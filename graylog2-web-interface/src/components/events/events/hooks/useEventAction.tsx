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
import React, { useMemo } from 'react';

import usePluggableEventActions from 'components/events/events/hooks/usePluggableEventActions';
import { MenuItem } from 'components/bootstrap';
import LinkToReplaySearch from 'components/event-definitions/replay-search/LinkToReplaySearch';
import useSendEventActionTelemetry from 'components/events/events/hooks/useSendEventActionTelemetry';
import type { Event } from 'components/events/events/types';
import usePermissions from 'hooks/usePermissions';

const useEventAction = (event: Event) => {
  const { actions: pluggableActions, actionModals: pluggableActionModals } = usePluggableEventActions([event]);
  const sendEventActionTelemetry = useSendEventActionTelemetry();
  const hasReplayInfo = !!event.replay_info;
  const permissions = usePermissions();
  const isPermitted = permissions.isPermitted(`eventdefinitions:edit:${event.event_definition_id}`);

  const moreActions = useMemo(
    () =>
      [
        hasReplayInfo && isPermitted ? (
          <LinkToReplaySearch
            key="replay-search"
            isMenuitem
            onClick={() => sendEventActionTelemetry('REPLAY_SEARCH', false)}
            id={event.id}
            isEvent
          />
        ) : null,
        pluggableActions.length && hasReplayInfo ? <MenuItem divider key="divider" /> : null,
        pluggableActions.length ? pluggableActions : null,
      ].filter(Boolean),
    [sendEventActionTelemetry, event.id, hasReplayInfo, pluggableActions, isPermitted],
  );

  return { moreActions, pluggableActionModals };
};

export default useEventAction;
