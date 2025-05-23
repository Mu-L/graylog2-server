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
import { render } from 'wrappedTestingLibrary';
import { defaultUser } from 'defaultMockValues';

import { StoreMock as MockStore } from 'helpers/mocking';
import asMock from 'helpers/mocking/AsMock';
import { adminUser } from 'fixtures/users';
import type { PreferencesMap } from 'stores/users/PreferencesStore';
import { CurrentUserStore } from 'stores/users/CurrentUserStore';

import type { UserPreferences } from './UserPreferencesContext';
import UserPreferencesContext, { defaultUserPreferences } from './UserPreferencesContext';
import CurrentUserProvider from './CurrentUserProvider';
import CurrentUserPreferencesProvider from './CurrentUserPreferencesProvider';

jest.mock('stores/users/CurrentUserStore', () => ({
  CurrentUserStore: MockStore(['getInitialState', jest.fn(() => ({}))]),
}));

describe('CurrentUserPreferencesProvider', () => {
  const SimpleCurrentUserPreferencesProvider = ({
    children,
  }: {
    children: (value: UserPreferences) => React.ReactNode;
  }) => (
    <CurrentUserPreferencesProvider>
      <UserPreferencesContext.Consumer>{children}</UserPreferencesContext.Consumer>
    </CurrentUserPreferencesProvider>
  );

  const renderSUT = (): ((UserPreferences: UserPreferences) => null) => {
    const consume = jest.fn();

    render(
      <CurrentUserProvider>
        <SimpleCurrentUserPreferencesProvider>{consume}</SimpleCurrentUserPreferencesProvider>
      </CurrentUserProvider>,
    );

    return consume;
  };

  beforeEach(() => {
    asMock(CurrentUserStore.getInitialState).mockReturnValue({ currentUser: defaultUser.toJSON() });
  });

  it('provides default user preferences when CurrentUserContext is not provided', () => {
    const consume = jest.fn();

    render(<SimpleCurrentUserPreferencesProvider>{consume}</SimpleCurrentUserPreferencesProvider>);

    expect(consume).toHaveBeenCalledWith(defaultUserPreferences);
  });

  it('provides default user preferences if the user has none', () => {
    asMock(CurrentUserStore.getInitialState).mockReturnValue({
      currentUser: adminUser
        .toBuilder()
        .preferences(undefined as PreferencesMap)
        .build()
        .toJSON(),
    });

    const consume = renderSUT();

    expect(consume).toHaveBeenCalledWith(defaultUserPreferences);
  });

  it('provides empty user preferences of current user', () => {
    asMock(CurrentUserStore.getInitialState).mockReturnValue({
      currentUser: adminUser
        .toBuilder()
        .preferences({} as PreferencesMap)
        .build()
        .toJSON(),
    });

    const consume = renderSUT();

    expect(consume).toHaveBeenCalledWith({});
  });

  it('provides user preferences of current user', () => {
    asMock(CurrentUserStore.getInitialState).mockReturnValue({
      currentUser: adminUser
        .toBuilder()
        .preferences({ enableSmartSearch: false, updateUnfocussed: true } as PreferencesMap)
        .build()
        .toJSON(),
    });

    const consume = renderSUT();

    expect(consume).toHaveBeenCalledWith({
      enableSmartSearch: false,
      updateUnfocussed: true,
    });
  });
});
