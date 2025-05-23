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
import { useMemo } from 'react';
import * as Immutable from 'immutable';

import View from 'views/logic/views/View';
import type { AbsoluteTimeRange, RelativeTimeRangeStartOnly, TimeRange } from 'views/logic/queries/Query';
import type { Event } from 'components/events/events/types';
import type { EventDefinition, SearchFilter } from 'components/event-definitions/event-definitions-types';
import QueryGenerator from 'views/logic/queries/QueryGenerator';
import Search from 'views/logic/search/Search';
import { matchesDecoratorStream, matchesDecoratorStreamCategories } from 'views/logic/views/ViewStateGenerator';
import UpdateSearchForWidgets from 'views/logic/views/UpdateSearchForWidgets';
import ViewState from 'views/logic/views/ViewState';
import { allMessagesTable, resultHistogram } from 'views/logic/Widgets';
import WidgetPosition from 'views/logic/widgets/WidgetPosition';
import { DecoratorsActions } from 'stores/decorators/DecoratorsStore';
import generateId from 'logic/generateId';
import pivotForField from 'views/logic/searchtypes/aggregation/PivotGenerator';
import FieldType from 'views/logic/fieldtypes/FieldType';
import AggregationWidget from 'views/logic/aggregationbuilder/AggregationWidget';
import AggregationWidgetConfig from 'views/logic/aggregationbuilder/AggregationWidgetConfig';
import Series from 'views/logic/aggregationbuilder/Series';
import type Pivot from 'views/logic/aggregationbuilder/Pivot';
import type { EventDefinitionAggregation } from 'hooks/useEventDefinition';
import SortConfig from 'views/logic/aggregationbuilder/SortConfig';
import Direction from 'views/logic/aggregationbuilder/Direction';
import type { ParameterJson } from 'views/logic/parameters/Parameter';
import Parameter from 'views/logic/parameters/Parameter';
import { concatQueryStrings, escape, predicate } from 'views/logic/queries/QueryHelper';
import HighlightingRule, { randomColor } from 'views/logic/views/formatting/highlighting/HighlightingRule';
import { exprToConditionMapper } from 'views/logic/ExpressionConditionMappers';
import FormattingSettings from 'views/logic/views/formatting/FormattingSettings';
import type { QueryString } from 'views/logic/queries/types';

const AGGREGATION_WIDGET_HEIGHT = 3;

export const getAggregationWidget = ({
  rowPivots,
  fnSeries,
  sort = [],
}: {
  rowPivots: Array<Pivot>;
  fnSeries: Array<Series>;
  sort?: Array<SortConfig>;
}) =>
  AggregationWidget.builder()
    .id(generateId())
    .config(
      AggregationWidgetConfig.builder()
        .columnPivots([])
        .rowPivots(rowPivots)
        .series(fnSeries)
        .sort(sort)
        .visualization('table')
        .rollup(true)
        .build(),
    )
    .build();

const createViewPosition = ({ index, SUMMARY_ROW_DELTA }) => {
  const isEven = (index + 1) % 2 === 0;
  const col = isEven ? 7 : 1;
  const HEIGHT_DELTA = index >= 2 ? AGGREGATION_WIDGET_HEIGHT : 0;
  const row = Math.ceil((index + 1) / 2) + HEIGHT_DELTA + SUMMARY_ROW_DELTA;

  return new WidgetPosition(col, row, AGGREGATION_WIDGET_HEIGHT, 6);
};

const createViewWidget = ({ groupBy, fnSeries, expr }: { groupBy: Array<string>; fnSeries: string; expr: string }) => {
  const rowPivots = groupBy.length ? [pivotForField(groupBy, new FieldType('value', [], []))] : [];
  const fnSeriesForFunc = Series.forFunction(fnSeries);
  const direction = ['>', '>=', '=='].includes(expr) ? Direction.Descending : Direction.Ascending;
  const sort = [new SortConfig(SortConfig.SERIES_TYPE, fnSeries, direction)];

  return getAggregationWidget({ rowPivots, fnSeries: [fnSeriesForFunc], sort });
};

const getSummaryAggregation = ({ aggregations, groupBy }) => {
  const { summaryFnSeries, summaryTitle } = aggregations.reduce(
    (res, { value, expr, fnSeries }) => {
      const concatTitle = `${fnSeries} ${expr} ${value}`;
      res.summaryFnSeries.push(fnSeries);
      res.summaryTitle = `${res.summaryTitle} ${concatTitle}`;

      return res;
    },
    {
      summaryFnSeries: [],
      summaryTitle: 'Summary: ',
    },
  );

  const summaryWidget = getAggregationWidget({
    rowPivots: [pivotForField(groupBy, new FieldType('value', [], []))],
    fnSeries: summaryFnSeries.map((s) => Series.forFunction(s)),
  });

  return {
    summaryTitle,
    summaryWidget,
    summaryPosition: new WidgetPosition(1, 1, AGGREGATION_WIDGET_HEIGHT, Infinity),
  };
};

