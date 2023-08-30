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
/* eslint-disable react/no-unescaped-entities, no-template-curly-in-string */
import React from 'react';

import { Alert } from 'components/bootstrap';

class GreyNoiseCommunityIpLookupAdapterDocumentation extends React.Component {
  render() {
    return (
      <div>
          <Alert style={{ marginBottom: 10 }} bsStyle="warning">
              <h4 style={{ marginBottom: 10 }}>Deprecation Warning</h4>
              <p>The GreyNoise Community IP Lookup Data Adapter is no longer supported. This Data Adapter should not be used.</p>
          </Alert>
      </div>
    )
    ;
  }
}

export default GreyNoiseCommunityIpLookupAdapterDocumentation;