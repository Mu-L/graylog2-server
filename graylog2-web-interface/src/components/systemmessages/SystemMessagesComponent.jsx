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

import { Col, Row } from 'components/bootstrap';
import { Pagination, Spinner } from 'components/common';
import { SystemMessagesList } from 'components/systemmessages';
import { SystemMessagesStore } from 'stores/systemmessages/SystemMessagesStore';
import ProductName from 'brand-customization/ProductName';

class SystemMessagesComponent extends React.Component {
  PER_PAGE = 30;

  constructor(props) {
    super(props);

    this.state = { currentPage: 1 };
  }

  componentDidMount() {
    const { currentPage } = this.state;

    this.loadMessages(currentPage);

    this.interval = setInterval(() => {
      const { currentPage: page } = this.state;
      this.loadMessages(page);
    }, 1000);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  loadMessages = (page) => {
    SystemMessagesStore.all(page).then((response) => {
      this.setState(response);
    });
  };

  _onSelected = (selectedPage) => {
    this.setState({ currentPage: selectedPage });
    this.loadMessages(selectedPage);
  };

  render() {
    const { currentPage, messages, total } = this.state;
    let content;

    if (total && messages) {
      const numberPages = Math.ceil(total / this.PER_PAGE);

      content = (
        <div>
          <SystemMessagesList messages={messages} />

          <nav style={{ textAlign: 'center' }}>
            <Pagination totalPages={numberPages} currentPage={currentPage} onChange={this._onSelected} />
          </nav>
        </div>
      );
    } else {
      content = <Spinner />;
    }

    return (
      <Row className="content">
        <Col md={12}>
          <h2>System messages</h2>

          <p className="description">
            System messages are generated by <ProductName /> server nodes on certain events that may be interesting for
            the <ProductName /> administrators. You don&apos;t need to actively act upon any message in here because
            notifications will be raised for any events that required action.
          </p>

          {content}
        </Col>
      </Row>
    );
  }
}

export default SystemMessagesComponent;
