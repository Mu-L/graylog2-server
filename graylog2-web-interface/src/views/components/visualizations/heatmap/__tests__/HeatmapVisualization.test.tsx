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
import { render } from 'wrappedTestingLibrary';
import * as Immutable from 'immutable';

import mockComponent from 'helpers/mocking/MockComponent';
import Pivot from 'views/logic/aggregationbuilder/Pivot';
import Series from 'views/logic/aggregationbuilder/Series';
import AggregationWidgetConfig from 'views/logic/aggregationbuilder/AggregationWidgetConfig';
import type { AbsoluteTimeRange } from 'views/logic/queries/Query';
import HeatmapVisualizationConfig from 'views/logic/aggregationbuilder/visualizations/HeatmapVisualizationConfig';
import TestStoreProvider from 'views/test/TestStoreProvider';
import useViewsPlugin from 'views/test/testViewsPlugin';
import TestFieldTypesContextProvider from 'views/components/contexts/TestFieldTypesContextProvider';
import asMock from 'helpers/mocking/AsMock';
import GenericPlot from 'views/components/visualizations/GenericPlot';

import * as fixtures from './HeatmapVisualization.fixtures';

import HeatmapVisualization from '../HeatmapVisualization';

jest.mock('../../GenericPlot', () => jest.fn(mockComponent('GenericPlot')));

// eslint-disable-next-line react/require-default-props
const WrappedHeatMap = (props: React.ComponentProps<typeof HeatmapVisualization>) => (
  <TestStoreProvider>
    <TestFieldTypesContextProvider>
      <HeatmapVisualization {...props} />
    </TestFieldTypesContextProvider>
  </TestStoreProvider>
);

describe('HeatmapVisualization', () => {
  useViewsPlugin();

  beforeEach(() => {
    asMock(GenericPlot).mockClear();
  });

  it('generates correct props for plot component', () => {
    const columnPivot = Pivot.createValues(['http_status']);
    const rowPivot = Pivot.createValues(['hour']);
    const series = new Series('count()');
    const config = AggregationWidgetConfig.builder()
      .rowPivots([rowPivot])
      .columnPivots([columnPivot])
      .series([series])
      .visualization('heatmap')
      .build();
    const effectiveTimerange: AbsoluteTimeRange = {
      type: 'absolute',
      from: '2019-10-22T11:54:35.850Z',
      to: '2019-10-29T11:53:50.000Z',
    };
    const plotLayout = {
      yaxis: { type: 'category', fixedrange: true },
      xaxis: { type: 'category', fixedrange: true },
      margin: { b: 40 },
    };
    const plotChartData = [
      {
        type: 'heatmap',
        name: 'Heatmap Chart',
        x: ['100', '201', '304', '405'],
        y: ['00', '01'],
        z: [
          [217, 'None', 213, 'None'],
          ['None', 217, 'None', 230],
        ],
        text: [
          ['count()', 'count()', 'count()', 'count()'],
          ['count()', 'count()', 'count()', 'count()'],
        ],
        customdata: [
          [217, 'None', 213, 'None'],
          ['None', 217, 'None', 230],
        ],
        hovertemplate: 'hour: %{y}<br>http_status: %{x}<br>%{text}: %{customdata}<extra></extra>',
        colorscale: 'Viridis',
        reversescale: false,
        originalName: 'Heatmap Chart',
        colorbar: { tickfont: { color: '#252D47' } },
      },
    ];

    render(
      <WrappedHeatMap
        data={fixtures.validData}
        config={config}
        setLoadingState={() => {}}
        effectiveTimerange={effectiveTimerange}
        fields={Immutable.List()}
        height={1024}
        onChange={() => {}}
        toggleEdit={() => {}}
        width={800}
      />,
    );

    expect(GenericPlot).toHaveBeenCalledWith(
      expect.objectContaining({
        layout: plotLayout,
        chartData: plotChartData,
      }),
      {},
    );
  });

  it('generates correct props for plot component with empty data with use smallest value as default', () => {
    const columnPivot = Pivot.createValues(['http_status']);
    const rowPivot = Pivot.createValues(['hour']);
    const series = new Series('count()');
    const config = AggregationWidgetConfig.builder()
      .rowPivots([rowPivot])
      .columnPivots([columnPivot])
      .series([series])
      .visualization('heatmap')
      .visualizationConfig(HeatmapVisualizationConfig.empty().toBuilder().useSmallestAsDefault(true).build())
      .build();
    const effectiveTimerange: AbsoluteTimeRange = {
      type: 'absolute',
      from: '2019-10-22T11:54:35.850Z',
      to: '2019-10-29T11:53:50.000Z',
    };
    const plotLayout = { yaxis: { fixedrange: true }, xaxis: { fixedrange: true }, margin: { b: 40 } };
    const plotChartData = [
      {
        type: 'heatmap',
        name: 'Heatmap Chart',
        x: [],
        y: [],
        z: [],
        text: [],
        customdata: [],
        hovertemplate: 'hour: %{y}<br>http_status: %{x}<br>%{text}: %{customdata}<extra></extra>',
        colorscale: 'Viridis',
        reversescale: false,
        originalName: 'Heatmap Chart',
        colorbar: { tickfont: { color: '#252D47' } },
      },
    ];

    render(
      <WrappedHeatMap
        data={{ chart: [] }}
        config={config}
        setLoadingState={() => {}}
        effectiveTimerange={effectiveTimerange}
        fields={Immutable.List()}
        height={1024}
        onChange={() => {}}
        toggleEdit={() => {}}
        width={800}
      />,
    );

    expect(GenericPlot).toHaveBeenCalledWith(
      expect.objectContaining({
        layout: plotLayout,
        chartData: plotChartData,
      }),
      {},
    );
  });
});
