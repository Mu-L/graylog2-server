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
package org.graylog.plugins.pipelineprocessor.rulebuilder.parser;

import com.google.common.collect.ImmutableList;
import com.google.common.collect.Maps;
import com.google.common.eventbus.EventBus;
import org.graylog.plugins.pipelineprocessor.ast.functions.Function;
import org.graylog.plugins.pipelineprocessor.parser.FunctionRegistry;
import org.graylog.plugins.pipelineprocessor.rulebuilder.RuleBuilderRegistry;
import org.graylog.plugins.pipelineprocessor.rulebuilder.RuleBuilderStep;
import org.graylog.plugins.pipelineprocessor.rulebuilder.db.RuleFragmentService;
import org.graylog2.bindings.providers.SecureFreemarkerConfigProvider;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.graylog.plugins.pipelineprocessor.ast.functions.ParameterDescriptor.integer;
import static org.graylog.plugins.pipelineprocessor.ast.functions.ParameterDescriptor.string;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

public class ConditionParserTest {

    public static final String NL = System.lineSeparator();
    private static RuleBuilderRegistry ruleBuilderRegistry;
    private ConditionParser conditionParser;

    private static final String FUNCTION1_NAME = "function1";
    private static final String FUNCTION2_NAME = "function2";
    private static final String FRAGMENT1_NAME = "fragment1";
    private static final String FRAGMENT2_NAME = "fragment2";

    @BeforeClass
    public static void registerFunctions() {
        final HashMap<String, Function<?>> functions = Maps.newHashMap();
        functions.put(FUNCTION1_NAME, FunctionUtil.testFunction(
                FUNCTION1_NAME, ImmutableList.of(
                        string("required").build(),
                        integer("optional").optional().build()
                ), Boolean.class
        ));
        functions.put(FUNCTION2_NAME, FunctionUtil.testFunction(
                FUNCTION2_NAME, ImmutableList.of(
                        integer("optional").optional().build()
                ), Boolean.class
        ));

        RuleFragmentService ruleFragmentService = mock(RuleFragmentService.class);
        when(ruleFragmentService.all()).thenReturn(new ArrayList<>());

        final SecureFreemarkerConfigProvider secureFreemarkerConfigProvider = new SecureFreemarkerConfigProvider();
        secureFreemarkerConfigProvider.get().setLogTemplateExceptions(false);
        ruleBuilderRegistry = new RuleBuilderRegistry(new FunctionRegistry(functions),
                ruleFragmentService, secureFreemarkerConfigProvider, mock(EventBus.class));
    }

    @Before
    public void initialize() {
        final SecureFreemarkerConfigProvider secureFreemarkerConfigProvider = new SecureFreemarkerConfigProvider();
        secureFreemarkerConfigProvider.get().setLogTemplateExceptions(false);
        conditionParser = new ConditionParser(ruleBuilderRegistry);
    }


    @Test
    public void generateTrueValue_WhenRuleConditionsEmpty() {
        assertThat(conditionParser.generate(new ArrayList<>(), RuleBuilderStep.Operator.AND, 1)).isEqualTo("  true");
    }

    @Test
    public void emptyString_WhenConditionNotInRuleBuilderConditions() {
        RuleBuilderStep step = RuleBuilderStep.builder().function("unknownFunction").build();
        assertThat(conditionParser.generateCondition(step, 1)).isEqualTo("");
    }

    @Test
    public void singleConditionWithoutParamsGeneration() {
        RuleBuilderStep step = RuleBuilderStep.builder().function(FUNCTION2_NAME).build();
        assertThat(conditionParser.generateCondition(step, 1)).isEqualTo(
                "  function2()"
        );
    }

    @Test
    public void singleNegatedConditionWithoutParamsGeneration() {
        RuleBuilderStep step = RuleBuilderStep.builder().function(FUNCTION2_NAME).negate().build();
        assertThat(conditionParser.generateCondition(step, 1)).isEqualTo(
                "  ! function2()"
        );
    }

    @Test
    public void singleConditionWithSingleParamGeneration() {
        RuleBuilderStep step = RuleBuilderStep.builder().function(FUNCTION1_NAME)
                .parameters(Map.of("required", "val1")).build();
        assertThat(conditionParser.generateCondition(step, 1)).isEqualTo(
                "  function1(" + NL + "    required : \"val1\"" + NL + "  )"
        );
    }

    @Test
    public void singleConditionWithMultipleParamsGeneration() {
        RuleBuilderStep step = RuleBuilderStep.builder().function(FUNCTION1_NAME)
                .parameters(Map.of("required", "val1", "optional", 1)).build();
        assertThat(conditionParser.generateCondition(step, 1)).isEqualTo(
                "  function1(" + NL +
                        "    required : \"val1\"," + NL +
                        "    optional : 1" + NL +
                        "  )"
        );
    }

    @Test
    public void generate_WhenRuleConditionsContainsOneFunction() {
        List<RuleBuilderStep> steps = List.of(
                RuleBuilderStep.builder().function(FUNCTION2_NAME).build()
        );
        assertThat(conditionParser.generate(steps, RuleBuilderStep.Operator.AND, 1)).isEqualTo("""
                  function2()
                """.stripTrailing());
    }

    @Test
    public void generate_WhenRuleConditionsContainsMultipleFunctions() {
        List<RuleBuilderStep> steps = List.of(
                RuleBuilderStep.builder().function(FUNCTION1_NAME)
                        .parameters(Map.of("required", "val1"))
                        .build(),
                RuleBuilderStep.builder().function(FUNCTION2_NAME).negate().build()
        );
        assertThat(conditionParser.generate(steps, RuleBuilderStep.Operator.AND, 1)).isEqualTo("""
                  function1(
                    required : "val1"
                  )
                  AND
                  ! function2()
                """.stripTrailing());
    }


}
