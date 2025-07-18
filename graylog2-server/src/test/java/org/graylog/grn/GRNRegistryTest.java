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
package org.graylog.grn;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.util.Collections;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class GRNRegistryTest {
    private GRNType type;
    private GRNRegistry registry;

    @Nested
    @DisplayName("with entries")
    class WithBuiltins {
        @BeforeEach
        void setup() {
            type = GRNType.create("test");
            registry = GRNRegistry.createWithTypes(Collections.singleton(type));
        }

        @Test
        @DisplayName("parse with existing type")
        void parseWithExistingType() {
            assertThat(registry.parse("grn::::test:123")).satisfies(grn -> {
                assertThat(grn.tenant()).isEmpty();
                assertThat(grn.cluster()).isEmpty();
                assertThat(grn.type()).isEqualTo("test");
                assertThat(grn.entity()).isEqualTo("123");
            });
        }

        @Test
        @DisplayName("parse with missing type should fail")
        void parseWithMissingType() {
            assertThatThrownBy(() -> registry.parse("grn::::__foo__:123"))
                    .hasMessageContaining("__foo__")
                    .isInstanceOf(IllegalArgumentException.class);
        }

        @Test
        void newGRN() {
            assertThat(registry.newGRN("test", "123").toString()).isEqualTo("grn::::test:123");
            assertThat(registry.newGRN(type, "123").toString()).isEqualTo("grn::::test:123");
        }

        @Test
        void newGRNBuilder() {
            assertThat(registry.newGRNBuilder("test").entity("123").build().toString()).isEqualTo("grn::::test:123");
            assertThat(registry.newGRNBuilder(type).entity("123").build().toString()).isEqualTo("grn::::test:123");
        }
    }

    @Nested
    @DisplayName("with providers")
    class WithProviders {
        @BeforeEach
        void setup() {
            registry = new GRNRegistry(Set.of(
                    new GRNTypeProvider() {
                        @Override
                        public Set<GRNType> getTypes() {
                            return Set.of(GRNType.create("provided1"));
                        }
                    },
                    new GRNTypeProvider() {
                        @Override
                        public Set<GRNType> getTypes() {
                            return Set.of(GRNType.create("provided2"));
                        }
                    }
            ));
        }

        @Test
        void parse() {
            final GRN parse1 = registry.parse("grn::::provided1:123");
            final GRN parse2 = registry.parse("grn::::provided2:123");
            assertThat(parse1.type()).isEqualTo("provided1");
            assertThat(parse2.type()).isEqualTo("provided2");
        }

        @Test
        void parseIllegal() {
            assertThatThrownBy(() -> registry.parse("grn::::dummy:123"))
                    .isInstanceOf(IllegalArgumentException.class);
        }
    }

    @Nested
    @DisplayName("when empty")
    class WhenEmpty {
        @BeforeEach
        void setup() {
            registry = GRNRegistry.createEmpty();
        }

        @Test
        @DisplayName("parse should fail")
        void parse() {
            assertThatThrownBy(() -> registry.parse("grn::::collection:123"))
                    .isInstanceOf(IllegalArgumentException.class);
        }

        @Test
        @DisplayName("newGRNBuilder should fail")
        void newGRNBuilder() {
            assertThatThrownBy(() -> registry.newGRNBuilder("collection"))
                    .isInstanceOf(IllegalArgumentException.class);
        }
    }
}
