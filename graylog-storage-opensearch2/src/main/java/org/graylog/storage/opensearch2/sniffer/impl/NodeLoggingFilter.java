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
package org.graylog.storage.opensearch2.sniffer.impl;

import com.google.common.collect.Sets;
import jakarta.inject.Inject;
import org.graylog.shaded.opensearch2.org.opensearch.client.Node;
import org.graylog.storage.opensearch2.sniffer.SnifferFilter;
import org.graylog2.configuration.ElasticsearchClientConfiguration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

public class NodeLoggingFilter implements SnifferFilter {
    private static final Logger LOG = LoggerFactory.getLogger(NodeLoggingFilter.class);
    private final Set<String> savedNodes = new LinkedHashSet<>();

    private final boolean enabled;

    @Inject
    public NodeLoggingFilter(ElasticsearchClientConfiguration configuration) {
        this.enabled = configuration.isNodeActivityLogger();
    }

    @Override
    public boolean enabled() {
        return enabled;
    }

    @Override
    public List<Node> filterNodes(final List<Node> nodes) {
        final Set<String> currentNodes = nodes.stream().map(n -> n.getHost().toURI()).collect(Collectors.toSet());

        final Set<String> nodesAdded = Sets.difference(currentNodes, savedNodes);
        final Set<String> nodesDropped = Sets.difference(savedNodes, currentNodes);

        if (!nodesAdded.isEmpty()) {
            LOG.info("Added node(s): {}", nodesAdded);
        }
        if (!nodesDropped.isEmpty()) {
            LOG.info("Dropped node(s): {}", nodesDropped);
        }
        if (!nodesAdded.isEmpty() || !nodesDropped.isEmpty()) {
            LOG.info("Current node list: {}", currentNodes);
        }

        savedNodes.clear();
        savedNodes.addAll(currentNodes);

        return nodes;
    }
}

