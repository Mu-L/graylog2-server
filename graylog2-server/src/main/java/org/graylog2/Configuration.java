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
package org.graylog2;

import com.github.joschi.jadconfig.Parameter;
import com.github.joschi.jadconfig.ValidationException;
import com.github.joschi.jadconfig.Validator;
import com.github.joschi.jadconfig.ValidatorMethod;
import com.github.joschi.jadconfig.converters.StringSetConverter;
import com.github.joschi.jadconfig.converters.TrimmedStringSetConverter;
import com.github.joschi.jadconfig.util.Duration;
import com.github.joschi.jadconfig.validators.PositiveDurationValidator;
import com.github.joschi.jadconfig.validators.PositiveIntegerValidator;
import com.github.joschi.jadconfig.validators.PositiveLongValidator;
import com.github.joschi.jadconfig.validators.StringNotBlankValidator;
import com.google.common.collect.Sets;
import org.apache.commons.lang3.StringUtils;
import org.graylog.plugins.views.search.engine.suggestions.FieldValueSuggestionMode;
import org.graylog.plugins.views.search.engine.suggestions.FieldValueSuggestionModeConverter;
import org.graylog.security.certutil.CaConfiguration;
import org.graylog2.bindings.NamedBindingOverride;
import org.graylog2.cluster.leader.AutomaticLeaderElectionService;
import org.graylog2.cluster.leader.LeaderElectionMode;
import org.graylog2.cluster.leader.LeaderElectionService;
import org.graylog2.cluster.lock.MongoLockService;
import org.graylog2.configuration.Documentation;
import org.graylog2.configuration.converters.JavaDurationConverter;
import org.graylog2.notifications.Notification;
import org.graylog2.outputs.BatchSizeConfig;
import org.graylog2.plugin.Tools;
import org.graylog2.security.hashing.PBKDF2PasswordAlgorithm;
import org.graylog2.security.realm.RootAccountRealm;
import org.graylog2.utilities.IPSubnetConverter;
import org.graylog2.utilities.IpSubnet;
import org.joda.time.DateTimeZone;
import org.joda.time.Period;

import java.io.File;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Collections;
import java.util.Optional;
import java.util.Set;

import static org.graylog2.shared.utilities.StringUtils.f;

/**
 * Helper class to hold configuration of Graylog
 */
@SuppressWarnings("FieldMayBeFinal")
public class Configuration extends CaConfiguration implements CommonNodeConfiguration {
    public static final String SAFE_CLASSES = "safe_classes";

    public static final String CONTENT_PACKS_DIR = "content_packs_dir";
    /**
     * Deprecated! Use isLeader() instead.
     */
    @Parameter(value = "is_master")
    private boolean isMaster = true;

    @Parameter(value = "stream_aware_field_types")
    private boolean streamAwareFieldTypes = false;

    /**
     * Used for initializing static leader election. You shouldn't use this for other purposes, but if you must, don't
     * use @{@link jakarta.inject.Named} injection but the getter isLeader() instead.
     **/
    @Parameter(value = "is_leader")
    private Boolean isLeader;

    @Parameter(value = "password_secret", required = true, validators = StringNotBlankValidator.class)
    private String passwordSecret;

    @Parameter(value = "output_batch_size", required = true, converter = BatchSizeConfig.Converter.class,
               validators = BatchSizeConfig.Validator.class)
    private BatchSizeConfig outputBatchSize = BatchSizeConfig.forCount(500);

    @Parameter(value = "output_flush_interval", required = true, validators = PositiveIntegerValidator.class)
    private int outputFlushInterval = 1;

    @Parameter(value = "outputbuffer_processors", required = true, validators = PositiveIntegerValidator.class)
    private int outputBufferProcessors = defaultNumberOfOutputBufferProcessors();

    @Parameter(value = "outputbuffer_processor_threads_core_pool_size", required = true, validators = PositiveIntegerValidator.class)
    private int outputBufferProcessorThreadsCorePoolSize = 3;

    @Parameter(value = "node_id_file", validators = NodeIdFileValidator.class)
    private String nodeIdFile = "/etc/graylog/server/node-id";

    @Parameter(value = "root_username")
    private String rootUsername = "admin";

    // Required unless "root-user" is deactivated in the "deactivated_builtin_authentication_providers" setting
    @Parameter(value = "root_password_sha2")
    private String rootPasswordSha2;

