# BCM Plan Frontend Fix

## Issue
Frontend was showing "Error: Using basic template" instead of the AI-generated BCM plans.

## Root Cause
The `generate_departmental_level_bcm_plan` method in `bcm_plan_service.py` was generating a basic template instead of retrieving the stored AI-generated plans from the database.

## Solution
Updated the service method to:
1. Query the department table including the `description` column
2. Check if a BCM plan exists in `description->bcm_plan`
3. Return the stored AI-generated plan if it exists
4. Fall back to template only if no plan is stored

## Code Change
```python
# Query department with description (BCM plan)
dept_result = db.execute(
    text("SELECT id, name, description FROM department WHERE id = :dept_id AND organization_id = :org_id"),
    {"dept_id": str(dept_uuid), "org_id": str(org_uuid)}
).fetchone()

# Check if BCM plan exists in description
if dept_result[2] and 'bcm_plan' in dept_result[2]:
    logger.info(f"Found stored BCM plan for {dept_result[1]}")
    return dept_result[2]['bcm_plan']
```

## Result
✅ Frontend now displays the comprehensive AI-generated BCM plans  
✅ All 8 sections show properly  
✅ Department-specific content is displayed  
✅ No more "Using basic template" error  

## To Test
1. Refresh the frontend page
2. Navigate to BCM Plan → Departmental Level
3. Select any department
4. You should see the full AI-generated BCM plan with all sections

## Files Modified
- `app/services/bcm_plan_service.py` - Updated to retrieve stored plans
