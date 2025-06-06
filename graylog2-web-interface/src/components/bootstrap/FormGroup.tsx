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
import React, { memo } from 'react';
// eslint-disable-next-line no-restricted-imports
import { FormGroup as BootstrapFormGroup } from 'react-bootstrap';
import styled, { css } from 'styled-components';
import chroma from 'chroma-js';

import { CONTROL_CLASS as COMMON_SELECT_CONTROL_CLASS } from 'components/common/Select/index';

import FormControl from './FormControl';
import { StyledAddon } from './InputGroup';

const StyledFormGroup = styled(BootstrapFormGroup)(({ theme, validationState }) => {
  const variant = validationState === 'error' ? 'danger' : validationState;

  if (!variant) {
    return undefined;
  }

  const text = theme.colors.variant.dark[variant];
  const border = theme.colors.variant.light[variant];
  const background = theme.colors.variant.lightest[variant];

  return css`
    &.has-${validationState} {
      .help-block,
      .control-label,
      .radio,
      .checkbox,
      .radio-inline,
      .checkbox-inline,
      &.radio label,
      &.checkbox label,
      &.radio-inline label,
      &.checkbox-inline label {
        color: ${text};
      }

      ${FormControl}, .${COMMON_SELECT_CONTROL_CLASS} {
        border-color: ${border};

        &:focus {
          border-color: ${chroma(border).darken(0.1).toString()};
          box-shadow:
            inset 0 1px 1px rgb(0 0 0 / 7.5%),
            0 0 6px ${chroma(border).brighten(0.2).toString()};
        }
      }

      ${StyledAddon} {
        color: ${text};
        background-color: ${background};
        border-color: ${border};
      }

      .form-control-feedback {
        color: ${text};
      }
    }
  `;
});

type Props = React.ComponentProps<typeof StyledFormGroup> & {
  children?: React.ReactNode;
  validationState?: 'error' | 'success' | 'warning';
};

const FormGroup = ({ children = undefined, validationState = null, ...props }: Props) => (
  <StyledFormGroup validationState={validationState} {...props}>
    {children}
  </StyledFormGroup>
);

export default memo(FormGroup);