    @Parameter(value = "root_timezone")
    private DateTimeZone rootTimeZone = DateTimeZone.UTC;

    @Parameter(value = "root_email")
    private String rootEmail = "";

    @Parameter(value = "allow_leading_wildcard_searches")
    private boolean allowLeadingWildcardSearches = false;

    @Parameter(value = "allow_highlighting")
    private boolean allowHighlighting = false;

    @Parameter(value = "lb_recognition_period_seconds", validators = PositiveIntegerValidator.class)
    private int loadBalancerRecognitionPeriodSeconds = 3;

    @Parameter(value = "lb_throttle_threshold_percentage", validators = PositiveIntegerValidator.class)
    private int loadBalancerThrottleThresholdPercentage = 100;

    @Parameter(value = "stream_processing_timeout", validators = PositiveLongValidator.class)
    private long streamProcessingTimeout = 2000;

    @Parameter(value = "stream_processing_max_faults", validators = PositiveIntegerValidator.class)
    private int streamProcessingMaxFaults = 3;

    @Parameter(value = "output_module_timeout", validators = PositiveLongValidator.class)
    private long outputModuleTimeout = 10000;

    @Parameter(value = "output_fault_count_threshold", validators = PositiveLongValidator.class)
    private long outputFaultCountThreshold = 5;

    @Parameter(value = "output_fault_penalty_seconds", validators = PositiveLongValidator.class)
    private long outputFaultPenaltySeconds = 30;

    /**
     * Deprecated! Use staleLeaderTimeout instead
     */
    @Parameter(value = "stale_master_timeout", validators = PositiveIntegerValidator.class)
    private int staleMasterTimeout = 2000;

    /**
     * Don't use @{@link jakarta.inject.Named} injection but the getter getStaleLeaderTimeout() instead.
     **/
    @Parameter(value = "stale_leader_timeout", validators = PositiveIntegerValidator.class)
    private Integer staleLeaderTimeout;

    @Parameter(value = "static_leader_timeout", converter = JavaDurationConverter.class)
    private java.time.Duration staticLeaderTimeout = java.time.Duration.of(60, java.time.temporal.ChronoUnit.SECONDS);

    @Parameter(value = "ldap_connection_timeout", validators = PositiveIntegerValidator.class)
    private int ldapConnectionTimeout = 2000;

    @Parameter(value = "alert_check_interval", validators = PositiveIntegerValidator.class)
    @Deprecated
    private int alertCheckInterval = 60;

    @Parameter(value = "default_message_output_class")
    private String defaultMessageOutputClass = "";

    @Parameter(value = "dashboard_widget_default_cache_time", validators = PositiveDurationValidator.class)
    private Duration dashboardWidgetDefaultCacheTime = Duration.seconds(10L);

    @Parameter(value = "user_password_default_algorithm")
    private String userPasswordDefaultAlgorithm = "bcrypt";

    @Parameter(value = "user_password_bcrypt_salt_size", validators = PositiveIntegerValidator.class)
    private int userPasswordBCryptSaltSize = 10;

    @Parameter(value = "user_password_pbkdf2_iterations", validators = PositiveIntegerValidator.class)
    private int userPasswordPbkdf2Iterations = PBKDF2PasswordAlgorithm.DEFAULT_ITERATIONS;

    @Parameter(value = "content_packs_loader_enabled")
    private boolean contentPacksLoaderEnabled = false;

    @Parameter(value = CONTENT_PACKS_DIR)
    private Path contentPacksDir;

    @Parameter(value = "content_packs_auto_install", converter = TrimmedStringSetConverter.class)
    private Set<String> contentPacksAutoInstall = Collections.emptySet();

    @Parameter(value = "index_ranges_cleanup_interval", validators = PositiveDurationValidator.class)
    private Duration indexRangesCleanupInterval = Duration.hours(1L);

    @Parameter(value = "trusted_proxies", converter = IPSubnetConverter.class)
    private Set<IpSubnet> trustedProxies = Collections.emptySet();

    @Parameter(value = "deactivated_builtin_authentication_providers", converter = StringSetConverter.class)
    private Set<String> deactivatedBuiltinAuthenticationProviders = Collections.emptySet();

