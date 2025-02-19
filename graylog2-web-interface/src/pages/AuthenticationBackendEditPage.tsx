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
import { useState, useEffect } from 'react';

import withParams from 'routing/withParams';
import type { Location } from 'routing/withLocation';
import withLocation from 'routing/withLocation';
import 'components/authentication/bindings'; // Bind all authentication plugins
import { getAuthServicePlugin } from 'util/AuthenticationService';
import { Spinner } from 'components/common';
import AuthenticationDomain from 'domainActions/authentication/AuthenticationDomain';
import type AuthenticationBackend from 'logic/authentication/AuthenticationBackend';

type Props = {
  params: {
    backendId: string;
  };
  location: Location;
};

const AuthenticationBackendEditPage = ({
  params: { backendId },
  location: {
    query: { initialStepKey },
  },
}: Props) => {
  const [authBackend, setAuthBackend] = useState<AuthenticationBackend | undefined>();

  useEffect(() => {
    AuthenticationDomain.load(backendId).then((response) => setAuthBackend(response.backend));
  }, [backendId]);

  if (!authBackend) {
    return <Spinner />;
  }

  const authService = getAuthServicePlugin(authBackend.config.type);

  if (!authService) {
    return <>{`No authentication service plugin configured for "${authBackend.config.type}"`}</>;
  }

  const { editComponent: BackendEdit } = authService;

  return <BackendEdit authenticationBackend={authBackend} initialStepKey={initialStepKey as string} />;
};

export default withParams(withLocation(AuthenticationBackendEditPage));
