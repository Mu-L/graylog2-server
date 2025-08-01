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
package org.graylog.events.processor;

import com.mongodb.client.model.Filters;
import jakarta.inject.Inject;
import jakarta.inject.Provider;
import org.bson.conversions.Bson;
import org.graylog.events.event.Event;
import org.graylog.events.event.EventWithContext;
import org.graylog.events.notifications.EventNotificationExecutionJob;
import org.graylog.grn.GRNTypes;
import org.graylog.scheduler.DBJobDefinitionService;
import org.graylog.scheduler.DBJobTriggerService;
import org.graylog.scheduler.JobDefinitionDto;
import org.graylog.scheduler.JobTriggerDto;
import org.graylog.scheduler.clock.JobSchedulerClock;
import org.graylog.security.shares.EntitySharesService;
import org.graylog2.database.entities.DefaultEntityScope;
import org.graylog2.database.entities.NonDeletableSystemScope;
import org.graylog2.events.ClusterEventBus;
import org.graylog2.plugin.database.users.User;
import org.joda.time.DateTime;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Supplier;

import static java.util.Objects.requireNonNull;

/**
 * Handles event definitions and creates scheduler job definitions and job triggers.
 *
 * <b>Caveat:</b> These handlers modify different database documents without using any transactions. That means we can
 * run into concurrency issues and partial operations.
 *
 * TODO: Make use of transactions once our database library supports it
 */
public class EventDefinitionHandler {
    private static final Logger LOG = LoggerFactory.getLogger(EventDefinitionHandler.class);

    private final DBEventDefinitionService eventDefinitionService;
    private final DBJobDefinitionService jobDefinitionService;
    private final DBJobTriggerService jobTriggerService;
    private final ClusterEventBus clusterEventBus;

    // Provider to avoid circular dependency
    private final Provider<EntitySharesService> entitySharesServiceProvider;

    private final JobSchedulerClock clock;

    @Inject
    public EventDefinitionHandler(DBEventDefinitionService eventDefinitionService,
                                  DBJobDefinitionService jobDefinitionService,
                                  DBJobTriggerService jobTriggerService,
                                  Provider<EntitySharesService> entitySharesServiceProvider,
                                  JobSchedulerClock clock,
                                  ClusterEventBus clusterEventBus) {
        this.eventDefinitionService = eventDefinitionService;
        this.jobDefinitionService = jobDefinitionService;
        this.jobTriggerService = jobTriggerService;
        this.entitySharesServiceProvider = entitySharesServiceProvider;
        this.clock = clock;
        this.clusterEventBus = clusterEventBus;
    }

    /**
     * Creates a new event definition and a corresponding scheduler job definition and trigger.
     *
     * @param unsavedEventDefinition the event definition to save
     * @param user                   the user who created this eventDefinition. If empty, no ownership will be registered.
     * @return the created event definition
     */
    public EventDefinitionDto create(EventDefinitionDto unsavedEventDefinition, Optional<User> user) {
        final EventDefinitionDto eventDefinition = createEventDefinition(unsavedEventDefinition, user);

        try {
            createJobDefinitionAndTriggerIfScheduledType(eventDefinition);
        } catch (Exception e) {
            // Cleanup if anything goes wrong
            LOG.error("Removing event definition <{}/{}> because of an error creating the job definition",
                    eventDefinition.id(), eventDefinition.title(), e);
            eventDefinitionService.delete(eventDefinition.id());
            throw e;
        }

        return eventDefinition;
    }

    /**
     * Duplicates an existing event definition.
     * The new copy will be disabled by default and will have the {@link DefaultEntityScope}.
     * Also the title will be prefixed with the string "COPY-".
     *
     * @param eventDefinition the event definition to copy
     * @param user            the user who copied this eventDefinition. If empty, no ownership will be registered.
     * @return the newly created event definition
     */
    public EventDefinitionDto duplicate(EventDefinitionDto eventDefinition, User user) {
        var copy = eventDefinition.toBuilder()
                .id(null)
                .title("COPY-" + eventDefinition.title())
                .remediationSteps(eventDefinition.remediationSteps())
                .scope(DefaultEntityScope.NAME)
                .state(EventDefinition.State.DISABLED)
                .build();

        EventDefinitionDto copyDto = createWithoutSchedule(copy, Optional.of(user));
        entitySharesServiceProvider.get().cloneEntityGrants(GRNTypes.EVENT_DEFINITION, eventDefinition.id(), copyDto.id(), user);

        return copyDto;
    }

