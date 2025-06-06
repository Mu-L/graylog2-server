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
package org.graylog.events.contentpack.entities;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.google.auto.value.AutoValue;
import com.google.common.collect.ImmutableList;
import com.google.common.collect.ImmutableMap;
import com.google.common.graph.MutableGraph;
import jakarta.annotation.Nullable;
import org.graylog.events.fields.EventFieldSpec;
import org.graylog.events.notifications.EventNotificationHandler;
import org.graylog.events.notifications.EventNotificationSettings;
import org.graylog.events.procedures.EventProcedure;
import org.graylog.events.processor.EventDefinitionDto;
import org.graylog.events.processor.storage.EventStorageHandler;
import org.graylog2.contentpacks.NativeEntityConverter;
import org.graylog2.contentpacks.exceptions.MissingNativeEntityException;
import org.graylog2.contentpacks.model.ModelId;
import org.graylog2.contentpacks.model.ModelTypes;
import org.graylog2.contentpacks.model.entities.Entity;
import org.graylog2.contentpacks.model.entities.EntityDescriptor;
import org.graylog2.contentpacks.model.entities.EntityV1;
import org.graylog2.contentpacks.model.entities.ScopedContentPackEntity;
import org.graylog2.contentpacks.model.entities.references.ValueReference;
import org.graylog2.database.entities.DefaultEntityScope;
import org.joda.time.DateTime;

import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@AutoValue
@JsonDeserialize(builder = EventDefinitionEntity.Builder.class)
public abstract class EventDefinitionEntity extends ScopedContentPackEntity implements NativeEntityConverter<EventDefinitionDto> {
    public static final String FIELD_TITLE = "title";
    public static final String FIELD_DESCRIPTION = "description";
    public static final String FIELD_REMEDIATION_STEPS = "remediation_steps";
    private static final String FIELD_PRIORITY = "priority";
    private static final String FIELD_ALERT = "alert";
    private static final String FIELD_CONFIG = "config";
    private static final String FIELD_FIELD_SPEC = "field_spec";
    private static final String FIELD_KEY_SPEC = "key_spec";
    private static final String FIELD_NOTIFICATION_SETTINGS = "notification_settings";
    private static final String FIELD_NOTIFICATIONS = "notifications";
    private static final String FIELD_STORAGE = "storage";
    private static final String FIELD_IS_SCHEDULED = "is_scheduled";
    private static final String UPDATED_AT = "updated_at";
    private static final String MATCHED_AT = "matched_at";
    private static final String FIELD_EVENT_PROCEDURE = "event_procedure";

    @JsonProperty(FIELD_TITLE)
    public abstract ValueReference title();

    @JsonProperty(FIELD_DESCRIPTION)
    public abstract ValueReference description();

    @Nullable
    @JsonProperty(FIELD_REMEDIATION_STEPS)
    public abstract ValueReference remediationSteps();

    @Nullable
    @JsonProperty(UPDATED_AT)
    public abstract DateTime updatedAt();

    @Nullable
    @JsonProperty(MATCHED_AT)
    public abstract DateTime matchedAt();

    @JsonProperty(FIELD_PRIORITY)
    public abstract ValueReference priority();

    @JsonProperty(FIELD_ALERT)
    public abstract ValueReference alert();

    @JsonProperty(FIELD_CONFIG)
    public abstract EventProcessorConfigEntity config();

    @JsonProperty(FIELD_FIELD_SPEC)
    public abstract ImmutableMap<String, EventFieldSpec> fieldSpec();

    @JsonProperty(FIELD_KEY_SPEC)
    public abstract ImmutableList<String> keySpec();

    @JsonProperty(FIELD_NOTIFICATION_SETTINGS)
    public abstract EventNotificationSettings notificationSettings();

    @JsonProperty(FIELD_NOTIFICATIONS)
    public abstract ImmutableList<EventNotificationHandlerConfigEntity> notifications();

    @JsonProperty(FIELD_STORAGE)
    public abstract ImmutableList<EventStorageHandler.Config> storage();

    @JsonProperty(FIELD_IS_SCHEDULED)
    public abstract ValueReference isScheduled();

    @Nullable
    @JsonProperty(FIELD_EVENT_PROCEDURE)
    public abstract ValueReference eventProcedureId();

    public static Builder builder() {
        return Builder.create();
    }

    public abstract Builder toBuilder();

    @AutoValue.Builder
    public static abstract class Builder extends ScopedContentPackEntity.AbstractBuilder<EventDefinitionEntity.Builder> {
        @JsonCreator
        public static Builder create() {
            return new AutoValue_EventDefinitionEntity.Builder().isScheduled(ValueReference.of(true));
        }

        @JsonProperty(FIELD_TITLE)
        public abstract Builder title(ValueReference title);

