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
import { render, screen } from 'wrappedTestingLibrary';
import { List } from 'immutable';

import FieldTypeMapping from 'views/logic/fieldtypes/FieldTypeMapping';
import { FieldTypes } from 'views/logic/fieldtypes/FieldType';
import RenderCompletionCallback from 'views/components/widgets/RenderCompletionCallback';
import AggregationWidgetConfig from 'views/logic/aggregationbuilder/AggregationWidgetConfig';
import Series from 'views/logic/aggregationbuilder/Series';
import type { Rows } from 'views/logic/searchtypes/pivot/PivotHandler';
import TestStoreProvider from 'views/test/TestStoreProvider';
import useViewsPlugin from 'views/test/testViewsPlugin';

import NumberVisualization from './NumberVisualization';

jest.mock(
  './AutoFontSizer',
  () =>
    ({ children = undefined }: React.PropsWithChildren<{}>) =>
      children,
);

jest.mock(
  'views/components/highlighting/CustomHighlighting',
  () =>
    ({ children = undefined }: React.PropsWithChildren<{}>) => <div>{children}</div>,
);

jest.mock('views/components/Value', () => ({ value }: { value: string }) => <div>{value}</div>);

type Data = Record<string, Rows>;
type SUTProps = {
  data?: Data;
};

describe('NumberVisualization', () => {
  const data: Data = {
    chart: [
      {
        key: [],
        source: 'leaf',
        values: [
          {
            key: ['sum(lines_add)'],
            rollup: true,
            source: 'row-leaf',
            value: 2134342,
          },
        ],
      },
    ],
  };
  const fields = List([FieldTypeMapping.create('lines_add', FieldTypes.INT())]);

  const SimplifiedNumberVisualization = (props: SUTProps = {}) => (
    <TestStoreProvider>
      <NumberVisualization
        data={data}
        width={200}
        height={200}
        fields={fields}
        setLoadingState={() => {}}
        onChange={() => {}}
        toggleEdit={() => {}}
        effectiveTimerange={{
          from: '2020-01-10T13:23:42.000Z',
          to: '2020-01-10T14:23:42.000Z',
          type: 'absolute',
        }}
        config={AggregationWidgetConfig.builder()
          .series([Series.forFunction('count()')])
          .build()}
        {...props}
      />
    </TestStoreProvider>
  );

  useViewsPlugin();

  it('should render a number visualization', async () => {
    render(<SimplifiedNumberVisualization />);

    await screen.findByText('2134342');
  });

  it('calls render completion callback after first render', () => {
    const onRenderComplete = jest.fn();

    render(
      <RenderCompletionCallback.Provider value={onRenderComplete}>
        <SimplifiedNumberVisualization />
      </RenderCompletionCallback.Provider>,
    );

    expect(onRenderComplete).toHaveBeenCalledTimes(1);
  });

  it('renders 0 if value is 0', async () => {
    const dataWithZeroValue: { chart: Rows } = {
      chart: [
        {
          key: [],
          source: 'leaf',
          values: [
            {
              key: ['count()'],
              rollup: true,
              source: 'row-leaf',
              value: 0,
            },
          ],
        },
      ],
    };
    render(<SimplifiedNumberVisualization data={dataWithZeroValue} />);

    await screen.findByText('0');
  });

  it('renders N/A if value is null', async () => {
    const dataWithZeroValue: Data = {
      chart: [
        {
          key: [],
          source: 'leaf',
          values: [
            {
              key: ['count()'],
              rollup: true,
              source: 'row-leaf',
              value: null,
            },
          ],
        },
      ],
    };
    render(<SimplifiedNumberVisualization data={dataWithZeroValue} />);

    await screen.findByText('N/A');
  });
});