    /**
     * Creates a new event definition without scheduling it. Normally the {@link #create(EventDefinitionDto, Optional<User>)} method
     * should be used to ensure proper scheduling of the event definition. In some cases new event definitions
     * must be created without a schedule, though. (e.g. content packs)
     *
     * @param unsavedEventDefinition the event definition to save
     * @return the created event definition
     */
    public EventDefinitionDto createWithoutSchedule(EventDefinitionDto unsavedEventDefinition, Optional<User> user) {
        return createEventDefinition(unsavedEventDefinition, user);
    }

    /**
     * Updates an existing event definition and its corresponding scheduler job definition and trigger.
     *
     * @param updatedEventDefinition the event definition to update
     * @return the updated event definition
     */
    public EventDefinitionDto update(EventDefinitionDto updatedEventDefinition, boolean schedule) {
        // Grab the old record so we can revert to it if something goes wrong
        final Optional<EventDefinitionDto> oldEventDefinition = eventDefinitionService.get(updatedEventDefinition.id());

        final EventDefinitionDto eventDefinition = updateEventDefinition(updatedEventDefinition);

        try {
            if (schedule) {
                if (getJobDefinition(eventDefinition).isPresent()) {
                    updateJobDefinitionAndTriggerIfScheduledType(eventDefinition);
                } else {
                    createJobDefinitionAndTriggerIfScheduledType(eventDefinition);
                }
            } else {
                unschedule(eventDefinition.id());
            }
        } catch (Exception e) {
            // Cleanup if anything goes wrong
            LOG.error("Reverting to old event definition <{}/{}> because of an error updating the job definition",
                    eventDefinition.id(), eventDefinition.title(), e);
            oldEventDefinition.ifPresent(eventDefinitionService::save);
            throw e;
        }

        clusterEventBus.post(new EventDefinitionUpdated(updatedEventDefinition.id()));
        return eventDefinition;
    }

    /**
     * Update the timestamp of last match based on given list of events (which may include events for
     * multiple event definitions).
     * Does not change the updatedAt timestamp.
     *
     * @param eventsList list of events that successfully matched
     */
    public void updateLastMatched(List<EventWithContext> eventsList) {
        Map<String, DateTime> lastMatched = new HashMap<>();
        for (EventWithContext eventWithContext : eventsList) {
            Event currEvent = eventWithContext.event();
            if (lastMatched.containsKey(currEvent.getId())) {
                if (currEvent.getEventTimestamp().isAfter(lastMatched.get(currEvent.getEventDefinitionId()))) {
                    lastMatched.put(currEvent.getEventDefinitionId(), currEvent.getEventTimestamp());
                }
            } else {
                lastMatched.put(currEvent.getEventDefinitionId(), currEvent.getEventTimestamp());
            }
        }

        lastMatched.keySet().forEach(id -> eventDefinitionService.updateMatchedAt(id, lastMatched.get(id)));
    }

    /**
     * Deletes an existing event definition and its corresponding scheduler job definition and trigger.
     *
     * @param eventDefinitionId the event definition to delete
     * @return true if the event definition got deleted, false otherwise
     */
    public boolean delete(String eventDefinitionId) {
        return doDelete(eventDefinitionId,
                () -> eventDefinitionService.deleteUnregister(eventDefinitionId) > 0);
    }

    /**
     * Deletes an existing immutable event definition and its corresponding scheduler job definition and trigger.
     * Do not call this method for API requests. Only call from <link>{@link org.graylog.events.contentpack.facade.EventDefinitionFacade}</link>.
     *
     * @param eventDefinitionId the event definition to delete
     * @return true if the event definition got deleted, false otherwise
     */
    public boolean deleteImmutable(String eventDefinitionId) {
        return doDelete(eventDefinitionId,
                () -> eventDefinitionService.deleteUnregisterImmutable(eventDefinitionId) > 0);
    }

    private boolean doDelete(String eventDefinitionId, Supplier<Boolean> deleteSupplier) {
        final Optional<EventDefinitionDto> optionalEventDefinition = eventDefinitionService.get(eventDefinitionId);
        if (optionalEventDefinition.isEmpty()) {
            return false;
        }

        final EventDefinitionDto eventDefinition = optionalEventDefinition.get();

        getJobDefinition(eventDefinition)
                .ifPresent(jobDefinition -> deleteJobDefinitionAndTrigger(jobDefinition, eventDefinition));

        clusterEventBus.post(new EventDefinitionDeleted(eventDefinitionId));
        LOG.debug("Deleting event definition <{}/{}>", eventDefinition.id(), eventDefinition.title());
        return deleteSupplier.get();
    }

