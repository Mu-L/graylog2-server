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
package org.graylog.plugins.pipelineprocessor.rest;

import com.fasterxml.jackson.annotation.JsonAutoDetect;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.google.auto.value.AutoValue;
import org.graylog.plugins.pipelineprocessor.db.RuleDao;
import org.graylog.plugins.pipelineprocessor.parser.ParseException;
import org.graylog.plugins.pipelineprocessor.parser.PipelineRuleParser;
import org.graylog.plugins.pipelineprocessor.parser.errors.ParseError;
import org.graylog.plugins.pipelineprocessor.rulebuilder.RuleBuilder;
import org.graylog2.database.entities.DefaultEntityScope;
import org.joda.time.DateTime;
import org.mongojack.Id;
import org.mongojack.ObjectId;

import javax.annotation.Nullable;
import java.util.Set;

@AutoValue
@JsonAutoDetect
public abstract class RuleSource {

    @JsonProperty("id")
    @Nullable
    @Id
    @ObjectId
    public abstract String id();

    @JsonProperty("_scope")
    public abstract String scope();

    @JsonProperty
    @Nullable
    public abstract String title();

    @JsonProperty
    @Nullable
    public abstract String description();

    @JsonProperty
    public abstract String source();

    @JsonProperty
    @Nullable
    public abstract DateTime createdAt();

    @JsonProperty
    @Nullable
    public abstract DateTime modifiedAt();

    @JsonProperty
    @Nullable
    public abstract Set<ParseError> errors();

    @JsonProperty
    @Nullable
    public abstract RuleBuilder ruleBuilder();

    @JsonProperty
    @Nullable
    public abstract String simulatorMessage();

    public static Builder builder() {
        return new AutoValue_RuleSource.Builder().scope(DefaultEntityScope.NAME);
    }

    public abstract Builder toBuilder();

    public static RuleSource create(@JsonProperty("id") @Id @ObjectId @Nullable String id,
                                    @JsonProperty("title") String title,
                                    @JsonProperty("description") @Nullable String description,
                                    @JsonProperty("source") String source,
                                    @JsonProperty("simulator_message") @Nullable String simulatorMessage,
                                    @JsonProperty("created_at") @Nullable DateTime createdAt,
                                    @JsonProperty("modified_at") @Nullable DateTime modifiedAt) {
        return create(id, null, title, description, source, simulatorMessage, createdAt, modifiedAt);
    }

    @JsonCreator
    public static RuleSource create(@JsonProperty("id") @Id @ObjectId @Nullable String id,
                                    @JsonProperty("_scope") @Nullable String scope,
                                    @JsonProperty("title") String title,
                                    @JsonProperty("description") @Nullable String description,
                                    @JsonProperty("source") String source,
                                    @JsonProperty("simulator_message") @Nullable String simulatorMessage,
                                    @JsonProperty("created_at") @Nullable DateTime createdAt,
                                    @JsonProperty("modified_at") @Nullable DateTime modifiedAt) {
        return builder()
                .id(id)
                .scope(scope == null ? DefaultEntityScope.NAME : scope)
                .source(source)
                .title(title)
                .description(description)
                .createdAt(createdAt)
                .modifiedAt(modifiedAt)
                .simulatorMessage(simulatorMessage)
                .build();
    }

    public static RuleSource fromDao(PipelineRuleParser parser, RuleDao dao) {
        Set<ParseError> errors = null;
        try {
            parser.parseRule(dao.id(), dao.source(), false);

        } catch (ParseException e) {
            errors = e.getErrors();
        }

        return builder()
                .id(dao.id())
                .scope(dao.scope())
                .source(dao.source())
                .title(dao.title())
                .description(dao.description())
                .createdAt(dao.createdAt())
                .modifiedAt(dao.modifiedAt())
                .errors(errors)
                .ruleBuilder(dao.ruleBuilder())
                .simulatorMessage(dao.simulatorMessage())
                .build();
    }

    @AutoValue.Builder
    public abstract static class Builder {
        public abstract RuleSource build();

        public abstract Builder id(String id);

        public abstract Builder scope(String scope);

        public abstract Builder title(String title);

        public abstract Builder description(String description);

        public abstract Builder source(String source);

        public abstract Builder createdAt(DateTime createdAt);

        public abstract Builder modifiedAt(DateTime modifiedAt);

        public abstract Builder errors(Set<ParseError> errors);

        public abstract Builder ruleBuilder(RuleBuilder ruleBuilder);

        public abstract Builder simulatorMessage(String simulatorMessage);

    }
}
