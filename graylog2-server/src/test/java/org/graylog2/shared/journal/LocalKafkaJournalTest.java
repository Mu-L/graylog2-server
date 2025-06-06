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
package org.graylog2.shared.journal;

import com.codahale.metrics.MetricRegistry;
import com.github.joschi.jadconfig.util.Size;
import com.google.common.collect.Iterators;
import com.google.common.collect.Lists;
import com.google.common.eventbus.EventBus;
import com.google.common.primitives.Ints;
import org.graylog.shaded.kafka09.common.KafkaException;
import org.graylog.shaded.kafka09.log.LogSegment;
import org.graylog.shaded.kafka09.message.Message;
import org.graylog.shaded.kafka09.message.MessageSet;
import org.graylog.shaded.kafka09.utils.FileLock;
import org.graylog2.Configuration;
import org.graylog2.audit.NullAuditEventSender;
import org.graylog2.plugin.InstantMillisProvider;
import org.graylog2.plugin.ServerStatus;
import org.graylog2.plugin.lifecycles.Lifecycle;
import org.graylog2.plugin.system.FilePersistedNodeIdProvider;
import org.joda.time.DateTime;
import org.joda.time.DateTimeUtils;
import org.joda.time.DateTimeZone;
import org.joda.time.Duration;
import org.joda.time.Period;
import org.junit.After;
import org.junit.Before;
import org.junit.Ignore;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TemporaryFolder;
import org.mockito.Mockito;
import org.mockito.junit.MockitoJUnit;
import org.mockito.junit.MockitoRule;

import java.io.File;
import java.io.FileFilter;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.channels.FileChannel;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.EnumSet;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ScheduledThreadPoolExecutor;
import java.util.stream.IntStream;

import static java.nio.charset.StandardCharsets.UTF_8;
import static org.apache.commons.io.filefilter.FileFilterUtils.and;
import static org.apache.commons.io.filefilter.FileFilterUtils.directoryFileFilter;
import static org.apache.commons.io.filefilter.FileFilterUtils.fileFileFilter;
import static org.apache.commons.io.filefilter.FileFilterUtils.nameFileFilter;
import static org.apache.commons.io.filefilter.FileFilterUtils.suffixFileFilter;
import static org.apache.commons.lang.RandomStringUtils.randomAlphanumeric;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;
import static org.junit.Assume.assumeTrue;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

public class LocalKafkaJournalTest {
    @Rule
    public final MockitoRule mockitoRule = MockitoJUnit.rule();
    @Rule
    public final TemporaryFolder temporaryFolder = new TemporaryFolder();

    private ServerStatus serverStatus;
    private ScheduledThreadPoolExecutor scheduler;
    private File journalDirectory;

    @Before
    public void setUp() throws IOException {
        scheduler = new ScheduledThreadPoolExecutor(1);
        scheduler.prestartCoreThread();
        journalDirectory = temporaryFolder.newFolder();

        final File nodeId = temporaryFolder.newFile("node-id");
        Files.write(nodeId.toPath(), UUID.randomUUID().toString().getBytes(StandardCharsets.UTF_8));

        final var nodeIdProvider = new FilePersistedNodeIdProvider(nodeId.getAbsolutePath());
        final var configuration =
                new Configuration() {
            @Override
            public String getNodeIdFile() {
                return nodeId.getAbsolutePath();
            }
        };
        serverStatus = new ServerStatus(configuration, EnumSet.of(ServerStatus.Capability.SERVER), new EventBus("KafkaJournalTest"), NullAuditEventSender::new, nodeIdProvider.get());
    }

    @After
    public void tearDown() {
        scheduler.shutdown();
    }