    /**
     * Creates a job definition and a trigger to schedule the given event definition.
     *
     * @param eventDefinitionId the event definition to schedule
     */
    public void schedule(String eventDefinitionId) {
        final EventDefinitionDto eventDefinition = getEventDefinitionOrThrowIAE(eventDefinitionId);

        createJobDefinitionAndTriggerIfScheduledType(eventDefinition);
    }

    /**
     * Removes job definition and trigger for the given event definition to disable it.
     *
     * @param eventDefinitionId the event definition to unschedule
     */
    public void unschedule(String eventDefinitionId) {
        final EventDefinitionDto eventDefinition = getEventDefinitionOrThrowIAE(eventDefinitionId);

        if (NonDeletableSystemScope.NAME.equals(eventDefinition.scope())) {
            LOG.debug("Ignoring disable for system notification events");
            return;
        }

        getJobDefinition(eventDefinition)
                .ifPresent(jobDefinition -> deleteJobDefinitionAndTrigger(jobDefinition, eventDefinition));
        eventDefinitionService.updateState(eventDefinitionId, EventDefinition.State.DISABLED);
    }

    /**
     * Deletes notification triggers for this event.
     * <p>
     * This mostly serves as a safety net, when a misconfiguration has lead to a high number of outstanding
     * notifications.
     * <p>
     * Processing these notifications would unnecessarily block the job scheduler and in some cases consume a lot of
     * resources.
     */
    public void deleteNotificationJobTriggers(String eventDefinitionId) {
        deleteNotificationJobTriggers(getEventDefinitionOrThrowIAE(eventDefinitionId));
    }

    private EventDefinitionDto createEventDefinition(EventDefinitionDto unsavedEventDefinition, Optional<User> user) {
        EventDefinitionDto eventDefinition;
        if (user.isPresent()) {
            eventDefinition = eventDefinitionService.saveWithOwnership(unsavedEventDefinition, user.get());
            LOG.debug("Created event definition <{}/{}> with user <{}>", eventDefinition.id(), eventDefinition.title(), user.get());
        } else {
            eventDefinition = eventDefinitionService.save(unsavedEventDefinition);
            LOG.debug("Created event definition <{}/{}> without user", eventDefinition.id(), eventDefinition.title());
        }
        return eventDefinition;
    }

    private EventDefinitionDto getEventDefinitionOrThrowIAE(String eventDefinitionId) {
        return eventDefinitionService.get(eventDefinitionId)
                .orElseThrow(() -> new IllegalArgumentException("Event definition <" + eventDefinitionId + "> doesn't exist"));
    }

    private EventDefinitionDto updateEventDefinition(EventDefinitionDto updatedEventDefinition) {
        final EventDefinitionDto eventDefinition = eventDefinitionService.save(updatedEventDefinition);
        LOG.debug("Updated event definition <{}/{}>", eventDefinition.id(), eventDefinition.title());
        return eventDefinition;
    }

    private JobDefinitionDto newJobDefinition(EventDefinitionDto eventDefinition, EventProcessorSchedulerConfig schedulerConfig) {
        return JobDefinitionDto.builder()
                .title(eventDefinition.title())
                .description(eventDefinition.description())
                .config(schedulerConfig.jobDefinitionConfig())
                .build();
    }

    private JobDefinitionDto createJobDefinition(EventDefinitionDto eventDefinition, EventProcessorSchedulerConfig schedulerConfig) {
        final JobDefinitionDto jobDefinition = jobDefinitionService.save(newJobDefinition(eventDefinition, schedulerConfig));
        LOG.debug("Created scheduler job definition <{}/{}> for event definition <{}/{}>", jobDefinition.id(),
                jobDefinition.title(), eventDefinition.id(), eventDefinition.title());
        return jobDefinition;
    }

    private void createJobDefinitionAndTrigger(EventDefinitionDto eventDefinition,
                                               EventProcessorSchedulerConfig schedulerConfig) {
        if (getJobDefinition(eventDefinition).isPresent()) {
            LOG.warn("Not creating a second job definition for EventDefinition <{}>", eventDefinition);
            return;
        }

        final JobDefinitionDto jobDefinition = createJobDefinition(eventDefinition, schedulerConfig);
        try {
            createJobTrigger(eventDefinition, jobDefinition, schedulerConfig);
        } catch (Exception e) {
            // Cleanup if anything goes wrong
            LOG.error("Removing job definition <{}/{}> because of an error creating the job trigger",
                    jobDefinition.id(), jobDefinition.title(), e);
            jobDefinitionService.delete(jobDefinition.id());
            throw e;
        }
    }

