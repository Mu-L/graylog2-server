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
package org.graylog.plugins.views.search.rest.scriptingapi.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.Locale;
import java.util.Objects;
import java.util.Optional;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ResponseSchemaEntry(
        @JsonProperty("column_type") ResponseEntryType type,
        @JsonProperty("type") ResponseEntryDataType dataType,
        @JsonProperty("function") String functionName,
        @JsonProperty("field") String fieldName) {

    public static ResponseSchemaEntry groupBy(String fieldName) {
        Objects.requireNonNull(fieldName);
        return new ResponseSchemaEntry(ResponseEntryType.GROUPING, ResponseEntryDataType.STRING, null, fieldName);
    }

    public static ResponseSchemaEntry metric(String functionName, ResponseEntryDataType dataType, String fieldName) {
        Objects.requireNonNull(functionName);
        Objects.requireNonNull(dataType);
        return new ResponseSchemaEntry(ResponseEntryType.METRIC, dataType, functionName, fieldName);
    }

    /**
     * @return Human readable label like:
     * grouping: http_method
     * metric: count(action)
     * metric: avg(took_ms)
     */
    @JsonProperty
    public String name() {
        return type + ": " + getFunctionLabel();
    }

    private String getFunctionLabel() {
        if (functionName != null) {
            final String safeFieldName = Optional.ofNullable(fieldName).orElse("");
            return String.format(Locale.ROOT, "%s(%s)", functionName, safeFieldName);
        } else {
            return fieldName;
        }
    }
}
