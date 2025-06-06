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
import * as React from 'react';
import styled from 'styled-components';

import { RowContentStyles } from 'components/bootstrap/Row';

const Container = styled.div`
  z-index: auto;
  ${RowContentStyles}
  margin-bottom: 0;
`;

type Props = React.PropsWithChildren<{
  isFocused: boolean;
  className?: string;
  style?: React.CSSProperties;
}>;

const WidgetContainer = (
  { children = undefined, className = undefined, isFocused, style = {}, ...rest }: Props,
  ref: React.ForwardedRef<HTMLDivElement>,
) => {
  let containerStyle = {
    ...style,
    transition: 'none',
  };

  if (isFocused) {
    containerStyle = {
      ...containerStyle,
      height: '100%',
      width: '100%',
      zIndex: 3,
      top: 0,
      left: 0,
    };
  }

  return (
    <Container className={className} style={containerStyle} ref={ref} {...rest}>
      {children}
    </Container>
  );
};

export default React.forwardRef(WidgetContainer);
