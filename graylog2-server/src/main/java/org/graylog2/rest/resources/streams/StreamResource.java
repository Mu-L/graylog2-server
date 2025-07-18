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
package org.graylog2.rest.resources.streams;

import com.codahale.metrics.annotation.Timed;
import com.google.common.collect.Lists;
import com.google.common.collect.Maps;
import com.google.common.collect.Sets;
import com.google.common.util.concurrent.ThreadFactoryBuilder;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import io.swagger.annotations.ApiResponse;
import io.swagger.annotations.ApiResponses;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.ForbiddenException;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.apache.shiro.authz.annotation.RequiresAuthentication;
import org.apache.shiro.authz.annotation.RequiresPermissions;
import org.bson.types.ObjectId;
import org.graylog.grn.GRNTypes;
import org.graylog.plugins.pipelineprocessor.db.PipelineDao;
import org.graylog.plugins.pipelineprocessor.db.PipelineService;
import org.graylog.plugins.pipelineprocessor.db.PipelineStreamConnectionsService;
import org.graylog.plugins.pipelineprocessor.rest.PipelineCompactSource;
import org.graylog.plugins.pipelineprocessor.rest.PipelineConnections;
import org.graylog.plugins.views.startpage.recentActivities.RecentActivityService;
import org.graylog.security.UserContext;
import org.graylog.security.shares.CreateEntityRequest;
import org.graylog.security.shares.EntitySharesService;
import org.graylog2.audit.AuditEventSender;
import org.graylog2.audit.AuditEventTypes;
import org.graylog2.audit.jersey.AuditEvent;
import org.graylog2.audit.jersey.DefaultFailureContextCreator;
import org.graylog2.audit.jersey.NoAuditEvent;
import org.graylog2.audit.jersey.SuccessContextCreator;
import org.graylog2.database.MongoEntity;
import org.graylog2.database.NotFoundException;
import org.graylog2.database.PaginatedList;
import org.graylog2.database.filtering.DbQueryCreator;
import org.graylog2.events.ClusterEventBus;
import org.graylog2.indexer.IndexSet;
import org.graylog2.indexer.IndexSetRegistry;
import org.graylog2.indexer.indexset.MongoIndexSetService;
import org.graylog2.plugin.Message;
import org.graylog2.plugin.MessageFactory;
import org.graylog2.plugin.Tools;
import org.graylog2.plugin.database.ValidationException;
import org.graylog2.plugin.streams.Output;
import org.graylog2.plugin.streams.Stream;
import org.graylog2.plugin.streams.StreamRule;
import org.graylog2.rest.bulk.AuditParams;
import org.graylog2.rest.bulk.BulkExecutor;
import org.graylog2.rest.bulk.SequentialBulkExecutor;
import org.graylog2.rest.bulk.model.BulkOperationRequest;
import org.graylog2.rest.bulk.model.BulkOperationResponse;
import org.graylog2.rest.models.SortOrder;
import org.graylog2.rest.models.streams.requests.UpdateStreamRequest;
import org.graylog2.rest.models.system.outputs.responses.OutputSummary;
import org.graylog2.rest.models.tools.responses.PageListResponse;
import org.graylog2.rest.resources.entities.EntityAttribute;
import org.graylog2.rest.resources.entities.EntityDefaults;
import org.graylog2.rest.resources.entities.FilterOption;
import org.graylog2.rest.resources.entities.Sorting;
import org.graylog2.rest.resources.streams.requests.CloneStreamRequest;
import org.graylog2.rest.resources.streams.requests.CreateStreamRequest;
import org.graylog2.rest.resources.streams.responses.StreamCreatedResponse;
import org.graylog2.rest.resources.streams.responses.StreamDTOResponse;
import org.graylog2.rest.resources.streams.responses.StreamListResponse;
import org.graylog2.rest.resources.streams.responses.StreamResponse;
import org.graylog2.rest.resources.streams.responses.TestMatchResponse;
import org.graylog2.search.SearchQueryField;
import org.graylog2.shared.rest.resources.RestResource;
import org.graylog2.shared.security.RestPermissions;
import org.graylog2.streams.PaginatedStreamService;
import org.graylog2.streams.StreamGuardException;
import org.graylog2.streams.StreamImpl;
import org.graylog2.streams.StreamRouterEngine;
import org.graylog2.streams.StreamRuleService;
import org.graylog2.streams.StreamService;
import org.joda.time.DateTime;
import org.joda.time.DateTimeZone;
import org.joda.time.format.ISODateTimeFormat;

