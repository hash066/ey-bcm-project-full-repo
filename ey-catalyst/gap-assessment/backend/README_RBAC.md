# Hierarchical RBAC and Multi-Stage Approval System

This document describes the implementation of the hierarchical Role-Based Access Control (RBAC) and multi-stage approval workflow system for the Gap Assessment module.

## 🎯 Overview

The system adds a comprehensive approval layer on top of the existing gap assessment functionality without modifying the core business logic. It enforces role-based permissions and requires multi-stage approval for sensitive operations like clause edits and framework additions.

## 🏗️ Architecture

### Role Hierarchy

The system implements a 4-level role hierarchy:

1. **Process Owner** (Level 1)
   - Can submit clause-level edits and framework suggestions
   - Can view their own submissions and pending approvals
   - Cannot approve requests

2. **Department Head** (Level 2)
   - Can review and approve Process Owner submissions
   - Can submit framework additions
   - Can manage users within their department
   - Can view department-level analytics

3. **Organization Head** (Level 3)
   - Can review and approve Department Head submissions
   - Can manage all users in the organization
   - Can approve framework additions
   - Can view organization-wide analytics

4. **EY Admin** (Level 4)
   - Has global oversight and final approval authority
   - Can manage all users and frameworks
   - Can escalate requests and override approval chains
   - Can view system-wide analytics

### Approval Workflow

The approval process follows the hierarchy:

```
Process Owner → Department Head → Organization Head → EY Admin
```

- **Clause Edits**: Always require approval from Department Head and above
- **Framework Additions**: Require approval from Organization Head and above
- **User Management**: Higher roles can create/manage lower roles
- **System Administration**: Only EY Admins can perform administrative tasks

## 🗄️ Database Schema

### Core Tables

#### `users`
- `id`: Primary key
- `email`: Unique user identifier
- `name`: Full name
- `role`: Role in hierarchy (process_owner, department_head, organization_head, ey_admin)
- `department`: User's department
- `organization`: User's organization
- `hashed_password`: Encrypted password
- `is_active`: Account status
- `created_at`, `updated_at`: Timestamps

#### `approval_requests`
- `id`: Primary key
- `type`: Request type (clause_edit, framework_addition)
- `title`: Request title
- `payload`: JSON request data
- `submitted_by`: Foreign key to users
- `current_approver_role`: Current role in approval chain
- `status`: Request status (pending, approved, rejected)
- `approval_history`: JSON array of approval steps
- `created_at`, `updated_at`: Timestamps

#### `approval_steps`
- `id`: Primary key
- `request_id`: Foreign key to approval_requests
- `role`: Role that performed approval
- `approver_id`: Foreign key to users (nullable for auto-approval)
- `decision`: Approval decision (approved, rejected)
- `comments`: Optional comments
- `timestamp`: Approval timestamp

#### `frameworks`
- `id`: Primary key
- `name`: Framework name
- `version`: Framework version
- `description`: Framework description
- `content`: JSON framework definition
- `submitted_by`: Foreign key to users
- `approved_by`: Foreign key to users (nullable)
- `global_available`: Availability flag
- `created_at`, `updated_at`: Timestamps

#### `training_corpus`
- `id`: Primary key
- `clause_id`: Reference to clause/control
- `remedy`: Remedy text
- `source`: Source of remedy (AI, manual, etc.)
- `approval_status`: Approval status
- `submitted_by`: Foreign key to users
- `approved_by`: Foreign key to users (nullable)
- `created_at`, `updated_at`: Timestamps

## 🔐 Authentication & Security

### JWT Authentication
- Uses JWT tokens with configurable expiration
- Secure password hashing with bcrypt
- Role-based token validation

### Password Requirements
- Minimum 8 characters (enforced in API)
- bcrypt hashing with salt rounds
- Secure password reset functionality

## 🚀 API Endpoints

### Authentication (`/api/auth/`)

#### Login
```http
POST /api/auth/login
Content-Type: application/x-www-form-urlencoded

username=user@company.com&password=password123
```

#### User Management
```http
GET    /api/auth/me                    # Get current user
PUT    /api/auth/me                    # Update current user
GET    /api/auth/users                 # List all users (Department Head+)
GET    /api/auth/users/{id}            # Get specific user
PUT    /api/auth/users/{id}            # Update user (Organization Head+)
DELETE /api/auth/users/{id}            # Deactivate user (Organization Head+)
POST   /api/auth/register              # Create new user (Department Head+)
GET    /api/auth/roles                 # Get available roles
GET    /api/auth/permissions/check     # Check user permissions
GET    /api/auth/stats                 # Get user statistics
```

### Approval Workflow (`/api/approval/`)

#### Submit Requests
```http
POST /api/approval/clause-edit         # Submit clause edit for approval
POST /api/approval/framework-addition  # Submit framework addition for approval
```

#### Manage Requests
```http
GET    /api/approval/requests           # Get approval requests (paginated)
GET    /api/approval/requests/{id}      # Get specific request
GET    /api/approval/pending           # Get pending approvals for user
POST   /api/approval/requests/{id}/approve  # Approve/reject request
GET    /api/approval/requests/{id}/steps   # Get approval steps
GET    /api/approval/dashboard/stats   # Get dashboard statistics
```

### Framework Management (`/api/framework/`)

```http
POST   /api/framework/                 # Create framework (Department Head+)
GET    /api/framework/                 # List frameworks (paginated)
GET    /api/framework/{id}             # Get framework details
PUT    /api/framework/{id}             # Update framework (Organization Head+)
DELETE /api/framework/{id}             # Delete framework (EY Admin only)
GET    /api/framework/available/list   # Get available frameworks
POST   /api/framework/{id}/approve     # Approve framework (Organization Head+)
GET    /api/framework/stats/summary    # Get framework statistics
```