    // This is needed for backwards compatibility. The setting in TLSProtocolsConfiguration should be used instead.
    @Parameter(value = "enabled_tls_protocols", converter = StringSetConverter.class)
    private Set<String> enabledTlsProtocols = null;

    @Parameter(value = "failure_handling_queue_capacity", validators = {PositiveIntegerValidator.class})
    private int failureHandlingQueueCapacity = 1000;

    @Parameter(value = "failure_handling_shutdown_await", validators = {PositiveDurationValidator.class})
    private Duration failureHandlingShutdownAwait = Duration.milliseconds(3000);

    @Parameter(value = "is_cloud")
    private boolean isCloud = false;

    @Parameter(value = "auto_restart_inputs")
    private boolean autoRestartInputs = false;

    @Parameter(value = "run_migrations")
    private boolean runMigrations = true;

    @Parameter(value = "ignore_migration_failures")
    private boolean ignoreMigrationFailures = false;

    @Parameter(value = "skip_preflight_checks")
    private boolean skipPreflightChecks = false;

    @Parameter(value = "enable_preflight_web")
    private boolean enablePreflightWeb = false;

    @Parameter(value = "query_latency_monitoring_enabled")
    private boolean queryLatencyMonitoringEnabled = false;

    @Parameter(value = "query_latency_monitoring_window_size")
    private int queryLatencyMonitoringWindowSize = 0;

    @Parameter(value = "leader_election_mode", converter = LeaderElectionMode.Converter.class)
    private LeaderElectionMode leaderElectionMode = LeaderElectionMode.STATIC;

    @Parameter(value = "leader_election_lock_polling_interval", converter = JavaDurationConverter.class)
    private java.time.Duration leaderElectionLockPollingInterval = AutomaticLeaderElectionService.DEFAULT_POLLING_INTERVAL;

    @Parameter(value = "lock_service_lock_ttl", converter = JavaDurationConverter.class)
    private java.time.Duration lockServiceLockTTL = MongoLockService.MIN_LOCK_TTL;

    @Parameter(value = "system_event_excluded_types", converter = TrimmedStringSetConverter.class)
    private Set<String> systemEventExcludedTypes = Sets.newHashSet(Notification.Type.SIDECAR_STATUS_UNKNOWN.name());

    @Parameter(value = "datanode_proxy_api_allowlist")
    private boolean datanodeProxyAPIAllowlist = true;

    @Parameter(value = "minimum_auto_refresh_interval", required = true)
    private Period minimumAutoRefreshInterval = Period.seconds(1);

    /**
     * Classes considered safe to load by name. A set of prefixes matched against the fully qualified class name.
     */
    @Parameter(value = SAFE_CLASSES, converter = StringSetConverter.class, validators = SafeClassesValidator.class)
    private Set<String> safeClasses = Set.of("org.graylog.", "org.graylog2.");

    @Parameter(value = "field_value_suggestion_mode", required = true, converter = FieldValueSuggestionModeConverter.class)
    private FieldValueSuggestionMode fieldValueSuggestionMode = FieldValueSuggestionMode.ON;

    @Parameter(value = "search_query_engine_indexer_jobs_pool_size", validators = PositiveIntegerValidator.class)
    private int searchQueryEngineIndexerJobsPoolSize = 4;

    @Parameter("search_query_engine_indexer_jobs_queue_size")
    private int searchQueryEngineIndexerJobsQueueSize = 0;

    @Parameter(value = "search_query_engine_data_lake_jobs_pool_size", validators = PositiveIntegerValidator.class)
    private int searchQueryEngineDataLakeJobsPoolSize = 4;

    @Parameter("search_query_engine_data_lake_jobs_queue_size")
    private int searchQueryEngineDataLakeJobsQueueSize = 0;

    @Documentation("""
            Enabling this parameter will activate automatic security configuration. Graylog server will
            set a default 30-day automatic certificate renewal policy and create a self-signed CA. This CA
            will be used to sign certificates for SSL communication between the server and datanodes.
            """)
    @Parameter(value = "selfsigned_startup")
    private boolean selfsignedStartup = false;

    public static final String INSTALL_HTTP_CONNECTION_TIMEOUT = "install_http_connection_timeout";
    public static final String INSTALL_OUTPUT_BUFFER_DRAINING_INTERVAL = "install_output_buffer_drain_interval";
    public static final String INSTALL_OUTPUT_BUFFER_DRAINING_MAX_RETRIES = "install_output_buffer_max_retries";