import java.net.URI;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.function.Predicate;
import java.util.stream.Collectors;

import static com.google.common.base.MoreObjects.firstNonNull;
import static org.graylog2.shared.rest.documentation.generator.Generator.CLOUD_VISIBLE;

@RequiresAuthentication
@Api(value = "Streams", description = "Manage streams", tags = {CLOUD_VISIBLE})
@Path("/streams")
public class StreamResource extends RestResource {
    private static final String DEFAULT_SORT_FIELD = StreamImpl.FIELD_TITLE;
    private static final String DEFAULT_SORT_DIRECTION = "asc";
    private static final List<EntityAttribute> attributes = List.of(
            EntityAttribute.builder().id(StreamImpl.FIELD_ID).title("id").type(SearchQueryField.Type.OBJECT_ID).hidden(true).searchable(true).build(),
            EntityAttribute.builder().id(StreamImpl.FIELD_TITLE).title("Title").searchable(true).build(),
            EntityAttribute.builder().id(StreamImpl.FIELD_DESCRIPTION).title("Description").searchable(true).build(),
            EntityAttribute.builder().id(StreamImpl.FIELD_CREATED_AT).title("Created").type(SearchQueryField.Type.DATE).filterable(true).build(),
            EntityAttribute.builder().id(StreamImpl.FIELD_INDEX_SET_ID).title("Index set")
                    .relatedCollection(MongoIndexSetService.COLLECTION_NAME)
                    .hidden(true)
                    .filterable(true)
                    .build(),
            EntityAttribute.builder().id("disabled").title("Status").type(SearchQueryField.Type.BOOLEAN).filterable(true).filterOptions(Set.of(
                    FilterOption.create("true", "Paused"),
                    FilterOption.create("false", "Running")
            )).build()
    );
    private static final EntityDefaults settings = EntityDefaults.builder()
            .sort(Sorting.create(DEFAULT_SORT_FIELD, Sorting.Direction.valueOf(DEFAULT_SORT_DIRECTION.toUpperCase(Locale.ROOT))))
            .build();
    private final PaginatedStreamService paginatedStreamService;
    private final MessageFactory messageFactory;
    private final StreamService streamService;
    private final StreamRuleService streamRuleService;
    private final StreamRouterEngine.Factory streamRouterEngineFactory;
    private final IndexSetRegistry indexSetRegistry;
    private final RecentActivityService recentActivityService;
    private final BulkExecutor<Stream, UserContext> bulkStreamDeleteExecutor;
    private final BulkExecutor<Stream, UserContext> bulkStreamStartExecutor;
    private final BulkExecutor<Stream, UserContext> bulkStreamStopExecutor;
    private final PipelineStreamConnectionsService pipelineStreamConnectionsService;
    private final PipelineService pipelineService;
    private final EntitySharesService entitySharesService;
    private final ClusterEventBus clusterEventBus;

    private final DbQueryCreator dbQueryCreator;

    @Inject
    public StreamResource(StreamService streamService,
                          PaginatedStreamService paginatedStreamService,
                          StreamRuleService streamRuleService,
                          StreamRouterEngine.Factory streamRouterEngineFactory,
                          IndexSetRegistry indexSetRegistry,
                          RecentActivityService recentActivityService,
                          AuditEventSender auditEventSender,
                          MessageFactory messageFactory,
                          PipelineStreamConnectionsService pipelineStreamConnectionsService,
                          PipelineService pipelineService,
                          EntitySharesService entitySharesService,
                          ClusterEventBus clusterEventBus) {
        this.streamService = streamService;
        this.streamRuleService = streamRuleService;
        this.streamRouterEngineFactory = streamRouterEngineFactory;
        this.indexSetRegistry = indexSetRegistry;
        this.paginatedStreamService = paginatedStreamService;
        this.messageFactory = messageFactory;
        this.pipelineStreamConnectionsService = pipelineStreamConnectionsService;
        this.pipelineService = pipelineService;
        this.entitySharesService = entitySharesService;
        this.dbQueryCreator = new DbQueryCreator(StreamImpl.FIELD_TITLE, attributes);
        this.recentActivityService = recentActivityService;
        this.clusterEventBus = clusterEventBus;
        final SuccessContextCreator<Stream> successAuditLogContextCreator = (entity, entityClass) ->
                Map.of("response_entity",
                        Map.of("stream_id", entity.getId(),
                                "title", entity.getTitle()
                        ));
        final DefaultFailureContextCreator failureAuditLogContextCreator = new DefaultFailureContextCreator();
        this.bulkStreamDeleteExecutor = new SequentialBulkExecutor<>(this::deleteInner, auditEventSender, successAuditLogContextCreator, failureAuditLogContextCreator);
        this.bulkStreamStartExecutor = new SequentialBulkExecutor<>(this::resumeInner, auditEventSender, successAuditLogContextCreator, failureAuditLogContextCreator);
        this.bulkStreamStopExecutor = new SequentialBulkExecutor<>(this::pauseInner, auditEventSender, successAuditLogContextCreator, failureAuditLogContextCreator);
    }

