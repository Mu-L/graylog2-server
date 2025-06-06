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
import Reflux from 'reflux';

import * as URLUtils from 'util/URLUtils';
import fetch from 'logic/rest/FetchProvider';
import { singletonStore, singletonActions } from 'logic/singleton';
import type { Traffic } from 'components/cluster/types';

type ClusterTrafficStoreState = {
  traffic: Traffic;
};
type ClusterTrafficActionsType = {
  getTraffic: (days: number) => Promise<ClusterTrafficStoreState>;
};

export const ClusterTrafficActions = singletonActions('core.ClusterTraffic', () =>
  Reflux.createActions<ClusterTrafficActionsType>({
    getTraffic: { asyncResult: true },
  }),
);

export const ClusterTrafficStore = singletonStore('core.ClusterTraffic', () =>
  Reflux.createStore<ClusterTrafficStoreState>({
    listenables: [ClusterTrafficActions],
    traffic: undefined,

    getInitialState() {
      return { traffic: this.traffic };
    },

    getTraffic(days: number) {
      const promise = fetch('GET', URLUtils.qualifyUrl(`/system/cluster/traffic?days=${days}&daily=false`));

      promise.then((response) => {
        this.trigger({ traffic: response });
      });

      return promise;
    },
  }),
);
