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

export type AccountStatus = 'enabled' | 'disabled' | 'deleted';

export type UserOverviewJSON = {
  id: string;
  username: string;
  full_name: string;
  email: string;
  external_user: boolean | null | undefined;
  roles: Array<string>;
  read_only: boolean | null | undefined;
  session_active: boolean | null | undefined;
  client_address: string;
  last_activity: string | null | undefined;
  enabled: boolean;
  auth_service_id: string;
  auth_service_uid: string;
  auth_service_enabled: boolean;
  account_status: AccountStatus;
};

type InternalState = {
  id: string;
  username: string;
  fullName: string;
  email: string;
  roles: Immutable.Set<string>;
  readOnly: boolean;
  external: boolean;
  sessionActive: boolean;
  clientAddress: string;
  lastActivity: string | null | undefined;
  enabled: boolean;
  authServiceId: string;
  authServiceUid: string;
  authServiceEnabled: boolean;
  accountStatus: AccountStatus;
};

export default class UserOverview {
  _value: InternalState;

  constructor(
    id: InternalState['id'],
    username: InternalState['username'],
    fullName: InternalState['fullName'],
    email: InternalState['email'],
    roles: InternalState['roles'],
    readOnly: InternalState['readOnly'],
    external: InternalState['external'],
    sessionActive: InternalState['sessionActive'],
    clientAddress: InternalState['clientAddress'],
    lastActivity: InternalState['lastActivity'],
    enabled: InternalState['enabled'],
    authServiceId: InternalState['authServiceId'],
    authServiceUid: InternalState['authServiceUid'],
    authServiceEnabled: InternalState['authServiceEnabled'],
    accountStatus: InternalState['accountStatus'],
  ) {
    this._value = {
      id,
      username,
      fullName,
      email,
      roles,
      readOnly,
      external,
      sessionActive,
      clientAddress,
      lastActivity,
      enabled,
      authServiceId,
      authServiceUid,
      authServiceEnabled,
      accountStatus,
    };
  }

  get id() {
    return this._value.id;
  }

  get username() {
    return this._value.username;
  }

  get name() {
    return this._value.username;
  }

  get fullName() {
    return this._value.fullName;
  }

  get description() {
    return this._value.fullName;
  }

  get email() {
    return this._value.email;
  }

  get roles() {
    return this._value.roles;
  }

  get readOnly() {
    return this._value.readOnly;
  }

  get external() {
    return this._value.external;
  }

  get sessionActive() {
    return this._value.sessionActive;
  }

  get clientAddress() {
    return this._value.clientAddress;
  }

  get lastActivity() {
    return this._value.lastActivity;
  }

  get enabled() {
    return this._value.enabled;
  }

  get authServiceId() {
    return this._value.authServiceId;
  }

  get authServiceUid() {
    return this._value.authServiceUid;
  }

  get authServiceEnabled() {
    return this._value.authServiceEnabled;
  }

  get accountStatus() {
    return this._value.accountStatus;
  }

  toBuilder() {
    const {
      id,
      username,
      fullName,
      email,
      roles,
      readOnly,
      external,
      sessionActive,
      clientAddress,
      lastActivity,
      enabled,
      authServiceId,
      authServiceUid,
      authServiceEnabled,
      accountStatus,
    } = this._value;

    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return new Builder(
      Immutable.Map({
        id,
        username,
        fullName,
        email,
        roles,
        readOnly,
        external,
        sessionActive,
        clientAddress,
        lastActivity,
        enabled,
        authServiceId,
        authServiceUid,
        authServiceEnabled,
        accountStatus,
      }),
    );
  }

  static create(
    id: InternalState['id'],
    username: InternalState['username'],
    fullName: InternalState['fullName'],
    email: InternalState['email'],
    roles: InternalState['roles'],
    readOnly: InternalState['readOnly'],
    external: InternalState['external'],
    sessionActive: InternalState['sessionActive'],
    clientAddress: InternalState['clientAddress'],
    lastActivity: InternalState['lastActivity'],
    enabled: InternalState['enabled'],
    authServiceId: InternalState['authServiceId'],
    authServiceUid: InternalState['authServiceUid'],
    authServiceEnabled: InternalState['authServiceEnabled'],
    accountStatus: InternalState['accountStatus'],
  ) {
    return new UserOverview(
      id,
      username,
      fullName,
      email,
      roles,
      readOnly,
      external,
      sessionActive,
      clientAddress,
      lastActivity,
      enabled,
      authServiceId,
      authServiceUid,
      authServiceEnabled,
      accountStatus,
    );
  }