    @POST
    @Timed
    @ApiOperation(value = "Create a stream", response = StreamCreatedResponse.class)
    @RequiresPermissions(RestPermissions.STREAMS_CREATE)
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @AuditEvent(type = AuditEventTypes.STREAM_CREATE)
    public Response create(@ApiParam(name = "JSON body", required = true) final CreateEntityRequest<CreateStreamRequest> createEntityRequest,
                           @Context UserContext userContext) throws ValidationException {
        final CreateStreamRequest cr = createEntityRequest.entity();
        // Create stream.
        final Stream stream = streamService.create(cr, getCurrentUser().getName());

        final IndexSet indexSet = stream.getIndexSet();
        checkIndexSet(indexSet);

        final Set<StreamRule> streamRules = cr.rules().stream()
                .map(streamRule -> streamRuleService.create(null, streamRule))
                .collect(Collectors.toSet());
        final String id = streamService.saveWithRulesAndOwnership(stream, streamRules, userContext.getUser());

        final StreamCreatedResponse result = new StreamCreatedResponse(id);
        final URI streamUri = getUriBuilderToSelf().path(StreamResource.class)
                .path("{streamId}")
                .build(id);

        recentActivityService.create(id, GRNTypes.STREAM, userContext.getUser());
        createEntityRequest.shareRequest().ifPresent(shareRequest ->
                entitySharesService.updateEntityShares(GRNTypes.STREAM, result.streamId(), shareRequest, userContext.getUser()));

        return Response.created(streamUri).entity(result).build();
    }

    @GET
    @Timed
    @Path("/paginated")
    @ApiOperation(value = "Get a paginated list of streams")
    @Produces(MediaType.APPLICATION_JSON)
    public PageListResponse<StreamDTOResponse> getPage(@ApiParam(name = "page") @QueryParam("page") @DefaultValue("1") int page,
                                               @ApiParam(name = "per_page") @QueryParam("per_page") @DefaultValue("50") int perPage,
                                               @ApiParam(name = "query") @QueryParam("query") @DefaultValue("") String query,
                                               @ApiParam(name = "filters") @QueryParam("filters") List<String> filters,
                                               @ApiParam(name = "sort",
                                                         value = "The field to sort the result on",
                                                         required = true,
                                                         allowableValues = "title,description,created_at,updated_at,status")
                                               @DefaultValue(DEFAULT_SORT_FIELD) @QueryParam("sort") String sort,
                                               @ApiParam(name = "order", value = "The sort direction", allowableValues = "asc, desc")
                                               @DefaultValue(DEFAULT_SORT_DIRECTION) @QueryParam("order") SortOrder order) {

        final Predicate<StreamImpl> permissionFilter = stream -> isPermitted(RestPermissions.STREAMS_READ, stream.id());
        final PaginatedList<StreamImpl> result = paginatedStreamService
                .findPaginated(dbQueryCreator.createDbQuery(filters, query), permissionFilter, page, perPage, sort, order);

        final List<String> streamIds = result.stream().map(StreamImpl::id).toList();
        final Map<String, List<StreamRule>> streamRuleMap = streamRuleService.loadForStreamIds(streamIds);

        final List<StreamImpl> streams = result
                .stream()
                .map(streamDTO -> {
                    final List<StreamRule> rules = streamRuleMap.getOrDefault(streamDTO.id(), Collections.emptyList());
                    return streamDTO.toBuilder().rules(rules).build();
                })
                .toList();
        final long total = paginatedStreamService.count();
        final PaginatedList<StreamDTOResponse> streamDTOS = new PaginatedList<>(
                streams.stream().map(this::dtoToResponse).toList(), result.pagination().total(), result.pagination().page(), result.pagination().perPage()
        );
        return PageListResponse.create(query, streamDTOS.pagination(), total, sort, order, streamDTOS, attributes, settings);
    }

