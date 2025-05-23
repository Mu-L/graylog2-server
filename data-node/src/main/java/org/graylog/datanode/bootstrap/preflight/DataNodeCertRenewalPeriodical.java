/*
 * Copyright (C) 2020 Graylog, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the Server Side Public License, version 1,
 * as published by MongoDB, Inc.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * Server Side Public License for more details.
 *
 * You should have received a copy of the Server Side Public License
 * along with this program. If not, see
 * <http://www.mongodb.com/licensing/server-side-public-license>.
 */
package org.graylog.datanode.bootstrap.preflight;

import com.google.common.util.concurrent.RateLimiter;
import jakarta.annotation.Nonnull;
import jakarta.inject.Inject;
import jakarta.inject.Singleton;
import org.graylog.datanode.Configuration;
import org.graylog.datanode.configuration.DatanodeKeystore;
import org.graylog.datanode.opensearch.CsrRequester;
import org.graylog2.bootstrap.preflight.PreflightConfigResult;
import org.graylog2.bootstrap.preflight.PreflightConfigService;
import org.graylog2.plugin.certificates.RenewalPolicy;
import org.graylog2.plugin.cluster.ClusterConfigService;
import org.graylog2.plugin.periodical.Periodical;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.Optional;
import java.util.function.Predicate;
import java.util.function.Supplier;

@SuppressWarnings("UnstableApiUsage")
@Singleton
public class DataNodeCertRenewalPeriodical extends Periodical {
    private static final Logger LOG = LoggerFactory.getLogger(DataNodeCertRenewalPeriodical.class);
    public static final Duration PERIODICAL_DURATION = Duration.ofSeconds(2);
    public static final Duration CSR_TRIGGER_PERIOD = Duration.ofMinutes(5);

    private final DatanodeKeystore datanodeKeystore;
    private final Supplier<RenewalPolicy> renewalPolicySupplier;

    private final CsrRequester csrRequester;

    private final Supplier<Boolean> isServerInPreflightMode;

    private final RateLimiter rateLimiter;
    private final String hostname;

    @Inject
    public DataNodeCertRenewalPeriodical(
            DatanodeKeystore datanodeKeystore,
            ClusterConfigService clusterConfigService,
            CsrRequester csrRequester,
            PreflightConfigService preflightConfigService,
            Configuration configuration
    ) {
        this(
                datanodeKeystore,
                () -> clusterConfigService.get(RenewalPolicy.class),
                csrRequester,
                () -> isInPreflight(preflightConfigService),
                configuration.getHostname()
        );
    }

    protected DataNodeCertRenewalPeriodical(DatanodeKeystore datanodeKeystore, Supplier<RenewalPolicy> renewalPolicySupplier, CsrRequester csrRequester, Supplier<Boolean> isServerInPreflightMode, String hostname) {
        this.datanodeKeystore = datanodeKeystore;
        this.renewalPolicySupplier = renewalPolicySupplier;
        this.csrRequester = csrRequester;
        this.isServerInPreflightMode = isServerInPreflightMode;
        this.rateLimiter = RateLimiter.create(1.0 / CSR_TRIGGER_PERIOD.toSeconds());
        this.hostname = hostname;
    }

    @Override
    public void doRun() {
        if (isServerInPreflightMode.get()) {
            // we don't want to automatically trigger CSRs during preflight, don't run it if the preflight is still not finished or skipped
            LOG.debug("Datanode still in preflight mode, skipping cert renewal task");
            return;
        }

        getRenewalPolicy()
                .filter(isAutomaticRenewal())
                .ifPresent(this::runRenewal);
    }

    @Nonnull
    private static Predicate<RenewalPolicy> isAutomaticRenewal() {
        return rp -> rp.mode() == RenewalPolicy.Mode.AUTOMATIC;
    }

    private static boolean isInPreflight(PreflightConfigService preflightConfigService) {
        return preflightConfigService.getPreflightConfigResult() != PreflightConfigResult.FINISHED;
    }

    private void runRenewal(RenewalPolicy renewalPolicy) {
        // only check and possibly renew once every CSR_TRIGGER_PERIOD_LIMIT period
        // this also limits usage of the filesystem-located keystore
        if (rateLimiter.tryAcquire() && needsNewCertificate(renewalPolicy)) {
            csrRequester.triggerCertificateSigningRequest();
        }
    }

    private boolean needsNewCertificate(RenewalPolicy renewalPolicy) {
        final Date expiration = datanodeKeystore.getCertificateExpiration();
        return expiration == null || expiresSoon(expiration, renewalPolicy) || hostnameChanged();
    }

    private boolean hostnameChanged() {
        final boolean hostnameChanged = !datanodeKeystore.getSubjectAlternativeNames().contains(hostname);
        if(hostnameChanged) {
            LOG.info("Datanode hostname changed, certificate will be renewed now");
        }
        return hostnameChanged;
    }

    private boolean expiresSoon(Date expiration, RenewalPolicy renewalPolicy) {
        Duration threshold = renewalPolicy.getRenewalThreshold();
        final Instant renewalMoment = expiration.toInstant()
                .minus(threshold)
                .minus(PERIODICAL_DURATION);
        final boolean expiresSoon = Instant.now().isAfter(renewalMoment);
        if (expiresSoon) {
            LOG.info("Datanode certificate will be renewed now, expiring soon (" + expiration + ")");
        }
        return expiresSoon;
    }

    private Optional<RenewalPolicy> getRenewalPolicy() {
        return Optional.ofNullable(renewalPolicySupplier.get());
    }

    @Override
    protected Logger getLogger() {
        return LOG;
    }

    @Override
    public boolean runsForever() {
        return false;
    }

    @Override
    public boolean stopOnGracefulShutdown() {
        return true;
    }

    @Override
    public boolean leaderOnly() {
        return false;
    }

    @Override
    public boolean startOnThisNode() {
        return true;
    }

    @Override
    public boolean isDaemon() {
        return true;
    }

    @Override
    public int getInitialDelaySeconds() {
        return 0;
    }

    @Override
    public int getPeriodSeconds() {
        return (int) PERIODICAL_DURATION.toSeconds();
    }
}