    private void createJobDefinitionAndTriggerIfScheduledType(EventDefinitionDto eventDefinition) {
        getJobSchedulerConfig(eventDefinition)
                .ifPresent(schedulerConfig -> createJobDefinitionAndTrigger(eventDefinition, schedulerConfig));
        eventDefinitionService.updateState(eventDefinition.id(), EventDefinition.State.ENABLED);
    }

    private Optional<JobDefinitionDto> getJobDefinition(EventDefinitionDto eventDefinition) {
        return jobDefinitionService.getByConfigField(EventProcessorExecutionJob.Config.FIELD_EVENT_DEFINITION_ID, eventDefinition.id());
    }

    private JobDefinitionDto getJobDefinitionOrThrowISE(EventDefinitionDto eventDefinition) {
        return getJobDefinition(eventDefinition)
                .orElseThrow(() -> new IllegalStateException("Couldn't find job definition for event definition <" + eventDefinition.id() + ">"));
    }

    private JobDefinitionDto updateJobDefinition(EventDefinitionDto eventDefinition,
                                                 JobDefinitionDto oldJobDefinition,
                                                 EventProcessorSchedulerConfig schedulerConfig) {
        // Update the existing object to make sure we keep the ID
        final JobDefinitionDto unsavedJobDefinition = oldJobDefinition.toBuilder()
                .title(eventDefinition.title())
                .description(eventDefinition.description())
                .config(schedulerConfig.jobDefinitionConfig())
                .build();

        final JobDefinitionDto jobDefinition = jobDefinitionService.save(unsavedJobDefinition);

        LOG.debug("Updated scheduler job definition <{}/{}> for event definition <{}/{}>", jobDefinition.id(),
                jobDefinition.title(), eventDefinition.id(), eventDefinition.title());

        return jobDefinition;
    }

    private void updateJobDefinitionAndTrigger(EventDefinitionDto eventDefinition,
                                               EventProcessorSchedulerConfig schedulerConfig) {
        // Grab the old record so we can revert to it if something goes wrong
        final JobDefinitionDto oldJobDefinition = getJobDefinitionOrThrowISE(eventDefinition);

        final JobDefinitionDto jobDefinition = updateJobDefinition(eventDefinition, oldJobDefinition, schedulerConfig);

        try {
            updateJobTrigger(eventDefinition, jobDefinition, oldJobDefinition, schedulerConfig);
        } catch (Exception e) {
            // Cleanup if anything goes wrong
            LOG.error("Reverting to old job definition <{}/{}> because of an error updating the job trigger",
                    jobDefinition.id(), jobDefinition.title(), e);
            jobDefinitionService.save(oldJobDefinition);
            throw e;
        }
    }

    private void updateJobDefinitionAndTriggerIfScheduledType(EventDefinitionDto eventDefinition) {
        getJobSchedulerConfig(eventDefinition)
                .ifPresent(schedulerConfig -> updateJobDefinitionAndTrigger(eventDefinition, schedulerConfig));
    }

    private void deleteJobDefinition(JobDefinitionDto jobDefinition, EventDefinitionDto eventDefinition) {
        LOG.debug("Deleting job definition <{}/{}> for event definition <{}/{}>", jobDefinition.id(),
                jobDefinition.title(), eventDefinition.id(), eventDefinition.title());
        jobDefinitionService.delete(jobDefinition.id());
    }

    private void deleteJobDefinitionAndTrigger(JobDefinitionDto jobDefinition, EventDefinitionDto eventDefinition) {
        deleteJobTrigger(jobDefinition, eventDefinition);
        deleteNotificationJobTriggers(eventDefinition);
        deleteJobDefinition(jobDefinition, eventDefinition);
    }

    private void deleteNotificationJobTriggers(EventDefinitionDto eventDefinition) {
        final Bson query = Filters.and(
                Filters.eq("data.type", EventNotificationExecutionJob.TYPE_NAME),
                Filters.eq("data.event_dto.event_definition_id", eventDefinition.id()));

        final int numberOfDeletedTriggers = jobTriggerService.deleteByQuery(query);

        if (numberOfDeletedTriggers > 0) {
            LOG.info("Deleted {} notification triggers for event definition <{}/{}>.",
                    numberOfDeletedTriggers, eventDefinition.id(), eventDefinition.title());
        }
    }