    @GET
    @Timed
    @ApiOperation(value = "Get a list of all streams")
    @Deprecated
    @Produces(MediaType.APPLICATION_JSON)
    public StreamListResponse get() {
        final List<Stream> streams = streamService.loadAll()
                .stream()
                .filter(stream -> isPermitted(RestPermissions.STREAMS_READ, stream.getId()))
                .toList();

        return StreamListResponse.create(streams.size(), streams.stream().map(this::streamToResponse).collect(Collectors.toSet()));
    }

    //TODO: remove this method when https://github.com/Graylog2/graylog-plugin-enterprise/issues/8610 is resolved!
    @GET
    @Path("/no_security")
    @Timed
    @ApiOperation(value = "Get a list of all streams, excluding security streams")
    @Deprecated
    @Produces(MediaType.APPLICATION_JSON)
    public StreamListResponse getNoSecurity() {
        final List<Stream> streams = streamService.loadAll()
                .stream()
                .filter(stream -> isPermitted(RestPermissions.STREAMS_READ, stream.getId()))
                .filter(stream -> !isSecurityStream(stream.getTitle()))
                .toList();

        return StreamListResponse.create(streams.size(), streams.stream().map(this::streamToResponse).collect(Collectors.toSet()));
    }

    private boolean isSecurityStream(String title) {
        return title.equalsIgnoreCase("All investigation events")
                || title.equalsIgnoreCase("All investigation messages")
                || title.startsWith("Illuminate:");
    }

    @GET
    @Path("/byIndex/{indexSetId}")
    @Timed
    @ApiOperation(value = "Get a list of all streams connected to a given index set")
    @Produces(MediaType.APPLICATION_JSON)
    public StreamListResponse getByIndexSet(@ApiParam(name = "indexSetId", required = true)
                                            @PathParam("indexSetId") @NotEmpty String indexSetId) {
        checkPermission(RestPermissions.INDEXSETS_READ, indexSetId);
        final List<Stream> streams = streamService.loadAll().stream()
                .filter(stream -> stream.getIndexSetId().equals(indexSetId))
                .toList();

        return StreamListResponse.create(streams.size(), streams.stream().map(this::streamToResponse).collect(Collectors.toSet()));
    }

    @GET
    @Path("/enabled")
    @Timed
    @ApiOperation(value = "Get a list of all enabled streams")
    @Produces(MediaType.APPLICATION_JSON)
    public StreamListResponse getEnabled() {
        final List<Stream> streams = streamService.loadAllEnabled()
                .stream()
                .filter(stream -> isPermitted(RestPermissions.STREAMS_READ, stream.getId()))
                .toList();

        return StreamListResponse.create(streams.size(), streams.stream().map(this::streamToResponse).collect(Collectors.toSet()));
    }

    @GET
    @Path("/{streamId}")
    @Timed
    @ApiOperation(value = "Get a single stream")
    @Produces(MediaType.APPLICATION_JSON)
    @ApiResponses(value = {
            @ApiResponse(code = 404, message = "Stream not found."),
            @ApiResponse(code = 400, message = "Invalid ObjectId.")
    })
    public StreamResponse get(@ApiParam(name = "streamId", required = true)
                              @PathParam("streamId") @NotEmpty String streamId) throws NotFoundException {
        checkPermission(RestPermissions.STREAMS_READ, streamId);

        return streamToResponse(streamService.load(streamId));
    }

