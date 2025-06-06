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
package org.graylog.integrations.aws.codecs;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.commons.collections4.CollectionUtils;
import org.graylog.integrations.aws.cloudwatch.KinesisLogEntry;
import org.graylog.integrations.aws.transports.KinesisTransport;
import org.graylog2.plugin.Message;
import org.graylog2.plugin.configuration.Configuration;
import org.graylog2.plugin.inputs.codecs.AbstractCodec;
import org.graylog2.plugin.inputs.codecs.CodecAggregator;
import org.graylog2.plugin.inputs.failure.InputProcessingException;
import org.graylog2.plugin.journal.RawMessage;

import javax.annotation.Nonnull;
import javax.annotation.Nullable;
import java.util.Optional;

public abstract class AbstractKinesisCodec extends AbstractCodec {
    public static final String SOURCE = "aws-kinesis-raw-logs";
    static final String SOURCE_GROUP_IDENTIFIER = "aws_source";
    static final String FIELD_KINESIS_STREAM = "aws_kinesis_stream";
    static final String FIELD_KINESIS_STREAM_ARN = "aws_kinesis_stream_arn";
    static final String FIELD_LOG_GROUP = "aws_log_group";
    static final String FIELD_LOG_STREAM = "aws_log_stream";
    public static final String FIELD_SUBSCRIPTION_FILTERS = "aws_subscription_filters";
    public static final String FIELD_MESSAGE_TYPE = "aws_kinesis_message_type";
    private static final String FIELD_OWNER = "aws_owner";

    private final ObjectMapper objectMapper;

    AbstractKinesisCodec(Configuration configuration, ObjectMapper objectMapper) {
        super(configuration);
        this.objectMapper = objectMapper;
    }

    @Override
    public Optional<Message> decodeSafe(@Nonnull RawMessage rawMessage) {
        try {
            final KinesisLogEntry entry = objectMapper.readValue(rawMessage.getPayload(), KinesisLogEntry.class);

            try {
                return decodeLogData(entry);
            } catch (Exception e) {
                throw InputProcessingException.create("Couldn't decode log event <%s>".formatted(entry),
                        e, rawMessage, new String(rawMessage.getPayload(), charset));
            }
        } catch (Exception e) {
            throw InputProcessingException.create("Couldn't deserialize log data",
                    e, rawMessage, new String(rawMessage.getPayload(), charset));
        }
    }

    protected abstract Optional<Message> decodeLogData(@Nonnull final KinesisLogEntry event);

    public void setCommonFields(KinesisLogEntry logEvent, Message result) {
        result.addField(FIELD_LOG_GROUP, logEvent.logGroup());
        result.addField(FIELD_LOG_STREAM, logEvent.logStream());
        result.addField(FIELD_KINESIS_STREAM, logEvent.kinesisStream());
        result.addField(FIELD_KINESIS_STREAM_ARN, configuration.getString(KinesisTransport.CK_KINESIS_STREAM_ARN));
        result.addField(FIELD_OWNER, logEvent.owner());
        result.addField(FIELD_MESSAGE_TYPE, logEvent.messageType());
        if (CollectionUtils.isNotEmpty(logEvent.subscriptionFilters())) {
            result.addField(FIELD_SUBSCRIPTION_FILTERS, logEvent.subscriptionFilters());
        }
    }

    @Nonnull
    @Override
    public Configuration getConfiguration() {
        return configuration;
    }

    @Nullable
    @Override
    public CodecAggregator getAggregator() {
        return null;
    }
}
