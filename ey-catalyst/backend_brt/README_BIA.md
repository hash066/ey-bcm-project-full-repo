# Business Impact Analysis (BIA) Module

This module provides functionality for managing Business Impact Analysis (BIA) information related to processes, departments, and subdepartments in the Business Resilience Tool.

## Overview

The BIA module allows you to:

1. Retrieve processes based on organizational hierarchy
2. Create, update, and retrieve BIA information for processes
3. Perform bulk updates of BIA information for multiple processes
4. Track review status of BIA information

## Database Models

The BIA module uses the following database models:

- `BIAProcessInfo`: Stores BIA information for processes, including description, peak period, SPOC, and review status
- `BIADepartmentInfo`: Stores BIA information for departments
- `BIASubdepartmentInfo`: Stores BIA information for subdepartments

## API Endpoints

### Get Processes for BIA

```
POST /bia/processes
```

Retrieves processes for BIA based on organization ID, department name, and subdepartment name. Also includes any existing BIA information for these processes.

**Request Body:**
```json
{
  "organization_id": "uuid-string",
  "department_name": "Department Name",
  "subdepartment_name": "Subdepartment Name"
}
```

**Response:**
```json
[
  {
    "id": "uuid-string",
    "name": "Process Name",
    "process_owner": "username",
    "bia_info": {
      "id": "uuid-string",
      "description": "Process description",
      "peak_period": "January-March",
      "spoc": "John Doe",
      "review_status": "Draft"
    }
  },
  {
    "id": "uuid-string",
    "name": "Another Process",
    "process_owner": "another_username",
    "bia_info": null
  }
]
```

### Create Process BIA Info

```
POST /bia/process-info
```

Creates BIA information for a process.

**Request Body:**
```json
{
  "process_id": "uuid-string",
  "description": "Process description",
  "peak_period": "January-March",
  "spoc": "John Doe",
  "review_status": "Draft"
}
```

### Update Process BIA Info

```
PUT /bia/process-info/{bia_info_id}
```

Updates BIA information for a process.

**Request Body:**
```json
{
  "description": "Updated description",
  "peak_period": "April-June",
  "spoc": "Jane Smith",
  "review_status": "In Review"
}
```

### Bulk Update Process BIA Info

```
POST /bia/bulk-update
```

Bulk updates or creates BIA information for multiple processes.

**Request Body:**
```json
{
  "organization_id": "uuid-string",
  "department_name": "Department Name",
  "subdepartment_name": "Subdepartment Name",
  "processes": [
    {
      "id": "uuid-string",
      "description": "Process description",
      "peak_period": "January-March",
      "spoc": "John Doe"
    },
    {
      "id": "uuid-string",
      "description": "Another process description",
      "peak_period": "April-June",
      "spoc": "Jane Smith"
    }
  ],
  "review_status": "Draft"
}
```

### Get Process BIA Info

```
GET /bia/process-info/{process_id}
```

Retrieves BIA information for a specific process.

## Database Migration

To apply the database migration for the BIA module, run:

```bash
alembic upgrade head
```

## Integration with Organization Module

The BIA module integrates with the Organization module to retrieve processes based on organizational hierarchy. The following endpoint is used:

```
POST /organizations/processes/filter
```

This endpoint returns a list of processes with their IDs, names, and process owner usernames.

## Review Status

BIA information can have the following review statuses:

- `Draft`: Initial state, information is being collected
- `In Review`: Information is being reviewed
- `Approved`: Information has been approved

## Future Enhancements

Planned enhancements for the BIA module include:

1. Support for impact assessment scoring
2. Integration with risk assessment module
3. Automated notifications for review deadlines
4. Historical tracking of BIA information changes