    @PUT
    @Timed
    @Path("/{streamId}")
    @ApiOperation(value = "Update a stream")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @ApiResponses(value = {
            @ApiResponse(code = 404, message = "Stream not found."),
            @ApiResponse(code = 400, message = "Invalid ObjectId.")
    })
    @AuditEvent(type = AuditEventTypes.STREAM_UPDATE)
    public StreamResponse update(@ApiParam(name = "streamId", required = true)
                                 @PathParam("streamId") String streamId,
                                 @ApiParam(name = "JSON body", required = true)
                                 @Valid @NotNull UpdateStreamRequest request,
                                 @Context UserContext userContext) throws NotFoundException, ValidationException {
        checkPermission(RestPermissions.STREAMS_EDIT, streamId);
        checkNotEditableStream(streamId, "The stream cannot be edited.");

        final Stream stream = streamService.update(streamId, request);

        recentActivityService.update(streamId, GRNTypes.STREAM, userContext.getUser());
        return streamToResponse(stream);
    }

    @DELETE
    @Path("/{streamId}")
    @Timed
    @ApiOperation(value = "Delete a stream")
    @ApiResponses(value = {
            @ApiResponse(code = 404, message = "Stream not found."),
            @ApiResponse(code = 400, message = "Invalid ObjectId.")
    })
    @AuditEvent(type = AuditEventTypes.STREAM_DELETE)
    public void delete(@ApiParam(name = "streamId", required = true) @PathParam("streamId") String streamId,
                       @Context UserContext userContext) throws NotFoundException {
        deleteInner(streamId, userContext);
    }

    private Stream deleteInner(String streamId, UserContext userContext) throws NotFoundException {
        checkPermission(RestPermissions.STREAMS_EDIT, streamId);
        checkNotEditableStream(streamId, "The stream cannot be deleted.");

        final Stream stream = streamService.load(streamId);

        try {
            streamService.destroy(stream);
        } catch (StreamGuardException e) {
            throw new BadRequestException(e.getMessage());
        }
        recentActivityService.delete(streamId, GRNTypes.STREAM, stream.getTitle(), userContext.getUser());

        return stream;
    }

    @POST
    @Path("/bulk_delete")
    @Consumes(MediaType.APPLICATION_JSON)
    @Timed
    @ApiOperation(value = "Delete a bulk of streams", response = BulkOperationResponse.class)
    @NoAuditEvent("Audit events triggered manually")
    public Response bulkDelete(@ApiParam(name = "Entities to remove", required = true) final BulkOperationRequest bulkOperationRequest,
                               @Context final UserContext userContext) {

        final BulkOperationResponse response = bulkStreamDeleteExecutor.executeBulkOperation(
                bulkOperationRequest,
                userContext,
                new AuditParams(AuditEventTypes.STREAM_DELETE, "streamId", Stream.class));

        return Response.status(Response.Status.OK)
                .entity(response)
                .build();
    }

    @POST
    @Path("/bulk_pause")
    @Consumes(MediaType.APPLICATION_JSON)
    @Timed
    @ApiOperation(value = "Pause a bulk of streams", response = BulkOperationResponse.class)
    @NoAuditEvent("Audit events triggered manually")
    public Response bulkPause(@ApiParam(name = "Streams to pause", required = true) final BulkOperationRequest bulkOperationRequest,
                              @Context final UserContext userContext) {

        final BulkOperationResponse response = bulkStreamStopExecutor.executeBulkOperation(
                bulkOperationRequest,
                userContext,
                new AuditParams(AuditEventTypes.STREAM_STOP, "streamId", Stream.class));

        return Response.status(Response.Status.OK)
                .entity(response)
                .build();
    }

    @POST
    @Path("/bulk_resume")
    @Consumes(MediaType.APPLICATION_JSON)
    @Timed
    @ApiOperation(value = "Resume a bulk of streams", response = BulkOperationResponse.class)
    @NoAuditEvent("Audit events triggered manually")
    public Response bulkResume(@ApiParam(name = "Streams to resume", required = true) final BulkOperationRequest bulkOperationRequest,
                               @Context final UserContext userContext) {

        final BulkOperationResponse response = bulkStreamStartExecutor.executeBulkOperation(
                bulkOperationRequest,
                userContext,
                new AuditParams(AuditEventTypes.STREAM_START, "streamId", Stream.class));

        return Response.status(Response.Status.OK)
                .entity(response)
                .build();
    }

