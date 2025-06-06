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

import { Row, Col } from 'components/bootstrap';
import { LookupTableForm } from 'components/lookup-tables';

type Props = {
  saved: (...args: any[]) => void;
  validate?: (...args: any[]) => void;
  validationErrors?: any;
};

const LookupTableCreate = ({ saved, validate = null, validationErrors = {} }: Props) => (
  <div>
    <Row className="content">
      <Col lg={8}>
        <LookupTableForm saved={saved} create validate={validate} validationErrors={validationErrors} />
      </Col>
    </Row>
  </div>
);

export default LookupTableCreate;
