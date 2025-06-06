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
import { useEffect, useState, useCallback } from 'react';

import type User from 'logic/users/User';
import withParams from 'routing/withParams';
import { Row, Col } from 'components/bootstrap';
import { isPermitted } from 'util/PermissionsMixin';
import DocsHelper from 'util/DocsHelper';
import UsersDomain from 'domainActions/users/UsersDomain';
import { PageHeader, DocumentTitle, Spinner } from 'components/common';
import TokenList from 'components/users/TokenList';
import UsersPageNavigation from 'components/users/navigation/UsersPageNavigation';
import UserActionLinks from 'components/users/navigation/UserActionLinks';
import useCurrentUser from 'hooks/useCurrentUser';

type Props = {
  params: {
    userId: string;
  };
};

const PageTitle = ({ fullName }: { fullName: string | null | undefined }) => (
  <>
    Edit Tokens Of User{' '}
    {fullName && (
      <>
        - <i>{fullName}</i>
      </>
    )}
  </>
);

const _loadTokens = (loadedUser, currentUser, setTokens) => {
  if (loadedUser) {
    if (isPermitted(currentUser?.permissions, [`users:tokenlist:${loadedUser.username}`])) {
      UsersDomain.loadTokens(loadedUser.id).then(setTokens);
    } else {
      setTokens([]);
    }
  }
};

const _createToken = (tokenName, userId, loadTokens, setCreatingToken, tokenTtl) => {
  const promise = UsersDomain.createToken(userId, tokenName, tokenTtl);

  setCreatingToken(true);

  return promise
    .then((token) => {
      loadTokens();

      return token;
    })
    .finally(() => {
      setCreatingToken(false);
    });
};

const UserEditPage = ({ params }: Props) => {
  const currentUser = useCurrentUser();
  const [loadedUser, setLoadedUser] = useState<User | undefined>();
  const [tokens, setTokens] = useState([]);
  const [creatingToken, setCreatingToken] = useState(false);

  const userId = params?.userId;

  const loadTokens = useCallback(() => _loadTokens(loadedUser, currentUser, setTokens), [currentUser, loadedUser]);
  const _handleTokenCreate = ({ tokenName, tokenTtl }: { tokenName: string; tokenTtl: string }) =>
    _createToken(tokenName, userId, loadTokens, setCreatingToken, tokenTtl);

  useEffect(() => {
    loadTokens();
  }, [loadTokens, loadedUser]);
  useEffect(() => {
    UsersDomain.load(userId).then(setLoadedUser);
  }, [userId]);

  return (
    <DocumentTitle title={`Edit Tokens Of User ${loadedUser?.fullName ?? ''}`}>
      <UsersPageNavigation />
      <PageHeader
        title={<PageTitle fullName={loadedUser?.fullName} />}
        actions={<UserActionLinks userId={userId} userIsReadOnly={loadedUser?.readOnly ?? false} />}
        documentationLink={{
          title: 'Permissions documentation',
          path: DocsHelper.PAGES.USERS_ROLES,
        }}>
        <span>You can create new tokens or delete old ones.</span>
      </PageHeader>

      <Row className="content">
        <Col lg={12}>
          {loadedUser ? (
            <TokenList
              tokens={tokens}
              user={loadedUser}
              onCreate={_handleTokenCreate}
              creatingToken={creatingToken}
              onDelete={loadTokens}
            />
          ) : (
            <Row>
              <Col xs={12}>
                <Spinner />
              </Col>
            </Row>
          )}
        </Col>
      </Row>
    </DocumentTitle>
  );
};

export default withParams(UserEditPage);
