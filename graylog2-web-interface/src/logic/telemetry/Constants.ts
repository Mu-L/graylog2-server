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

// Please note, each project has its own collection of telemetry event types.
// Only maintain event types related to core features in this file.

// eslint-disable-next-line import/prefer-default-export
export const TELEMETRY_EVENT_TYPE = {
  SEARCH_TIMERANGE_PRESET_SELECTED: 'Search TimeRange Preset Selected',
  SEARCH_TIMERANGE_PICKER_TOGGLED: 'Search TimeRange Picker Toggled',
  SEARCH_TIMERANGE_PICKER_UPDATED: 'Search TimeRange Picker Updated',
  SEARCH_TIMERANGE_PICKER_CANCELED: 'Search TimeRange Picker Canceled',
  SEARCH_TIMERANGE_PICKER_TAB_SELECTED: 'Search TimeRange Picker Tab Selected',
  SEARCH_STREAM_INPUT_CHANGED: 'Search Stream Input Changed',
  SEARCH_REFRESH_CONTROL_PRESET_SELECTED: 'Search Refresh Control Preset Selected',
  SEARCH_REFRESH_CONTROL_TOGGLED: 'Search Refresh Control Toggled',
  ALERTS_REFRESH_CONTROL_PRESET_SELECTED: 'Alerts Refresh Control Preset Selected',
  ALERTS_REFRESH_CONTROL_TOGGLED: 'Alerts Refresh Control Toggled',
  SEARCH_BUTTON_CLICKED: 'Search Button Clicked',
  SEARCH_WIDGET_EXPORT_DOWNLOADED: 'Search Widget Export Downloaded',
  SEARCH_TIMERANGE_PRESET_ADD_QUICK_ACCESS: 'Search TimeRange Preset Add Quick Access',
  SEARCH_WIDGET_ACTION: {
    FOCUSED: 'Search Widget Focused',
    DELETED: 'Search Widget Deleted',
    MOVE: 'Search Widget Moved',
    DUPLICATE: 'Search Widget Duplicate',
    COPY_TO_DASHBOARD: 'Search Widget Copy To Dashboard Clicked',
    CREATE_NEW_DASHBOARD: 'Search Widget Create New Dashboard Clicked',
    SEARCH_WIDGET_HORIZONTAL_STRETCH: 'Search Widget Horizontal Width Toggled',
    SEARCH_WIDGET_EXTRA_ACTION: 'Search Widget Extra Action Clicked',
    WIDGET_EDIT_TOGGLED: 'Search Widget Edit Toggled',
    WIDGET_EDIT_CANCEL_CLICKED: 'Search Widget Edit Cancel Clicked',
    WIDGET_CONFIG_UPDATED: 'Search Widget Config Updated',
    EXPORT: 'Search Widget Exported',
  },
  SEARCH_WIDGET_CREATE: {
    AGGREGATION: 'Search Widget Aggregation Created',
    MESSAGE_COUNT: 'Search Widget Message Count Created',
    MESSAGE_TABLE: 'Search Widget Message Table Created',
    LOG_VIEW: 'Search Widget Log View Created',
  },
  SEARCH_FIELD_VALUE_ACTION: {
    CHART: 'Search Field Action Chart Clicked',
    STATISTICS: 'Search Field Action Statistics Clicked',
    SHOW_TOP_VALUES: 'Search Field Action Show Top Values Clicked',
    ADD_TO_TABLE: 'Search Field Action Add To Table Clicked',
    REMOVE_FROM_TABLE: 'Search Field Action Remove From Table Clicked',
    ADD_TO_ALL_TABLES: 'Search Field Action Add To All Tables Clicked',
    COPY_FIELD_NAME_TO_CLIPBOARD: 'Search Field Action Copy Field Name To Clipboard Clicked',
    REMOVE_FROM_ALL_TABLES: 'Search Field Action Remove From All Tables Clicked',
    EXCLUDE_FROM_RESULTS: 'Search Value Action Exclude From Results Clicked',
    ADD_TO_QUERY: 'Search Value Action Add To Query Clicked',
    SHOW_DOCUMENT_FOR_VALUE: 'Search Value Action Show Document For Value Clicked',
    CREATE_EXTRACTOR: 'Search Value Action Create Extractor Clicked',
    HIGHLIGHT_THIS_VALUE: 'Search Value Action Highlight This Value Clicked',
    COPY_VALUE_TO_CLIPBOARD: 'Search Value Action Copy Value To Clipboard Clicked',
    CREATE_EVENT_DEFINITION: 'Search Value Action Create Event Definition Clicked',
    INSERT_INTO_DASHBOARD_SEARCH: 'Search Value Action Insert Into Dashboard/Search Clicked',
    CHANGE_FIELD_TYPE_OPENED: 'Search Field Action Change Field Type Opened',
    CHANGE_FIELD_TYPE_CLOSED: 'Search Field Action Change Field Type Closed',
    CHANGE_FIELD_TYPE_CHANGED: 'Search Field Action Change Field Type Changed',
    REMOVE_CUSTOM_FIELD_TYPE_OPENED: 'Search Field Action Removed Custom Field Type Opened',
    REMOVE_CUSTOM_FIELD_TYPE_CLOSED: 'Search Field Action Removed Custom Field Type Closed',
    REMOVE_CUSTOM_FIELD_TYPE_REMOVED: 'Search Field Action Removed Custom Field Type Removed',
  },
  DASHBOARD_FULL_SCREEN_MODE_STARTED: 'Dashboard Fullscreen Mode Started',
  SEARCH_MESSAGE_TABLE_SHOW_SURROUNDING_MESSAGE: 'Search Message Table Show Surrounding Message Clicked ',
  SEARCH_MESSAGE_TABLE_TEST_AGAINST_STREAM: 'Search Message Table Test Against Stream Clicked ',
  SEARCH_MESSAGE_TABLE_DETAILS_TOGGLED: 'Widget Message Table Details Toggled',
  SEARCH_SIDEBAR_TOGGLE: 'Search Sidebar Toggled',
  SEARCH_SIDEBAR_HIGHLIGHT_CREATED: 'Search Sidebar Highlight Created',
  SEARCH_SIDEBAR_HIGHLIGHT_UPDATED: 'Search Sidebar Highlight Updated',
  SEARCH_SIDEBAR_HIGHLIGHT_DELETED: 'Search Sidebar Highlight Deleted',
  SEARCH_SIDEBAR_REDO: 'Search Sidebar Redo',
  SEARCH_SIDEBAR_UNDO: 'Search Sidebar Undo',
  DASHBOARD_ACTION: {
    DASHBOARD_NEW_SAVED: 'Dashboard New Saved',
    DASHBOARD_SAVED: 'Dashboard Saved',
    DASHBOARD_UPDATED: 'Dashboard Updated',
    DASHBOARD_CREATE_CLICKED: 'Dashboard Create Clicked',
    DASHBOARD_CREATE_PAGE: 'Dashboard Create Page Clicked',
    DASHBOARD_PAGE_CONFIGURATION: 'Dashboard Page Configuration Clicked',
    DASHBOARD_PAGE_CONFIGURATION_UPDATED: 'Dashboard Page Configuration Updated',
    DASHBOARD_PAGE_CONFIGURATION_CANCELED: 'Dashboard Page Configuration Update Cancel',
    DASHBOARD_PAGE_CONFIGURATION_SORTING_UPDATED: 'Dashboard Page Configuration Sorting Updated',
    DASHBOARD_PAGE_CONFIGURATION_PAGE_REMOVED: 'Dashboard Page Configuration Page Remove',
  },
  EVENTDEFINITION_LIST: {
    COLUMNS_CHANGED: 'EventDefinition List Columns Changed',
    SORT_CHANGED: 'EventDefinition List Sort Changed',
    PAGE_SIZE_CHANGED: 'EventDefinition List Page Size Changed',
    BULK_ACTION_DELETE_CLICKED: 'EventDefinition List Bulk Delete Clicked',
    BULK_ACTION_ENABLE_CLICKED: 'EventDefinition List Bulk Enable Clicked',
    BULK_ACTION_DISABLE_CLICKED: 'EventDefinition List Bulk Disable Clicked',
    ROW_ACTION_DELETE_CLICKED: 'EventDefinition List Row Delete Clicked',
    ROW_ACTION_ENABLE_CLICKED: 'EventDefinition List Row Enable Clicked',
    ROW_ACTION_DISABLE_CLICKED: 'EventDefinition List Row Disable Clicked',
    ROW_ACTION_COPY_CLICKED: 'EventDefinition List Row Copy Clicked',
    ROW_ACTION_SHARE_CLICKED: 'EventDefinition List Row Share Clicked',
  },
  EVENTDEFINITION_CREATE_BUTTON_CLICKED: 'EventDefinition Create Button Clicked',
  EVENTDEFINITION_DUPLICATED: 'EventDefinition Duplicated',
  EVENTDEFINITION_NEXT_CLICKED: 'EventDefinition Next Clicked',
  EVENTDEFINITION_PREVIOUS_CLICKED: 'EventDefinition Previous Clicked',
  EVENTDEFINITION_DETAILS: {
    STEP_CLICKED: 'EventDefinition Details Step Clicked',
    PRIORITY_CHANGED: 'EventDefinition Details Priority Changed',
  },
  EVENTDEFINITION_CONDITION: {
    STEP_CLICKED: 'EventDefinition Condition Step Clicked',
    TYPE_SELECTED: 'EventDefinition Condition Type Selected',
    FILTER_STREAM_SELECTED: 'EventDefinition Condition Filter Stream Selected',
    FILTER_SEARCH_WITHIN_THE_LAST_UNIT_CHANGED: 'EventDefinition Condition Filter Search Within The Last Unit Changed',
    FILTER_EXECUTE_SEARCH_EVERY_UNIT_CHANGED: 'EventDefinition Condition Filter Execute Search Every Unit Changed',
    FILTER_EXECUTED_AUTOMATICALLY_TOGGLED: 'EventDefinition Condition Filter Executed Automatically Toggled',
    FILTER_EVENT_LIMIT_CHANGED: 'EventDefinition Condition Filter Event Limit Changed',
    AGGREGATION_TOGGLED: 'EventDefinition Aggregation Toggled',
    AGGREGATION_GROUP_BY_FIELD_SELECTED: 'EventDefinition Aggregation Group By Field Selected',
  },
  EVENTDEFINITION_FIELDS: {
    STEP_CLICKED: 'EventDefinition Fields Step Clicked',
    ADD_CUSTOM_FIELD_CLICKED: 'EventDefinition Fields Add Custom Field Clicked',
    AS_EVENT_KEY_TOGGLED: 'EventDefinition Fields As Event Key Toggled',
    SET_VALUE_FROM_TEMPLATE_SELECTED: 'EventDefinition Fields Set Value From Template Selected',
    SET_VALUE_FROM_LOOKUP_TABLE_SELECTED: 'EventDefinition Fields Set Value From Lookup Table Selected',
    DONE_CLICKED: 'EventDefinition Fields Done Clicked',
    CANCEL_CLICKED: 'EventDefinition Fields Cancel Clicked',
  },
  EVENTDEFINITION_NOTIFICATIONS: {
    STEP_CLICKED: 'EventDefinition Notifications Step Clicked',
    ADD_CLICKED: 'EventDefinition Notifications Add Clicked',
    MANAGE_LINK_CLICKED: 'EventDefinition Notifications Manage Link Clicked',
    NOTIFICATION_SELECTED: 'EventDefinition Notifications Notification Selected',
    CREATE_NEW_CLICKED: 'EventDefinition Notifications Create New Clicked',
    NOTIFICATION_TYPE_SELECTED: 'EventDefinition Notifications Notification Type Selected',
    DONE_CLICKED: 'EventDefinition Notifications Done Clicked',
    CANCEL_CLICKED: 'EventDefinition Notifications Cancel Clicked',
  },
  EVENTDEFINITION_SUMMARY: {
    STEP_CLICKED: 'EventDefinition Summary Step Clicked',
    CANCEL_CLICKED: 'EventDefinition Summary Cancel Clicked',
    CREATE_CLICKED: 'EventDefinition Summary Create Clicked',
    UPDATE_CLICKED: 'EventDefinition Summary Update Clicked',
  },
  NOTIFICATIONS: {
    CREATE_CLICKED: 'Notifications Create Clicked',
    EDIT_CLICKED: 'Notifications Edit Clicked',
    EXECUTE_TEST_CLICKED: 'Notifications Execute Test Clicked',
    BULK_ACTION_DELETE_CLICKED: 'Notifications Bulk Delete Clicked',
    ROW_ACTION_DELETE_CLICKED: 'Notifications Row Delete Clicked',
    ROW_ACTION_TEST_CLICKED: 'Notifications Row Test Clicked',
  },
  CONTENTSTREAM: {
    PREV_ARROW_CLICKED: 'Content Stream Left Arrow Clicked',
    NEXT_ARROW_CLICKED: 'Content Stream Right Arrow Clicked',
    READ_MORE_CLICKED: 'Content Stream Read More Clicked',
    ARTICLE_CLICKED: 'Content Stream Article Clicked',
    RELESE_ARTICLE_CLICKED: 'Content Stream Release Article Clicked',
    NEWS_OPT_IN_TOGGLED: 'Content Stream News Opt-In Clicked',
    RELEASE_OPT_IN_TOGGLED: 'Content Stream Release Opt-In Clicked',
  },
  STREAMS: {
    CREATE_FORM_MODAL_OPENED: 'Stream Create Form Modal Opened',
    NEW_STREAM_CREATED: 'Stream New Stream Created',
    STREAM_ITEM_UPDATED: 'Stream Item Updated',
    STREAM_ITEM_STATUS_TOGGLED: 'Stream Item Status Toggled',
    STREAM_ITEM_SHARE_MODAL_OPENED: 'Stream Item Share Modal Opened',
    STREAM_ITEM_UPDATE_MODAL_OPENED: 'Stream Item Update Modal Opened',
    STREAM_ITEM_CLONED: 'Stream Item Cloned',
    STREAM_ITEM_RULE_SAVED: 'Stream Item Rule SAVED',
    STREAM_ITEM_DELETED: 'Stream Item Deleted',
    STREAM_ITEM_DATA_ROUTING_CLICKED: 'Stream Item Data Routing Clicked',
    STREAM_ITEM_DATA_ROUTING_UPDATE_CLICKED: 'Stream Item Data Routing Update Clicked',
    STREAM_ITEM_DATA_ROUTING_STREAM_INDEXSET_UPDATE_OPENED: 'Stream Item Data Routing Stream IndexSet Update Opened',
    STREAM_ITEM_DATA_ROUTING_INDEXER_FILTER_UPDATE_OPENED: 'Stream Item Data Routing Indexer Filter Update Opened',
    STREAM_ITEM_DATA_ROUTING_INDEXER_FILTER_CREATE_OPENED: 'Stream Item Data Routing Indexer Filter Create Opened',
    STREAM_ITEM_DATA_ROUTING_DATA_WAREHOUSE_FILTER_CREATE_OPENED:
      'Stream Item Data Routing Data Warehouse Filter Create Opened',
    STREAM_ITEM_DATA_ROUTING_DATA_WAREHOUSE_FILTER_UPDATE_OPENED:
      'Stream Item Data Routing Data Warehouse Filter Update Opened',
    STREAM_ITEM_DATA_ROUTING_FILTER_DELETE_OPENED: 'Stream Item Data Routing Filter Delete Opened',
    STREAM_ITEM_DATA_ROUTING_INTAKE_OPENED: 'Stream Item Data Routing Intake Opened',
    STREAM_ITEM_DATA_ROUTING_PROCESSING_OPENED: 'Stream Item Data Routing Processing Opened',
    STREAM_ITEM_DATA_ROUTING_DESTINATIONS_OPENED: 'Stream Item Data Routing Destination Opened',
    STREAM_ITEM_DATA_ROUTING_DESTINATIONS_OUTPUT_ASSIGN_OPENED:
      'Stream Item Data Routing Destination Output Assign Opened',
    STREAM_ITEM_DATA_ROUTING_INTAKE_CREATE_RULE_OPENED: 'Stream Item Data Routing Intake Create Rule Opened',
    STREAM_ITEM_DATA_ROUTING_PROCESSING_EDIT_PIPELINES_CONNECTION: 'Stream Item Data Routing Edit Pipelines Connection',
  },
  ENTITYSHARE: {
    ENTITY_STREAM_SHARED: 'Entity Share: Entity Stream Shared',
    ENTITY_SEARCH_SHARED: 'Entity Share: Entity Search Shared',
    ENTITY_SEARCH_FILTER_SHARED: 'Entity Share: Entity Filter Shared',
    ENTITY_EVENT_DEFINITION_SHARED: 'Entity Share: Event Definition Shared',
    ENTITY_NOTIFICATION_SHARED: 'Entity Share: Notification Shared',
    ENTITY_DASHBOARD_SHARED: 'Entity Share: Dashboard Shared',
  },
  PIPELINE_RULE_BUILDER: {
    CREATE_RULE_CLICKED: 'Pipeline Create Rule Clicked',
    RUN_RULE_SIMULATION_CLICKED: 'Pipeline Run Rule Simulation Clicked',
    RESET_RULE_SIMULATION_CLICKED: 'Pipeline Reset Rule Simulation Clicked',
    USE_SOURCE_CODE_EDITOR_CLICKED: 'Pipeline RuleBuilder Use Source Code Editor Clicked',
    SWITCH_TO_SOURCE_CODE_EDITOR_CONFIRM_CLICKED: 'Pipeline RuleBuilder Switch to Source Code Editor Confirm Clicked',
    SWITCH_TO_SOURCE_CODE_EDITOR_CANCEL_CLICKED: 'Pipeline RuleBuilder Switch to Source Code Editor Cancel Clicked',
    CREATE_NEW_RULE_FROM_CODE_CLICKED: 'Pipeline RuleBuilder Create New Rule From Code Clicked',
    COPY_CODE_AND_CLOSE_CLICKED: 'Pipeline RuleBuilder Code Copy & Close Clicked',
    NEW_CONDITION_SELECTED: 'Pipeline RuleBuilder New Condition Selected',
    NEW_ACTION_SELECTED: 'Pipeline RuleBuilder New Action Selected',
    ADD_CONDITION_CLICKED: 'Pipeline RuleBuilder Add Condition Clicked',
    ADD_ACTION_CLICKED: 'Pipeline RuleBuilder Add Action Clicked',
    UPDATE_CONDITION_CLICKED: 'Pipeline RuleBuilder Update Condition Clicked',
    UPDATE_ACTION_CLICKED: 'Pipeline RuleBuilder Update Action Clicked',
    CANCEL_CLICKED: 'Pipeline RuleBuilder Cancel Clicked',
    ADD_RULE_CLICKED: 'Pipeline RuleBuilder Add Rule Clicked',
    CONVERT_TO_SOURCE_CODE_CLICKED: 'Pipeline RuleBuilder Convert to Source Code Clicked',
    OPERATOR_AND_CLICKED: 'Pipeline RuleBuilder Operator AND Clicked',
    OPERATOR_OR_CLICKED: 'Pipeline RuleBuilder Operator OR Clicked',
    UPDATE_RULE_CLICKED: 'Pipeline RuleBuilder Update Rule Clicked',
    UPDATE_RULE_AND_CLOSE_CLICKED: 'Pipeline RuleBuilder Update Rule And Close Clicked',
    NEGATE_CONDITION_CLICKED: 'Pipeline RuleBuilder Negate Condition Clicked',
    DUPLICATE_ACTION_CLICKED: 'Pipeline RuleBuilder Duplicate Action Clicked',
    INSERT_ABOVE_ACTION_CLICKED: 'Pipeline RuleBuilder Insert Above Action Clicked',
    INSERT_BELOW_ACTION_CLICKED: 'Pipeline RuleBuilder Insert Below Action Clicked',
    DELETE_CONDITION_CLICKED: 'Pipeline RuleBuilder Delete Condition Clicked',
    DELETE_ACTION_CLICKED: 'Pipeline RuleBuilder Delete Action Clicked',
    EDIT_CONDITION_CLICKED: 'Pipeline RuleBuilder Edit Condition Clicked',
    EDIT_ACTION_CLICKED: 'Pipeline RuleBuilder Edit Action Clicked',
  },
  SHORTCUT_TYPED: 'Shortcut Typed',
  CONFIGURATIONS: {
    INDEX_SETS_UPDATED: 'Configurations Index Sets Defaults Updated',
    THREATINTEL_CONFIGURATION_UPDATED: 'Configurations Threat Intel Configuration Updated',
    PERMISSIONS_UPDATED: 'Configurations Permissions Updated',
    SEARCHES_UPDATED: 'Configurations Searches Updated',
    URL_WHITE_LIST_UPDATED: 'Configurations Url White List Updated',
    USER_UPDATED: 'Configurations User Updated',
    CERTIFICATE_RENEWAL_UPDATED: 'Configurations Certificate Renewal Updated',
    CERTIFICATE_RENEWAL_POLICY_UPDATED: 'Configurations Certificate Renewal Policy Updated',
    DECORATORS_UPDATED: 'Configurations Decorators Updated',
    GEOLOCATION_CONFIGURATION_UPDATED: 'Configurations Geolocation Configuration Updated',
  },
  INPUTS: {
    INPUT_SELECTED: 'Inputs Input Selected',
    INPUT_CREATED: 'Inputs Input Created',
    INPUT_DELETED: 'Inputs Input Deleted',
    INPUT_EDIT_CLICKED: 'Inputs Input Edit Clicked',
    INPUT_UPDATED: 'Inputs Input Updated',
    INPUT_SETUP_ENTERED: 'Inputs Input Setup Mode Entered',
    INPUT_SETUP_EXITED: 'Inputs Input Setup Mode Exited',
    SHOW_RECEIVED_MESSAGES_CLICKED: 'Inputs Show Received Messages Clicked',
    MANAGE_EXTRACTORS_CLICKED: 'Inputs Manage Extractors Clicked',
    SHOW_METRICS_CLICKED: 'Inputs Show Metrics Clicked',
    INPUT_DIAGNOSIS_CLICKED: 'Inputs Input Diagnosis Clicked',
    INPUT_START_CLICKED: 'Inputs Input Start Clicked',
    INPUT_STOP_CLICKED: 'Inputs Input Stop Clicked',
    INPUT_SETUP_CLICKED: 'Inputs Input Setup Clicked',
  },
  INPUT_SETUP_WIZARD: {
    START_INPUT: 'Input Setup Wizard Start Input Clicked',
  },
  OUTPUTS: {
    OUTPUT_CREATED: 'Outputs Output Created',
    OUTPUT_ASSIGNED: 'Outputs Output Assigned',
    OUTPUT_GLOBALLY_REMOVED: 'Outputs Output Globally Removed',
    OUTPUT_FROM_STREAM_REMOVED: 'Outputs Output From Stream Removed',
    OUTPUT_UPDATED: 'Outputs Output Updated',
  },
  INDICES: {
    INDEX_SET_DEFAULT_SET: 'Indices Index Set Default Set',
    INDEX_SET_DELETED: 'Indices Index Set Deleted',
    INDEX_SET_CREATED: 'Indices Index Set Created',
    INDEX_SET_UPDATED: 'Indices Index Set Updated',
  },
  LOGGING: {
    LOG_LEVEL_EDITED: 'Logging Log Level Edited',
    SHOW_LOG_LEVEL_METRICS_TOGGLED: 'Logging Show Log Level Metrics Toggled',
  },
  LUT: {
    DELETED: 'LUT Deleted',
    CREATED: 'LUT Created',
    UPDATED: 'LUT Updated',
    CACHE_TYPE_CHANGED: 'LUT Cache Type Changed',
    CACHE_DELETED: 'LUT Cache Deleted',
    CACHE_CREATED: 'LUT Cache Created',
    CACHE_UPDATED: 'LUT Cache Updated',
    DATA_ADAPTER_DELETED: 'LUT Data Adapter Deleted',
    DATA_ADAPTER_CREATED: 'LUT Data Adapter Created',
    DATA_ADAPTER_UPDATED: 'LUT Data Adapter Updated',
  },
  USERS: {
    USER_CREATED: 'Users User Created',
    USER_DISABLED: 'Users User Disabled',
    USER_ENABLED: 'Users User Enabled',
    USER_DELETED: 'Users User Deleted',
  },
  GROK_PATTERN: {
    CREATED: 'Grok Pattern Created',
    UPDATED: 'Grok Pattern Updated',
    DELETED: 'Grok Pattern Deleted',
    TESTED: 'Grok Pattern Tested',
    IMPORTED: 'Grok Pattern Imported',
  },
  ROLES: {
    USER_ASSIGNED: 'Roles User Assigned',
    USER_UNASSIGNED: 'Roles User Unassigned',
  },
  AUTHENTICATION: {
    DIRECTORY_GROUP_SYNC_SAVE_CLICKED: 'Authentication Directory Group Sync Save Clicked',
    CONFIG_UPDATED: 'Authentication Config Updated',
    SERVICE_CREATED: 'Authentication Service Created',
    SERVICE_SELECTED: 'Authentication Service Selected',
    DIRECTORY_SERVER_CONFIG_SAVE_CLICKED: 'Authentication Directory Server Config Save Clicked',
    DIRECTORY_USER_SYNC_SAVE_CLICKED: 'Authentication Directory User Sync Save Clicked',
    DIRECTORY_NEXT_USER_SYNC_CLICKED: 'Authentication Directory Next User Sync Clicked',
    DIRECTORY_NEXT_GROUP_SYNC_CLICKED: 'Authentication Directory Next Group Sync Clicked',
  },
  SIDECARS: {
    CONFIGURATION_CREATED: 'Sidecar Configuration Created',
    CONFIGURATION_UPDATED: 'Sidecar Configuration Updated',
    CONFIGURATION_CLONED: 'Sidecar Configuration Cloned',
    CONFIGURATION_DELETED: 'Sidecar Configuration Deleted',
    CONFIGURATION_ASSIGNED: 'Sidecar Configuration Assigned',
    PROCESS_ACTION_SET: 'Sidecar Process Action Set',
    LOG_COLLECTOR_CLONED: 'Sidecar Log Collector Cloned',
    LOG_COLLECTOR_CREATED: 'Sidecar Log Collector Created',
    LOG_COLLECTOR_SERVICE_TYPE_CHANGED: 'Sidecar Log Collector Service Type Changed',
    LOG_COLLECTOR_NODE_OPERATING_SYSTEM_CHANGED: 'Sidecar Log Collector Node Operating System Changed',
    LOG_COLLECTOR_UPDATED: 'Sidecar Log Collector Updated',
    LOG_COLLECTOR_DELETED: 'Sidecar Log Collector Deleted',
  },
  TRAFFIC_GRAPH_DAYS_CHANGED: 'Traffic Graph Days Changed',
  URLWHITELIST_CONFIGURATION_UPDATED: 'Urlwhitelist Configuration Updated',
  CONTENT_PACK: {
    INSTALLED: 'Content Pack Installed',
    DOWNLOADED: 'Content Pack Downloaded',
    ALL_VERSIONS_DELETED: 'Content Pack All Versions Deleted',
  },
  INDEX_SET_FIELD_TYPE_PROFILE: {
    NEW_OPENED: 'Index Set Field Type Profile Creating New Opened',
    NEW_CANCELED: 'Index Set Field Type Profile Creating New Canceled',
    CREATED: 'Index Set Field Type Profile Created',
    EDIT_OPENED: 'Index Set Field Type Profile Edit Opened',
    EDIT_CANCELED: 'Index Set Field Type Profile Edit Canceled',
    EDIT: 'Index Set Field Type Profile Edited',
    CHANGE_FOR_INDEX_OPENED: 'Index Set Field Type Profile Change For Index Opened',
    CHANGE_FOR_INDEX_CANCELED: 'Index Set Field Type Profile Change For Index  Canceled',
    CHANGE_FOR_INDEX_CHANGED: 'Index Set Field Type Profile Change For Index Changed',
    CHANGE_FOR_INDEX_REMOVED: 'Index Set Field Type Profile Change For Index Removed',
    CREATE_PROFILE_FROM_SELECTED_RAN: 'Index Set Field Type Profile Create From Selected Ran',
  },
  INDEX_SET_TEMPLATE: {
    NEW_OPENED: 'Index Set Template Create Opened',
    NEW_CANCELLED: 'Index Set Template Create Cancelled',
    CREATED: 'Index Set Template Created',
    EDIT_OPENED: 'Index Set Template Edit Opened',
    EDIT_CANCELLED: 'Index Set Template Edit Cancelled',
    EDIT: 'Index Set Template Edited',
    SELECTED: 'Index Set Template Selected',
    SELECT_OPENED: 'Index Set Template Selected Opened',
    SELECT_CLOSED: 'Index Set Template Selected Cancelled',
  },
  DATANODE_MIGRATION: {
    RESET_MIGRATION_CLICKED: 'Datanode Migration Reset Migration Clicked',
    RESET_MIGRATION_CONFIRM_CLICKED: 'Datanode Migration Reset Migration Confirm Clicked',
    WELCOME_GO_TO_MIGRATION_STEPS_CLICKED: 'Datanode Migration Welcome Go To Migration Steps Clicked',
    WELCOME_CONFIGURE_CERTIFICATE_RENEWAL_POLICY_CLICKED:
      'Datanode Migration Welcome Configure Certificate Renewal Policy Clicked',
    WELCOME_NEXT_CLICKED: 'Datanode Migration Welcome Next Clicked',
    CA_CREATE_TAB_CLICKED: 'Datanode Migration CA Create Tab Clicked',
    CA_UPLOAD_TAB_CLICKED: 'Datanode Migration CA Upload Tab Clicked',
    CA_CREATE_CA_CLICKED: 'Datanode Migration CA Create CA Clicked',
    CA_UPLOAD_CA_CLICKED: 'Datanode Migration CA Upload CA Clicked',
    CA_GO_TO_MIGRATION_STEPS_CLICKED: 'Datanode Migration CA Go To Migration Steps Clicked',
    CA_CONFIGURE_CERTIFICATE_RENEWAL_POLICY_CLICKED:
      'Datanode Migration CA Configure Certificate Renewal Policy Clicked',
    CA_NEXT_CLICKED: 'Datanode Migration CA Next Clicked',
    CR_EDIT_CONFIGURATION_CLICKED: 'Datanode Migration CR Edit Configuration Clicked',
    CR_UPDATE_CONFIGURATION_CLICKED: 'Datanode Migration CR Update Configuration Clicked',
    CR_GO_TO_MIGRATION_STEPS_CLICKED: 'Datanode Migration CR Go To Migration Steps Clicked',
    CR_NEXT_CLICKED: 'Datanode Migration CR Next Clicked',
    MIGRATION_TYPE_SELECTED: 'Datanode Migration Migration Type Selected',
    INPLACE_RUN_DIRECTORY_COMPATIBILITY_CHECK_CLICKED:
      'Datanode Migration Inplace Run Directory Compatibility Check Clicked',
    INPLACE_DIRECTORY_COMPATIBILITY_CHECK_NEXT_CLICKED:
      'Datanode Migration Inplace Directory Compatibility Check Next Clicked',
    INPLACE_JOURNAL_SIZE_DOWNTIME_WARNING_NEXT_CLICKED:
      'Datanode Migration Inplace Journal Size Downtime Warning Next Clicked',
    INPLACE_STOP_MESSAGE_PROCESSING_NEXT_CLICKED: 'Datanode Migration Inplace Stop Message Processing Next Clicked',
    INPLACE_RESTART_GRAYLOG_NEXT_CLICKED: 'Datanode Migration Inplace Restart Graylog Next Clicked',
    REMOTEREINDEX_WELCOME_NEXT_CLICKED: 'Datanode Migration RemoteReindex Welcome Next Clicked',
    REMOTEREINDEX_MIGRATE_EXISTING_DATA_QUESTION_NEXT_CLICKED:
      'Datanode Migration RemoteReindex Migrate Existing Data Question Next Clicked',
    REMOTEREINDEX_MIGRATE_EXISTING_DATA_QUESTION_SKIP_CLICKED:
      'Datanode Migration RemoteReindex Migrate Existing Data Question Skip Clicked',
    REMOTEREINDEX_MIGRATE_EXISTING_DATA_CHECK_CONNECTION_CLICKED:
      'Datanode Migration RemoteReindex Migrate Existing Data Check Connection Clicked',
    REMOTEREINDEX_MIGRATE_EXISTING_DATA_START_CLICKED:
      'Datanode Migration RemoteReindex Migrate Existing Data Start Clicked',
    REMOTEREINDEX_RUNNING_LOGVIEW_CLICKED: 'Datanode Migration RemoteReindex Running Logview Clicked',
    REMOTEREINDEX_RUNNING_RETRY_CLICKED: 'Datanode Migration RemoteReindex Running Retry Clicked',
    REMOTEREINDEX_RUNNING_RETRY_CONFIRM_CLICKED: 'Datanode Migration RemoteReindex Running Retry Confirm Clicked',
    REMOTEREINDEX_SHUTDOWN_OLD_CLUSTER_NEXT_CLICKED:
      'Datanode Migration RemoteReindex Shutdown Old Cluster Next Clicked',
  },
  ALERTS_AND_EVENTS: {
    ACTION_RAN: 'Alerts And Events Action Ran',
  },
  ENTITY_DATA_TABLE: {
    COLUMNS_CHANGED: 'Entity Data Table Columns Changed',
    SORT_CHANGED: 'Entity Data Table Sort Changed',
    PAGE_SIZE_CHANGED: 'Entity Data Table Page Size Changed',
    FILTER_CREATED: 'Entity Data Table Filter Created',
    FILTER_DELETED: 'Entity Data Table Filter Deleted',
    FILTER_CHANGED: 'Entity Data Table Filter Changed',
  },
} as const;
