# Frontend API Configuration Fix

## Issue
The frontend was trying to connect to the wrong API endpoints:
- **Wrong Port**: Using `localhost:8000` instead of `localhost:8002`
- **Wrong Endpoint**: Using `/enhanced-recovery-strategies/` instead of `/api/recovery-strategies/`

## Error Message
```
Failed to load resource: net::ERR_CONNECTION_REFUSED
:8000/enhanced-recovery-strategies/process/proc-2/generate-ai
```

## Changes Made

### File: `EY-Catalyst-front-end/src/modules/recovery_strategy/RecoveryStrategy.jsx`

#### 1. Fixed API Port
```javascript
// Before
const API_URL = 'http://localhost:8000';
const TEST_API_URL = 'http://localhost:8002';

// After
const API_URL = 'http://localhost:8002';
const TEST_API_URL = 'http://localhost:8002';
```

#### 2. Fixed AI Generation Endpoint
```javascript
// Before
`${API_URL}/enhanced-recovery-strategies/process/${processId}/generate-ai`

// After
`${API_URL}/api/recovery-strategies/generate/${processId}`
```

#### 3. Fixed Status Update Endpoint
```javascript
// Before
`${API_URL}/recovery-strategies/${processId}/status`

// After
`${API_URL}/api/recovery-strategies/process/${processId}/status`
```

## Correct API Endpoints

### Backend Server
- **URL**: `http://localhost:8002`
- **Base Path**: `/api/recovery-strategies`

### Available Endpoints
1. **Test**: `GET /api/recovery-strategies/test`
2. **Initialize DB**: `POST /api/recovery-strategies/init-db`
3. **Get All**: `GET /api/recovery-strategies/`
4. **Get Single**: `GET /api/recovery-strategies/process/{id}`
5. **Generate with LLM**: `POST /api/recovery-strategies/generate/{id}` ✨
6. **Update Status**: `PUT /api/recovery-strategies/process/{id}/status`
7. **Generate Missing**: `POST /api/recovery-strategies/generate-missing`
8. **Get Stats**: `GET /api/recovery-strategies/stats/summary`

## Testing

After making these changes, the frontend should now:
1. ✅ Connect to the correct server port (8002)
2. ✅ Use the correct API endpoints
3. ✅ Successfully generate AI strategies
4. ✅ Successfully update strategy status

## Next Steps

1. **Refresh the frontend** in your browser (Ctrl+Shift+R or Cmd+Shift+R)
2. **Test AI Generation** by clicking the "Generate AI Content" button
3. **Test Status Update** by changing status dropdowns and clicking "Update Status"

## Expected Behavior

### AI Generation
- Click "Generate AI Content" button
- Should show loading state
- After ~60 seconds, should display success message
- Strategies should be populated with AI-generated content

### Status Update
- Change status dropdowns
- Click "Update Status"
- Should show success message
- Status should persist in database

## Troubleshooting

If you still see connection errors:
1. Verify server is running on port 8002
2. Check browser console for exact error
3. Verify CORS is enabled on backend
4. Clear browser cache and reload
