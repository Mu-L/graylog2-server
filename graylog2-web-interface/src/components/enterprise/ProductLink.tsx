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

import { ExternalLinkButton } from 'components/common';
import { ButtonToolbar } from 'components/bootstrap';

type Props = {
  href?: string;
  clusterId?: string;
  children?: React.ReactNode;
};

const ProductLink = ({ href = '', clusterId = undefined, children = undefined }: Props) => {
  let hrefWithParam = href;

  if (clusterId) {
    hrefWithParam = `${hrefWithParam}?cluster_id=${clusterId}`;
  }

  return (
    <ButtonToolbar>
      <ExternalLinkButton target="_blank" rel="noopener noreferrer" href={hrefWithParam} bsStyle="primary">
        {children}
      </ExternalLinkButton>
    </ButtonToolbar>
  );
};

export default ProductLink;
