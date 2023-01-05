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

import ViewLoaderContext from 'views/logic/ViewLoaderContext';
import NewViewLoaderContext from 'views/logic/NewViewLoaderContext';
import Search from 'views/components/Search';
import { loadNewView as defaultLoadNewView, loadView as defaultLoadView } from 'views/logic/views/Actions';
import IfUserHasAccessToAnyStream from 'views/components/IfUserHasAccessToAnyStream';
import DashboardPageContextProvider from 'views/components/contexts/DashboardPageContextProvider';
import { useStore } from 'stores/connect';
import { DocumentTitle, Spinner } from 'components/common';
import viewTitle from 'views/logic/views/ViewTitle';
import { ViewStore } from 'views/stores/ViewStore';
import type View from 'views/logic/views/View';
import useLoadView from 'views/hooks/useLoadView';
import useProcessHooksForView from 'views/logic/views/UseProcessHooksForView';
import useQuery from 'routing/useQuery';

type Props = {
  view: Promise<View>,
  loadNewView?: () => unknown,
  loadView?: (viewId: string) => unknown,
};

const SearchPageTitle = ({ children }: { children: React.ReactNode }) => {
  const title = useStore(ViewStore, ({ view }) => viewTitle(view?.title, view?.type));

  return (
    <DocumentTitle title={title}>
      {children}
    </DocumentTitle>
  );
};

const SearchPage = ({ view, loadNewView = defaultLoadNewView, loadView = defaultLoadView }: Props) => {
  const query = useQuery();
  useLoadView(view, query?.page as string);
  const [loaded, HookComponent] = useProcessHooksForView(view, query);

  if (HookComponent) {
    return HookComponent;
  }

  return (loaded)
    ? (
      <SearchPageTitle>
        <DashboardPageContextProvider>
          <NewViewLoaderContext.Provider value={loadNewView}>
            <ViewLoaderContext.Provider value={loadView}>
              <IfUserHasAccessToAnyStream>
                <Search />
              </IfUserHasAccessToAnyStream>
            </ViewLoaderContext.Provider>
          </NewViewLoaderContext.Provider>
        </DashboardPageContextProvider>
      </SearchPageTitle>
    )
    : <Spinner />;
};

SearchPage.defaultProps = {
  loadNewView: defaultLoadNewView,
  loadView: defaultLoadView,
};

export default React.memo(SearchPage);
