# Module Licensing Documentation

## Overview

The module licensing system allows administrators to control which Business Resilience modules each organization can access. This feature enables a license-based access model where organizations (clients) can only use the modules they have been licensed for.

## Available Modules

The system includes 12 predefined modules based on the Business Resilience Framework:

1. **Process Mapping** - Map and document critical business processes
2. **Service Mapping** - Map services to processes and infrastructure
3. **BIA Process** - Business Impact Analysis for critical processes
4. **Risk Assessment** - Identify and assess risks to business continuity
5. **Recovery Strategy Development** - Develop strategies for business recovery
6. **Business Continuity Plan Development** - Create comprehensive continuity plans
7. **Crisis Management & Communication Plan** - Plan for crisis response and communication
8. **Business Resilience Testing** - Test and validate resilience measures
9. **Continual Improvement** - Continuously improve resilience capabilities
10. **BCM Maturity & KPIs** - Measure and track business continuity maturity
11. **Internal Audit & Management Review** - Review and audit resilience measures
12. **Business Resilience Gap Assessment** - Identify and address resilience gaps

## Database Structure

The module licensing information is stored in the `licensed_modules` column of the `organization` table. This column uses the PostgreSQL JSONB type to store an array of module license objects with the following structure:

```json
[
  {
    "module_id": 1,
    "is_licensed": true,
    "expiry_date": "2026-07-23T00:00:00"
  },
  {
    "module_id": 3,
    "is_licensed": true,
    "expiry_date": null
  }
]
```

Each object in the array contains:
- `module_id`: The ID of the module (1-12)
- `is_licensed`: Boolean indicating if the module is licensed (true/false)
- `expiry_date`: Optional expiry date for the license (ISO format)

## API Endpoints

### Get Available Modules

Retrieves the list of all available modules that can be licensed.

- **URL**: `/organizations/modules/available`
- **Method**: `GET`
- **Permission Required**: Admin read permission
- **Response**:
  ```json
  {
    "modules": [
      {
        "id": 1,
        "name": "Process Mapping",
        "description": "Map and document critical business processes"
      },
      ...
    ]
  }
  ```

### Get Organization's Licensed Modules

Retrieves the modules licensed to a specific organization.

- **URL**: `/organizations/{organization_id}/modules`
- **Method**: `GET`
- **Permission Required**: Admin read permission
- **Response**:
  ```json
  {
    "modules": [
      {
        "module_id": 1,
        "is_licensed": true,
        "expiry_date": "2026-07-23T00:00:00"
      },
      ...
    ]
  }
  ```

### Update Organization's Licensed Modules

Updates the modules licensed to a specific organization.

- **URL**: `/organizations/{organization_id}/modules`
- **Method**: `PUT`
- **Permission Required**: Admin write permission
- **Request Body**:
  ```json
  {
    "modules": [
      {
        "module_id": 1,
        "is_licensed": true,
        "expiry_date": "2026-07-23T00:00:00"
      },
      {
        "module_id": 3,
        "is_licensed": true
      }
    ]
  }
  ```
- **Response**: Same as request body

## Module Access Control

The system includes middleware to check if an organization has access to a specific module:

- `check_module_access(module_id, organization_id)`: Returns a boolean indicating if the organization has access to the module
- `require_module_access(module_id, organization_id)`: Dependency that raises a 403 Forbidden error if the organization doesn't have access to the module

### Example Usage in API Endpoints

```python
@router.get("/organizations/{organization_id}/bia-processes")
async def get_organization_bia_processes(
    organization_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module_access(3, organization_id))  # Module ID 3 is BIA Process
):
    # This endpoint will only be accessible if the organization has access to the BIA Process module
    pass
```

## Frontend Integration

To integrate with the frontend, you can:

1. Check module access when rendering navigation menus
2. Disable or hide features that the organization doesn't have access to
3. Show appropriate messages when a user tries to access unlicensed features

## Best Practices

1. Always check module access before allowing users to access module-specific features
2. Use the `require_module_access` dependency for API endpoints that are specific to a module
3. Set appropriate expiry dates for time-limited licenses
4. Regularly audit module access to ensure organizations only have access to modules they've paid for
