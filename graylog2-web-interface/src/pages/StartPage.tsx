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
import { useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { Spinner } from 'components/common';
import Routes from 'routing/Routes';
import { isPermitted } from 'util/PermissionsMixin';
import { CurrentUserStore } from 'stores/users/CurrentUserStore';
import { GettingStartedActions, GettingStartedStore } from 'stores/gettingstarted/GettingStartedStore';
import { useStore } from 'stores/connect';

const StartPage = () => {
  const { currentUser } = useStore(CurrentUserStore);
  const gettingStarted = useStore(GettingStartedStore, (state) => state.status);

  useEffect(() => { GettingStartedActions.getStatus(); }, []);
  useEffect(() => { CurrentUserStore.reload(); }, []);

  const isLoading = useMemo(() => !currentUser || !gettingStarted, [currentUser, gettingStarted]);
  const navigate = useNavigate();
  const redirect = useCallback((path: string) => navigate(path, { replace: true }), [navigate]);

  if (isLoading) {
    return <Spinner />;
  }

  const { startpage, permissions } = currentUser;

  // Show getting started page if user is an admin and getting started wasn't dismissed
  if (gettingStarted.show && isPermitted(permissions, ['inputs:create'])) {
    redirect(Routes.GETTING_STARTED);

    return null;
  }

  // Show custom startpage if it was set
  if (startpage !== null && Object.keys(startpage).length > 0) {
    redirect(startpage.type === 'stream' ? Routes.stream_search(startpage.id) : Routes.dashboard_show(startpage.id));

    return null;
  }

  redirect(Routes.SEARCH);

  return null;
};

export default StartPage;
