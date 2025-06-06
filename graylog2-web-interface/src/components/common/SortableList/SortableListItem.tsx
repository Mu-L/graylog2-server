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
import { Draggable } from 'react-beautiful-dnd';
import styled, { css } from 'styled-components';

import { Portal } from 'components/common';

import type { CustomListItemRender, ListItemType, CustomContentRender } from './types';
import ListItem from './ListItem';

type Props<ItemType extends ListItemType> = {
  alignItemContent?: 'flex-start' | 'center';
  className?: string;
  customListItemRender?: CustomListItemRender<ItemType>;
  customContentRender?: CustomContentRender<ItemType>;
  disableDragging?: boolean;
  displayOverlayInPortal: boolean;
  index: number;
  item: ItemType;
};

const StyledListItem = styled(ListItem)<{ $isDragging: boolean }>(
  ({ $isDragging }) => css`
    box-shadow: ${$isDragging ? 'rgba(0, 0, 0, 0.24) 0px 3px 8px' : 'none'};
  `,
);

const SortableListItem = <ItemType extends ListItemType>({
  alignItemContent = undefined,
  className = undefined,
  customContentRender = undefined,
  customListItemRender = undefined,
  disableDragging = false,
  displayOverlayInPortal,
  index,
  item,
}: Props<ItemType>) => (
  <Draggable draggableId={item.id} index={index}>
    {({ draggableProps, dragHandleProps, innerRef }, { isDragging }) => {
      const listItem = (
        <StyledListItem
          alignItemContent={alignItemContent}
          item={item}
          index={index}
          className={className}
          ref={innerRef}
          customContentRender={customContentRender}
          customListItemRender={customListItemRender}
          disableDragging={disableDragging}
          displayOverlayInPortal={displayOverlayInPortal}
          draggableProps={draggableProps}
          dragHandleProps={dragHandleProps}
          $isDragging={isDragging}
        />
      );

      return displayOverlayInPortal && isDragging ? <Portal>{listItem}</Portal> : listItem;
    }}
  </Draggable>
);

export default SortableListItem;