  toJSON(): UserOverviewJSON {
    const {
      id,
      username,
      fullName,
      email,
      roles,
      readOnly,
      external,
      sessionActive,
      clientAddress,
      lastActivity,
      enabled,
      authServiceId,
      authServiceUid,
      authServiceEnabled,
      accountStatus,
    } = this._value;

    return {
      id,
      username,
      full_name: fullName,
      email,
      roles: roles.toArray(),
      read_only: readOnly,
      external_user: external,
      session_active: sessionActive,
      client_address: clientAddress,
      last_activity: lastActivity,
      enabled,
      auth_service_id: authServiceId,
      auth_service_uid: authServiceUid,
      auth_service_enabled: authServiceEnabled,
      account_status: accountStatus,
    };
  }

  static fromJSON(value: UserOverviewJSON) {
    const {
      id,
      username,
      full_name: fullName,
      email,
      roles,
      read_only: readOnly,
      external_user: external,
      session_active: sessionActive,
      client_address: clientAddress,
      last_activity: lastActivity,
      enabled,
      auth_service_id: authServiceId,
      auth_service_uid: authServiceUid,
      auth_service_enabled: authServiceEnabled,
      account_status: accountStatus,
    } = value;

    return UserOverview.create(
      id,
      username,
      fullName,
      email,
      Immutable.Set(roles),
      readOnly ?? false,
      external ?? false,
      sessionActive ?? false,
      clientAddress,
      lastActivity,
      enabled,
      authServiceId,
      authServiceUid,
      authServiceEnabled,
      accountStatus,
    );
  }

  static builder(): Builder {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return new Builder();
  }
}

type BuilderState = Immutable.Map<string, any>;

class Builder {
  value: BuilderState;

  constructor(value: BuilderState = Immutable.Map()) {
    this.value = value;
  }

  id(value: InternalState['id']) {
    return new Builder(this.value.set('id', value));
  }

  username(value: InternalState['username']) {
    return new Builder(this.value.set('username', value));
  }

  fullName(value: InternalState['fullName']) {
    return new Builder(this.value.set('fullName', value));
  }

  email(value: InternalState['email']) {
    return new Builder(this.value.set('email', value));
  }

  roles(value: InternalState['roles']) {
    return new Builder(this.value.set('roles', value));
  }

  readOnly(value: InternalState['readOnly']) {
    return new Builder(this.value.set('readOnly', value));
  }

  external(value: InternalState['external']) {
    return new Builder(this.value.set('external', value));
  }

  sessionActive(value: InternalState['sessionActive']) {
    return new Builder(this.value.set('sessionActive', value));
  }

  clientAddress(value: InternalState['clientAddress']) {
    return new Builder(this.value.set('clientAddress', value));
  }

  lastActivity(value: InternalState['lastActivity']) {
    return new Builder(this.value.set('lastActivity', value));
  }

  enabled(value: InternalState['enabled']) {
    return new Builder(this.value.set('enabled', value));
  }

  authServiceId(value: InternalState['authServiceId']) {
    return new Builder(this.value.set('authServiceId', value));
  }

  authServiceUid(value: InternalState['authServiceUid']) {
    return new Builder(this.value.set('authServiceUid', value));
  }

  authServiceEnabled(value: InternalState['authServiceEnabled']) {
    return new Builder(this.value.set('authServiceEnabled', value));
  }

  accountStatus(value: InternalState['accountStatus']) {
    return new Builder(this.value.set('accountStatus', value));
  }

  build() {
    const {
      id,
      username,
      fullName,
      email,
      roles,
      readOnly,
      external,
      sessionActive,
      clientAddress,
      lastActivity,
      enabled,
      authServiceId,
      authServiceUid,
      authServiceEnabled,
      accountStatus,
    } = this.value.toObject();

    return new UserOverview(
      id,
      username,
      fullName,
      email,
      roles,
      readOnly,
      external,
      sessionActive,
      clientAddress,
      lastActivity,
      enabled,
      authServiceId,
      authServiceUid,
      authServiceEnabled,
      accountStatus,
    );
  }
}
