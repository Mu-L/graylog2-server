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
package org.graylog2.system.processing;

import com.github.joschi.jadconfig.util.Duration;
import com.google.common.annotations.VisibleForTesting;
import com.google.common.collect.ImmutableList;
import com.mongodb.MongoException;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.FindOneAndReplaceOptions;
import com.mongodb.client.model.IndexOptions;
import com.mongodb.client.model.Indexes;
import com.mongodb.client.model.ReturnDocument;
import com.mongodb.client.model.Sorts;
import jakarta.inject.Inject;
import jakarta.inject.Named;
import org.bson.conversions.Bson;
import org.graylog.scheduler.clock.JobSchedulerClock;
import org.graylog2.database.MongoCollection;
import org.graylog2.database.MongoCollections;
import org.graylog2.plugin.BaseConfiguration;
import org.graylog2.plugin.indexer.searches.timeranges.TimeRange;
import org.graylog2.plugin.system.NodeId;
import org.joda.time.DateTime;
import org.joda.time.DateTimeZone;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static com.mongodb.client.model.Filters.eq;
import static com.mongodb.client.model.Indexes.ascending;
import static org.graylog2.system.processing.ProcessingStatusDto.FIELD_UPDATED_AT;

/**
 * Manages the database collection for processing status.
 */
public class DBProcessingStatusService {
    public static final String COLLECTION_NAME = "processing_status";
    private static final String FIELD_WRITTEN_MESSAGES_1M = ProcessingStatusDto.FIELD_INPUT_JOURNAL + "." + ProcessingStatusDto.JournalInfo.FIELD_WRITTEN_MESSAGES_1M_RATE;
    private static final String FIELD_UNCOMMITTED_ENTRIES = ProcessingStatusDto.FIELD_INPUT_JOURNAL + "." + ProcessingStatusDto.JournalInfo.FIELD_UNCOMMITTED_ENTRIES;

    private final String nodeId;
    private final JobSchedulerClock clock;
    private final Duration updateThreshold;
    private final BaseConfiguration baseConfiguration;
    private final MongoCollection<ProcessingStatusDto> collection;

    @Inject
    public DBProcessingStatusService(MongoCollections mongoCollections,
                                     NodeId nodeId,
                                     JobSchedulerClock clock,
                                     @Named(ProcessingStatusConfig.UPDATE_THRESHOLD) Duration updateThreshold,
                                     @Named(ProcessingStatusConfig.JOURNAL_WRITE_RATE_THRESHOLD) int journalWriteRateThreshold,
                                     BaseConfiguration baseConfiguration) {
        this.nodeId = nodeId.getNodeId();
        this.clock = clock;
        this.updateThreshold = updateThreshold;
        this.baseConfiguration = baseConfiguration;
        this.collection = mongoCollections.collection(COLLECTION_NAME, ProcessingStatusDto.class);

        collection.createIndex(ascending(ProcessingStatusDto.FIELD_NODE_ID), new IndexOptions().unique(true));

        // Remove the old (3.1.0) index before creating the new one. This is needed, because mongodb >= 4.2 won't allow
        // the creation of identical indices with a different name. We don't use a migration,
        // because it can race with the code below that creates the same index with a shorter name.
        // TODO remove this in a future release (maybe at 3.5)
        final String OLD_INDEX_NAME = "updated_at_1_input_journal.uncommitted_entries_1_input_journal.written_messages_1m_rate_1";
        try {
            if (collection.listIndexes().into(new ArrayList<>()).stream().anyMatch(dbo -> dbo.get("name").equals(OLD_INDEX_NAME))) {
                collection.dropIndex(OLD_INDEX_NAME);
            }
        } catch (MongoException ignored) {
            // index was either never created or already deleted
        }

        // Use a custom index name to avoid the automatically generated index name which will be pretty long and
        // might cause errors due to the 127 character index name limit. (e.g. when using a long database name)
        // See: https://github.com/Graylog2/graylog2-server/issues/6322
        collection.createIndex(
                Indexes.compoundIndex(
                        ascending(FIELD_UPDATED_AT),
                        ascending(FIELD_UNCOMMITTED_ENTRIES),
                        ascending(FIELD_WRITTEN_MESSAGES_1M)),
                new IndexOptions().name("compound_0")
        );
    }

    /**
     * Returns all existing processing status entries from the database.
     *
     * @return a list of all processing status entries
     */
    public List<ProcessingStatusDto> all() {
        return ImmutableList.copyOf(collection.find().sort(Sorts.ascending("_id")));
    }