    @Test
    public void writeAndRead() throws IOException {
        final Journal journal = new LocalKafkaJournal(journalDirectory.toPath(),
                scheduler,
                Size.megabytes(100L),
                Duration.standardHours(1),
                Size.megabytes(5L),
                Duration.standardHours(1),
                1_000_000,
                Duration.standardMinutes(1),
                100,
                new MetricRegistry(),
                serverStatus);

        final byte[] idBytes = "id".getBytes(UTF_8);
        final byte[] messageBytes = "message".getBytes(UTF_8);

        final long position = journal.write(idBytes, messageBytes);
        final List<Journal.JournalReadEntry> messages = journal.read(1);

        final Journal.JournalReadEntry firstMessage = Iterators.getOnlyElement(messages.iterator());

        assertEquals("message", new String(firstMessage.getPayload(), UTF_8));
    }

    @Test
    public void readAtLeastOne() throws Exception {
        final Journal journal = new LocalKafkaJournal(journalDirectory.toPath(),
                scheduler,
                Size.megabytes(100L),
                Duration.standardHours(1),
                Size.megabytes(5L),
                Duration.standardHours(1),
                1_000_000,
                Duration.standardMinutes(1),
                100,
                new MetricRegistry(),
                serverStatus);

        final byte[] idBytes = "id".getBytes(UTF_8);
        final byte[] messageBytes = "message1".getBytes(UTF_8);

        final long position = journal.write(idBytes, messageBytes);

        // Trying to read 0 should always read at least 1 entry.
        final List<Journal.JournalReadEntry> messages = journal.read(0);

        final Journal.JournalReadEntry firstMessage = Iterators.getOnlyElement(messages.iterator());

        assertEquals("message1", new String(firstMessage.getPayload(), UTF_8));
    }

    private int createBulkChunks(LocalKafkaJournal journal, Size segmentSize, int bulkCount) {
        // Magic numbers deduced by magic…
        int bulkSize = Ints.saturatedCast(segmentSize.toBytes() / (2L * 16L));
        // perform multiple writes to make multiple segments
        for (int currentBulk = 0; currentBulk < bulkCount; currentBulk++) {
            final List<Journal.Entry> entries = Lists.newArrayListWithExpectedSize(bulkSize);
            long writtenBytes = 0L;
            for (int i = 0; i < bulkSize; i++) {
                final byte[] idBytes = ("id" + i).getBytes(UTF_8);
                final byte[] messageBytes = ("message " + i).getBytes(UTF_8);

                writtenBytes += 3 * (idBytes.length + messageBytes.length);
                if (writtenBytes > segmentSize.toBytes()) {
                    break;
                }
                entries.add(journal.createEntry(idBytes, messageBytes));
            }
            journal.write(entries);
        }

        return bulkSize;
    }

    private int countSegmentsInDir(File messageJournalFile) {
        // let it throw
        return messageJournalFile.list(and(fileFileFilter(), suffixFileFilter(".log"))).length;
    }

    @Test
    public void maxSegmentSize() throws Exception {
        final Size segmentSize = Size.kilobytes(1L);
        final LocalKafkaJournal journal = new LocalKafkaJournal(journalDirectory.toPath(),
                scheduler,
                segmentSize,
                Duration.standardHours(1),
                Size.kilobytes(10L),
                Duration.standardDays(1),
                1_000_000,
                Duration.standardMinutes(1),
                100,
                new MetricRegistry(),
                serverStatus);

        long size = 0L;
        long maxSize = segmentSize.toBytes();
        final List<Journal.Entry> list = Lists.newArrayList();

        while (size <= maxSize) {
            final byte[] idBytes = ("the1-id").getBytes(UTF_8);
            final byte[] messageBytes = ("the1-message").getBytes(UTF_8);

            size += idBytes.length + messageBytes.length;

            list.add(journal.createEntry(idBytes, messageBytes));
        }

        // Make sure all messages have been written
        assertThat(journal.write(list)).isEqualTo(list.size() - 1);
    }

