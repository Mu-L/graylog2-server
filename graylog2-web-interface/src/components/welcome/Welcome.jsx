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
import styled from 'styled-components';

import PageHeader from 'components/common/PageHeader';
import SectionComponent from 'components/common/Section/SectionComponent';

import LastOpenList from './LastOpenList';
import FavoriteItemsList from './FavoriteItemsList';
import RecentActivityList from './RecentActivityList';

import SectionGrid from '../common/Section/SectionGrid';

const StyledSectionComponent = styled(SectionComponent)`
  flex-grow: 1;
`;

const Welcome = () => (
  <>
    <PageHeader title="Welcome to Graylog">
      <span>Here you can find most used content</span>
    </PageHeader>
    <SectionGrid>
      <StyledSectionComponent title="Last opened">
        <LastOpenList />
      </StyledSectionComponent>
      <StyledSectionComponent title="Favorite items">
        <FavoriteItemsList />
      </StyledSectionComponent>
    </SectionGrid>
    <StyledSectionComponent title="Recent activity">
      <RecentActivityList />
    </StyledSectionComponent>
  </>
);

export default Welcome;