    private static final int DEFAULT_INSTALL_RETRIES = 150;
    private static final Duration DEFAULT_INSTALL_SECONDS = Duration.seconds(2);

    @Parameter(value = INSTALL_HTTP_CONNECTION_TIMEOUT, validators = PositiveDurationValidator.class)
    private Duration installHttpConnectionTimeout = Duration.seconds(10L);

    @Parameter(value = INSTALL_OUTPUT_BUFFER_DRAINING_INTERVAL, validators = PositiveDurationValidator.class)
    private Duration installOutputBufferDrainingInterval = DEFAULT_INSTALL_SECONDS;

    // The maximum number of times to check if buffers have drained during Illuminate restarts on all
    // nodes before giving up
    @Parameter(value = INSTALL_OUTPUT_BUFFER_DRAINING_MAX_RETRIES, validators = PositiveIntegerValidator.class)
    private int installOutputBufferDrainingMaxRetries = DEFAULT_INSTALL_RETRIES;

    public boolean maintainsStreamAwareFieldTypes() {
        return streamAwareFieldTypes;
    }

    /**
     * @deprecated Use {@link #isLeader()} instead.
     */
    @Deprecated
    public boolean isMaster() {
        return isLeader();
    }

    /**
     * Returns the <em>configured</em> leader status. This is only valid for static leader election. You should probably
     * use {@link LeaderElectionService#isLeader()} instead.
     */
    public boolean isLeader() {
        return isLeader != null ? isLeader : isMaster;
    }

    /**
     * @deprecated Use {@link #setIsLeader(boolean)} instead
     */
    @Deprecated
    public void setIsMaster(boolean is) {
        setIsLeader(is);
    }

    /**
     * We should remove this method after refactoring {@link org.graylog2.cluster.leader.StaticLeaderElectionService}
     * and {@link org.graylog2.commands.Server} so that they don't need this to communicate demotion from leader to
     * follower anymore.
     */
    public void setIsLeader(boolean is) {
        isLeader = isMaster = is;
    }

    public LeaderElectionMode getLeaderElectionMode() {
        return leaderElectionMode;
    }

    public java.time.Duration getLockServiceLockTTL() {
        return lockServiceLockTTL;
    }

    public Set<String> getSystemEventExcludedTypes() {
        return systemEventExcludedTypes;
    }

    public java.time.Duration getLeaderElectionLockPollingInterval() {
        return leaderElectionLockPollingInterval;
    }

    public String getPasswordSecret() {
        return passwordSecret.trim();
    }

    public BatchSizeConfig getOutputBatchSize() {
        return outputBatchSize;
    }

    public int getOutputFlushInterval() {
        return outputFlushInterval;
    }

    public int getOutputBufferProcessors() {
        return outputBufferProcessors;
    }

    public int getOutputBufferProcessorThreadsCorePoolSize() {
        return outputBufferProcessorThreadsCorePoolSize;
    }

    public boolean isCloud() {
        return isCloud;
    }

    public boolean getAutoRestartInputs() {
        return autoRestartInputs;
    }

    public boolean runMigrations() {
        return runMigrations;
    }

    public boolean ignoreMigrationFailures() {
        return ignoreMigrationFailures;
    }

    public boolean getSkipPreflightChecks() {
        return skipPreflightChecks;
    }

    public String getNodeIdFile() {
        return nodeIdFile;
    }

    public String getRootUsername() {
        return rootUsername;
    }

    public String getRootPasswordSha2() {
        return rootPasswordSha2;
    }

    public DateTimeZone getRootTimeZone() {
        return rootTimeZone;
    }

    public String getRootEmail() {
        return rootEmail;
    }

    public boolean isAllowLeadingWildcardSearches() {
        return allowLeadingWildcardSearches;
    }

    public boolean isAllowHighlighting() {
        return allowHighlighting;
    }

    public int getLoadBalancerRecognitionPeriodSeconds() {
        return loadBalancerRecognitionPeriodSeconds;
    }

    public long getStreamProcessingTimeout() {
        return streamProcessingTimeout;
    }

    public int getStreamProcessingMaxFaults() {
        return streamProcessingMaxFaults;
    }

    public long getOutputModuleTimeout() {
        return outputModuleTimeout;
    }

