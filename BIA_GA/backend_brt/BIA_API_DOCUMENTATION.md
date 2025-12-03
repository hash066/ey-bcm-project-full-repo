# Business Impact Analysis (BIA) API Documentation

This document provides detailed information about all the endpoints available in the Business Impact Analysis (BIA) module of the Business Resilience Tool.

## Table of Contents

1. [Authentication](#authentication)
2. [Process BIA Information](#process-bia-information)
   - [Get Processes for BIA](#get-processes-for-bia)
   - [Get Process BIA Info](#get-process-bia-info)
   - [Create Process BIA Info](#create-process-bia-info)
   - [Update Process BIA Info](#update-process-bia-info)
   - [Bulk Update Process BIA Info](#bulk-update-process-bia-info)
3. [Process Impact Analysis](#process-impact-analysis)
   - [Get Process Impact Analysis](#get-process-impact-analysis)
   - [Create Process Impact Analysis](#create-process-impact-analysis)
   - [Update Process Impact Analysis](#update-process-impact-analysis)
   - [Bulk Update Process Impact Analysis](#bulk-update-process-impact-analysis)
4. [Organization-level Operations](#organization-level-operations)
   - [Get Organization Processes](#get-organization-processes)
   - [Get Organization Impact Analysis](#get-organization-impact-analysis)

## Authentication

All endpoints require JWT authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Process BIA Information

### Get Processes for BIA

Retrieves processes for BIA based on organization ID, department name, and subdepartment name. Also includes any existing BIA information for these processes.

**Endpoint:** `POST /bia/processes`

**Request Body:**
```json
{
  "organization_id": "123e4567-e89b-12d3-a456-426614174000",
  "department_name": "Finance",
  "subdepartment_name": "Accounting"
}
```

**Response:**
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174001",
    "name": "Financial Reporting",
    "process_owner": "john.doe",
    "bia_info": {
      "id": "123e4567-e89b-12d3-a456-426614174002",
      "description": "Monthly financial reporting process",
      "peak_period": "Month-end",
      "peak_period_details": "Especially busy during quarter-end closings",
      "review_status": "Approved",
      "created_at": "2025-01-15T10:30:00Z",
      "updated_at": "2025-06-20T14:45:00Z"
    }
  },
  {
    "id": "123e4567-e89b-12d3-a456-426614174003",
    "name": "Accounts Payable",
    "process_owner": "jane.smith",
    "bia_info": null
  }
]
```

### Get Process BIA Info

Retrieves BIA information for a specific process.

**Endpoint:** `GET /bia/process-info/{process_id}`

**Path Parameters:**
- `process_id`: UUID of the process

**Response:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174002",
  "process_id": "123e4567-e89b-12d3-a456-426614174001",
  "process_name": "Financial Reporting",
  "description": "Monthly financial reporting process",
  "peak_period": "Month-end",
  "peak_period_details": "Especially busy during quarter-end closings",
  "review_status": "Approved",
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-06-20T14:45:00Z"
}
```

### Create Process BIA Info

Creates BIA information for a process.

**Endpoint:** `POST /bia/process-info`

**Request Body:**
```json
{
  "process_id": "123e4567-e89b-12d3-a456-426614174001",
  "description": "Monthly financial reporting process",
  "peak_period": "Month-end",
  "peak_period_details": "Especially busy during quarter-end closings",
  "review_status": "Draft"
}
```

**Response:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174002",
  "process_id": "123e4567-e89b-12d3-a456-426614174001",
  "description": "Monthly financial reporting process",
  "peak_period": "Month-end",
  "peak_period_details": "Especially busy during quarter-end closings",
  "review_status": "Draft",
  "created_at": "2025-07-16T12:30:00Z",
  "updated_at": "2025-07-16T12:30:00Z"
}
```

### Update Process BIA Info

Updates BIA information for a process.

**Endpoint:** `PUT /bia/process-info/{bia_info_id}`

**Path Parameters:**
- `bia_info_id`: UUID of the BIA info record

**Request Body:**
```json
{
  "description": "Updated monthly financial reporting process",
  "peak_period": "Month-end and Quarter-end",
  "peak_period_details": "Especially busy during fiscal year-end",
  "review_status": "In Review"
}
```

**Response:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174002",
  "process_id": "123e4567-e89b-12d3-a456-426614174001",
  "description": "Updated monthly financial reporting process",
  "peak_period": "Month-end and Quarter-end",
  "peak_period_details": "Especially busy during fiscal year-end",
  "review_status": "In Review",
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-07-16T14:45:00Z"
}
```

### Bulk Update Process BIA Info

Bulk updates or creates BIA information for multiple processes.

**Endpoint:** `POST /bia/bulk-update`

**Request Body:**
```json
{
  "organization_id": "123e4567-e89b-12d3-a456-426614174000",
  "department_name": "Finance",
  "subdepartment_name": "Accounting",
  "processes": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174001",
      "description": "Monthly financial reporting process",
      "peak_period": "Month-end",
      "peak_period_details": "Especially busy during quarter-end closings"
    },
    {
      "id": "123e4567-e89b-12d3-a456-426614174003",
      "description": "Accounts payable process",
      "peak_period": "Weekly",
      "peak_period_details": "Payments processed every Friday"
    }
  ],
  "review_status": "Draft"
}
```

**Response:**
```json
{
  "updated_processes": [
    "123e4567-e89b-12d3-a456-426614174001"
  ],
  "created_processes": [
    "123e4567-e89b-12d3-a456-426614174003"
  ],
  "skipped_processes": []
}
```

## Process Impact Analysis

### Get Process Impact Analysis

Retrieves impact analysis for a specific process.

**Endpoint:** `GET /bia/impact-analysis/process/{process_id}`

**Path Parameters:**
- `process_id`: UUID of the process

**Response:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174004",
  "process_id": "123e4567-e89b-12d3-a456-426614174001",
  "rto": "4",
  "mtpd": "7",
  "is_critical": true
}
```

**Notes:**
- The endpoint now returns a simplified response with only essential fields
- The `process_id` parameter should be the UUID of the process for which you want to retrieve impact analysis

### Create Process Impact Analysis

Creates impact analysis for a process.

**Endpoint:** `POST /bia/impact-analysis`

**Request Body:**
```json
{
  "process_id": "123e4567-e89b-12d3-a456-426614174001",
  "rto": 4,
  "mtpd": 7,
  "impact_data": {
    "financial": {
      "day1": "Low",
      "day3": "Medium",
      "day7": "High",
      "day14": "Very High",
      "day30": "Very High"
    },
    "operational": {
      "day1": "Medium",
      "day3": "High",
      "day7": "Very High",
      "day14": "Very High",
      "day30": "Very High"
    },
    "regulatory": {
      "day1": "Low",
      "day3": "Medium",
      "day7": "High",
      "day14": "High",
      "day30": "Very High"
    }
  },
  "highest_impact": {
    "category": "operational",
    "level": "Very High",
    "day": 7
  },
  "is_critical": true,
  "rationale": "Critical financial reporting process with regulatory implications"
}
```

**Response:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174004",
  "process_id": "123e4567-e89b-12d3-a456-426614174001",
  "rto": 4,
  "mtpd": 7,
  "impact_data": {
    "financial": {
      "day1": "Low",
      "day3": "Medium",
      "day7": "High",
      "day14": "Very High",
      "day30": "Very High"
    },
    "operational": {
      "day1": "Medium",
      "day3": "High",
      "day7": "Very High",
      "day14": "Very High",
      "day30": "Very High"
    },
    "regulatory": {
      "day1": "Low",
      "day3": "Medium",
      "day7": "High",
      "day14": "High",
      "day30": "Very High"
    }
  },
  "highest_impact": {
    "category": "operational",
    "level": "Very High",
    "day": 7
  },
  "is_critical": true,
  "rationale": "Critical financial reporting process with regulatory implications",
  "created_at": "2025-07-16T15:20:00Z",
  "updated_at": "2025-07-16T15:20:00Z"
}
```

### Update Process Impact Analysis

Updates impact analysis for a process.

**Endpoint:** `PUT /bia/impact-analysis/{impact_analysis_id}`

**Path Parameters:**
- `impact_analysis_id`: UUID of the impact analysis record

**Request Body:**
```json
{
  "rto": 3,
  "mtpd": 5,
  "impact_data": {
    "financial": {
      "day1": "Medium",
      "day3": "High",
      "day7": "Very High",
      "day14": "Very High",
      "day30": "Very High"
    },
    "operational": {
      "day1": "High",
      "day3": "Very High",
      "day7": "Very High",
      "day14": "Very High",
      "day30": "Very High"
    },
    "regulatory": {
      "day1": "Medium",
      "day3": "High",
      "day7": "High",
      "day14": "Very High",
      "day30": "Very High"
    }
  },
  "highest_impact": {
    "category": "operational",
    "level": "Very High",
    "day": 3
  },
  "is_critical": true,
  "rationale": "Updated: Critical financial reporting process with significant operational impact"
}
```

**Response:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174004",
  "process_id": "123e4567-e89b-12d3-a456-426614174001",
  "rto": 3,
  "mtpd": 5,
  "impact_data": {
    "financial": {
      "day1": "Medium",
      "day3": "High",
      "day7": "Very High",
      "day14": "Very High",
      "day30": "Very High"
    },
    "operational": {
      "day1": "High",
      "day3": "Very High",
      "day7": "Very High",
      "day14": "Very High",
      "day30": "Very High"
    },
    "regulatory": {
      "day1": "Medium",
      "day3": "High",
      "day7": "High",
      "day14": "Very High",
      "day30": "Very High"
    }
  },
  "highest_impact": {
    "category": "operational",
    "level": "Very High",
    "day": 3
  },
  "is_critical": true,
  "rationale": "Updated: Critical financial reporting process with significant operational impact",
  "created_at": "2025-02-10T09:15:00Z",
  "updated_at": "2025-07-16T16:45:00Z"
}
```

### Bulk Update Process Impact Analysis

Bulk updates or creates impact analysis for multiple processes.

**Endpoint:** `POST /bia/impact-analysis/bulk-update`

**Request Body:**
```json
{
  "items": [
    {
      "process_id": "123e4567-e89b-12d3-a456-426614174001",
      "process_name": null,
      "rto": 4,
      "mtpd": 7,
      "impact_data": {
        "financial": {
          "day1": "Low",
          "day3": "Medium",
          "day7": "High",
          "day14": "Very High",
          "day30": "Very High"
        },
        "operational": {
          "day1": "Medium",
          "day3": "High",
          "day7": "Very High",
          "day14": "Very High",
          "day30": "Very High"
        },
        "regulatory": {
          "day1": "Low",
          "day3": "Medium",
          "day7": "High",
          "day14": "High",
          "day30": "Very High"
        }
      },
      "highest_impact": {
        "category": "operational",
        "level": "Very High",
        "day": 7
      },
      "is_critical": true,
      "rationale": "Critical financial reporting process"
    },
    {
      "process_id": null,
      "process_name": "Accounts Payable",
      "rto": 2,
      "mtpd": 5,
      "impact_data": {
        "financial": {
          "day1": "Medium",
          "day3": "High",
          "day7": "Very High",
          "day14": "Very High",
          "day30": "Very High"
        },
        "operational": {
          "day1": "High",
          "day3": "Very High",
          "day7": "Very High",
          "day14": "Very High",
          "day30": "Very High"
        },
        "regulatory": {
          "day1": "Low",
          "day3": "Medium",
          "day7": "High",
          "day14": "High",
          "day30": "Very High"
        }
      },
      "highest_impact": {
        "category": "operational",
        "level": "Very High",
        "day": 3
      },
      "is_critical": true,
      "rationale": "Critical accounts payable process"
    }
  ]
}
```

**Response:**
```json
{
  "updated_processes": [
    "123e4567-e89b-12d3-a456-426614174001"
  ],
  "created_processes": [
    "123e4567-e89b-12d3-a456-426614174003"
  ],
  "skipped_processes": []
}
```

## Organization-level Operations

### Get Organization Processes

Retrieves all processes for an organization, optionally filtered by department and subdepartment.

**Endpoint:** `GET /bia/organization/{organization_id}/processes`

**Path Parameters:**
- `organization_id`: UUID or string ID of the organization

**Query Parameters:**
- `department_id` (optional): UUID or string ID of the department
- `subdepartment_id` (optional): UUID or string ID of the subdepartment

**Response:**
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174001",
    "name": "Financial Reporting",
    "department_id": "123e4567-e89b-12d3-a456-426614174005",
    "department_name": "Finance",
    "subdepartment_id": "123e4567-e89b-12d3-a456-426614174006",
    "subdepartment_name": "Accounting",
    "has_bia_info": true,
    "has_impact_analysis": true
  },
  {
    "id": "123e4567-e89b-12d3-a456-426614174003",
    "name": "Accounts Payable",
    "department_id": "123e4567-e89b-12d3-a456-426614174005",
    "department_name": "Finance",
    "subdepartment_id": "123e4567-e89b-12d3-a456-426614174006",
    "subdepartment_name": "Accounting",
    "has_bia_info": false,
    "has_impact_analysis": true
  },
  {
    "id": "123e4567-e89b-12d3-a456-426614174007",
    "name": "Budget Planning",
    "department_id": "123e4567-e89b-12d3-a456-426614174005",
    "department_name": "Finance",
    "subdepartment_id": "123e4567-e89b-12d3-a456-426614174008",
    "subdepartment_name": "Financial Planning",
    "has_bia_info": true,
    "has_impact_analysis": false
  }
]
```

### Get Organization Impact Analysis

Retrieves impact analysis for all processes in an organization.

**Endpoint:** `GET /bia/impact-analysis/organization/{organization_id}`

**Path Parameters:**
- `organization_id`: UUID of the organization

**Response:**
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174001",
    "name": "Financial Reporting",
    "department_name": "Finance",
    "subdepartment_name": "Accounting",
    "impact_analysis": {
      "id": "123e4567-e89b-12d3-a456-426614174004",
      "rto": 4,
      "mtpd": 7,
      "impact_data": {
        "financial": {
          "day1": "Low",
          "day3": "Medium",
          "day7": "High",
          "day14": "Very High",
          "day30": "Very High"
        },
        "operational": {
          "day1": "Medium",
          "day3": "High",
          "day7": "Very High",
          "day14": "Very High",
          "day30": "Very High"
        },
        "regulatory": {
          "day1": "Low",
          "day3": "Medium",
          "day7": "High",
          "day14": "High",
          "day30": "Very High"
        }
      },
      "highest_impact": {
        "category": "operational",
        "level": "Very High",
        "day": 7
      },
      "is_critical": true,
      "rationale": "Critical financial reporting process with regulatory implications"
    }
  },
  {
    "id": "123e4567-e89b-12d3-a456-426614174003",
    "name": "Accounts Payable",
    "department_name": "Finance",
    "subdepartment_name": "Accounting",
    "impact_analysis": {
      "id": "123e4567-e89b-12d3-a456-426614174009",
      "rto": 2,
      "mtpd": 5,
      "impact_data": {
        "financial": {
          "day1": "Medium",
          "day3": "High",
          "day7": "Very High",
          "day14": "Very High",
          "day30": "Very High"
        },
        "operational": {
          "day1": "High",
          "day3": "Very High",
          "day7": "Very High",
          "day14": "Very High",
          "day30": "Very High"
        },
        "regulatory": {
          "day1": "Low",
          "day3": "Medium",
          "day7": "High",
          "day14": "High",
          "day30": "Very High"
        }
      },
      "highest_impact": {
        "category": "operational",
        "level": "Very High",
        "day": 3
      },
      "is_critical": true,
      "rationale": "Critical accounts payable process"
    }
  },
  {
    "id": "123e4567-e89b-12d3-a456-426614174007",
    "name": "Budget Planning",
    "department_name": "Finance",
    "subdepartment_name": "Financial Planning",
    "impact_analysis": null
  }
]
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "detail": "Invalid request format or parameters"
}
```

### 401 Unauthorized
```json
{
  "detail": "Not authenticated"
}
```

### 403 Forbidden
```json
{
  "detail": "Not enough permissions"
}
```

### 404 Not Found
```json
{
  "detail": "Resource not found"
}
```

### 422 Unprocessable Entity
```json
{
  "detail": "Validation error"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Internal server error"
}
```

## Notes on JSON Fields

The `impact_data` and `highest_impact` fields are stored as TEXT in the database and are automatically serialized/deserialized when interacting with the API. These fields can contain complex JSON structures of any size.

## Using Real Process IDs

When working with the BIA module, always use the real process IDs returned by the `/bia/organization/{organization_id}/processes` endpoint rather than mock or dummy IDs. This ensures proper data association and retrieval.