    /**
     * Returns the processing status entry for the calling node.
     *
     * @return the processing status entry or an empty optional if none exists
     */
    public Optional<ProcessingStatusDto> get() {
        return Optional.ofNullable(collection.find(eq(ProcessingStatusDto.FIELD_NODE_ID, nodeId)).first());
    }

    /**
     * Create or update (upsert) a processing status entry for the given {@link ProcessingStatusRecorder} using the
     * caller's node ID.
     *
     * @param processingStatusRecorder the processing recorder object to create/update
     * @return the created/updated entry
     */
    public ProcessingStatusDto save(ProcessingStatusRecorder processingStatusRecorder) {
        return save(processingStatusRecorder, DateTime.now(DateTimeZone.UTC));
    }

    @VisibleForTesting
    ProcessingStatusDto save(ProcessingStatusRecorder processingStatusRecorder, DateTime updatedAt) {
        // TODO: Using a timestamp provided by the node for "updated_at" can be bad if the node clock is skewed.
        //       Ideally we would use MongoDB's "$currentDate" but there doesn't seem to be a way to use that
        //       with mongojack.
        return collection.findOneAndReplace(
                eq(ProcessingStatusDto.FIELD_NODE_ID, nodeId),
                ProcessingStatusDto.of(nodeId, processingStatusRecorder, updatedAt, baseConfiguration.isMessageJournalEnabled()),
                new FindOneAndReplaceOptions().returnDocument(ReturnDocument.AFTER).upsert(true));
    }

    /**
     * Calculates the processing state of all active Graylog nodes in the cluster.
     * This can be used to find out if a certain timerange is already searchable in Elastic / OpenSearch.
     * <p>
     * Beware: This only takes the message receive time into account. It doesn't help when log sources send their
     * messages late.
     *
     * @return A combined state of all processing nodes in this cluster. See {@link  ProcessingNodesState}
     */
    public ProcessingNodesState calculateProcessingState(TimeRange timeRange) {
        final DateTime updateThresholdTimestamp = clock.nowUTC().minus(updateThreshold.toMilliseconds());

        try (final var statusCursor = collection.find(activeNodes(updateThresholdTimestamp)).iterator()) {
            if (!statusCursor.hasNext()) {
                return ProcessingNodesState.NONE_ACTIVE;
            }

            int activeNodes = 0;
            int idleNodes = 0;
            while (statusCursor.hasNext()) {
                activeNodes++;
                ProcessingStatusDto nodeProcessingStatus = statusCursor.next();
                DateTime lastIndexedMessage = nodeProcessingStatus.receiveTimes().postIndexing();
                // If node is behind and is busy, it is overloaded.
                if (lastIndexedMessage.isBefore(timeRange.getTo()) && isBusy(nodeProcessingStatus)) {
                    return ProcessingNodesState.SOME_OVERLOADED;
                }
                // If a node did not index a message that is at least at the start of the time range,
                // we consider it idle.
                if (lastIndexedMessage.isBefore(timeRange.getFrom())) {
                    idleNodes++;
                }
            }

            // Only if all nodes are idle, we stop the processing.
            if (activeNodes == idleNodes) {
                return ProcessingNodesState.ALL_IDLE;
            }
        }

        // If none of the above checks return, we can assume that some nodes have already indexed the given timerange.
        return ProcessingNodesState.SOME_UP_TO_DATE;
    }

    private boolean isBusy(ProcessingStatusDto nodeProcessingStatus) {
        return nodeProcessingStatus.inputJournal().uncommittedEntries() > 0L || nodeProcessingStatus.processBufferUsage() > 0;
    }

    private Bson activeNodes(DateTime updateThresholdTimestamp) {
        return Filters.gt(FIELD_UPDATED_AT, updateThresholdTimestamp);
    }

    public enum ProcessingNodesState {
        /**
         * No active nodes in this cluster found. Should never happen.
         */
        NONE_ACTIVE,
        /**
         * Cluster has active nodes, but none have been processing any messages for the given timerange
         */
        ALL_IDLE,
        /**
         * Some or all nodes in the cluster have processed the given timerange already.
         */
        SOME_UP_TO_DATE,
        /**
         * Some or all nodes of the cluster, are currently overloaded and have not processed the timerange yet.
         */
        SOME_OVERLOADED
    }
}