    public long getOutputFaultCountThreshold() {
        return outputFaultCountThreshold;
    }

    public long getOutputFaultPenaltySeconds() {
        return outputFaultPenaltySeconds;
    }

    /**
     * @deprecated Use getStaleLeaderTimeout instead
     */
    @Deprecated
    public int getStaleMasterTimeout() {
        return getStaleLeaderTimeout();
    }

    public int getStaleLeaderTimeout() {
        return staleLeaderTimeout != null ? staleLeaderTimeout : staleMasterTimeout;
    }

    public java.time.Duration getStaticLeaderTimeout() {
        return staticLeaderTimeout;
    }

    public int getLdapConnectionTimeout() {
        return ldapConnectionTimeout;
    }

    @Deprecated
    public int getAlertCheckInterval() {
        return alertCheckInterval;
    }

    public String getDefaultMessageOutputClass() {
        return defaultMessageOutputClass;
    }

    public Duration getDashboardWidgetDefaultCacheTime() {
        return dashboardWidgetDefaultCacheTime;
    }

    public String getUserPasswordDefaultAlgorithm() {
        return userPasswordDefaultAlgorithm;
    }

    public int getUserPasswordBCryptSaltSize() {
        return userPasswordBCryptSaltSize;
    }

    public boolean isContentPacksLoaderEnabled() {
        return contentPacksLoaderEnabled;
    }

    @NamedBindingOverride(value = CONTENT_PACKS_DIR)
    public Path getContentPacksDir() {
        return Optional.ofNullable(contentPacksDir).orElse(getDataDir().resolve("contentpacks"));
    }

    public Set<String> getContentPacksAutoInstall() {
        return contentPacksAutoInstall;
    }

    public Duration getIndexRangesCleanupInterval() {
        return indexRangesCleanupInterval;
    }

    public Set<IpSubnet> getTrustedProxies() {
        return trustedProxies;
    }

    public int getLoadBalancerRequestThrottleJournalUsage() {
        return loadBalancerThrottleThresholdPercentage;
    }

    public Set<String> getDeactivatedBuiltinAuthenticationProviders() {
        return deactivatedBuiltinAuthenticationProviders;
    }

    public int getFailureHandlingQueueCapacity() {
        return failureHandlingQueueCapacity;
    }


    public Duration getFailureHandlingShutdownAwait() {
        return failureHandlingShutdownAwait;
    }

    public Period getMinimumAutoRefreshInterval() {
        return minimumAutoRefreshInterval;
    }

    public Set<String> getSafeClasses() {
        return safeClasses;
    }

    public FieldValueSuggestionMode getFieldValueSuggestionMode() {
        return fieldValueSuggestionMode;
    }

    /**
     * This is needed for backwards compatibility. The setting in TLSProtocolsConfiguration should be used instead.
     */
    @Deprecated
    public Set<String> getEnabledTlsProtocols() {
        return enabledTlsProtocols;
    }

    @ValidatorMethod
    @SuppressWarnings("unused")
    public void validatePasswordSecret() throws ValidationException {
        final String passwordSecret = getPasswordSecret();
        if (passwordSecret == null || passwordSecret.length() < 16) {
            throw new ValidationException("The minimum length for \"password_secret\" is 16 characters.");
        }
    }

    @ValidatorMethod
    @SuppressWarnings("unused")
    public void validateRootUser() throws ValidationException {
        if (getRootPasswordSha2() == null && !isRootUserDisabled()) {
            throw new ValidationException("Required parameter \"root_password_sha2\" not found.");
        }
    }

    @ValidatorMethod
    public void validateLeaderElectionTimeouts() throws ValidationException {
        if (leaderElectionMode != LeaderElectionMode.AUTOMATIC) {
            return;
        }
        if (lockServiceLockTTL.compareTo(MongoLockService.MIN_LOCK_TTL) < 0) {
            throw new ValidationException("The minimum valid \"lock_service_lock_ttl\" is 60 seconds");
        }
        if (leaderElectionLockPollingInterval.compareTo(java.time.Duration.ofSeconds(1)) < 0) {
            throw new ValidationException("The minimum valid \"leader_election_lock_polling_interval\" is 1 second");
        }
        if (lockServiceLockTTL.compareTo(leaderElectionLockPollingInterval) < 1) {
            throw new ValidationException("The \"leader_election_lock_polling_interval\" needs to be greater than the \"lock_service_lock_ttl\"!");
        }
    }