        @JsonProperty(FIELD_DESCRIPTION)
        public abstract Builder description(ValueReference description);

        @JsonProperty(FIELD_REMEDIATION_STEPS)
        public abstract Builder remediationSteps(ValueReference remediationSteps);

        @JsonProperty(UPDATED_AT)
        public abstract Builder updatedAt(DateTime updatedAt);

        @JsonProperty(MATCHED_AT)
        public abstract Builder matchedAt(DateTime matchedAt);

        @JsonProperty(FIELD_PRIORITY)
        public abstract Builder priority(ValueReference priority);

        @JsonProperty(FIELD_ALERT)
        public abstract Builder alert(ValueReference alert);

        @JsonProperty(FIELD_CONFIG)
        public abstract Builder config(EventProcessorConfigEntity config);

        @JsonProperty(FIELD_FIELD_SPEC)
        public abstract Builder fieldSpec(ImmutableMap<String, EventFieldSpec> fieldSpec);

        @JsonProperty(FIELD_KEY_SPEC)
        public abstract Builder keySpec(ImmutableList<String> keySpec);

        @JsonProperty(FIELD_NOTIFICATION_SETTINGS)
        public abstract Builder notificationSettings(EventNotificationSettings notificationSettings);

        @JsonProperty(FIELD_NOTIFICATIONS)
        public abstract Builder notifications(ImmutableList<EventNotificationHandlerConfigEntity> notifications);

        @JsonProperty(FIELD_STORAGE)
        public abstract Builder storage(ImmutableList<EventStorageHandler.Config> storage);

        @JsonProperty(FIELD_IS_SCHEDULED)
        public abstract Builder isScheduled(ValueReference isScheduled);

        @JsonProperty(FIELD_EVENT_PROCEDURE)
        public abstract Builder eventProcedureId(ValueReference eventProcedureId);

        public abstract EventDefinitionEntity build();
    }

    @Override
    public EventDefinitionDto toNativeEntity(Map<String, ValueReference> parameters, Map<EntityDescriptor, Object> nativeEntities) {
        final ImmutableList<EventNotificationHandler.Config> notificationList = ImmutableList.copyOf(
                notifications().stream()
                        .map(notification -> notification.toNativeEntity(parameters, nativeEntities))
                        .collect(Collectors.toList())
        );
        String procedureId = null;
        if (eventProcedureId() != null) {
            final EntityDescriptor procedureDescriptor = EntityDescriptor.create(ModelId.of(eventProcedureId().asString()), ModelTypes.EVENT_PROCEDURE_V1);
            final Object procedureObj = nativeEntities.getOrDefault(procedureDescriptor, null);
            if (procedureObj == null) {
                throw new MissingNativeEntityException(procedureDescriptor);
            }
            if (procedureObj instanceof EventProcedure procedure) {
                procedureId = procedure.id();
            } else {
                throw new MissingNativeEntityException(procedureDescriptor);
            }
        }
        return EventDefinitionDto.builder()
                .scope(scope() != null ? scope().asString(parameters) : DefaultEntityScope.NAME)
                .title(title().asString(parameters))
                .updatedAt(updatedAt())
                .description(description().asString(parameters))
                .remediationSteps(remediationSteps() != null ? remediationSteps().asString(parameters): null)
                .priority(priority().asInteger(parameters))
                .alert(alert().asBoolean(parameters))
                .config(config().toNativeEntity(parameters, nativeEntities))
                .fieldSpec(fieldSpec())
                .keySpec(keySpec())
                .notificationSettings(notificationSettings())
                .notifications(notificationList)
                .storage(storage())
                .eventProcedureId(procedureId)
                .build();
    }

    @Override
    public void resolveForInstallation(EntityV1 entity, Map<String, ValueReference> parameters, Map<EntityDescriptor, Entity> entities, MutableGraph<Entity> graph) {
        notifications().stream()
                .map(EventNotificationHandlerConfigEntity::notificationId)
                .map(valueReference -> valueReference.asString(parameters))
                .map(ModelId::of)
                .map(modelId -> EntityDescriptor.create(modelId, ModelTypes.NOTIFICATION_V1))
                .map(entities::get)
                .filter(Objects::nonNull)
                .forEach(notification -> graph.putEdge(entity, notification));

        if (eventProcedureId() != null) {
            final EntityDescriptor eventProcedureDescriptor = EntityDescriptor.create(ModelId.of(eventProcedureId().asString()), ModelTypes.EVENT_PROCEDURE_V1);
            final Entity procedureEntity = entities.getOrDefault(eventProcedureDescriptor, null);
            if (procedureEntity != null) {
                graph.putEdge(entity, procedureEntity);
            }
        }

        config().resolveForInstallation(entity, parameters, entities, graph);
    }
}
