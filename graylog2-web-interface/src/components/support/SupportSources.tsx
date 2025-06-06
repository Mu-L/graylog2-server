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
import styled from 'styled-components';

import Icon from 'components/common/Icon';
import DocsHelper from 'util/DocsHelper';

import DocumentationLink from './DocumentationLink';

const SourcesList = styled.ul`
  margin: 0;
  padding: 0;
  margin-top: 5px;
`;

const SupportSources = () => (
  <div className="support-sources">
    <h2>Need help?</h2>
    <p>
      Do not hesitate to consult the Graylog community if your questions are not answered in the{' '}
      <DocumentationLink page={DocsHelper.PAGES.WELCOME} text="documentation" />.
    </p>

    <SourcesList>
      <li>
        <Icon name="group" />
        &nbsp;
        <a href="https://www.graylog.org/community-support/" target="_blank" rel="noopener noreferrer">
          Community support
        </a>
      </li>
      <li>
        <Icon name="bug_report" />
        &nbsp;&nbsp;
        <a href="https://github.com/Graylog2/graylog2-server/issues" target="_blank" rel="noopener noreferrer">
          Issue tracker
        </a>
      </li>
      <li>
        <Icon name="favorite" />
        &nbsp;
        <a href="https://www.graylog.org/professional-support" target="_blank" rel="noopener noreferrer">
          Professional support
        </a>
      </li>
    </SourcesList>
  </div>
);

export default SupportSources;
