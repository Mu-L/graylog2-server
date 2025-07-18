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
import styled from 'styled-components';
import { Outlet } from 'react-router-dom';

import { ScratchpadProvider } from 'contexts/ScratchpadProvider';
import { Spinner } from 'components/common';
import Scratchpad from 'components/scratchpad/Scratchpad';
import CurrentUserContext from 'contexts/CurrentUserContext';
import Navigation from 'components/navigation/Navigation';
import ReportedErrorBoundary from 'components/errors/ReportedErrorBoundary';
import RuntimeErrorBoundary from 'components/errors/RuntimeErrorBoundary';
import NavigationTelemetry from 'logic/telemetry/NavigationTelemetry';
import HotkeysProvider from 'contexts/HotkeysProvider';
import HotkeysModalContainer from 'components/hotkeys/HotkeysModalContainer';
import PerspectivesProvider from 'components/perspectives/contexts/PerspectivesProvider';
import PageContextProviders from 'components/page/contexts/PageContextProviders';
import { singleton } from 'logic/singleton';
import DefaultQueryParamProvider from 'routing/DefaultQueryParamProvider';

const AppLayout = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const PageContent = styled.div`
  height: 100%;
  overflow: auto;
  flex: 1;
`;

const App = () => (
  <DefaultQueryParamProvider>
    <CurrentUserContext.Consumer>
      {(currentUser) => {
        if (!currentUser) {
          return <Spinner />;
        }

        return (
          <PerspectivesProvider>
            <HotkeysProvider>
              <ScratchpadProvider loginName={currentUser.username}>
                <NavigationTelemetry />
                <>
                  <AppLayout>
                    <Navigation />
                    <Scratchpad />
                    <ReportedErrorBoundary>
                      <RuntimeErrorBoundary>
                        <PageContextProviders>
                          <PageContent>
                            <Outlet />
                          </PageContent>
                        </PageContextProviders>
                      </RuntimeErrorBoundary>
                    </ReportedErrorBoundary>
                  </AppLayout>
                  <HotkeysModalContainer />
                </>
              </ScratchpadProvider>
            </HotkeysProvider>
          </PerspectivesProvider>
        );
      }}
    </CurrentUserContext.Consumer>
  </DefaultQueryParamProvider>
);

export default singleton('components.App', () => App);
