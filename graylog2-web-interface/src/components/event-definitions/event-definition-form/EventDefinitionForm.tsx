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
import type { SyntheticEvent } from 'react';
import * as React from 'react';
import { PluginStore } from 'graylog-web-plugin/plugin';
import styled from 'styled-components';

import { getPathnameWithoutId } from 'util/URLUtils';
import { Col, Row } from 'components/bootstrap';
import { Wizard } from 'components/common';
import type { EventNotification } from 'stores/event-notifications/EventNotificationsStore';
import type {
  EventDefinition,
  EventDefinitionFormControlsProps,
} from 'components/event-definitions/event-definitions-types';
import type User from 'logic/users/User';
import useSendTelemetry from 'logic/telemetry/useSendTelemetry';
import useLocation from 'routing/useLocation';
import { TELEMETRY_EVENT_TYPE } from 'logic/telemetry/Constants';
import EventDefinitionFormControls from 'components/event-definitions/event-definition-form/EventDefinitionFormControls';
import type { EntitySharePayload } from 'actions/permissions/EntityShareActions';

import EventDetailsForm from './EventDetailsForm';
import EventConditionForm from './EventConditionForm';
import FieldsForm from './FieldsForm';
import NotificationsForm from './NotificationsForm';
import EventDefinitionSummary from './EventDefinitionSummary';
import ShareForm from './ShareForm';

const WizardContainer = styled.div`
  margin-bottom: 10px;
`;
export const getStepKeys = (isNew: boolean) => [
  'event-details',
  'condition',
  'fields',
  'notifications',
  ...(isNew ? ['Share'] : []),
  'summary',
];
const STEP_TELEMETRY_KEYS = [
  TELEMETRY_EVENT_TYPE.EVENTDEFINITION_DETAILS.STEP_CLICKED,
  TELEMETRY_EVENT_TYPE.EVENTDEFINITION_CONDITION.STEP_CLICKED,
  TELEMETRY_EVENT_TYPE.EVENTDEFINITION_FIELDS.STEP_CLICKED,
  TELEMETRY_EVENT_TYPE.EVENTDEFINITION_NOTIFICATIONS.STEP_CLICKED,
  TELEMETRY_EVENT_TYPE.EVENTDEFINITION_SUMMARY.STEP_CLICKED,
];

const getConditionPlugin = (type: string | undefined) => {
  if (type === undefined) {
    return { displayName: null };
  }

  return PluginStore.exports('eventDefinitionTypes').find((edt) => edt.type === type) || {};
};