    @POST
    @Path("/{streamId}/pause")
    @Timed
    @ApiOperation(value = "Pause a stream")
    @ApiResponses(value = {
            @ApiResponse(code = 404, message = "Stream not found."),
            @ApiResponse(code = 400, message = "Invalid or missing Stream id.")
    })
    @AuditEvent(type = AuditEventTypes.STREAM_STOP)
    public void pause(@ApiParam(name = "streamId", required = true)
                      @PathParam("streamId") @NotEmpty String streamId) throws NotFoundException, ValidationException {
        pauseInner(streamId, null);
    }

    private Stream pauseInner(String streamId, UserContext userContext) throws NotFoundException, ValidationException {
        checkAnyPermission(new String[]{RestPermissions.STREAMS_CHANGESTATE, RestPermissions.STREAMS_EDIT}, streamId);
        checkNotEditableStream(streamId, "The stream cannot be paused.");

        final Stream stream = streamService.load(streamId);
        streamService.pause(stream);
        return stream;
    }

    @POST
    @Path("/{streamId}/resume")
    @Timed
    @ApiOperation(value = "Resume a stream")
    @ApiResponses(value = {
            @ApiResponse(code = 404, message = "Stream not found."),
            @ApiResponse(code = 400, message = "Invalid or missing Stream id.")
    })
    @AuditEvent(type = AuditEventTypes.STREAM_START)
    public void resume(@ApiParam(name = "streamId", required = true)
                       @PathParam("streamId") @NotEmpty String streamId,
                       @Context UserContext userContext) throws NotFoundException, ValidationException {
        resumeInner(streamId, null);
    }

    private Stream resumeInner(String streamId, UserContext userContext) throws NotFoundException, ValidationException {
        checkAnyPermission(new String[]{RestPermissions.STREAMS_CHANGESTATE, RestPermissions.STREAMS_EDIT}, streamId);
        checkNotEditableStream(streamId, "The stream cannot be resumed.");

        final Stream stream = streamService.load(streamId);
        streamService.resume(stream);
        return stream;
    }

    @POST
    @Path("/{streamId}/testMatch")
    @Timed
    @ApiOperation(value = "Test matching of a stream against a supplied message")
    @ApiResponses(value = {
            @ApiResponse(code = 404, message = "Stream not found."),
            @ApiResponse(code = 400, message = "Invalid or missing Stream id.")
    })
    @NoAuditEvent("only used for testing stream matches")
    public TestMatchResponse testMatch(@ApiParam(name = "streamId", required = true)
                                       @PathParam("streamId") String streamId,
                                       @ApiParam(name = "JSON body", required = true)
                                       @NotNull Map<String, Map<String, Object>> serialisedMessage) throws NotFoundException {
        checkPermission(RestPermissions.STREAMS_READ, streamId);

        final Stream stream = streamService.load(streamId);
        // This is such a hack...
        final Map<String, Object> m = new HashMap<>(serialisedMessage.get("message"));
        final String timeStamp = firstNonNull((String) m.get(Message.FIELD_TIMESTAMP),
                DateTime.now(DateTimeZone.UTC).toString(ISODateTimeFormat.dateTime()));
        m.put(Message.FIELD_TIMESTAMP, Tools.dateTimeFromString(timeStamp));
        final Message message = messageFactory.createMessage(m);

        final ExecutorService executor = Executors.newSingleThreadExecutor(
                new ThreadFactoryBuilder()
                        .setNameFormat("stream-" + streamId + "-test-match-%d")
                        .build()
        );
        final StreamRouterEngine streamRouterEngine = streamRouterEngineFactory.create(Lists.newArrayList(stream), executor);
        final List<StreamRouterEngine.StreamTestMatch> streamTestMatches = streamRouterEngine.testMatch(message);
        final StreamRouterEngine.StreamTestMatch streamTestMatch = streamTestMatches.get(0);

        final Map<String, Boolean> rules = Maps.newHashMap();

        for (Map.Entry<StreamRule, Boolean> match : streamTestMatch.getMatches().entrySet()) {
            rules.put(match.getKey().getId(), match.getValue());
        }

        return TestMatchResponse.create(streamTestMatch.isMatched(), rules);
    }

