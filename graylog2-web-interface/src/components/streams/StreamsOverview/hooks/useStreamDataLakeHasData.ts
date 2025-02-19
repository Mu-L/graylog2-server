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
import { useQuery } from '@tanstack/react-query';

import usePluginEntities from 'hooks/usePluginEntities';

const useStreamDataLakeHasData = (streamId: string, enabled: boolean) => {
  const { fetchStreamDataLake } = usePluginEntities('dataLake')[0] ?? {};
  const {
    data: dataLake,
    isError,
    isLoading,
  } = useQuery(['stream', 'data-lake', streamId], () => fetchStreamDataLake(streamId), {
    enabled: fetchStreamDataLake && enabled,
  });

  return isLoading || isError ? undefined : dataLake?.message_count > 1 || dataLake?.restore_history?.length > 0;
};

export default useStreamDataLakeHasData;
