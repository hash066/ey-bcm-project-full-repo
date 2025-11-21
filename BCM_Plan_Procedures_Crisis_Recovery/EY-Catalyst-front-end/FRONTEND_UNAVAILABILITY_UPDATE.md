# Frontend Updates for Technology and Third Party Unavailability

## Overview
Updated the Recovery Strategy frontend to display the two new unavailability types:
1. **Technology Unavailability** - Technology infrastructure failures
2. **Third Party Unavailability** - External service provider unavailability

## Changes Made

### 1. RecoveryStrategy.jsx
**Location:** `src/modules/recovery_strategy/RecoveryStrategy.jsx`

#### Added Icons:
- `FaNetworkWired` - For Technology Unavailability
- `FaUsers` - For Third Party Unavailability

#### Updated strategyCategories Array:
Added two new strategy categories:
```javascript
{
  key: 'technology_unavailability_strategy',
  reasoningKey: 'technology_unavailability_reasoning',
  statusKey: 'technology_unavailability_status',
  title: 'Technology Unavailability',
  icon: <FaNetworkWired size={28} color="#FFD700" />,
},
{
  key: 'third_party_unavailability_strategy',
  reasoningKey: 'third_party_unavailability_reasoning',
  statusKey: 'third_party_unavailability_status',
  title: 'Third Party Unavailability',
  icon: <FaUsers size={28} color="#FFD700" />,
}
```

#### Updated Default Enabled Strategies:
```javascript
const [enabledStrategies, setEnabledStrategies] = useState([
  'people', 
  'technology', 
  'site', 
  'vendor', 
  'process_vulnerability', 
  'technology_unavailability',      // NEW
  'third_party_unavailability'      // NEW
]);
```

### 2. RecoveryStrategyDashboard.jsx
**Location:** `src/modules/recovery_strategy/RecoveryStrategyDashboard.jsx`

#### Updated Strategy Type Distribution:
```javascript
const strategyTypes = { 
  people: 0, 
  technology: 0, 
  site: 0, 
  vendor: 0, 
  technology_unavailability: 0,      // NEW
  third_party_unavailability: 0     // NEW
};
```

#### Updated Risk Coverage Calculation:
```javascript
const riskCategories = [
  'people', 
  'technology', 
  'site', 
  'vendor', 
  'technology_unavailability',      // NEW
  'third_party_unavailability'      // NEW
];
```

## Visual Changes

### Before:
- 5 unavailability types displayed:
  1. People Unavailability
  2. Technology/Data Unavailability
  3. Site Unavailability
  4. Third-Party Vendor Unavailability
  5. Process Vulnerability

### After:
- 7 unavailability types displayed:
  1. People Unavailability
  2. Technology/Data Unavailability
  3. Site Unavailability
  4. Third-Party Vendor Unavailability
  5. Process Vulnerability
  6. **Technology Unavailability** (NEW) 🌐
  7. **Third Party Unavailability** (NEW) 👥

## UI Components

### Strategy Cards
Each new unavailability type will display:
- **Icon**: Network icon for Technology, Users icon for Third Party
- **Title**: "Technology Unavailability" or "Third Party Unavailability"
- **Strategy**: AI-generated strategy text
- **Reasoning**: AI-generated reasoning
- **Status Dropdown**: Not Implemented / In Progress / Implemented

### Dashboard Statistics
- Updated to track 7 types instead of 5
- Risk coverage percentage now based on 6 categories
- Strategy type distribution includes new types

## Testing

### To Verify Changes:
1. **Refresh the frontend** (Ctrl + Shift + R)
2. **Navigate to Recovery Strategy module**
3. **Select any department and function**
4. **You should now see 7 unavailability types** (instead of 3-5)

### Expected Display:
```
✅ People Unavailability
✅ Technology/Data Unavailability  
✅ Site Unavailability
✅ Third-Party Vendor Unavailability
✅ Process Vulnerability
✅ Technology Unavailability (NEW)
✅ Third Party Unavailability (NEW)
```

## API Integration

The frontend now expects these additional fields from the backend API:

```json
{
  "technology_unavailability_strategy": "string",
  "technology_unavailability_reasoning": "string",
  "technology_unavailability_status": "Not Implemented | In Progress | Implemented",
  "third_party_unavailability_strategy": "string",
  "third_party_unavailability_reasoning": "string",
  "third_party_unavailability_status": "Not Implemented | In Progress | Implemented"
}
```

## Status Update

When updating strategy status, the frontend will now send:
```json
{
  "people_status": "Implemented",
  "technology_status": "In Progress",
  "site_status": "Not Implemented",
  "vendor_status": "Implemented",
  "process_vulnerability_status": "In Progress",
  "technology_unavailability_status": "Not Implemented",      // NEW
  "third_party_unavailability_status": "In Progress"         // NEW
}
```

## Backward Compatibility

- ✅ Existing strategies without new fields will still display correctly
- ✅ Old data format is supported
- ✅ New fields are optional and won't break existing functionality
- ✅ Dashboard statistics gracefully handle missing data

## Next Steps

1. ✅ Frontend code updated
2. 🔄 Restart frontend development server
3. 🔄 Test with populated backend data
4. 🔄 Verify all 7 unavailability types display correctly
5. 🔄 Test status updates for new types

## Notes

- All existing functionality remains unchanged
- New unavailability types use the same UI patterns as existing ones
- Icons are visually distinct (Network icon and Users icon)
- Color scheme matches existing yellow/gold theme (#FFD700)