    @POST
    @Path("/{streamId}/clone")
    @Timed
    @ApiOperation(value = "Clone a stream", response = StreamCreatedResponse.class)
    @ApiResponses(value = {
            @ApiResponse(code = 404, message = "Stream not found."),
            @ApiResponse(code = 400, message = "Invalid or missing Stream id.")
    })
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @AuditEvent(type = AuditEventTypes.STREAM_CREATE)
    public Response cloneStream(@ApiParam(name = "streamId", required = true) @PathParam("streamId") String streamId,
                                @ApiParam(name = "JSON body", required = true) @Valid @NotNull CloneStreamRequest cr,
                                @Context UserContext userContext) throws ValidationException, NotFoundException {
        checkPermission(RestPermissions.STREAMS_CREATE);
        checkPermission(RestPermissions.STREAMS_READ, streamId);
        checkNotEditableStream(streamId, "The stream cannot be cloned.");

        final Stream sourceStream = streamService.load(streamId);
        final String creatorUser = getCurrentUser().getName();

        final List<StreamRule> sourceStreamRules = streamRuleService.loadForStream(sourceStream);
        final Set<StreamRule> newStreamRules = sourceStreamRules
                .stream()
                .map(streamRule -> streamRuleService.copy(null, streamRule))
                .collect(Collectors.toSet());

        final Stream stream = StreamImpl.builder()
                .id(new ObjectId().toHexString())
                .title(cr.title().strip())
                .description(cr.description())
                .creatorUserId(creatorUser)
                .createdAt(Tools.nowUTC())
                .matchingType(sourceStream.getMatchingType())
                .removeMatchesFromDefaultStream(cr.removeMatchesFromDefaultStream())
                .disabled(true)
                .indexSetId(cr.indexSetId())
                .build();

        final String savedStreamId = streamService.saveWithRulesAndOwnership(stream, newStreamRules, userContext.getUser());
        final ObjectId savedStreamObjectId = new ObjectId(savedStreamId);

        streamService.addOutputs(savedStreamObjectId, sourceStream.getOutputIds());

        entitySharesService.cloneEntityGrants(GRNTypes.STREAM, streamId, savedStreamId, userContext.getUser());

        var result = new StreamCreatedResponse(savedStreamId);
        final URI streamUri = getUriBuilderToSelf().path(StreamResource.class)
                .path("{streamId}")
                .build(savedStreamId);

        return Response.created(streamUri).entity(result).build();
    }

    @GET
    @Path("/{streamId}/pipelines")
    @ApiOperation(value = "Get pipelines associated with a stream")
    @Produces(MediaType.APPLICATION_JSON)
    public List<PipelineCompactSource> getConnectedPipelines(@ApiParam(name = "streamId", required = true) @PathParam("streamId") String streamId) throws NotFoundException {
        if (!isPermitted(RestPermissions.STREAMS_READ, streamId)) {
            throw new ForbiddenException("Not allowed to read configuration for stream with id: " + streamId);
        }

        PipelineConnections pipelineConnections = pipelineStreamConnectionsService.load(streamId);
        List<PipelineCompactSource> list = new ArrayList<>();

        for (String id : pipelineConnections.pipelineIds()) {
            PipelineDao pipelineDao = pipelineService.load(id);
            list.add(PipelineCompactSource.create(pipelineDao.id(), pipelineDao.title()));
        }
        return list;
    }

    public record GetConnectedPipelinesRequest(List<String> streamIds) {}

    @POST
    @Path("/pipelines")
    @ApiOperation(value = "Get pipelines associated with specified streams")
    @NoAuditEvent("No data is changed.")
    @Produces(MediaType.APPLICATION_JSON)
    public Map<String, List<PipelineCompactSource>> getConnectedPipelinesForStreams(@ApiParam(name = "streamIds", required = true) GetConnectedPipelinesRequest request) {
        final var streamIds = request.streamIds.stream()
                .filter(streamId -> {
                    if (!isPermitted(RestPermissions.STREAMS_READ, streamId)) {
                        throw new ForbiddenException("Not allowed to read configuration for stream with id: " + streamId);
                    }
                    return true;
                })
                .collect(Collectors.toSet());

        final var pipelineConnections = pipelineStreamConnectionsService.loadByStreamIds(streamIds);
        final var pipelineIds = pipelineConnections.values().stream()
                .flatMap(connection -> connection.pipelineIds().stream())
                .collect(Collectors.toSet());
        final var pipelines = pipelineService.loadByIds(pipelineIds).stream()
                .collect(Collectors.toMap(MongoEntity::id, pipeline -> pipeline));
        return request.streamIds().stream()
                .collect(Collectors.toMap(streamId -> streamId, streamId -> {
                    final var pipelinesForStream = Optional.ofNullable(pipelineConnections.get(streamId))
                            .map(PipelineConnections::pipelineIds)
                            .orElse(Set.of());
                    return pipelinesForStream.stream()
                            .flatMap(pipeline -> Optional.ofNullable(pipelines.get(pipeline)).stream())
                            .map(pipeline -> PipelineCompactSource.create(pipeline.id(), pipeline.title()))
                            .toList();
                }));
    }