### Training Corpus (`/api/training/`)

```http
POST   /api/training/                  # Create training entry (Process Owner+)
GET    /api/training/                  # List training entries (paginated)
GET    /api/training/{id}              # Get training entry
PUT    /api/training/{id}              # Update training entry
DELETE /api/training/{id}              # Delete training entry (Department Head+)
POST   /api/training/{id}/approve      # Approve training entry (Department Head+)
POST   /api/training/{id}/reject       # Reject training entry (Department Head+)
GET    /api/training/approved/list     # Get approved entries for AI training
GET    /api/training/pending/approvals # Get pending approvals (Department Head+)
GET    /api/training/stats/summary     # Get training statistics
```

### Enhanced Controls (`/api/controls/`)

```http
POST   /api/controls/{id}/edit         # Edit control with approval workflow
GET    /api/controls/{id}/approval-status  # Get approval status for control
```

## 🛠️ Setup Instructions

### 1. Environment Configuration

Update your `.env` file with the new configuration variables:

```env
# Database Configuration
DATABASE_URL=sqlite:///./gap_assessment.db

# JWT Configuration
JWT_SECRET_KEY=your-secret-key-change-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24

# Existing configurations...
OPENAI_API_KEY=your_grok_api_key_here
FRONTEND_URL=http://localhost:5174
PORT=8000
ENVIRONMENT=development
MAX_UPLOAD_SIZE=10485760
LOG_LEVEL=INFO
```

### 2. Database Initialization

Run the database initialization script to create tables and default users:

```bash
cd backend
python init_db.py
```

This creates:
- Database tables
- Default users for all roles
- Sample frameworks

### 3. Default Login Credentials

After initialization, use these credentials to test the system:

- **Process Owner**: `process.owner@company.com` / `pass`
- **Department Head**: `dept.head@company.com` / `pass`
- **Organization Head**: `org.head@company.com` / `pass`
- **EY Admin**: `admin@ey.com` / `admin`

## 🔄 Integration with Existing System

The RBAC and approval system integrates seamlessly with existing functionality:

### Non-Invasive Integration
- **No changes** to existing frontend or backend logic
- **Middleware-based** approach for intercepting operations
- **Backward compatible** with existing API endpoints
- **Gradual rollout** with feature flags

### Enhanced Operations
- **Clause Edits**: Now require approval workflow
- **Framework Management**: Global database with approval
- **User Management**: Role-based user administration
- **Audit Trail**: Complete approval history tracking

## 📊 Dashboard and Analytics

The system provides comprehensive analytics:

### User Dashboard
- Personal approval statistics
- Pending approvals count
- Submission history
- Role-based permissions overview

### System Dashboard (Department Head+)
- System-wide approval metrics
- User activity summaries
- Framework utilization statistics
- Training corpus analytics

## 🔒 Security Features

### Access Control
- **Role-based permissions** with hierarchical enforcement
- **JWT token authentication** with secure password hashing
- **Session management** with configurable expiration
- **Audit logging** for all approval actions

### Data Protection
- **Encrypted passwords** using bcrypt
- **SQL injection protection** via parameterized queries
- **Input validation** with Pydantic models
- **CORS protection** for cross-origin requests

## 🧪 Testing

### Test Scenarios

1. **Role Hierarchy Testing**
   - Verify users can only access appropriate resources
   - Test approval chain escalation
   - Validate permission inheritance

2. **Approval Workflow Testing**
   - Test complete approval chains
   - Verify rejection scenarios
   - Test escalation and override functionality

3. **Integration Testing**
   - Test clause edit approval flow
   - Test framework addition workflow
   - Verify existing functionality remains intact

### Sample Test Commands

```bash
# Login as Process Owner
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=process.owner@company.com&password=pass"

# Submit clause edit for approval
curl -X POST "http://localhost:8000/api/approval/clause-edit" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "job_id": "test-job",
    "control_id": "RBI-001",
    "remedy": "Updated remedy text",
    "justification": "Business requirement change"
  }'

# Check approval status
curl -X GET "http://localhost:8000/api/approval/pending" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🚨 Error Handling

### Common Error Responses

```json
{
  "detail": "Insufficient permissions. Required roles: department_head",
  "status_code": 403
}
```

```json
{
  "detail": "Approval request not found",
  "status_code": 404
}
```

```json
{
  "detail": "Request is not in pending status",
  "status_code": 400
}
```

## 📈 Future Enhancements

### Planned Features
- **Email notifications** for approval requests
- **Bulk approval** operations for administrators
- **Advanced filtering** and search capabilities
- **Integration with external** identity providers
- **Mobile application** support
- **Advanced analytics** and reporting

### Scalability Considerations
- **Database optimization** for large-scale deployments
- **Caching layer** for frequently accessed data
- **Load balancing** for high-traffic scenarios
- **Microservices architecture** for enterprise deployments

## 📞 Support

For technical support or questions about the RBAC and approval system:

1. Check the API documentation at `/docs` when the server is running
2. Review the database schema and models in `app/models.py`
3. Examine the approval workflow logic in `app/services/approval_engine.py`
4. Test with the provided default users and credentials

## 📝 Change Log

### Version 1.0.0
- Initial implementation of hierarchical RBAC system
- Multi-stage approval workflow for clause edits and framework additions
- Database schema with audit trails
- Integration middleware for existing endpoints
- Comprehensive API documentation

---

**Note**: This system is designed to be production-ready with proper security, audit trails, and scalable architecture. All sensitive operations require appropriate approval workflows while maintaining backward compatibility with existing functionality.