    @Test
    public void maxMessageSize() throws Exception {
        final Size segmentSize = Size.kilobytes(1L);
        final LocalKafkaJournal journal = new LocalKafkaJournal(journalDirectory.toPath(),
                scheduler,
                segmentSize,
                Duration.standardHours(1),
                Size.kilobytes(10L),
                Duration.standardDays(1),
                1_000_000,
                Duration.standardMinutes(1),
                100,
                new MetricRegistry(),
                serverStatus);

        long size = 0L;
        long maxSize = segmentSize.toBytes();
        final List<Journal.Entry> list = Lists.newArrayList();

        final String largeMessage1 = randomAlphanumeric(Ints.saturatedCast(segmentSize.toBytes() * 2));
        list.add(journal.createEntry(randomAlphanumeric(6).getBytes(UTF_8), largeMessage1.getBytes(UTF_8)));

        final byte[] idBytes0 = randomAlphanumeric(6).getBytes(UTF_8);
        // Build a message that has exactly the max segment size
        final String largeMessage2 = randomAlphanumeric(Ints.saturatedCast(segmentSize.toBytes() - MessageSet.LogOverhead() - Message.MessageOverhead() - idBytes0.length));
        list.add(journal.createEntry(idBytes0, largeMessage2.getBytes(UTF_8)));

        while (size <= maxSize) {
            final byte[] idBytes = randomAlphanumeric(6).getBytes(UTF_8);
            final byte[] messageBytes = "the-message".getBytes(UTF_8);

            size += idBytes.length + messageBytes.length;

            list.add(journal.createEntry(idBytes, messageBytes));
        }

        // Make sure all messages but the large one have been written
        assertThat(journal.write(list)).isEqualTo(list.size() - 2);
    }

    @Test
    public void segmentRotation() throws Exception {
        final Size segmentSize = Size.kilobytes(1L);
        final LocalKafkaJournal journal = new LocalKafkaJournal(journalDirectory.toPath(),
                scheduler,
                segmentSize,
                Duration.standardHours(1),
                Size.kilobytes(10L),
                Duration.standardDays(1),
                1_000_000,
                Duration.standardMinutes(1),
                100,
                new MetricRegistry(),
                serverStatus);

        createBulkChunks(journal, segmentSize, 3);

        final File[] files = journalDirectory.listFiles();
        assertNotNull(files);
        assertTrue("there should be files in the journal directory", files.length > 0);

        final File[] messageJournalDir = journalDirectory.listFiles((FileFilter) and(directoryFileFilter(),
                                                                                     nameFileFilter("messagejournal-0")));
        assertTrue(messageJournalDir.length == 1);
        final File[] logFiles = messageJournalDir[0].listFiles((FileFilter) and(fileFileFilter(),
                                                                                suffixFileFilter(".log")));
        assertEquals("should have two journal segments", 3, logFiles.length);
    }

    @Test
    public void segmentSizeCleanup() throws Exception {
        final Size segmentSize = Size.kilobytes(1L);
        final LocalKafkaJournal journal = new LocalKafkaJournal(journalDirectory.toPath(),
                scheduler,
                segmentSize,
                Duration.standardHours(1),
                Size.kilobytes(1L),
                Duration.standardDays(1),
                1_000_000,
                Duration.standardMinutes(1),
                100,
                new MetricRegistry(),
                serverStatus);
        final File messageJournalDir = new File(journalDirectory, "messagejournal-0");
        assertTrue(messageJournalDir.exists());

        // create enough chunks so that we exceed the maximum journal size we configured
        createBulkChunks(journal, segmentSize, 3);

        // make sure everything is on disk
        journal.flushDirtyLogs();

        assertEquals(3, countSegmentsInDir(messageJournalDir));

        final int cleanedLogs = journal.runRetention();
        assertEquals(1, cleanedLogs);

        final int numberOfSegments = countSegmentsInDir(messageJournalDir);
        assertEquals(2, numberOfSegments);
    }

