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

import { Panel } from 'components/bootstrap';
import DocumentationLink from 'components/support/DocumentationLink';
import DocsHelper from 'util/DocsHelper';

export default function SidebarPermissions() {
  return (
    <Panel bsStyle="info" header={<span>AWS Policy Permissions</span>}>
      <p>
        Please refer to the{' '}
        <DocumentationLink page={DocsHelper.PAGES.AWS_KINESIS_CLOUDWATCH_INPUT} text="official documentation" /> for
        information on required AWS permissions.
        <br />
      </p>
    </Panel>
  );
}