type Props = {
  activeStep: string;
  action?: 'edit' | 'create';
  eventDefinition: EventDefinition & {
    share_request?: EntitySharePayload;
  };
  currentUser: User;
  validation: {
    errors: {
      config?: unknown;
      title?: string;
    };
  };
  entityTypes: {};
  notifications: Array<EventNotification>;
  defaults: { default_backlog_size: number };
  onChange: (key: string, value: unknown) => void;
  onChangeStep: (step: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
  canEdit: boolean;
  formControls?: React.ComponentType<EventDefinitionFormControlsProps>;
};

const EventDefinitionForm = ({
  action = 'edit',
  activeStep,
  canEdit,
  currentUser,
  defaults,
  entityTypes,
  eventDefinition,
  formControls: FormControls = EventDefinitionFormControls,
  notifications,
  onCancel,
  onChange,
  onChangeStep,
  onSubmit,
  validation,
}: Props) => {
  const { pathname } = useLocation();
  const sendTelemetry = useSendTelemetry();

  const handleSubmit = (event: SyntheticEvent) => {
    if (event) {
      event.preventDefault();
    }

    onSubmit();
  };

  const defaultStepProps = {
    key: eventDefinition.id, // Recreate components if ID changed
    action,
    entityTypes,
    eventDefinition,
    onChange,
    validation,
    currentUser,
  };

  const canEditCondition = React.useMemo(
    () => canEdit || eventDefinition._scope.toUpperCase() === 'ILLUMINATE',
    [canEdit, eventDefinition._scope],
  );

  const eventProcedureId = eventDefinition?.event_procedure || undefined;

  const eventDefinitionType = getConditionPlugin(eventDefinition.config.type);
  const isNew = action === 'create';
  const currentStepKeys = getStepKeys(isNew);
  const activeStepIndex = currentStepKeys.indexOf(activeStep);
  const steps = [
    {
      key: currentStepKeys[0],
      title: 'Event Details',
      component: (
        <EventDetailsForm {...defaultStepProps} eventDefinitionEventProcedure={eventProcedureId} canEdit={canEdit} />
      ),
    },
    {
      key: currentStepKeys[1],
      title: eventDefinitionType?.displayName ?? 'Condition',
      component: <EventConditionForm {...defaultStepProps} canEdit={canEditCondition} />,
    },
    {
      key: currentStepKeys[2],
      title: 'Fields',
      component: <FieldsForm {...defaultStepProps} canEdit={canEdit} />,
    },
    {
      key: currentStepKeys[3],
      title: 'Notifications',
      component: <NotificationsForm {...defaultStepProps} notifications={notifications} defaults={defaults} />,
    },
    ...(isNew
      ? [
          {
            key: currentStepKeys[4],
            title: 'Share',
            component: <ShareForm {...defaultStepProps} />,
          },
        ]
      : []),
    {
      key: currentStepKeys[currentStepKeys.length - 1],
      title: 'Summary',
      component: (
        <EventDefinitionSummary
          eventDefinition={eventDefinition}
          currentUser={currentUser}
          notifications={notifications}
          validation={validation}
        />
      ),
    },
  ];

  const handleStepChange = (nextStep: string) => {
    sendTelemetry(STEP_TELEMETRY_KEYS[currentStepKeys.indexOf(nextStep)], {
      app_pathname: getPathnameWithoutId(pathname),
      app_section: action === 'create' ? 'new-event-definition' : 'edit-event-definition',
      app_action_value: 'event-definition-step',
      current_step: steps[activeStepIndex]?.title,
    });

    onChangeStep(nextStep);
  };

  const openPrevPage = () => {
    sendTelemetry(TELEMETRY_EVENT_TYPE.EVENTDEFINITION_PREVIOUS_CLICKED, {
      app_pathname: getPathnameWithoutId(pathname),
      app_section: action === 'create' ? 'new-event-definition' : 'edit-event-definition',
      app_action_value: 'previous-button',
      current_step: steps[activeStepIndex]?.title,
    });

    const previousStep = activeStepIndex > 0 ? currentStepKeys[activeStepIndex - 1] : undefined;
    onChangeStep(previousStep);
  };

  const openNextPage = () => {
    sendTelemetry(TELEMETRY_EVENT_TYPE.EVENTDEFINITION_NEXT_CLICKED, {
      app_pathname: getPathnameWithoutId(pathname),
      app_section: action === 'create' ? 'new-event-definition' : 'edit-event-definition',
      app_action_value: 'next-button',
      current_step: steps[activeStepIndex]?.title,
    });

    const nextStep = currentStepKeys[activeStepIndex + 1];
    onChangeStep(nextStep);
  };

  return (
    <Row>
      <Col md={12}>
        <WizardContainer>
          <Wizard
            steps={steps}
            activeStep={activeStep}
            onStepChange={handleStepChange}
            horizontal
            justified
            containerClassName=""
            hidePreviousNextButtons
          />
        </WizardContainer>
        <FormControls
          activeStepIndex={activeStepIndex}
          action={action}
          onOpenPrevPage={openPrevPage}
          onOpenNextPage={openNextPage}
          steps={steps}
          onSubmit={handleSubmit}
          onCancel={onCancel}
        />
      </Col>
    </Row>
  );
};

export default EventDefinitionForm;
