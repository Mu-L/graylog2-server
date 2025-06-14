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

import { Button } from 'components/bootstrap';

type Props = {
  outputs: any[];
  onSubmit: (...args: any[]) => void;
};

class AssignOutputDropdown extends React.Component<Props, { selectedOutput: string }> {
  PLACEHOLDER = 'placeholder';

  constructor(props: Props) {
    super(props);
    this.state = {
      selectedOutput: this.PLACEHOLDER,
    };
  }

  _handleUpdate = (evt) => {
    this.setState({ selectedOutput: evt.target.value });
  };

  _handleClick = () => {
    const { onSubmit } = this.props;
    const { selectedOutput } = this.state;

    onSubmit(selectedOutput);
    this.setState({ selectedOutput: this.PLACEHOLDER });
  };

  render() {
    const { outputs } = this.props;
    const { selectedOutput } = this.state;

    return (
      <div className="output-add">
        <div className="form-inline">
          <select value={selectedOutput} name="outputId" className="form-control" onChange={this._handleUpdate}>
            <option value={this.PLACEHOLDER} disabled>
              Select existing output
            </option>
            {outputs.length > 0 ? (
              outputs.map((output) => (
                <option key={output.id} value={output.id}>
                  {output.title}
                </option>
              ))
            ) : (
              <option disabled>No outputs available</option>
            )}
          </select>
          &nbsp;
          <Button
            id="add-existing-output"
            bsStyle="success"
            type="button"
            disabled={selectedOutput === this.PLACEHOLDER}
            onClick={this._handleClick}>
            Assign existing Output
          </Button>
        </div>
      </div>
    );
  }
}

export default AssignOutputDropdown;
