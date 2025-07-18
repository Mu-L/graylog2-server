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
import { useEffect, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';

import useViewsSelector from 'views/stores/useViewsSelector';
import SearchExplainContext from 'views/components/contexts/SearchExplainContext';
import type { SearchExplainContextType, WidgetExplain } from 'views/components/contexts/SearchExplainContext';
import { buildSearchExecutionState } from 'views/logic/slices/executeJobResult';
import type { WidgetMapping } from 'views/logic/views/types';
import { selectSearchTypesToSearch, selectSearchExecutionState } from 'views/logic/slices/searchExecutionSelectors';
import fetch from 'logic/rest/FetchProvider';
import { qualifyUrl } from 'util/URLUtils';
import useViewType from 'views/hooks/useViewType';
import View from 'views/logic/views/View';
import useView from 'views/hooks/useView';

const SearchExplainContextProvider = ({ children }: { children: React.ReactNode }): React.ReactElement => {
  const view = useView();
  const executionState = useViewsSelector(selectSearchExecutionState);
  const searchTypesToSearch = useViewsSelector(selectSearchTypesToSearch);
  const [searchExplain, setSearchExplain] = useState<SearchExplainContextType['explainedSearch'] | undefined>(
    undefined,
  );

  const { mutateAsync: onSearchExplain } = useMutation({
    mutationFn: () =>
      fetch(
        'POST',
        qualifyUrl(`views/search/${view.search.id}/explain`),
        buildSearchExecutionState(searchTypesToSearch, executionState),
      ),

    onSuccess: (result) => {
      setSearchExplain(result);
    },
  });

  const searchExplainContextValue = useMemo(() => {
    const getExplainForWidget = (
      queryId: string,
      widgetId: string,
      widgetMapping: WidgetMapping,
    ): WidgetExplain | undefined => {
      const searchTypeId = widgetMapping?.get(widgetId)?.first();

      return searchExplain?.search?.queries?.[queryId]?.search_types?.[searchTypeId];
    };

    return { getExplainForWidget, explainedSearch: searchExplain };
  }, [searchExplain]);

  const viewType = useViewType();

  useEffect(() => {
    if (view.search.id && viewType === View.Type.Dashboard && view._value.title) {
      onSearchExplain();
    }
  }, [onSearchExplain, view.search.id, executionState, searchTypesToSearch, viewType, view._value.title]);

  return <SearchExplainContext.Provider value={searchExplainContextValue}>{children}</SearchExplainContext.Provider>;
};

export default SearchExplainContextProvider;
