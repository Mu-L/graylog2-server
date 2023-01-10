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
import { render, fireEvent, screen } from 'wrappedTestingLibrary';

import View from 'views/logic/views/View';
import Search from 'views/logic/search/Search';
import useDashboards from 'views/components/dashboard/hooks/useDashboards';
import { asMock } from 'helpers/mocking';

import CopyToDashboardForm from './CopyToDashboardForm';

const view1 = View.builder().type(View.Type.Dashboard).id('view-1').title('view 1')
  .search(Search.create())
  .build();
const view2 = View.builder().type(View.Type.Dashboard).id('view-2').title('view 2')
  .search(Search.create())
  .build();
const dashboardList = [view1, view2];

jest.mock('views/components/dashboard/hooks/useDashboards');

describe('CopyToDashboardForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    asMock(useDashboards).mockReturnValue({
      data: {
        list: dashboardList,
        pagination: { total: 2 },
        attributes: [
          {
            id: 'title',
            title: 'Title',
            sortable: true,
          },
          {
            id: 'description',
            title: 'Description',
            sortable: true,
          },
        ],
      },
      isFetching: false,
      refetch: () => {},
    });
  });

  const submitModal = () => {
    const submitButton = screen.getByRole('button', { name: /copy widget/i, hidden: true });
    fireEvent.click(submitButton);
  };

  it('should render the modal minimal', () => {
    asMock(useDashboards).mockReturnValue({
      data: {
        list: [],
        pagination: { total: 0 },
      },
      isFetching: false,
      refetch: () => {},
    });

    const { baseElement } = render(<CopyToDashboardForm widgetId="widget-id"
                                                        onCancel={() => {}}
                                                        onSubmit={() => {}} />);

    expect(baseElement).not.toBeNull();
  });

  it('should render the modal with entries', () => {
    const { baseElement } = render(<CopyToDashboardForm widgetId="widget-id"
                                                        onCancel={() => {}}
                                                        onSubmit={() => {}} />);

    expect(baseElement).not.toBeNull();
  });

  it('should handle onCancel', () => {
    const onCancel = jest.fn();
    const { getByText } = render(<CopyToDashboardForm widgetId="widget-id"
                                                      onCancel={onCancel}
                                                      onSubmit={() => {}} />);
    const cancelButton = getByText('Cancel');

    fireEvent.click(cancelButton);

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('should not handle onSubmit without selection', () => {
    const onSubmit = jest.fn();

    render(<CopyToDashboardForm widgetId="widget-id"
                                onCancel={() => {}}
                                onSubmit={onSubmit} />);

    submitModal();

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('should handle onSubmit with a previous selection', () => {
    const onSubmit = jest.fn();
    const { getByText } = render(<CopyToDashboardForm widgetId="widget-id"
                                                      onCancel={() => {}}
                                                      onSubmit={onSubmit} />);
    const firstView = getByText('view 1');

    fireEvent.click(firstView);
    submitModal();

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith('widget-id', 'view-1');
  });

  it('should query for all dashboards & specific dashboards', () => {
    const { getByPlaceholderText, getByText } = render(
      <CopyToDashboardForm widgetId="widget-id"
                           onCancel={() => {}}
                           onSubmit={() => {}} />,
    );

    expect(useDashboards).toHaveBeenCalledTimes(1);

    const searchInput = getByPlaceholderText('Enter search query...');

    fireEvent.change(searchInput, { target: { value: 'view 1' } });
    const searchButton = getByText('Search');

    fireEvent.click(searchButton);

    expect(useDashboards).toHaveBeenCalledWith({
      query: 'view 1',
      page: 1,
      pageSize: 5,
      sort: {
        attributeId: 'title',
        direction: 'asc',
      },
    });
  });
});
