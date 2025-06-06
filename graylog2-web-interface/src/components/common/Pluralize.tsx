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
import React from 'react';

import StringUtils from 'util/StringUtils';

type Props = {
  /** Singular form of the word. */
  singular: string;
  /** Plural form of the word. */
  plural: string;
  /** Value to use to decide which form will be rendered. */
  value: number | string;
};

/**
 * Component that will render a singular or plural text depending on a given value.
 */
const Pluralize = ({ value, singular, plural }: Props) => <span>{StringUtils.pluralize(value, singular, plural)}</span>;

export default Pluralize;
