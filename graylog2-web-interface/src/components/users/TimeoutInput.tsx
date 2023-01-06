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
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

import Routes from 'routing/Routes';
import { Row, Col, HelpBlock, Input } from 'components/bootstrap';
import TimeoutUnitSelect from 'components/users/TimeoutUnitSelect';

import { MS_DAY, MS_HOUR, MS_MINUTE, MS_SECOND } from './timeoutConstants';

import type { UserConfigType } from '../../stores/configurations/ConfigurationsStore';
import { ConfigurationsActions } from '../../stores/configurations/ConfigurationsStore';
import { Link } from '../common/router';

type Props = {
  value: number,
  onChange: (value: number) => void;
};

const USER_CONFIG = 'org.graylog2.users.UserConfiguration';

const _estimateUnit = (value) => {
  if (value === 0) {
    return MS_SECOND;
  }

  if (value % MS_DAY === 0) {
    return MS_DAY;
  }

  if (value % MS_HOUR === 0) {
    return MS_HOUR;
  }

  if (value % MS_MINUTE === 0) {
    return MS_MINUTE;
  }

  return MS_SECOND;
};

const TimeoutInput = ({ value: propsValue, onChange }: Props) => {
  const [sessionTimeoutNever, setSessionTimeoutNever] = useState(propsValue === -1);
  const [unit, setUnit] = useState(_estimateUnit(propsValue));
  const [value, setValue] = useState(propsValue ? Math.floor(propsValue / Number(unit)) : 0);
  const [globalSessionTimeout, setGlobalSessionTimeout] = useState<UserConfigType>({ enable_global_session_timeout: false, global_session_timeout_interval: '' });

  useEffect(() => {
    ConfigurationsActions.list(USER_CONFIG).then((data: UserConfigType) => {
      setGlobalSessionTimeout(data);
    });
  }, []);

  useEffect(() => {
    if (typeof onChange === 'function') {
      const getValue = () => {
        if (sessionTimeoutNever) {
          return -1;
        }

        return (value * Number(unit));
      };

      onChange(getValue());
    }
  }, [value, unit, sessionTimeoutNever, onChange]);

  const _onClick = (evt) => {
    setSessionTimeoutNever(evt.target.checked);
  };

  const _onChangeValue = (evt) => {
    setValue(evt.target.value);
  };

  const _onChangeUnit = (newUnit: string) => {
    setUnit(newUnit);
  };

  return (
    <Input id="timeout-controls"
           labelClassName="col-sm-3"
           wrapperClassName="col-sm-9"
           label="Sessions Timeout">
      <>
        <Input type="checkbox"
               id="session-timeout-never"
               name="session_timeout_never"
               label="Sessions do not time out"
               help="When checked, sessions never time out due to inactivity."
               formGroupClassName="no-bm"
               onChange={_onClick}
               checked={sessionTimeoutNever}
               disabled={globalSessionTimeout.enable_global_session_timeout} />

        <div className="clearfix">
          <Col xs={2}>
            <Input type="number"
                   id="timeout"
                   placeholder="Timeout amount"
                   name="timeout"
                   min={1}
                   formGroupClassName="form-group no-bm"
                   disabled={sessionTimeoutNever || globalSessionTimeout.enable_global_session_timeout}
                   value={value}
                   onChange={_onChangeValue} />
          </Col>
          <Col xs={4}>
            <TimeoutUnitSelect disabled={sessionTimeoutNever || globalSessionTimeout.enable_global_session_timeout}
                               value={`${unit}`}
                               onChange={_onChangeUnit} />
          </Col>
          <Row className="no-bm">
            <Col xs={12}>
              {globalSessionTimeout.enable_global_session_timeout ? (
                <HelpBlock>
                  User session timeout is not editable because the <Link to={Routes.SYSTEM.CONFIGURATIONS}>global session timeout</Link> is enabled.
                </HelpBlock>
              ) : (
                <HelpBlock>
                  Session automatically end after this amount of time, unless they are actively used.
                </HelpBlock>
              )}
            </Col>
          </Row>
        </div>
      </>
    </Input>
  );
};

TimeoutInput.propTypes = {
  value: PropTypes.number,
  onChange: PropTypes.func,
};

TimeoutInput.defaultProps = {
  value: MS_HOUR,
  onChange: () => {},
};

export default TimeoutInput;