    @Test
    public void segmentAgeCleanup() throws Exception {
        final InstantMillisProvider clock = new InstantMillisProvider(DateTime.now(DateTimeZone.UTC));

        DateTimeUtils.setCurrentMillisProvider(clock);
        try {
            final Size segmentSize = Size.kilobytes(1L);
            final LocalKafkaJournal journal = new LocalKafkaJournal(journalDirectory.toPath(),
                    scheduler,
                    segmentSize,
                    Duration.standardHours(1),
                    Size.kilobytes(10L),
                    Duration.standardMinutes(1),
                    1_000_000,
                    Duration.standardMinutes(1),
                    100,
                    new MetricRegistry(),
                    serverStatus);
            final File messageJournalDir = new File(journalDirectory, "messagejournal-0");
            assertTrue(messageJournalDir.exists());

            // we need to fix up the last modified times of the actual files.
            long lastModifiedTs[] = new long[2];

            // create two chunks, 30 seconds apart
            createBulkChunks(journal, segmentSize, 1);
            journal.flushDirtyLogs();
            lastModifiedTs[0] = clock.getMillis();

            clock.tick(Period.seconds(30));

            createBulkChunks(journal, segmentSize, 1);
            journal.flushDirtyLogs();
            lastModifiedTs[1] = clock.getMillis();

            int i = 0;
            for (final LogSegment segment : journal.getSegments()) {
                assertTrue(i < 2);
                segment.lastModified_$eq(lastModifiedTs[i]);
                i++;
            }

            int cleanedLogs = journal.runRetention();
            assertEquals("no segments should've been cleaned", 0, cleanedLogs);
            assertEquals("two segments segment should remain", 2, countSegmentsInDir(messageJournalDir));

            // move clock beyond the retention period and clean again
            clock.tick(Period.seconds(120));

            cleanedLogs = journal.runRetention();
            assertEquals("two segments should've been cleaned (only one will actually be removed...)", 2, cleanedLogs);
            assertEquals("one segment should remain", 1, countSegmentsInDir(messageJournalDir));

        } finally {
            DateTimeUtils.setCurrentMillisSystem();
        }
    }

    @Test
    public void segmentCommittedCleanup() throws Exception {
        final Size segmentSize = Size.kilobytes(1L);
        final LocalKafkaJournal journal = new LocalKafkaJournal(journalDirectory.toPath(),
                scheduler,
                segmentSize,
                Duration.standardHours(1),
                Size.petabytes(1L), // never clean by size in this test
                Duration.standardDays(1),
                1_000_000,
                Duration.standardMinutes(1),
                100,
                new MetricRegistry(),
                serverStatus);
        final File messageJournalDir = new File(journalDirectory, "messagejournal-0");
        assertTrue(messageJournalDir.exists());

        final int bulkSize = createBulkChunks(journal, segmentSize, 3);

        // make sure everything is on disk
        journal.flushDirtyLogs();

        assertEquals(3, countSegmentsInDir(messageJournalDir));

        // we haven't committed any offsets, this should not touch anything.
        final int cleanedLogs = journal.runRetention();
        assertEquals(0, cleanedLogs);

        final int numberOfSegments = countSegmentsInDir(messageJournalDir);
        assertEquals(3, numberOfSegments);

        // mark first half of first segment committed, should not clean anything
        journal.markJournalOffsetCommitted(bulkSize / 2);
        assertEquals("should not touch segments", 0, journal.runRetention());
        assertEquals(3, countSegmentsInDir(messageJournalDir));

        journal.markJournalOffsetCommitted(bulkSize + 1);
        assertEquals("first segment should've been purged", 1, journal.runRetention());
        assertEquals(2, countSegmentsInDir(messageJournalDir));

        journal.markJournalOffsetCommitted(bulkSize * 4);
        assertEquals("only purge one segment, not the active one", 1, journal.runRetention());
        assertEquals(1, countSegmentsInDir(messageJournalDir));
    }

