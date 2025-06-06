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
import styled, { css } from 'styled-components';

import { Navbar } from 'components/bootstrap';
import { NAV_ITEM_HEIGHT } from 'theme/constants';
import { hoverIndicatorStyles, activeIndicatorStyles } from 'components/common/NavItemStateIndicator';

const StyledNavbar = styled(Navbar)(
  ({ theme }) => css`
    .dev-badge-wrap > a {
      cursor: default;
    }

    &.navbar-default {
      .navbar-nav > li > a {
        padding: 0 15px;
        height: ${NAV_ITEM_HEIGHT};
        display: inline-flex;
        align-items: center;
      }

      .navbar-nav > li,
      .navbar-nav > span {
        > * {
          font-family: ${theme.fonts.family.navigation};
          font-size: ${theme.fonts.size.navigation};

          &:hover,
          &:focus-visible {
            ${hoverIndicatorStyles(theme)}
          }
        }

        &.active {
          > * {
            ${activeIndicatorStyles(theme)}
            &:hover,
            &:focus-visible {
              ${activeIndicatorStyles(theme)}
            }
          }
        }
      }
    }

    .dropdown-menu li {
      &:not(.dropdown-header) {
        font-family: ${theme.fonts.family.navigation};
        font-size: ${theme.fonts.size.navigation};
      }

      a {
        padding: 6px 20px;
      }
    }

    @media (width <= 991px) {
      .small-scrn-badge {
        float: right;
        margin: 15px 15px 0;
      }

      .header-meta-nav {
        border-top: 1px solid ${theme.colors.gray[50]};
        padding-top: 7.5px;

        #scratchpad-toggle {
          padding: 10px 15px;
          display: block;
          width: 100%;
          text-align: left;

          &:hover {
            text-decoration: none;
          }
        }

        #scratchpad-toggle,
        .dropdown-toggle,
        #welcome-nav-link {
          font-size: ${theme.fonts.size.body};
          font-family: ${theme.fonts.family.body};
          padding: 0 15px;
          height: ${NAV_ITEM_HEIGHT};
          display: inline-flex;
          align-items: center;

          &::before {
            content: attr(aria-label);
          }

          [class*='fa-'] {
            display: none;
          }
        }
      }

      .dev-badge-wrap {
        display: none !important;
      }
    }

    @media (width >= 768px) {
      .navbar-toggle {
        display: block;
      }

      .navbar-collapse {
        width: auto;
        border-top: 1px solid transparent;
        box-shadow: inset 0 1px 0 rgb(255 255 255 / 10%);

        &.collapse {
          height: auto !important;
          padding-bottom: 0;
        }

        &.in {
          overflow-y: auto;
        }
      }

      .navbar-fixed-top .navbar-collapse,
      .navbar-static-top .navbar-collapse,
      .navbar-fixed-bottom .navbar-collapse {
        padding-right: 15px;
        padding-left: 15px;
      }

      .navbar-header {
        float: none;
      }

      .container > .navbar-header,
      .container-fluid > .navbar-header,
      .container > .navbar-collapse,
      .container-fluid > .navbar-collapse {
        margin-right: -15px;
      }
    }

    @media (width >= 991px) {
      .header-meta-nav {
        display: flex;
        align-items: center;

        .dropdown-toggle {
          padding: 12px !important;
          min-height: ${NAV_ITEM_HEIGHT};
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
      }

      .navbar-toggle {
        display: none;
      }

      .navbar-collapse {
        width: auto;
        border-top: 0;
        box-shadow: none;

        &.collapse {
          display: block !important;
          height: auto !important;
          padding-bottom: 0;
          overflow: visible !important;
        }

        &.in {
          overflow-y: visible;
        }
      }

      .navbar-fixed-top .navbar-collapse,
      .navbar-static-top .navbar-collapse,
      .navbar-fixed-bottom .navbar-collapse {
        padding-right: 0;
        padding-left: 0;
      }

      .navbar-header {
        float: left;
      }

      .small-scrn-badge {
        display: none;
      }

      .container > .navbar-header,
      .container-fluid > .navbar-header,
      .container > .navbar-collapse,
      .container-fluid > .navbar-collapse {
        margin-right: 0;
        margin-left: 0;
      }
    }
  `,
);

export default StyledNavbar;
