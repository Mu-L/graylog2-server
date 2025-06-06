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
import { notifications } from '@mantine/notifications';

import Icon from 'components/common/Icon/Icon';
import { singleton } from 'logic/singleton';

const UserNotification = {
  error(message: string, title = 'Error') {
    notifications.show({
      message,
      title,
      autoClose: 10000,
      color: 'red',
      icon: <Icon name="exclamation" type="regular" />,
    });
  },
  warning(message: string, title = 'Attention') {
    notifications.show({
      message,
      title,
      color: 'blue',
      icon: <Icon name="exclamation" type="regular" rotation={180} />,
    });
  },
  success(message: string, title = 'Success') {
    notifications.show({
      message,
      title,
      color: 'green',
      icon: <Icon name="check" type="regular" />,
    });
  },
};

export default singleton('core.UserNotification', () => UserNotification);