export const WidgetsGenerator = async ({ streams, streamCategories, aggregations, groupBy }) => {
  const decorators = await DecoratorsActions.list();
  const byStreamId = matchesDecoratorStream(streams);
  const byStreamCategory = matchesDecoratorStreamCategories(streamCategories);
  const streamDecorators = decorators?.length ? decorators.filter(byStreamId) : [];
  const streamCategoryDecorators = decorators?.length ? decorators.filter(byStreamCategory) : [];
  const allDecorators =
    // eslint-disable-next-line no-nested-ternary
    streamDecorators.length && streamCategoryDecorators.length
      ? [...streamDecorators, ...streamCategoryDecorators]
      : streamDecorators.length
        ? streamDecorators
        : streamCategoryDecorators;
  const histogram = resultHistogram();
  const messageTable = allMessagesTable(undefined, allDecorators);
  const needsSummaryAggregations = aggregations.length > 1;
  const SUMMARY_ROW_DELTA = needsSummaryAggregations ? AGGREGATION_WIDGET_HEIGHT : 0;
  const { aggregationWidgets, aggregationTitles, aggregationPositions } = aggregations.reduce(
    (res, { value, expr, fnSeries }, index) => {
      const widget = createViewWidget({ fnSeries, groupBy, expr });
      res.aggregationWidgets.push(widget);
      res.aggregationTitles[widget.id] = `${fnSeries} ${expr} ${value}`;
      res.aggregationPositions[widget.id] = createViewPosition({ index, SUMMARY_ROW_DELTA });

      return res;
    },
    { aggregationTitles: {}, aggregationWidgets: [], aggregationPositions: {} },
  );

  const widgets = [...aggregationWidgets, histogram, messageTable];

  const titles = {
    widget: {
      ...aggregationTitles,
      [histogram.id]: 'Message Count',
      [messageTable.id]: 'All Messages',
    },
  };

  const positions = {
    ...aggregationPositions,
    [histogram.id]: new WidgetPosition(
      1,
      AGGREGATION_WIDGET_HEIGHT * aggregationWidgets.length + 1 + SUMMARY_ROW_DELTA,
      2,
      Infinity,
    ),
    [messageTable.id]: new WidgetPosition(
      1,
      AGGREGATION_WIDGET_HEIGHT * aggregationWidgets.length + 3 + SUMMARY_ROW_DELTA,
      6,
      Infinity,
    ),
  };

  if (needsSummaryAggregations) {
    const { summaryTitle, summaryWidget, summaryPosition } = getSummaryAggregation({ aggregations, groupBy });
    widgets.push(summaryWidget);
    titles.widget[summaryWidget.id] = summaryTitle;
    positions[summaryWidget.id] = summaryPosition;
  }

  return { titles, widgets, positions };
};

export const ViewStateGenerator = async ({
  streams,
  streamCategories,
  aggregations,
  groupBy,
}: {
  groupBy: Array<string>;
  streams: string | string[] | undefined;
  streamCategories: string | string[] | undefined;
  aggregations: Array<any>;
}) => {
  const { titles, widgets, positions } = await WidgetsGenerator({ streams, streamCategories, aggregations, groupBy });

  const highlightRules = aggregations?.map(({ fnSeries, value, expr }) =>
    HighlightingRule.create(fnSeries, value, exprToConditionMapper[expr] || 'equal', randomColor()),
  );

  return ViewState.create()
    .toBuilder()
    .titles(titles)
    .widgets(Immutable.List(widgets))
    .widgetPositions(positions)
    .formatting(FormattingSettings.create(highlightRules))
    .build();
};

export const ViewGenerator = async ({
  streams,
  streamCategories,
  timeRange,
  queryString,
  aggregations,
  groupBy,
  queryParameters,
  searchFilters,
}: {
  streams: string | string[] | undefined | null;
  streamCategories: string | string[] | undefined | null;
  timeRange: AbsoluteTimeRange | RelativeTimeRangeStartOnly;
  queryString: QueryString;
  aggregations: Array<EventDefinitionAggregation>;
  groupBy: Array<string>;
  queryParameters: Array<ParameterJson>;
  searchFilters?: Array<SearchFilter>;
}) => {
  const query = QueryGenerator(streams, streamCategories, undefined, timeRange, queryString, searchFilters || []);
  const search = Search.create()
    .toBuilder()
    .queries([query])
    .parameters(queryParameters.map((param) => Parameter.fromJSON(param)))
    .build();
  const viewState = await ViewStateGenerator({ streams, streamCategories, aggregations, groupBy });

  const view = View.create()
    .toBuilder()
    .newId()
    .type(View.Type.Search)
    .state({ [query.id]: viewState })
    .search(search)
    .build();

  return UpdateSearchForWidgets(view);
};

export const UseCreateViewForEvent = ({
  eventData,
  eventDefinition,
  aggregations,
}: {
  eventData?: Event;
  eventDefinition: EventDefinition;
  aggregations: Array<EventDefinitionAggregation>;
}) => {
  const queryStringFromGrouping = concatQueryStrings(
    Object.entries(eventData?.group_by_fields ?? {}).map(([field, value]) => predicate(field, escape(value))),
    { withBrackets: false },
  );
  const eventQueryString = eventData?.replay_info?.query ?? eventDefinition?.config?.query ?? '';
  const streams = eventData?.replay_info?.streams ?? eventDefinition?.config?.streams ?? [];
  const streamCategories =
    eventData?.replay_info?.stream_categories ?? eventDefinition?.config?.stream_categories ?? [];
  const timeRange: TimeRange = eventData
    ? {
        type: 'absolute',
        from: eventData?.replay_info?.timerange_start,
        to: eventData?.replay_info?.timerange_end,
      }
    : {
        type: 'relative',
        range: (eventDefinition?.config?.search_within_ms ?? 0) / 1000,
      };
  const queryString: QueryString = {
    type: 'elasticsearch',
    query_string: eventData
      ? concatQueryStrings([eventQueryString, queryStringFromGrouping])
      : (eventDefinition?.config?.query ?? ''),
  };

  const queryParameters = eventDefinition?.config?.query_parameters ?? [];

  const groupBy = eventDefinition?.config?.group_by ?? [];

  const searchFilters = eventDefinition?.config?.filters ?? [];

  return useMemo(
    () =>
      ViewGenerator({
        streams,
        streamCategories,
        timeRange,
        queryString,
        aggregations,
        groupBy,
        queryParameters,
        searchFilters,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
};

export default UseCreateViewForEvent;