    @Test
    public void lockedJournalDir() throws Exception {
        // Grab the lock before starting the KafkaJournal.
        final File file = new File(journalDirectory, ".lock");
        assumeTrue(file.createNewFile());
        final FileLock fileLock = new FileLock(file);
        assumeTrue(fileLock.tryLock());

        try {
            new LocalKafkaJournal(journalDirectory.toPath(),
                    scheduler,
                    Size.megabytes(100L),
                    Duration.standardHours(1),
                    Size.megabytes(5L),
                    Duration.standardHours(1),
                    1_000_000,
                    Duration.standardMinutes(1),
                    100,
                    new MetricRegistry(),
                    serverStatus);
            fail("Expected exception");
        } catch (Exception e) {
            assertThat(e)
                    .isExactlyInstanceOf(RuntimeException.class)
                    .hasMessageStartingWith("org.graylog.shaded.kafka09.common.KafkaException: Failed to acquire lock" +
                            " on file .lock in")
                    .hasCauseExactlyInstanceOf(KafkaException.class);
        }
    }


    @Test
    public void serverStatusThrottledIfJournalUtilizationIsHigherThanThreshold() throws Exception {
        serverStatus.running();

        final Size segmentSize = Size.kilobytes(1L);
        final LocalKafkaJournal journal = new LocalKafkaJournal(journalDirectory.toPath(),
                scheduler,
                segmentSize,
                Duration.standardSeconds(1L),
                Size.kilobytes(4L),
                Duration.standardHours(1L),
                1_000_000,
                Duration.standardSeconds(1L),
                90,
                new MetricRegistry(),
                serverStatus);

        createBulkChunks(journal, segmentSize, 4);
        journal.flushDirtyLogs();
        journal.runRetention();
        assertThat(serverStatus.getLifecycle()).isEqualTo(Lifecycle.THROTTLED);
    }

    @Test
    public void serverStatusUnthrottledIfJournalUtilizationIsLowerThanThreshold() throws Exception {
        serverStatus.throttle();

        final Size segmentSize = Size.kilobytes(1L);
        final LocalKafkaJournal journal = new LocalKafkaJournal(journalDirectory.toPath(),
                scheduler,
                segmentSize,
                Duration.standardSeconds(1L),
                Size.kilobytes(4L),
                Duration.standardHours(1L),
                1_000_000,
                Duration.standardSeconds(1L),
                90,
                new MetricRegistry(),
                serverStatus);

        journal.flushDirtyLogs();
        journal.runRetention();
        assertThat(serverStatus.getLifecycle()).isEqualTo(Lifecycle.RUNNING);
    }

    @Test
    public void truncatedSegment() throws Exception {
        final Size segmentSize = Size.kilobytes(1L);
        final LocalKafkaJournal journal = new LocalKafkaJournal(journalDirectory.toPath(),
                scheduler,
                segmentSize,
                Duration.standardHours(1),
                Size.kilobytes(10L),
                Duration.standardDays(1),
                1_000_000,
                Duration.standardMinutes(1),
                100,
                new MetricRegistry(),
                serverStatus);

        // this will create two segments, each containing 25 messages
        createBulkChunks(journal, segmentSize, 2);

        final Path firstSegmentPath =
                Paths.get(journalDirectory.getAbsolutePath(), "messagejournal-0", "00000000000000000000.log");

        assertThat(firstSegmentPath).isRegularFile();

        // truncate the first segment so that the last message is cut off
        final File firstSegment = firstSegmentPath.toFile();
        try (FileChannel channel = new FileOutputStream(firstSegment, true).getChannel()) {
            channel.truncate(firstSegment.length() - 1);
        }

        final List<Journal.JournalReadEntry> entriesFromFirstSegment = journal.read(25);
        assertThat(entriesFromFirstSegment).hasSize(24);
        final List<Journal.JournalReadEntry> entriesFromSecondSegment = journal.read(25);
        assertThat(entriesFromSecondSegment).hasSize(25);
    }