    private JobTriggerDto newJobTrigger(JobDefinitionDto jobDefinition, EventProcessorSchedulerConfig schedulerConfig) {
        return JobTriggerDto.builderWithClock(clock)
                .jobDefinitionType(EventProcessorExecutionJob.TYPE_NAME)
                .jobDefinitionId(requireNonNull(jobDefinition.id(), "Job definition ID cannot be null"))
                .nextTime(clock.nowUTC())
                .schedule(schedulerConfig.schedule())
                .build();
    }

    private void createJobTrigger(EventDefinitionDto dto, JobDefinitionDto jobDefinition, EventProcessorSchedulerConfig schedulerConfig) {
        final JobTriggerDto jobTrigger = jobTriggerService.create(newJobTrigger(jobDefinition, schedulerConfig));
        LOG.debug("Created job trigger <{}> for job definition <{}/{}> and event definition <{}/{}>", jobTrigger.id(),
                jobDefinition.id(), jobDefinition.title(), dto.id(), dto.title());
    }

    private Optional<JobTriggerDto> getJobTrigger(JobDefinitionDto jobDefinition) {
        // DBJobTriggerService#getOneForJob currently returns only one trigger. (raises an exception otherwise)
        // Once we allow multiple triggers per job definition, this code will fail. We need some kind of label
        // to figure out which trigger was created automatically. (e.g. event processor)
        // TODO: Fix this code for multiple triggers per job definition
        return jobTriggerService.getOneForJob(jobDefinition.id());
    }

    private void updateJobTrigger(EventDefinitionDto eventDefinition,
                                  JobDefinitionDto jobDefinition,
                                  JobDefinitionDto oldJobDefinition,
                                  EventProcessorSchedulerConfig schedulerConfig) {
        final Optional<JobTriggerDto> optionalOldJobTrigger = getJobTrigger(jobDefinition);
        if (optionalOldJobTrigger.isEmpty()) {
            // Nothing to do if there are no job triggers to update
            return;
        }

        final JobTriggerDto oldJobTrigger = optionalOldJobTrigger.get();

        // Update the existing object to make sure we keep the ID
        final JobTriggerDto.Builder unsavedJobTriggerBuilder = oldJobTrigger.toBuilder()
                .jobDefinitionId(requireNonNull(jobDefinition.id(), "Job definition ID cannot be null"))
                .schedule(schedulerConfig.schedule())
                .nextTime(clock.nowUTC());

        final EventProcessorExecutionJob.Config oldConfig = (EventProcessorExecutionJob.Config) oldJobDefinition.config();
        final EventProcessorExecutionJob.Config config = (EventProcessorExecutionJob.Config) jobDefinition.config();
        // If necessary, reset the scheduling times
        if (!config.hasEqualSchedule(oldConfig)) {
            // jobDefinition has a newly created scheduling timerange.
            // Wipe the old one so EventProcessorExecutionJob.execute()
            // will fall back to the new one from the JobDefinition.
            unsavedJobTriggerBuilder.data(null);
            // schedule the next execution accordingly
            unsavedJobTriggerBuilder.nextTime(config.parameters().timerange().getTo());
        }

        final JobTriggerDto jobTrigger = unsavedJobTriggerBuilder.build();
        jobTriggerService.update(jobTrigger);
        LOG.debug("Updated scheduler job trigger <{}> for job definition <{}/{}> and event definition <{}/{}>",
                jobTrigger.id(), jobDefinition.id(), jobDefinition.title(), eventDefinition.id(), eventDefinition.title());
    }

    private void deleteJobTrigger(JobDefinitionDto jobDefinition, EventDefinitionDto eventDefinition) {
        final Optional<JobTriggerDto> optionalJobTrigger = getJobTrigger(jobDefinition);
        if (optionalJobTrigger.isEmpty()) {
            return;
        }

        final JobTriggerDto jobTrigger = optionalJobTrigger.get();
        LOG.debug("Deleting scheduler job trigger <{}> for job definition <{}/{}> and event definition <{}/{}>",
                jobTrigger.id(), jobDefinition.id(), jobDefinition.title(), eventDefinition.id(), eventDefinition.title());
        jobTriggerService.delete(jobTrigger.id());
    }

    private Optional<EventProcessorSchedulerConfig> getJobSchedulerConfig(EventDefinitionDto eventDefinition) {
        return eventDefinition.config().toJobSchedulerConfig(eventDefinition, clock);
    }
}
