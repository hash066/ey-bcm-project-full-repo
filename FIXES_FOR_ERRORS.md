# Fixes for Current Errors

## Issue 1: 404 Not Found on `/recovery-strategies/`

**Problem:** Test scripts are calling `/recovery-strategies/` but the actual endpoint is `/api/recovery-strategies/`

**Root Cause:** The router has prefix `/api/recovery-strategies` in `app/routers/recovery_strategy_router.py` line 36

**Fix Options:**

### Option A: Update Test Scripts (Recommended)
Change all test script URLs from:
```python
# OLD
response = requests.get('http://localhost:8002/recovery-strategies/')

# NEW
response = requests.get('http://localhost:8002/api/recovery-strategies/')
```

### Option B: Change Router Prefix
In `app/routers/recovery_strategy_router.py` line 36:
```python
# OLD
router = APIRouter(
    prefix="/api/recovery-strategies",
    ...
)

# NEW
router = APIRouter(
    prefix="/recovery-strategies",
    ...
)
```

**Recommended:** Option A - Update test scripts to use correct path

---

## Issue 2: 401 Unauthorized on `/bcm/department-plan/...`

**Problem:** Frontend is not sending JWT token in Authorization header

**Root Cause:** Frontend API calls are missing the Authorization header

**Fix:** Update frontend API service to include token

### Frontend Fix (JavaScript/React)

**File:** `EY-Catalyst-front-end/src/services/api.js` or similar

```javascript
// Get token from localStorage
const token = localStorage.getItem('brt_token');

// Add to fetch headers
const response = await fetch(url, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`  // ← ADD THIS
  }
});
```

### Quick Test to Verify Token Works

```powershell
# 1. Login and get token
$response = Invoke-RestMethod -Uri "http://localhost:8002/auth/token" `
  -Method Post `
  -ContentType "application/x-www-form-urlencoded" `
  -Body "username=admin.demo&password=Admin@123"

$token = $response.access_token

# 2. Test endpoint WITH token
$headers = @{
    "Authorization" = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:8002/bcm/department-plan/e228fe6f-ace2-47d5-9305-3ecfe1aa82f3?organization_id=11110413-8907-4b2a-a44e-58b43a172788" `
  -Headers $headers
```

---

## Issue 3: 404 Not Found on `/bcm/organization-plan`

**Problem:** Endpoint doesn't exist or returns 404

**Possible Causes:**
1. No organization plan exists in database for that organization_id
2. Endpoint expects different parameters
3. Data hasn't been created yet

**Fix:** Check if endpoint exists and what it expects

```powershell
# Check Swagger docs
Start-Process "http://localhost:8002/docs"

# Search for organization-plan endpoint
# Look at required parameters
```

---

## Quick Fix Summary

### 1. Update Test Scripts
```powershell
cd "c:\Users\inchara P\new-integration"

# Update test_rbac_access.py
# Change line with recovery-strategies URL
```

### 2. Fix Frontend Authorization
Add this to your frontend API service:

```javascript
// Create a base fetch function with auth
async function authenticatedFetch(url, options = {}) {
  const token = localStorage.getItem('brt_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return fetch(url, {
    ...options,
    headers
  });
}

// Use it for all API calls
const response = await authenticatedFetch('http://localhost:8002/bcm/department-plan/...');
```

### 3. Verify Endpoints Exist
```powershell
# Test recovery strategies endpoint
curl http://localhost:8002/api/recovery-strategies/test

# Should return: {"message": "Recovery strategy router is working!"}
```

---

## Updated Test Scripts

### Update `test_rbac_access.py`

Change the TEST_ENDPOINTS array:

```python
TEST_ENDPOINTS = [
    {
        "name": "Get BCM Department Plans",
        "method": "GET",
        "url": "/bcm/department-plans",  # This one is OK
        "params": {"organization_id": "11110413-8907-4b2a-a44e-58b43a172788"},
        "allowed_roles": ["System Admin", "CEO", "Department Head", "BCM Coordinator"]
    },
    {
        "name": "Get Recovery Strategies",
        "method": "GET",
        "url": "/api/recovery-strategies/",  # ← CHANGE THIS (add /api)
        "params": {},
        "allowed_roles": ["System Admin", "CEO", "Department Head", "SubDepartment Head", "BCM Coordinator"]
    },
    {
        "name": "Get BIA Procedure",
        "method": "GET",
        "url": "/api/enhanced-procedures/current/bia",  # This one is OK
        "params": {},
        "allowed_roles": ["System Admin", "CEO", "BCM Coordinator"]
    },
    {
        "name": "Get Current User Info",
        "method": "GET",
        "url": "/auth/me",  # This one is OK
        "params": {},
        "allowed_roles": ["System Admin", "CEO", "Department Head", "SubDepartment Head", "Process Owner", "BCM Coordinator"]
    }
]
```

### Update `quick_rbac_demo.ps1`

Change the test endpoints array:

```powershell
# Test endpoints
$testEndpoints = @(
    "/auth/me",
    "/api/recovery-strategies/",  # ← CHANGE THIS (add /api)
    "/api/enhanced-procedures/current/bia"
)
```

---

## Verification Steps

### 1. Test Recovery Strategies Endpoint
```powershell
# Should work now
curl http://localhost:8002/api/recovery-strategies/test
```

### 2. Test with Token
```powershell
# Login
$response = Invoke-RestMethod -Uri "http://localhost:8002/auth/token" `
  -Method Post `
  -ContentType "application/x-www-form-urlencoded" `
  -Body "username=admin.demo&password=Admin@123"

$token = $response.access_token

# Test BCM endpoint
$headers = @{"Authorization" = "Bearer $token"}
Invoke-RestMethod -Uri "http://localhost:8002/bcm/departments?organization_id=11110413-8907-4b2a-a44e-58b43a172788" `
  -Headers $headers
```

### 3. Check All Endpoints
```powershell
# Visit Swagger UI
Start-Process "http://localhost:8002/docs"

# Look for:
# - /api/recovery-strategies/ endpoints
# - /bcm/* endpoints
# - Check which ones require authentication
```

---

## Status

- ✅ **Recovery strategies 404** - Path should be `/api/recovery-strategies/` not `/recovery-strategies/`
- ✅ **BCM 401 errors** - Frontend needs to send Authorization header with JWT token
- ⚠️ **Organization plan 404** - May need to create data or check if endpoint exists

---

## Next Steps

1. **Update test scripts** with correct paths
2. **Update frontend** to send Authorization header
3. **Re-run tests** to verify fixes
4. **Check Swagger docs** for any other endpoint issues
