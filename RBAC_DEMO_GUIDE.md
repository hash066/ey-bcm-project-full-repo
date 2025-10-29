# RBAC Demo Guide

## Overview
This guide helps you demonstrate Role-Based Access Control (RBAC) functionality to your senior.

## Demo Users Created

| Role | Username | Password | Access Level |
|------|----------|----------|--------------|
| System Admin | admin.demo | Admin@123 | Full system access |
| CEO | ceo.demo | CEO@123 | Organization-wide view |
| Department Head | depthead.demo | DeptHead@123 | Department level access |
| SubDepartment Head | subdepthead.demo | SubDept@123 | SubDepartment level access |
| Process Owner | processowner.demo | Process@123 | Process level access |
| BCM Coordinator | bcmcoord.demo | BCM@123 | BCM coordination access |

## Quick Start

### Step 1: Create Demo Users
```powershell
cd "c:\Users\inchara P\new-integration"
python setup_demo_users.py
```

This will:
- Create 6 demo users in the database
- Assign appropriate roles to each user
- Display credentials for each user

### Step 2: Test Login for All Roles
```powershell
python test_rbac_login.py
```

This will:
- Test login for each demo user
- Display JWT tokens
- Save tokens to `demo_tokens.json` for further testing

### Step 3: Test Access Control
```powershell
python test_rbac_access.py
```

This will:
- Test various endpoints with each user's token
- Verify that users can only access authorized endpoints
- Generate a detailed report in `rbac_test_results.json`

## Manual Testing via Terminal

### Get Token for a Specific Role

**System Admin:**
```powershell
curl -X POST http://localhost:8002/auth/token ^
  -H "Content-Type: application/x-www-form-urlencoded" ^
  -d "username=admin.demo&password=Admin@123"
```

**Department Head:**
```powershell
curl -X POST http://localhost:8002/auth/token ^
  -H "Content-Type: application/x-www-form-urlencoded" ^
  -d "username=depthead.demo&password=DeptHead@123"
```

**Process Owner:**
```powershell
curl -X POST http://localhost:8002/auth/token ^
  -H "Content-Type: application/x-www-form-urlencoded" ^
  -d "username=processowner.demo&password=Process@123"
```

### Test Endpoint Access

Replace `YOUR_TOKEN` with the actual token from login response:

**Test BCM Department Plans (Should work for Admin, CEO, Dept Head):**
```powershell
curl "http://localhost:8002/bcm/department-plans?organization_id=11110413-8907-4b2a-a44e-58b43a172788" ^
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Test Recovery Strategies (Should work for most roles):**
```powershell
curl http://localhost:8002/recovery-strategies/ ^
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Test BIA Procedure (Should work for Admin, CEO, BCM Coordinator):**
```powershell
curl http://localhost:8002/api/enhanced-procedures/current/bia ^
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Frontend Testing

### Option 1: Use Browser Console
1. Open your frontend application
2. Open browser DevTools (F12)
3. Go to Console tab
4. Run this to set the token:
```javascript
// For System Admin
localStorage.setItem('brt_token', 'YOUR_ADMIN_TOKEN_HERE');

// For Department Head
localStorage.setItem('brt_token', 'YOUR_DEPTHEAD_TOKEN_HERE');
```
5. Refresh the page
6. Navigate to different pages to see role-based access

### Option 2: Login via UI
If your frontend has a login page:
1. Use the credentials from the table above
2. Login with different roles
3. Navigate through the application
4. Observe that each role sees only their authorized content

## Expected Behavior

### System Admin (admin.demo)
- ✅ Can access ALL endpoints
- ✅ Can view all BCM plans
- ✅ Can manage all procedures
- ✅ Can view all recovery strategies
- ✅ Full CRUD operations

### CEO (ceo.demo)
- ✅ Can view organization-wide data
- ✅ Can access BCM plans
- ✅ Can view procedures
- ❌ Cannot modify system settings

### Department Head (depthead.demo)
- ✅ Can view their department's data
- ✅ Can access department BCM plans
- ✅ Can manage department processes
- ❌ Cannot access other departments' data

### SubDepartment Head (subdepthead.demo)
- ✅ Can view their subdepartment's data
- ✅ Can manage subdepartment processes
- ❌ Cannot access other subdepartments' data

### Process Owner (processowner.demo)
- ✅ Can view their assigned processes
- ✅ Can update process information
- ❌ Cannot access other processes

### BCM Coordinator (bcmcoord.demo)
- ✅ Can coordinate BCM activities
- ✅ Can view BCM procedures
- ✅ Can access recovery strategies
- ❌ Limited administrative access

## Demonstrating to Your Senior

### Scenario 1: Show Different Role Access
1. Login as **admin.demo** → Show full access to all pages
2. Logout and login as **processowner.demo** → Show limited access
3. Try to access admin pages → Show 403 Forbidden error

### Scenario 2: Show API-Level RBAC
1. Run `test_rbac_access.py` → Show the test results
2. Point out that different roles get different HTTP status codes
3. Explain: 200 = Allowed, 403 = Forbidden, 401 = Unauthorized

### Scenario 3: Show Token-Based Authentication
1. Run `test_rbac_login.py` → Show JWT tokens being generated
2. Explain that each token contains role information
3. Show that expired/invalid tokens are rejected

## Cleanup After Demo

To remove demo users after demonstration:
```sql
-- Connect to your database and run:
DELETE FROM user_roles WHERE user_id IN (
  SELECT id FROM users WHERE username LIKE '%.demo'
);

DELETE FROM users WHERE username LIKE '%.demo';
```

Or keep them for future demos!

## Troubleshooting

### Issue: 401 Unauthorized
- **Cause**: Token is missing or invalid
- **Solution**: Login again to get a fresh token

### Issue: 403 Forbidden
- **Cause**: User doesn't have permission for this resource
- **Solution**: This is expected! It shows RBAC is working

### Issue: Login fails for demo users
- **Cause**: Users not created in database
- **Solution**: Run `setup_demo_users.py` again

### Issue: All roles can access everything
- **Cause**: RBAC middleware not properly configured
- **Solution**: Check `app/middleware/auth.py` and endpoint dependencies

## API Documentation

Access Swagger UI for interactive API testing:
```
http://localhost:8002/docs
```

Use the "Authorize" button and paste your JWT token to test endpoints interactively.

---

**Note**: These are demo credentials for testing purposes only. Do not use in production!
