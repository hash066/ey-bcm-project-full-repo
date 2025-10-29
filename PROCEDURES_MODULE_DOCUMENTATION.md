# Procedures Module Documentation

## Overview

The Procedures module provides comprehensive functionality for managing Business Continuity Management (BCM) procedure documents. It supports three main types of procedures:

1. **BIA Procedures** - Business Impact Analysis procedures
2. **Risk Assessment Procedures** - Risk assessment and management procedures  
3. **BCM Plan Development Procedures** - Business continuity plan development procedures

## Features

### Core Functionality
- **Document Management**: Create, read, update, and delete procedure documents
- **Version Control**: Track document versions and change history
- **Template System**: Pre-defined templates for different procedure types
- **PDF Export**: Generate downloadable PDF documents
- **Organization Integration**: Automatically pulls organization-specific data

### AI-Powered Enhancements
- **LLM Integration**: Uses external LLM endpoints for content generation
- **Dynamic Content**: Generates contextual content based on organization data
- **Fallback Content**: Provides hardcoded content when LLM is unavailable
- **Content Caching**: Caches LLM-generated content for performance
- **Impact Scale Matrix**: AI-generated impact severity scales
- **Peak Period Prediction**: AI-predicted peak operational periods

## Architecture

### Frontend Structure
```
EY-Catalyst-front-end/src/modules/procedures/
├── components/
│   ├── ProceduresDashboard.jsx      # Main dashboard
│   ├── ProceduresContainer.jsx      # Routing container
│   ├── BIAProcedure.jsx            # BIA procedure component
│   ├── RiskAssessmentProcedure.jsx # Risk assessment component
│   └── BcmPlanProcedure.jsx        # BCM plan component
├── services/
│   ├── llmService.js               # LLM integration (existing)
│   └── proceduresApiService.js     # Backend API integration (new)
└── README.md                       # Module documentation
```

### Backend Structure
```
backend_brt/app/
├── routers/
│   └── procedures_router.py        # API endpoints
├── models/
│   └── procedures_models.py        # Database models
├── schemas/
│   └── procedures.py               # Pydantic schemas
├── services/
│   ├── procedures_service.py       # Business logic
│   └── llm_integration_service.py  # LLM service
└── alembic/versions/
    └── add_procedures_tables.py    # Database migration
```

## Database Schema

### Tables Created
1. **procedure_documents** - Main procedure documents
2. **procedure_change_log** - Document change history
3. **procedure_templates** - Procedure templates
4. **llm_content_cache** - Cached LLM content
5. **procedure_exports** - Export tracking

### Key Relationships
- One-to-many: ProcedureDocument → ProcedureChangeLog
- One-to-many: ProcedureDocument → ProcedureExport
- Caching: LLMContentCache (by organization and content type)

## API Endpoints

### Core Endpoints
- `GET /procedures/templates` - Get procedure templates
- `GET /procedures/{type}-procedure/{org_id}` - Get procedure by type
- `POST /procedures/{type}-procedure/{org_id}` - Create/update procedure
- `POST /procedures/generate-llm-content` - Generate LLM content
- `GET /procedures/organization/{org_id}/procedures` - Get all org procedures
- `DELETE /procedures/procedure/{id}` - Delete procedure
- `GET /procedures/procedure/{id}/export` - Export procedure

### Procedure Types
- `bia` - Business Impact Analysis
- `risk_assessment` - Risk Assessment
- `bcm_plan` - BCM Plan Development

## LLM Integration

### External LLM Endpoints Used
1. **`/get-description`** - Generates descriptions for processes and departments
2. **`/get-peak-period/`** - Predicts peak operational periods
3. **`/get-impact-scale-matrix`** - Generates impact severity scales
4. **`/generate-bcm-policy`** - Generates BCM policies
5. **`/generate-bcm-questions`** - Generates BCM questions

### LLM Service Configuration
- **Base URL**: `https://Prithivi-nanda-EY-catalyst.hf.space`
- **Authentication**: Bearer token authentication
- **Error Handling**: Graceful fallback to hardcoded content
- **Caching**: 24-hour cache for generated content

## Content Generation

### AI-Generated Content Types

#### BIA Procedures
- Introduction, Scope, Objective, Methodology
- Impact parameters and critical processes
- Peak periods for departments
- Impact scale matrices

#### Risk Assessment Procedures  
- Introduction, Scope, Objective, Methodology
- Risk parameters and control effectiveness
- Risk value matrices

#### BCM Plan Procedures
- Introduction, Scope, Objective, Methodology
- BCM policies and questions
- Critical processes and peak periods

### Fallback Content
When LLM endpoints are unavailable, the system uses:
- Hardcoded content based on procedure templates
- Default impact matrices and risk assessments
- Standard BCM questions and policies

## Usage Instructions

### For Developers

#### 1. Setup Backend
```bash
# Install dependencies
pip install -r requirements.txt

# Run database migration
alembic upgrade head

# Start the server
python main.py
```

