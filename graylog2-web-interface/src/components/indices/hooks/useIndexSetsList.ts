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
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import fetch from 'logic/rest/FetchProvider';
import { qualifyUrl } from 'util/URLUtils';
import ApiRoutes from 'routing/ApiRoutes';
import type { IndexSet, IndexSetsResponseType, IndexSetsStats } from 'stores/indices/IndexSetsStore';
import { defaultOnError } from 'util/conditional/onError';

type State = {
  indexSetsCount: number;
  indexSets: Array<IndexSet>;
  indexSetStats: IndexSetsStats | null;
};
const getUrl = (stats: boolean, security: boolean) =>
  qualifyUrl(ApiRoutes.IndexSetsApiController.list(stats, security).url);
const fetchIndexSetsList = (stats: boolean, only_open: boolean): Promise<State> =>
  fetch('GET', getUrl(stats, only_open)).then((response: IndexSetsResponseType) => ({
    indexSetsCount: response.total,
    indexSets: response.index_sets,
    indexSetStats: response.stats,
  }));

const initialData: State = { indexSets: [], indexSetsCount: null, indexSetStats: null };

const useIndexSetsList = (
  stats: boolean = false,
  refetchInterval: number | false = false,
  only_open: boolean = false,
): {
  data: State;
  refetch: () => void;
  isSuccess: boolean;
  isInitialLoading: boolean;
} => {
  const { data, refetch, isInitialLoading, isSuccess } = useQuery({
    queryKey: ['IndexSetsList', stats],

    queryFn: () =>
      defaultOnError(
        fetchIndexSetsList(stats, only_open),
        'Loading index sets with list failed with status',
        'Could not load index sets list',
      ),

    placeholderData: keepPreviousData,
    refetchInterval,
  });

  return {
    data: data ?? initialData,
    refetch,
    isSuccess,
    isInitialLoading,
  };
};

export default useIndexSetsList;
