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
import styled, { css } from 'styled-components';
import chroma from 'chroma-js';

import artiSvg from 'assets/arti.svg';
import { Col, Jumbotron, Row } from 'components/bootstrap';
import useProductName, { DEFAULT_PRODUCT_NAME } from 'brand-customization/useProductName';

const H1 = styled.h1(
  ({ theme }) => css`
    font-size: ${theme.fonts.size.extraLarge};
    margin-bottom: 15px;
  `,
);

const ContainerRow = styled(Row)`
  height: 82vh;
`;

const StyledErrorJumbotron = styled(Jumbotron)(
  ({ theme }) => css`
    background-color: ${chroma(theme.colors.global.contentBackground).alpha(0.8).css()};
    text-align: center;
  `,
);

type ErrorJumbotronProps = {
  children: React.ReactNode;
  title: string;
};

const StyledArti = styled.img`
  height: 10rem;
  float: right;
`;
const Arti = () => <StyledArti src={artiSvg} />;

const ErrorJumbotron = ({ children, title }: ErrorJumbotronProps) => {
  const productName = useProductName();
  const isDefaultProduct = productName === DEFAULT_PRODUCT_NAME;

  return (
    <ContainerRow>
      <Col mdOffset={2} md={8}>
        <StyledErrorJumbotron>
          {isDefaultProduct && <Arti />}
          <H1>{title}</H1>
          {children}
        </StyledErrorJumbotron>
      </Col>
    </ContainerRow>
  );
};

export default ErrorJumbotron;