#### 2. Test API Endpoints
```bash
# Run the test script
python test_procedures_api.py
```

#### 3. Frontend Integration
```javascript
import { 
  getBIAProcedure, 
  generateEnhancedLLMContent,
  saveProcedureDocument 
} from './services/proceduresApiService';

// Load procedure
const procedure = await getBIAProcedure(organizationId);

// Generate AI content
const llmResult = await generateEnhancedLLMContent(
  'bia', 
  organizationName, 
  organizationId
);

// Save procedure
await saveProcedureDocument('bia', organizationId, documentData);
```

### For End Users

#### 1. Navigate to Procedures
- Click on "Procedures" from the main dashboard
- Select the desired procedure type (BIA, Risk Assessment, or BCM Plan)

#### 2. Generate AI Content
- Click "Generate with AI" to create enhanced content
- Toggle AI content on/off in edit mode
- Review and customize generated content

#### 3. Edit Documents
- Use "Edit" mode to modify document information
- Update change log entries
- Configure organization settings

#### 4. Export Documents
- Click "Generate PDF" to download the final document
- Documents include all selected content and formatting

## Configuration

### Environment Variables
```bash
# LLM API Configuration
LLM_API_URL=https://Prithivi-nanda-EY-catalyst.hf.space
HF_API_KEY=your_hugging_face_api_key

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost/dbname
```

### Organization Integration
- **Criticality Threshold**: Automatically loaded from organization settings
- **Organization Name**: Retrieved from user authentication
- **Impact Matrix**: Fetched from organization-specific data

## Error Handling

### Backend Error Handling
- **LLM Failures**: Graceful fallback to hardcoded content
- **Database Errors**: Proper rollback and error messages
- **Authentication**: JWT token validation
- **Validation**: Pydantic schema validation

### Frontend Error Handling
- **Network Issues**: Displays appropriate error messages
- **Missing Data**: Shows warnings for incomplete data
- **PDF Generation**: Validates content before generation
- **LLM Timeouts**: Falls back to cached or default content

## Performance Optimizations

### Caching Strategy
- **LLM Content**: 24-hour cache for generated content
- **Templates**: Cached procedure templates
- **Organization Data**: Cached organization settings

### Database Optimizations
- **Indexes**: On frequently queried columns
- **JSON Storage**: For flexible content storage
- **Relationships**: Proper foreign key constraints

## Security Considerations

### Authentication & Authorization
- **JWT Tokens**: Required for all API endpoints
- **User Validation**: Verify user access to organizations
- **Role-Based Access**: Future enhancement for role-based permissions

### Data Protection
- **Input Validation**: Pydantic schemas for all inputs
- **SQL Injection**: SQLAlchemy ORM protection
- **XSS Protection**: Proper content sanitization

## Testing

### Backend Tests
```bash
# Run the test script
python test_procedures_api.py
```

### Test Coverage
- Authentication flow
- CRUD operations for all procedure types
- LLM content generation
- Error handling scenarios
- Export functionality

## Future Enhancements

### Planned Features
- **Document Upload**: Integration with document upload endpoints
- **Process Mapping**: AI-powered process mapping from uploaded files
- **Custom Templates**: User-defined document templates
- **Collaboration**: Multi-user editing capabilities
- **Workflow**: Approval workflows for document changes
- **Notifications**: Email notifications for document updates

### Technical Improvements
- **Real-time Collaboration**: WebSocket integration
- **Advanced Caching**: Redis integration
- **File Storage**: S3 integration for document storage
- **Analytics**: Usage analytics and reporting
- **API Versioning**: Versioned API endpoints

## Troubleshooting

### Common Issues

#### 1. LLM Content Generation Fails
- **Cause**: External LLM service unavailable
- **Solution**: System automatically falls back to hardcoded content
- **Check**: Network connectivity and API key validity

#### 2. PDF Generation Issues
- **Cause**: Missing organization data or content
- **Solution**: Verify organization settings and content verification
- **Check**: Browser console for detailed error messages

#### 3. Database Connection Errors
- **Cause**: Database unavailable or migration not run
- **Solution**: Run `alembic upgrade head` and check database connection
- **Check**: Database logs and connection string

#### 4. Authentication Failures
- **Cause**: Invalid or expired JWT token
- **Solution**: Re-authenticate and refresh token
- **Check**: Token expiration and user permissions

### Debug Mode
Enable debug logging by setting:
```python
logging.basicConfig(level=logging.DEBUG)
```

## Support

For technical support or questions:
1. Check the error logs in browser console and server logs
2. Verify API endpoint availability using the test script
3. Review the database migration status
4. Check LLM service connectivity

## Version History

- **v1.0.0** - Initial implementation with basic CRUD operations
- **v1.1.0** - Added LLM integration and content generation
- **v1.2.0** - Added caching and performance optimizations
- **v1.3.0** - Added export functionality and enhanced error handling