    /**
     * The root user is disabled if the {@link RootAccountRealm} is deactivated.
     */
    public boolean isRootUserDisabled() {
        return getDeactivatedBuiltinAuthenticationProviders().contains(RootAccountRealm.NAME);
    }

    public boolean enablePreflightWebserver() {
        return enablePreflightWeb;
    }

    public boolean isQueryLatencyMonitoringEnabled() {
        return queryLatencyMonitoringEnabled;
    }

    public int getQueryLatencyMonitoringWindowSize() {
        return queryLatencyMonitoringWindowSize;
    }

    public boolean selfsignedStartupEnabled() {
        return selfsignedStartup;
    }

    public int searchQueryEngineIndexerJobsPoolSize() {
        return searchQueryEngineIndexerJobsPoolSize;
    }

    public int searchQueryEngineIndexerJobsQueueSize() {
        return searchQueryEngineIndexerJobsQueueSize;
    }

    public int searchQueryEngineDataLakeJobsPoolSize() {
        return searchQueryEngineDataLakeJobsPoolSize;
    }

    public int searchQueryEngineDataLakeJobsQueueSize() {
        return searchQueryEngineDataLakeJobsQueueSize;
    }

    public static class NodeIdFileValidator implements Validator<String> {
        @Override
        public void validate(String name, String path) throws ValidationException {
            if (path == null) {
                return;
            }
            final File file = Paths.get(path).toFile();
            final StringBuilder b = new StringBuilder();

            if (!file.exists()) {
                final File parent = file.getParentFile();
                if (!parent.isDirectory()) {
                    throw new ValidationException("Parent path " + parent + " for Node ID file at " + path + " is not a directory");
                } else {
                    if (!parent.canRead()) {
                        throw new ValidationException("Parent directory " + parent + " for Node ID file at " + path + " is not readable");
                    }
                    if (!parent.canWrite()) {
                        throw new ValidationException("Parent directory " + parent + " for Node ID file at " + path + " is not writable");
                    }

                    // parent directory exists and is readable and writable
                    return;
                }
            }

            if (!file.isFile()) {
                b.append("a file");
            }
            final boolean readable = file.canRead();
            final boolean writable = file.canWrite();
            if (!readable) {
                if (b.length() > 0) {
                    b.append(", ");
                }
                b.append("readable");
            }
            final boolean empty = file.length() == 0;
            if (!writable && readable && empty) {
                if (b.length() > 0) {
                    b.append(", ");
                }
                b.append("writable, but it is empty");
            }
            if (b.length() == 0) {
                // all good
                return;
            }
            throw new ValidationException("Node ID file at path " + path + " isn't " + b + ". Please specify the correct path or change the permissions");
        }
    }

    public static class SafeClassesValidator implements Validator<Set<String>> {
        @Override
        public void validate(String name, Set<String> set) throws ValidationException {
            if (set.isEmpty()) {
                throw new ValidationException(f("\"%s\" must not be empty. Please specify a comma-separated list of " +
                        "fully-qualified class name prefixes.", name));
            }
            if (set.stream().anyMatch(StringUtils::isBlank)) {
                throw new ValidationException(f("\"%s\" must only contain non-empty class name prefixes.", name));
            }
        }
    }

    /**
     * Calculate the default number of output buffer processors as a linear function of available CPU cores.
     * The function is designed to yield predetermined values for the following select numbers of CPU cores that
     * have proven to work well in real-world production settings:
     * <table>
     *     <tr>
     *         <th># CPU cores</th><th># buffer processors</th>
     *     </tr>
     *     <tr>
     *         <td>2</td><td>1</td>
     *     </tr>
     *     <tr>
     *         <td>4</td><td>1</td>
     *     </tr>
     *     <tr>
     *         <td>8</td><td>2</td>
     *     </tr>
     *     <tr>
     *         <td>12</td><td>3</td>
     *     </tr>
     *     <tr>
     *         <td>16</td><td>3</td>
     *     </tr>
     * </table>
     */
    private static int defaultNumberOfOutputBufferProcessors() {
        return Math.round(Tools.availableProcessors() * 0.162f + 0.625f);
    }

    @Override
    public boolean withPlugins() {
        return true;
    }

    @Override
    public boolean withInputs() {
        return true;
    }
}
