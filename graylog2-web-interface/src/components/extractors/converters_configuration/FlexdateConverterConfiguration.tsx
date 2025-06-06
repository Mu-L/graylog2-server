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

import { getValueFromInput } from 'util/FormsUtils';
import { TimezoneSelect } from 'components/common';
import { Row, Col, Input } from 'components/bootstrap';
import DocumentationLink from 'components/support/DocumentationLink';
import DocsHelper from 'util/DocsHelper';

type FlexdateConverterConfigurationProps = {
  type: string;
  configuration: any;
  onChange: (...args: any[]) => void;
};

class FlexdateConverterConfiguration extends React.Component<
  FlexdateConverterConfigurationProps,
  {
    [key: string]: any;
  }
> {
  componentDidMount() {
    this.props.onChange(this.props.type, this._getConverterObject());
  }

  _getConverterObject = (configuration?) => ({
    type: this.props.type,
    config: configuration || this.props.configuration,
  });

  _toggleConverter = (event) => {
    let converter;

    if (getValueFromInput(event.target) === true) {
      converter = this._getConverterObject();
    }

    this.props.onChange(this.props.type, converter);
  };

  _onChange = (key) => (data) => {
    const newConfig = this.props.configuration;

    // data can be an event or a value, we need to check its type :sick:
    newConfig[key] = typeof data === 'object' ? getValueFromInput(data.target) : data;
    this.props.onChange(this.props.type, this._getConverterObject(newConfig));
  };

  render() {
    const timezoneHelpMessage = (
      <span>
        Time zone to apply to date. Read more in the{' '}
        <DocumentationLink page={DocsHelper.PAGES.PAGE_FLEXIBLE_DATE_CONVERTER} text="documentation" />.
      </span>
    );

    return (
      <div className="xtrc-converter">
        <Input
          type="checkbox"
          id={`enable-${this.props.type}-converter`}
          label="Flexibly parse date"
          wrapperClassName="col-md-offset-2 col-md-10"
          defaultChecked
          onChange={this._toggleConverter}
        />
        <Row className="row-sm">
          <Col md={9} mdOffset={2}>
            <div className="xtrc-converter-subfields">
              <Input
                label="Time Zone"
                id={`${this.props.type}_converter_timezone`}
                labelClassName="col-sm-3"
                wrapperClassName="col-sm-9"
                help={timezoneHelpMessage}>
                <TimezoneSelect
                  id={`${this.props.type}_converter_timezone`}
                  className="timezone-select"
                  value={this.props.configuration.time_zone}
                  onChange={this._onChange('time_zone')}
                />
              </Input>
            </div>
          </Col>
        </Row>
      </div>
    );
  }
}

export default FlexdateConverterConfiguration;
