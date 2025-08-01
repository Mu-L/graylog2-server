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
import type * as React from 'react';

import type { WidgetFocusContextType } from 'views/components/contexts/WidgetFocusContext';
import type Widget from 'views/logic/widgets/Widget';
import type { ViewsDispatch } from 'views/stores/useViewsDispatch';
import type { GetState } from 'views/types';

export type Contexts = {
  widgetFocusContext: WidgetFocusContextType;
};

export type WidgetAction = (
  w: Widget,
  contexts: Contexts,
) => (dispatch: ViewsDispatch, getState: GetState) => Promise<unknown>;

type WidgetBaseActionType = {
  type: string;
  isHidden?: (w: Widget) => boolean;
  disabled?: () => boolean;
};

type WidgetDropdownActionType = {
  title: (w: Widget) => React.ReactNode;
  action: WidgetAction;
  component?: never;
};

type WidgetDropdownComponentType = {
  title: (w: Widget) => React.ReactNode;
  action?: never;
  component: React.ComponentType<WidgetDropdownActionComponentProps>;
};

export type WidgetDropdownType = WidgetBaseActionType & { position: 'dropdown' } & (
    | WidgetDropdownActionType
    | WidgetDropdownComponentType
  );

export type WidgetMenuActionComponentProps = {
  disabled?: boolean;
  widget: Widget;
  contexts?: Contexts;
};

type WidgetDropdownActionComponentProps = WidgetMenuActionComponentProps & {
  onClose: () => void;
};

export type WidgetMenuActionType = WidgetBaseActionType & {
  component: React.ComponentType<WidgetMenuActionComponentProps>;
  position: 'menu';
  title?: never;
  action?: never;
};

export type WidgetActionType = WidgetDropdownType | WidgetMenuActionType;

export const isWidgetMenuAction = (action: WidgetActionType): action is WidgetMenuActionType =>
  action.position === 'menu';
