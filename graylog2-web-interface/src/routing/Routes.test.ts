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
import URI from 'urijs';

import type { AppConfigs } from 'util/AppConfig';

let Routes;
const prefix = '/test';

describe('Routes', () => {
  describe('without prefix', () => {
    beforeAll(() => {
      jest.resetModules();
      window.appConfig = {} as AppConfigs; // Ensure no prefix is set
      Routes = jest.requireActual('./Routes').default;
    });

    it('returns a route from constant', () => {
      expect(Routes.SEARCH).toMatch('/search');
    });

    it('returns a route from function', () => {
      expect(Routes.SYSTEM.CLUSTER.NODE_SHOW('id')).toMatch('/system/cluster/node/id');
    });

    it('routes contain query parameters', () => {
      const uri = URI(Routes.search('', { rangetype: 'relative', relative: 300 }, 'hour'));

      expect(uri.path()).toMatch('/search');
      expect(uri.hasQuery('q', '')).toBeTruthy();
      expect(uri.hasQuery('rangetype', 'relative')).toBeTruthy();
      expect(uri.hasQuery('relative', '300')).toBeTruthy();
      expect(uri.hasQuery('interval', 'hour')).toBeTruthy();
    });
  });

  describe('with prefix', () => {
    beforeAll(() => {
      jest.resetModules();

      window.appConfig = {
        gl2AppPathPrefix: prefix,
      } as AppConfigs;

      Routes = jest.requireActual('./Routes').default;
    });

    it('returns a route from constant', () => {
      expect(Routes.SEARCH).toMatch(`${prefix}/search`);
    });

    it('returns a route from function', () => {
      expect(Routes.SYSTEM.CLUSTER.NODE_SHOW('id')).toMatch(`${prefix}/system/cluster/node/id`);
    });

    it('routes contain query parameters', () => {
      const uri = URI(Routes.search('', { rangetype: 'relative', relative: 300 }, 'hour'));

      expect(uri.path()).toMatch(`${prefix}/search`);
      expect(uri.hasQuery('q', '')).toBeTruthy();
      expect(uri.hasQuery('rangetype', 'relative')).toBeTruthy();
      expect(uri.hasQuery('relative', '300')).toBeTruthy();
      expect(uri.hasQuery('interval', 'hour')).toBeTruthy();
    });
  });

  describe('with `/` prefix', () => {
    beforeAll(() => {
      jest.resetModules();

      window.appConfig = {
        gl2AppPathPrefix: '/',
      } as AppConfigs;

      Routes = jest.requireActual('./Routes').default;
    });

    it('returns a route from constant', () => {
      expect(Routes.SEARCH).toMatch('/search');
    });

    it('returns correct route for getting started page', () => {
      expect(Routes.WELCOME).toMatch('/welcome');
    });

    it('returns a route from function', () => {
      expect(Routes.SYSTEM.CLUSTER.NODE_SHOW('id')).toMatch('/system/cluster/node/id');
    });

    it('routes contain query parameters', () => {
      const uri = URI(Routes.search('', { rangetype: 'relative', relative: 300 }, 'hour'));

      expect(uri.path()).toMatch('/search');
      expect(uri.hasQuery('q', '')).toBeTruthy();
      expect(uri.hasQuery('rangetype', 'relative')).toBeTruthy();
      expect(uri.hasQuery('relative', '300')).toBeTruthy();
      expect(uri.hasQuery('interval', 'hour')).toBeTruthy();
    });
  });
});
