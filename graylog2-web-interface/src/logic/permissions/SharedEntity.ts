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

import type { SharedEntityType } from 'logic/permissions/types';

import Grantee from './Grantee';

type InternalState = {
  id: SharedEntityType['id'];
  owners: Immutable.List<Grantee>;
  title: SharedEntityType['title'];
  type: SharedEntityType['type'];
};

export default class SharedEntity {
  _value: InternalState;

  constructor(
    id: InternalState['id'],
    owners: InternalState['owners'],
    title: InternalState['title'],
    type: InternalState['type'],
  ) {
    this._value = { id, owners, title, type };
  }

  get id(): InternalState['id'] {
    return this._value.id;
  }

  get owners(): InternalState['owners'] {
    return this._value.owners;
  }

  get title(): InternalState['title'] {
    return this._value.title;
  }

  get type(): InternalState['type'] {
    return this._value.type;
  }

  toBuilder(): Builder {
    const { id, owners, title } = this._value;

    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return new Builder(Immutable.Map({ id, owners, title }));
  }

  toJSON() {
    const { id, owners, title, type } = this._value;

    return { id, owners, title, type };
  }

  static fromJSON(value: SharedEntityType): SharedEntity {
    const { id, owners, title, type } = value;
    const formattedOwners = Immutable.fromJS(owners.map((o) => Grantee.fromJSON(o)));

    return SharedEntity.builder().id(id).owners(formattedOwners).title(title).type(type).build();
  }

  static builder(): Builder {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return new Builder();
  }
}

type InternalBuilderState = Immutable.Map<string, any>;

class Builder {
  value: InternalBuilderState;

  constructor(value: InternalBuilderState = Immutable.Map()) {
    this.value = value;
  }

  id(value: InternalState['id']): Builder {
    return new Builder(this.value.set('id', value));
  }

  owners(value: InternalState['owners']): Builder {
    return new Builder(this.value.set('owners', value));
  }

  title(value: InternalState['title']): Builder {
    return new Builder(this.value.set('title', value));
  }

  type(value: InternalState['type']): Builder {
    return new Builder(this.value.set('type', value));
  }

  build(): SharedEntity {
    const { id, owners, title, type } = this.value.toObject();

    return new SharedEntity(id, owners, title, type);
  }
}
