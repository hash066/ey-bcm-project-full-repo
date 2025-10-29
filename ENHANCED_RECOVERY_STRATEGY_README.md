# Enhanced Recovery Strategy Module

This document describes the enhanced recovery strategy module with dynamic configuration, AI-generated content, and process vulnerability analysis.

## New Features

### 1. Dynamic Recovery Strategy Configuration

The recovery strategy module now supports dynamic configuration based on database data:

- **Department-level Configuration**: Each department can have its own recovery strategy configuration
- **Enabled Strategies**: Departments can choose which strategy categories to enable (people, technology, site, vendor, process_vulnerability)
- **Strategy Templates**: Departments can define templates that cascade to all processes
- **Cascading Changes**: Changes at department level automatically apply to all processes in that department

### 2. Process Vulnerability Strategy

A new recovery strategy category has been added:

- **Process Vulnerability Analysis**: Identifies and mitigates process-specific vulnerabilities
- **Risk Assessment**: Categorizes vulnerabilities by type (operational, technical, compliance, security)
- **Mitigation Strategies**: Provides specific mitigation approaches for each vulnerability type
- **Risk Levels**: Assigns risk levels (high, medium, low) to vulnerabilities

### 3. AI-Generated Sections

The module now includes AI-powered content generation:

- **Automated Strategy Generation**: AI generates recovery strategies based on process context
- **Vulnerability Analysis**: AI identifies potential vulnerabilities and suggests mitigations
- **AI Insights**: Provides risk scores, criticality levels, and improvement recommendations
- **Caching**: AI-generated content is cached to improve performance
- **Force Regeneration**: Option to force regeneration of AI content

### 4. Departmental Level Changes

Department-level configuration that reflects in process-level changes:

- **Configuration Inheritance**: Processes inherit configuration from their department
- **Template Application**: Department templates are applied to processes with empty strategies
- **Bulk Updates**: Changes to department configuration update all related processes
- **Override Capability**: Individual processes can override department defaults

## API Endpoints

### Enhanced Recovery Strategy Endpoints

```
GET /enhanced-recovery-strategies/
- Get all departments with dynamic recovery strategies

GET /enhanced-recovery-strategies/department/{department_id}/config
- Get recovery configuration for a specific department

PUT /enhanced-recovery-strategies/department/{department_id}/config
- Update recovery configuration for a department

POST /enhanced-recovery-strategies/generate-ai-content
- Generate AI content for recovery strategies

POST /enhanced-recovery-strategies/process/{process_id}/generate-ai
- Generate AI content for a specific process

POST /enhanced-recovery-strategies/department/{department_id}/generate-ai
- Generate AI content for all processes in a department
```

## Database Schema Changes

### New Tables

#### department_recovery_config
- `department_id` (UUID, Primary Key)
- `default_enabled_strategies` (Text)
- `people_strategy_template` (Text)
- `technology_strategy_template` (Text)
- `site_strategy_template` (Text)
- `vendor_strategy_template` (Text)
- `process_vulnerability_strategy_template` (Text)
- `enable_ai_generation` (Boolean)
- `ai_generation_frequency` (Text)
- `created_at` (DateTime)
- `updated_at` (DateTime)

### Enhanced Tables

#### recovery_strategies (new columns)
- `process_vulnerability_strategy` (Text)
- `process_vulnerability_reasoning` (Text)
- `process_vulnerability_status` (Text)
- `enabled_strategies` (Text)
- `ai_generated_sections` (Text)
- `ai_last_updated` (DateTime)

## Frontend Enhancements

### New UI Components

1. **AI Generation Button**: Allows users to generate AI content for recovery strategies
2. **AI Insights Panel**: Displays AI-generated insights including risk scores and recommendations
3. **Vulnerability Analysis Section**: Shows identified vulnerabilities with mitigation strategies
4. **Process Vulnerability Strategy Card**: New strategy category in the UI
5. **Dynamic Strategy Display**: Only shows enabled strategy categories

### Enhanced Features

- **Real-time AI Generation**: Users can generate AI content on-demand
- **Enhanced Export**: Excel export includes AI insights and vulnerability analysis
- **Visual Indicators**: Different colors and icons for AI-generated content
- **Responsive Design**: All new components are responsive and mobile-friendly

## Configuration Examples

### Department Configuration
```json
{
  "default_enabled_strategies": "people,technology,site,vendor,process_vulnerability",
  "enable_ai_generation": true,
  "ai_generation_frequency": "weekly",
  "people_strategy_template": "Cross-train team members and establish backup personnel...",
  "process_vulnerability_strategy_template": "Implement comprehensive risk assessment..."
}
```

### AI Generation Request
```json
{
  "process_id": "uuid-here",
  "content_types": ["all"],
  "force_regenerate": true
}
```

## Usage Instructions

### 1. Configure Department Settings
1. Navigate to department configuration endpoint
2. Set enabled strategies and templates
3. Configure AI generation settings
4. Save configuration (automatically cascades to processes)

### 2. Generate AI Content
1. Use the "Generate AI Content" button in the UI
2. Or call the API endpoint with appropriate parameters
3. AI will generate strategies, insights, and vulnerability analysis
4. Content is cached for 24 hours by default

### 3. View Enhanced Strategies
1. Recovery strategies now show only enabled categories
2. AI insights panel displays risk scores and recommendations
3. Vulnerability analysis shows identified risks and mitigations
4. Process vulnerability strategy appears as a new category

## Migration Instructions

1. Run the database migration:
   ```bash
   alembic upgrade head
   ```

2. Update frontend dependencies if needed

3. Restart the application to load new endpoints

4. Configure department settings through the API or admin interface

## Testing

Run the test script to verify functionality:
```bash
python test_enhanced_recovery.py
```

## Performance Considerations

- AI content is cached for 24 hours to reduce API calls
- Department configuration changes are batched for efficiency
- Vulnerability analysis is generated asynchronously
- Large departments may take longer for bulk AI generation

## Security Notes

- AI-generated content should be reviewed before implementation
- Department configuration changes require appropriate permissions
- API endpoints include proper authentication and authorization
- Sensitive data is not sent to external AI services

## Future Enhancements

- Real-time collaboration on strategy development
- Integration with external risk management systems
- Advanced AI models for more accurate vulnerability detection
- Automated strategy testing and validation
- Integration with business continuity planning tools