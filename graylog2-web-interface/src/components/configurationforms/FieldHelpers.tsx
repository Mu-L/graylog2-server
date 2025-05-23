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
import type { ConfigurationField } from 'components/configurationforms/types';

export const hasAttribute = (array: Array<string>, attribute: string): boolean =>
  array.find((e) => e.toLowerCase() === attribute.toLowerCase()) !== undefined;

export const optionableLabel = (field: ConfigurationField): string =>
  field.is_optional && field.type !== 'boolean' ? ` ${field.human_name} (optional)` : field.human_name;

export default {
  hasAttribute,
  optionableLabel,
};
