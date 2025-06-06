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
import * as Immutable from 'immutable';

import isDeepEqual from 'stores/isDeepEqual';
import generateId from 'logic/generateId';
import type { FiltersType, SearchFilter } from 'views/types';
import type { NO_TIMERANGE_OVERRIDE } from 'views/Constants';
import type { QueryString, ElasticsearchQueryString } from 'views/logic/queries/types';

import type { SearchType } from './SearchType';

export type QueryId = string;

export type FilterType = Immutable.Map<string, any>;

export type SearchTypeList = Array<SearchType>;
type InternalBuilderState = Immutable.Map<keyof InternalState, any>;

type InternalState = {
  id: QueryId;
  query: QueryString;
  timerange: TimeRange;
  filter?: FilterType;
  filters?: FiltersType;
  searchTypes: SearchTypeList;
};

export type QueryJson = {
  id: QueryId;
  query: QueryString;
  timerange: TimeRange;
  filter?: { [key: string]: unknown };
  filters?: Array<SearchFilter>;
  search_types: SearchTypeList;
};

export const createElasticsearchQueryString = (query = ''): ElasticsearchQueryString => ({
  type: 'elasticsearch',
  query_string: query,
});

const _streamFilters = (selectedStreams: Array<string>) =>
  Immutable.List(selectedStreams?.map((stream) => Immutable.Map({ type: 'stream', id: stream })));
const _streamCategoryFilters = (selectedCategories: Array<string>) =>
  Immutable.List(selectedCategories?.map((category) => Immutable.Map({ type: 'stream_category', category: category })));

export const filtersForQuery = (streams: Array<string> | null | undefined): FilterType | null | undefined => {
  if (!streams || streams.length === 0) {
    return null;
  }

  const streamFilters = _streamFilters(streams);

  return Immutable.Map({
    type: 'or',
    filters: streamFilters,
  });
};

export const categoryFiltersForQuery = (
  categories: Array<string> | null | undefined,
): FilterType | null | undefined => {
  if (!categories || categories.length === 0) {
    return null;
  }

  const categoryFilters = _streamCategoryFilters(categories);

  return Immutable.Map({
    type: 'or',
    filters: categoryFilters,
  });
};

export const newFiltersForQuery = (
  streams: Array<string> | null | undefined,
  categories: Array<string> | null | undefined,
): FilterType | null | undefined => {
  const streamFilter: Immutable.List<FilterType> = _streamFilters(streams);
  const categoryFilter: Immutable.List<FilterType> = _streamCategoryFilters(categories);

  if (streamFilter.size > 0 && categoryFilter.size > 0) {
    return Immutable.Map({
      type: 'or',
      filters: Immutable.List(
        [...streamFilter.toArray(), ...categoryFilter.toArray()].map((filter: FilterType) => filter),
      ),
    });
  }

  return filtersForQuery(streams) || categoryFiltersForQuery(categories);
};

export const filtersToStreamSet = (filter: FilterType | null | undefined): Immutable.Set<string> => {
  if (!filter) {
    return Immutable.Set();
  }

  const type = filter.get('type');

  if (type === 'stream') {
    return Immutable.Set([filter.get('id')]);
  }

  const filters = filter.get('filters', Immutable.List());

  return filters.map(filtersToStreamSet).reduce((prev, cur) => prev.merge(cur), Immutable.Set());
};

export const filtersToStreamCategorySet = (filter: FilterType | null | undefined): Immutable.Set<string> => {
  if (!filter) {
    return Immutable.Set();
  }

  const type = filter.get('type');

  if (type === 'stream_category') {
    return Immutable.Set([filter.get('category')]);
  }

  const filters = filter.get('filters', Immutable.List());

  return filters.map(filtersToStreamCategorySet).reduce((prev, cur) => prev.merge(cur), Immutable.Set());
};

export type TimeRangeTypes = 'relative' | 'absolute' | 'keyword';

export type RelativeTimeRangeStartOnly = {
  type: 'relative';
  range: number;
};

export type RelativeTimeRangeWithEnd = {
  type: 'relative';
  from: number;
  to?: number;
};