    @Test
    public void noRetryOnShutdown() throws Exception {
        final Size segmentSize = Size.kilobytes(1L);
        final LocalKafkaJournal journal = new LocalKafkaJournal(journalDirectory.toPath(),
                scheduler,
                segmentSize,
                Duration.standardHours(1),
                Size.kilobytes(10L),
                Duration.standardDays(1),
                1_000_000,
                Duration.standardMinutes(1),
                100,
                new MetricRegistry(),
                serverStatus);

        // this will create two segments, each containing 25 messages
        createBulkChunks(journal, segmentSize, 2);

        final Path firstSegmentPath =
                Paths.get(journalDirectory.getAbsolutePath(), "messagejournal-0", "00000000000000000000.log");

        assertThat(firstSegmentPath).isRegularFile();

        // truncate the first segment so that the last message is cut off
        final File firstSegment = firstSegmentPath.toFile();
        try (FileChannel channel = new FileOutputStream(firstSegment, true).getChannel()) {
            channel.truncate(firstSegment.length() - 1);
        }

        final List<Journal.JournalReadEntry> entriesFromFirstSegment = journal.read(25);
        assertThat(entriesFromFirstSegment).hasSize(24);

        // Trigger a shutdown of the journal.
        journal.triggerShutDown();

        final LocalKafkaJournal journalSpy = Mockito.spy(journal);
        final List<Journal.JournalReadEntry> entriesFromSecondSegment = journalSpy.read(25);

        // When the journal is shut down, we don't want to enter the retry loop in the read method.
        assertThat(entriesFromSecondSegment).isEmpty();
        verify(journalSpy, times(1)).read(25);
        verify(journalSpy, times(1)).read(anyLong(), anyLong());
    }

    /**
     * Test a race condition between reading and writing:
     *
     * We get an empty result back from the journal but at the time we check the last offset, more entries have been
     * written to the journal. In that case we can't assume that the journal is corrupted, which we did with the
     * first implementation.
     *
     * This is a manual test. It will always pass but you will see warnings, if the bug is triggered. You might have
     * to run the test multiple times because as it's a race condition, it can't be triggered reliably.
     */
    @Test
    @Ignore
    public void readNext() throws Exception {
        final LocalKafkaJournal journal = new LocalKafkaJournal(journalDirectory.toPath(),
                scheduler, Size.kilobytes(1L),
                Duration.standardHours(1),
                Size.kilobytes(10L),
                Duration.standardDays(1),
                1_000_000,
                Duration.standardMinutes(1),
                100,
                new MetricRegistry(),
                serverStatus);

        final byte[] idBytes = "id".getBytes(UTF_8);
        final byte[] messageBytes = "message".getBytes(UTF_8);

         // High frequency reading with occasional writing.
        // This doesn't trigger the bug reliably every time though.
        IntStream.range(0, 1_000_000).parallel().forEach(
                (i) -> {
                    if (i % 1000 == 0) {
                        journal.write(idBytes, messageBytes);
                    } else {
                        journal.read(1L).forEach(e -> journal.markJournalOffsetCommitted(e.getOffset()));
                    }
                }
        );
    }

    @Test
    public void testJournalUtilizationSize() {
        Size retentionSize = Size.kilobytes(10L);
        Size segmentSize = Size.kilobytes(1l);
        final LocalKafkaJournal journal = new LocalKafkaJournal(journalDirectory.toPath(),
                scheduler,
                segmentSize,
                Duration.standardHours(1),
                retentionSize,
                Duration.standardDays(1),
                1_000_000,
                Duration.standardMinutes(1),
                LocalKafkaJournal.THRESHOLD_THROTTLING_DISABLED,
                new MetricRegistry(),
                serverStatus);

        //No message in the journal utilization should be zero
        assertThat(journal.getJournalUtilization().get()).isZero();

        //After writing messages utilization should be positive
        final int bulkSize = createBulkChunks(journal, segmentSize, 3);
        double utilizationAfterBulk = journal.getJournalUtilization().get();
        assertThat(utilizationAfterBulk).isPositive();

        //Utilization should decrease again when clean up kicked in
        journal.markJournalOffsetCommitted(bulkSize);
        final int cleanedLogs = journal.runRetention();
        assertEquals(1, cleanedLogs);
        assertThat(journal.getJournalUtilization().get()).isLessThan(utilizationAfterBulk);
    }
}
