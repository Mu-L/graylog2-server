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
import * as React from 'react';
import { useFormikContext, FieldArray } from 'formik';

import MetricConfiguration from './MetricConfiguration';
import MetricElement from './MetricElement';

import ElementConfigurationContainer from '../ElementConfigurationContainer';
import type { WidgetConfigFormValues } from '../WidgetConfigForm';

const MetricsConfiguration = () => {
  const { values: { metrics } } = useFormikContext<WidgetConfigFormValues>();

  return (
    <FieldArray name="metrics"
                validateOnChange={false}
                render={() => (
                  <>
                    {metrics.map((_metric, index) => (
                      // eslint-disable-next-line react/no-array-index-key
                      <ElementConfigurationContainer key={`metrics-${index}`}
                                                     index={index}
                                                     onRemove={MetricElement.onRemove}
                                                     elementTitle={MetricElement.title}>
                        <MetricConfiguration index={index} />
                      </ElementConfigurationContainer>
                    ))}
                  </>
                )} />
  );
};

export default React.memo(MetricsConfiguration);
