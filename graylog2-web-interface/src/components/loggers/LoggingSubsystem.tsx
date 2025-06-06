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
import capitalize from 'lodash/capitalize';

import { ButtonGroup, Col } from 'components/bootstrap';
import { LogLevelDropdown } from 'components/loggers';

type Props = {
  name: string;
  nodeId: string;
  subsystem: any;
};

const LoggingSubsystem = ({ name, nodeId, subsystem }: Props) => (
  <div className="subsystem-row">
    <Col md={6} className="subsystem" style={{ marginBottom: '10px' }}>
      <h3 className="u-light">
        Subsystem: {capitalize(name)}
        <ButtonGroup className="pull-right">
          <LogLevelDropdown nodeId={nodeId} name={name} subsystem={subsystem} />
        </ButtonGroup>
      </h3>
      {subsystem.description}
      <br style={{ clear: 'both' }} />
    </Col>
  </div>
);

export default LoggingSubsystem;