export type RelativeTimeRange = RelativeTimeRangeStartOnly | RelativeTimeRangeWithEnd;

export type AbsoluteTimeRange = {
  type: 'absolute';
  from: string;
  to: string;
};

export type KeywordTimeRange = {
  type: 'keyword';
  keyword: string;
  from?: string;
  to?: string;
  timezone?: string;
};

export type TimeRange = RelativeTimeRange | AbsoluteTimeRange | KeywordTimeRange;

export type NoTimeRangeOverride = typeof NO_TIMERANGE_OVERRIDE;

const isNullish = (o: unknown) => o === null || o === undefined;

export default class Query {
  private _value: InternalState;

  constructor(
    id: QueryId,
    query: QueryString,
    timerange: TimeRange,
    filter?: FilterType,
    searchTypes?: SearchTypeList,
    filters?: FiltersType,
  ) {
    this._value = { id, query, timerange, filter, filters, searchTypes };
  }

  get id(): QueryId {
    return this._value.id;
  }

  get query(): QueryString {
    return this._value.query;
  }

  get timerange(): TimeRange {
    return this._value.timerange;
  }

  get filter(): FilterType | null | undefined {
    return this._value.filter;
  }

  get filters(): FiltersType | null | undefined {
    return this._value.filters;
  }

  get searchTypes(): SearchTypeList {
    return this._value.searchTypes;
  }

  toBuilder(): Builder {
    const { id, query, timerange, filter, filters, searchTypes } = this._value;

    const builder = Query.builder()
      .id(id)
      .query(query)
      .timerange(timerange)
      .filter(filter)
      .filters(filters)
      .searchTypes(searchTypes);

    return filter ? builder.filter(filter) : builder;
  }

  equals(other: Query): boolean {
    if (other === undefined) {
      return false;
    }

    if (!(other instanceof Query)) {
      return false;
    }

    if (
      this.id !== other.id ||
      !isDeepEqual(this.query, other.query) ||
      !isDeepEqual(this.timerange, other.timerange) ||
      !((isNullish(this.filter) && isNullish(other.filter)) || isDeepEqual(this.filter, other.filter)) ||
      !((isNullish(this.filters) && isNullish(other.filters)) || isDeepEqual(this.filters, other.filters)) ||
      !isDeepEqual(this.searchTypes, other.searchTypes)
    ) {
      return false;
    }

    return true;
  }

  toJSON(): QueryJson {
    const { id, query, timerange, filter, filters, searchTypes } = this._value;

    return {
      id,
      query,
      timerange,
      filter,
      filters: filters?.toArray(),
      search_types: searchTypes,
    };
  }

  static builder(): Builder {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return new Builder().searchTypes([]);
  }

  static fromJSON(value: QueryJson): Query {
    const { id, query, timerange, filter, filters, search_types } = value;

    return new Query(
      id,
      query,
      timerange,
      Immutable.fromJS(filter),
      search_types,
      filters ? Immutable.List(filters) : undefined,
    );
  }
}

class Builder {
  private value: InternalBuilderState;

  constructor(value: InternalBuilderState = Immutable.Map()) {
    this.value = value;
  }

  id(value: QueryId): Builder {
    return new Builder(this.value.set('id', value));
  }

  newId(): Builder {
    return this.id(generateId());
  }

  query(value: QueryString): Builder {
    return new Builder(this.value.set('query', value));
  }

  timerange(value: TimeRange): Builder {
    return new Builder(this.value.set('timerange', value));
  }

  filter(value: FilterType | null | undefined): Builder {
    return new Builder(this.value.set('filter', Immutable.fromJS(value)));
  }

  filters(value: FiltersType | null | undefined | SearchFilter[]): Builder {
    return new Builder(this.value.set('filters', value ? Immutable.List(value) : value));
  }

  searchTypes(value: SearchTypeList): Builder {
    return new Builder(this.value.set('searchTypes', value));
  }

  build(): Query {
    const { id, query, timerange, filter, filters, searchTypes } = this.value.toObject() as InternalState;

    return new Query(id, query, timerange, filter, searchTypes, filters);
  }
}
