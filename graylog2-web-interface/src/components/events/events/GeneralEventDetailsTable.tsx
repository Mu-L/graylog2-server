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

import type { Event, EventsAdditionalData } from 'components/events/events/types';
import useColumnRenderers from 'components/events/events/ColumnRenderers';
import EventDetailsTable from 'components/events/events/EventDetailsTable';
import { useGetEventDefinition } from 'components/event-definitions/hooks/useEventDefinitions';
import { Spinner } from 'components/common';

type Props = {
  attributesList: Array<{ id: string; title: string }>;
  event: Event;
  meta: EventsAdditionalData;
};

const GeneralEventDetailsTable = ({ event, attributesList, meta }: Props) => {
  const { attributes: attributesRenderers } = useColumnRenderers();
  const { event_definition_id } = event;
  const { data, isFetching } = useGetEventDefinition(event_definition_id);

  if (isFetching) return <Spinner />;

  const eventDefinitionEventProcedureId = data?.eventDefinition?.event_procedure || '';

  return (
    <EventDetailsTable<Event>
      event={event}
      meta={meta}
      eventProcedureId={eventDefinitionEventProcedureId}
      attributesRenderers={attributesRenderers}
      attributesList={attributesList}
    />
  );
};

export default GeneralEventDetailsTable;