    @PUT
    @Path("/indexSet/{indexSetId}")
    @Timed
    @ApiOperation(value = "Assign multiple streams to index set")
    @ApiResponses(value = {
            @ApiResponse(code = 404, message = "Index set not found.")
    })
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @AuditEvent(type = AuditEventTypes.STREAM_UPDATE)
    public Response assignToIndexSet(@ApiParam(name = "indexSetId", required = true) @PathParam("indexSetId") String indexSetId,
                                     @ApiParam(name = "JSON body", required = true) @Valid @NotNull List<String> streamIds) {
        checkPermission(RestPermissions.INDEXSETS_READ, indexSetId);
        streamIds.forEach(streamId -> {
            checkPermission(RestPermissions.STREAMS_EDIT, streamId);
            checkNotEditableStream(streamId, "The stream with id <" + streamId + "> cannot be edited.");
        });

        final Set<String> existingStreams;
        try (var stream = streamService.streamDTOByIds(streamIds)) {
            existingStreams = stream.map(Stream::getId).collect(Collectors.toSet());
        }

        final Set<String> missingStreams = Sets.difference(new HashSet<>(streamIds), existingStreams);

        if (!missingStreams.isEmpty()) {
            return Response.status(Response.Status.NOT_FOUND).entity("Missing streams: " + missingStreams).build();
        }

        return indexSetRegistry.get(indexSetId)
                .map(indexSet -> {
                    checkIndexSet(indexSet);

                    streamService.addToIndexSet(indexSetId, streamIds);
                    return Response.ok().build();
                })
                .orElse(Response.status(Response.Status.NOT_FOUND).build());
    }

    private void checkIndexSet(IndexSet indexSet) {
        if (!indexSet.getConfig().isWritable()) {
            throw new BadRequestException("Assigned index set must be writable!");
        } else if (!indexSet.getConfig().isRegularIndex()) {
            throw new BadRequestException("Assigned index set is not usable");
        }
    }

    private StreamResponse streamToResponse(Stream stream) {
        return StreamResponse.create(
                stream.getId(),
                stream.getCreatorUserId(),
                outputsToSummaries(stream.getOutputs()),
                stream.getMatchingType().name(),
                stream.getDescription(),
                stream.getCreatedAt().toString(),
                stream.getDisabled(),
                stream.getStreamRules(),
                stream.getTitle(),
                stream.getContentPack(),
                stream.isDefaultStream(),
                stream.getRemoveMatchesFromDefaultStream(),
                stream.getIndexSetId(),
                stream.getCategories()
        );
    }

    private StreamDTOResponse dtoToResponse(Stream stream) {
        return new StreamDTOResponse(stream.getId(),
                stream.getCreatorUserId(),
                stream.getOutputIds(),
                stream.getMatchingType(),
                stream.getDescription(),
                stream.getCreatedAt(),
                stream.getStreamRules(),
                stream.getDisabled(),
                stream.getTitle(),
                stream.getContentPack(),
                firstNonNull(stream.isDefaultStream(), false),
                stream.getRemoveMatchesFromDefaultStream(),
                stream.getIndexSetId(),
                Stream.streamIsEditable(stream.getId()),
                stream.getCategories()
        );
    }

    private Collection<OutputSummary> outputsToSummaries(Collection<Output> outputs) {
        return outputs.stream()
                .map(output -> OutputSummary.create(output.getId(), output.getTitle(), output.getType(),
                        output.getCreatorUserId(), new DateTime(output.getCreatedAt()), output.getConfiguration(), output.getContentPack()))
                .collect(Collectors.toSet());
    }

    private void checkNotEditableStream(String streamId, String message) {
        if (Stream.DEFAULT_STREAM_ID.equals(streamId) || !Stream.streamIsEditable(streamId)) {
            throw new BadRequestException(message);
        }
    }
}
