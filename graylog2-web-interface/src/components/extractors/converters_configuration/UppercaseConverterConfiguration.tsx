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

import { Input } from 'components/bootstrap';
import { getValueFromInput } from 'util/FormsUtils';

type UppercaseConverterConfigurationProps = {
  type: string;
  configuration: any;
  onChange: (...args: any[]) => void;
};

class UppercaseConverterConfiguration extends React.Component<
  UppercaseConverterConfigurationProps,
  {
    [key: string]: any;
  }
> {
  componentDidMount() {
    this.props.onChange(this.props.type, this._getConverterObject());
  }

  _getConverterObject = () => ({ type: this.props.type, config: this.props.configuration });

  _toggleConverter = (event) => {
    let converter;

    if (getValueFromInput(event.target) === true) {
      converter = this._getConverterObject();
    }

    this.props.onChange(this.props.type, converter);
  };

  render() {
    return (
      <div className="xtrc-converter">
        <Input
          type="checkbox"
          id={`enable-${this.props.type}-converter`}
          label="Transform value to uppercase"
          wrapperClassName="col-md-offset-2 col-md-10"
          defaultChecked
          onChange={this._toggleConverter}
        />
      </div>
    );
  }
}

export default UppercaseConverterConfiguration;
