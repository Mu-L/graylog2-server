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
package org.graylog2.inputs.transports;

import com.google.inject.assistedinject.Assisted;
import com.google.inject.assistedinject.AssistedInject;
import io.netty.channel.EventLoopGroup;
import jakarta.inject.Named;
import org.graylog2.configuration.TLSProtocolsConfiguration;
import org.graylog2.inputs.transports.netty.EventLoopGroupFactory;
import org.graylog2.plugin.LocalMetricRegistry;
import org.graylog2.plugin.configuration.Configuration;
import org.graylog2.plugin.inputs.annotations.ConfigClass;
import org.graylog2.plugin.inputs.annotations.FactoryClass;
import org.graylog2.plugin.inputs.transports.Transport;
import org.graylog2.plugin.inputs.util.ThroughputCounter;
import org.graylog2.utilities.IpSubnet;

import java.util.Set;

public class HttpTransport extends AbstractHttpTransport {
    private static final String PATH = "/gelf";

    @AssistedInject
    public HttpTransport(@Assisted Configuration configuration,
                         EventLoopGroup eventLoopGroup,
                         EventLoopGroupFactory eventLoopGroupFactory,
                         NettyTransportConfiguration nettyTransportConfiguration,
                         ThroughputCounter throughputCounter,
                         LocalMetricRegistry localRegistry,
                         TLSProtocolsConfiguration tlsConfiguration,
                         @Named("trusted_proxies") Set<IpSubnet> trustedProxies) {
        super(configuration, eventLoopGroup, eventLoopGroupFactory, nettyTransportConfiguration, throughputCounter,
                localRegistry, tlsConfiguration, trustedProxies, PATH);
    }

    @FactoryClass
    public interface Factory extends Transport.Factory<HttpTransport> {
        @Override
        HttpTransport create(Configuration configuration);

        @Override
        HttpTransport.Config getConfig();
    }

    @ConfigClass
    public static class Config extends AbstractHttpTransport.Config {
    }
}
