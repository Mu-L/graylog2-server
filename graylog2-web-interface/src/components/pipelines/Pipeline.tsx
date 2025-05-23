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
import React, { useCallback, useMemo } from 'react';
import styled from 'styled-components';

import { Row, Col, Alert } from 'components/bootstrap';
import { EntityList, Pluralize, Spinner } from 'components/common';
import type { PipelineType, StageType } from 'components/pipelines/types';
import type { Stream } from 'stores/streams/StreamsStore';
import type { PipelineConnectionsType } from 'stores/pipelines/PipelineConnectionsStore';
import useGetPermissionsByScope from 'hooks/useScopePermissions';

import Stage from './Stage';
import StageForm from './StageForm';
import PipelineDetails from './PipelineDetails';
import PipelineConnectionsForm from './PipelineConnectionsForm';
import PipelineConnectionsList from './PipelineConnectionsList';

const ConnectionWarning = styled(Alert)`
  margin-bottom: 13px;
`;

const StyledRow = styled(Row)`
  margin-top: 10px;
`;

const StyledP = styled.p`
  margin-top: 5px;
`;

type Props = {
  pipeline: PipelineType;
  connections: PipelineConnectionsType[];
  streams: Stream[];
  onConnectionsChange: (updatedConnections, callback?) => void;
  onStagesChange: (newStages: StageType[], callback?) => void;
  onPipelineChange: (pipeline: PipelineType, callback?) => void;
};

const Pipeline = ({ pipeline, connections, streams, onConnectionsChange, onStagesChange, onPipelineChange }: Props) => {
  const { loadingScopePermissions, scopePermissions } = useGetPermissionsByScope(pipeline);
  const isManaged = scopePermissions && !scopePermissions?.is_mutable;

  const _connectionsWarning = () => {
    if (connections.length === 0) {
      return (
        <ConnectionWarning bsStyle="danger">
          This pipeline is currently not connected to any streams. You have to connect a pipeline to at least one stream
          to make it process incoming messages. Note that this is not required if you intend to use this pipeline only
          for search result transformation using decorators.
        </ConnectionWarning>
      );
    }

    return null;
  };

  const _saveStage = (stage, callback) => {
    const newStages = pipeline.stages.slice();

    newStages.push(stage);
    onStagesChange(newStages, callback);
  };

  const _updateStage = useCallback(
    (prevStage) => (stage, callback) => {
      const newStages = pipeline.stages.filter((s) => s.stage !== prevStage.stage);

      newStages.push(stage);
      onStagesChange(newStages, callback);
    },
    [pipeline, onStagesChange],
  );

  const _deleteStage = useCallback(
    (stage) => () => {
      // eslint-disable-next-line no-alert
      if (window.confirm(`You are about to delete stage ${stage.stage}, are you sure you want to proceed?`)) {
        const newStages = pipeline.stages.filter((s) => s.stage !== stage.stage);

        onStagesChange(newStages);
      }
    },
    [pipeline, onStagesChange],
  );

  const _formatConnectedStreams = (connectedStreams: Stream[]) => {
    const formattedStreams = connectedStreams.map((s) => `"${s.title}"`);
    const streamList =
      formattedStreams.length > 1
        ? [formattedStreams.slice(0, -1).join(', '), formattedStreams.slice(-1)].join(' and ')
        : formattedStreams[0];

    return (
      <span>
        This pipeline is processing messages from the{' '}
        <Pluralize singular="stream" plural="streams" value={formattedStreams.length} /> {streamList}.
      </span>
    );
  };

  const formattedStages = useMemo(() => {
    const maxStage = pipeline.stages.reduce((max, currentStage) => Math.max(max, currentStage.stage), -Infinity);

    return pipeline.stages
      .sort((s1, s2) => s1.stage - s2.stage)
      .map((stage) => (
        <Stage
          key={`stage-${stage.stage}`}
          pipeline={pipeline}
          stage={stage}
          isLastStage={stage.stage === maxStage}
          onUpdate={_updateStage(stage)}
          onDelete={_deleteStage(stage)}
          disableEdit={isManaged}
        />
      ));
  }, [pipeline, _updateStage, _deleteStage, isManaged]);

  const stageKey = useMemo(() => pipeline.stages.map((s) => s.stage).join('-'), [pipeline.stages]);

  if (loadingScopePermissions) {
    return <Spinner />;
  }

  return (
    <div>
      {isManaged && <Alert bsStyle="warning">This pipeline is system managed</Alert>}
      {_connectionsWarning()}
      <PipelineDetails pipeline={pipeline} onChange={onPipelineChange} disableEdit={isManaged} />
      <StyledRow className="row-sm">
        <Col md={12}>
          <div className="pull-right">
            <PipelineConnectionsForm
              pipeline={pipeline}
              connections={connections}
              streams={streams}
              save={onConnectionsChange}
              disableEdit={isManaged}
            />
          </div>
          <h2>Pipeline connections</h2>
          <StyledP>
            <PipelineConnectionsList
              pipeline={pipeline}
              connections={connections}
              streams={streams}
              streamsFormatter={_formatConnectedStreams}
              noConnectionsMessage="Select streams that will be processed by this pipeline."
            />
          </StyledP>
          <hr />
        </Col>
      </StyledRow>
      <StyledRow className="row-sm">
        <Col md={12}>
          <div className="pull-right">
            <StageForm key={stageKey} pipeline={pipeline} create save={_saveStage} disableEdit={isManaged} />
          </div>
          <h2>Pipeline Stages</h2>
          <StyledP>
            Stages are groups of conditions and actions which need to run in order, and provide the necessary control
            flow to decide whether or not to run the rest of a pipeline.
          </StyledP>
        </Col>
      </StyledRow>
      <EntityList bsNoItemsStyle="info" noItemsText="There are no rules on this stage." items={formattedStages} />
    </div>
  );
};

export default Pipeline;
