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
package org.graylog.plugins.pipelineprocessor.functions.urls;

import com.google.common.base.Throwables;
import org.graylog.plugins.pipelineprocessor.EvaluationContext;
import org.graylog.plugins.pipelineprocessor.ast.functions.AbstractFunction;
import org.graylog.plugins.pipelineprocessor.ast.functions.FunctionArgs;
import org.graylog.plugins.pipelineprocessor.ast.functions.FunctionDescriptor;
import org.graylog.plugins.pipelineprocessor.ast.functions.ParameterDescriptor;
import org.graylog.plugins.pipelineprocessor.rulebuilder.RuleBuilderFunctionGroup;

import java.util.Optional;

/**
 * Converts a value to a valid URL using its string representation.
 * If the input is null or malformed, return a null or a default URL.
 * An exception will be thrown if the default URL is malformed, since that is a pipeline coding error.
 */
public class UrlConversion extends AbstractFunction<URL> {

    public static final String NAME = "to_url";

    private final ParameterDescriptor<Object, Object> urlParam = ParameterDescriptor.object("url").ruleBuilderVariable().description("Value to convert").build();
    private final ParameterDescriptor<String, String> defaultParam = ParameterDescriptor.string("default").optional().description("Used when 'url' is null or malformed").build();

    @Override
    public URL evaluate(FunctionArgs args, EvaluationContext context) {
        final String urlString = String.valueOf(urlParam.required(args, context));
        try {
            return parseUrl(urlString);
        } catch (IllegalArgumentException e) {
            log.debug(context.pipelineErrorMessage("Unable to parse URL for string " + urlString), e);
            final Optional<String> defaultUrl = defaultParam.optional(args, context);
            if (defaultUrl.isEmpty()) {
                return null;
            }
            try {
                return parseUrl(defaultUrl.get());
            } catch (IllegalArgumentException e1) {
                log.warn(context.pipelineErrorMessage("Parameter `default` for to_url() is not a valid URL: " + defaultUrl.get()));
                throw Throwables.propagate(e1);
            }
        }
    }

    private static URL parseUrl(String urlString) {
        final URL url = new URL(urlString);
        if (!url.hasParsedUrl()) {
            throw new IllegalArgumentException("Could not parse a valid URL from: " + urlString);
        }
        return url;
    }

    @Override
    public FunctionDescriptor<URL> descriptor() {
        return FunctionDescriptor.<URL>builder()
                .name(NAME)
                .returnType(URL.class)
                .params(urlParam,
                        defaultParam)
                .description("Converts a value to a valid URL using its string representation")
                .ruleBuilderEnabled()
                .ruleBuilderName("Convert to URL")
                .ruleBuilderTitle("Convert '${url}' to URL")
                .ruleBuilderFunctionGroup(RuleBuilderFunctionGroup.CONVERSION)
                .build();
    }
}
