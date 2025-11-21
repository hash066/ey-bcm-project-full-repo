# 🗄️ Business Resilience Tool - Database Schema

**Database Type**: PostgreSQL (Supabase)  
**Connection**: `aws-0-ap-south-1.pooler.supabase.com:5432`  
**Database Name**: `postgres`  
**Generated**: October 25, 2025

---

## 📋 Table of Contents

1. [Core Tables](#core-tables)
2. [RBAC & Authentication](#rbac--authentication)
3. [BCM Module](#bcm-module)
4. [BIA Module](#bia-module)
5. [Recovery Strategy Module](#recovery-strategy-module)
6. [Procedures Module](#procedures-module)
7. [Crisis Management Module](#crisis-management-module)
8. [Risk Assessment Module](#risk-assessment-module)
9. [Audit & Logging](#audit--logging)
10. [Supporting Tables](#supporting-tables)

---

## Core Tables

### `organizations`
Organization master table
- `id` (UUID, PK)
- `name` (VARCHAR)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### `clients`
Client information
- `id` (UUID, PK)
- `organization_id` (UUID, FK → organizations)
- `name` (VARCHAR)
- `contact_info` (JSONB)

### `departments`
Department hierarchy
- `id` (UUID, PK)
- `organization_id` (UUID, FK → organizations)
- `name` (VARCHAR)
- `parent_department_id` (UUID, FK → departments)
- `created_at` (TIMESTAMP)

### `subdepartment`
Sub-department structure
- `id` (UUID, PK)
- `department_id` (UUID, FK → departments)
- `name` (VARCHAR)
- `created_at` (TIMESTAMP)

### `process`
Business processes
- `id` (UUID, PK)
- `subdepartment_id` (UUID, FK → subdepartment)
- `name` (VARCHAR)
- `description` (TEXT)
- `owner` (VARCHAR)
- `status` (VARCHAR)

---

## RBAC & Authentication

### `users`
User accounts
- `id` (INTEGER, PK, AUTOINCREMENT)
- `username` (VARCHAR, UNIQUE)
- `email` (VARCHAR, UNIQUE)
- `full_name` (VARCHAR)
- `hashed_password` (VARCHAR)
- `is_active` (BOOLEAN)
- `is_superuser` (BOOLEAN)
- `created_at` (TIMESTAMP)
- `last_login` (TIMESTAMP)

### `roles`
Role definitions
- `id` (INTEGER, PK, AUTOINCREMENT)
- `name` (VARCHAR, UNIQUE)
- `description` (TEXT)
- `created_at` (TIMESTAMP)

**Standard Roles:**
- System Admin
- CEO
- Department Head
- SubDepartment Head
- Process Owner
- BCM Coordinator

### `permissions`
Permission definitions
- `id` (INTEGER, PK, AUTOINCREMENT)
- `name` (VARCHAR, UNIQUE)
- `resource` (VARCHAR)
- `action` (VARCHAR)
- `description` (TEXT)

### `user_roles`
User-Role mapping (Many-to-Many)
- `id` (INTEGER, PK, AUTOINCREMENT)
- `user_id` (INTEGER, FK → users)
- `role_id` (INTEGER, FK → roles)
- `assigned_at` (TIMESTAMP)

### `role_permissions`
Role-Permission mapping (Many-to-Many)
- `id` (INTEGER, PK, AUTOINCREMENT)
- `role_id` (INTEGER, FK → roles)
- `permission_id` (INTEGER, FK → permissions)

### `user_organization_mapping`
User-Organization access
- `id` (INTEGER, PK)
- `user_id` (INTEGER, FK → users)
- `organization_id` (UUID, FK → organizations)
- `client_id` (UUID, FK → clients)

### `user_department_mapping`
User-Department access
- `id` (INTEGER, PK)
- `user_id` (INTEGER, FK → users)
- `department_id` (UUID, FK → departments)

### `user_passwords`
Password management
- `id` (INTEGER, PK)
- `user_id` (INTEGER, FK → users)
- `encrypted_password` (TEXT)
- `created_at` (TIMESTAMP)

---

## BCM Module

### `bcm_organization_plan`
Organization-level BCM plans
- `id` (UUID, PK)
- `organization_id` (UUID, FK → organizations)
- `plan_data` (JSONB)
- `version` (INTEGER)
- `status` (VARCHAR)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)
- `created_by` (INTEGER, FK → users)

### `bcm_department_plan`
Department-level BCM plans
- `id` (UUID, PK)
- `department_id` (UUID, FK → departments)
- `organization_id` (UUID, FK → organizations)
- `plan_data` (JSONB)
- `version` (INTEGER)
- `status` (VARCHAR)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### `bcm_policy`
BCM policies
- `id` (UUID, PK)
- `organization_id` (UUID, FK → organizations)
- `policy_content` (TEXT)
- `version` (VARCHAR)
- `approved_by` (INTEGER, FK → users)
- `approved_at` (TIMESTAMP)

### `bcm_manual`
BCM manuals and documentation
- `id` (UUID, PK)
- `organization_id` (UUID, FK → organizations)
- `manual_content` (TEXT)
- `version` (VARCHAR)
- `created_at` (TIMESTAMP)

### `bcm_procedures`
BCM procedures
- `id` (UUID, PK)
- `organization_id` (UUID, FK → organizations)
- `procedure_type` (VARCHAR)
- `content` (JSONB)
- `status` (VARCHAR)

---

## BIA Module

### `bia_process_info`
Business Impact Analysis - Process Information
- `id` (UUID, PK)
- `process_id` (UUID, FK → process)
- `organization_id` (UUID, FK → organizations)
- `department_id` (UUID, FK → departments)
- `subdepartment_id` (UUID, FK → subdepartment)
- `process_name` (VARCHAR)
- `process_owner` (VARCHAR)
- `rto` (INTEGER) - Recovery Time Objective (hours)
- `rpo` (INTEGER) - Recovery Point Objective (hours)
- `mtpd` (INTEGER) - Maximum Tolerable Period of Disruption
- `criticality_level` (VARCHAR) - Critical/High/Medium/Low
- `financial_impact` (DECIMAL)
- `operational_impact` (TEXT)
- `reputational_impact` (TEXT)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### `bia_information`
BIA general information
- `id` (UUID, PK)
- `organization_id` (UUID, FK → organizations)
- `bia_data` (JSONB)
- `completed_at` (TIMESTAMP)

### `bia_department_info`
Department-level BIA data
- `id` (UUID, PK)
- `department_id` (UUID, FK → departments)
- `bia_data` (JSONB)

### `bia_subdepartment_info`
Sub-department BIA data
- `id` (UUID, PK)
- `subdepartment_id` (UUID, FK → subdepartment)
- `bia_data` (JSONB)

### `bia_impact_scales`
Impact measurement scales
- `id` (INTEGER, PK)
- `scale_name` (VARCHAR)
- `scale_values` (JSONB)

### `bia_mitigations`
Mitigation strategies for BIA
- `id` (UUID, PK)
- `process_id` (UUID, FK → process)
- `mitigation_strategy` (TEXT)
- `status` (VARCHAR)

### `impact_analysis`
Impact analysis results
- `id` (UUID, PK)
- `process_id` (UUID, FK → process)
- `impact_type` (VARCHAR)
- `impact_score` (INTEGER)
- `impact_description` (TEXT)

### `business_application_impact`
Application impact assessment
- `id` (UUID, PK)
- `application_name` (VARCHAR)
- `impact_level` (VARCHAR)
- `dependencies` (JSONB)

### `critical_staff`
Critical staff identification
- `id` (UUID, PK)
- `process_id` (UUID, FK → process)
- `staff_name` (VARCHAR)
- `role` (VARCHAR)
- `contact_info` (JSONB)

### `critical_staff_details`
Detailed critical staff information
- `id` (UUID, PK)
- `critical_staff_id` (UUID, FK → critical_staff)
- `additional_details` (JSONB)

### `critical_applications_summary`
Summary of critical applications
- `id` (UUID, PK)
- `organization_id` (UUID, FK → organizations)
- `summary_data` (JSONB)

### `minimum_operating_requirement`
Minimum operating requirements
- `id` (UUID, PK)
- `process_id` (UUID, FK → process)
- `requirement_type` (VARCHAR)
- `requirement_details` (TEXT)

### `resources_for_resumption`
Resources needed for process resumption
- `id` (UUID, PK)
- `process_id` (UUID, FK → process)
- `resource_type` (VARCHAR)
- `resource_details` (JSONB)

### `timeline_summary`
Timeline summaries for recovery
- `id` (UUID, PK)
- `process_id` (UUID, FK → process)
- `timeline_data` (JSONB)

### `vital_records`
Vital records identification
- `id` (UUID, PK)
- `process_id` (UUID, FK → process)
- `record_name` (VARCHAR)
- `storage_location` (VARCHAR)
- `backup_location` (VARCHAR)

---

## Recovery Strategy Module

### `recovery_strategies`
Recovery strategies for processes
- `id` (UUID, PK)
- `process_id` (UUID, FK → bia_process_info)
- `organization_id` (UUID, FK → organizations)
- `department_id` (UUID, FK → departments)
- `subdepartment_id` (UUID, FK → subdepartment)
- `process_name` (VARCHAR)
- `rto` (INTEGER)
- `rpo` (INTEGER)
- `people_strategy` (JSONB)
- `technology_strategy` (JSONB)
- `facility_strategy` (JSONB)
- `data_strategy` (JSONB)
- `people_status` (VARCHAR) - draft/approved/implemented
- `technology_status` (VARCHAR)
- `facility_status` (VARCHAR)
- `data_status` (VARCHAR)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)
- `created_by` (INTEGER, FK → users)

### `department_recovery_config`
Department recovery configurations
- `id` (UUID, PK)
- `department_id` (UUID, FK → departments)
- `config_data` (JSONB)
- `created_at` (TIMESTAMP)

---

## Procedures Module

### `procedure_templates`
Procedure templates
- `id` (UUID, PK)
- `procedure_type` (VARCHAR) - bia/ra/bcp/drp/irp
- `template_name` (VARCHAR)
- `template_content` (JSONB)
- `version` (VARCHAR)
- `is_active` (BOOLEAN)

### `procedure_documents`
Generated procedure documents
- `id` (UUID, PK)
- `organization_id` (UUID, FK → organizations)
- `user_id` (INTEGER, FK → users)
- `procedure_type` (VARCHAR)
- `content` (JSONB)
- `status` (VARCHAR) - draft/review/approved/published
- `version` (VARCHAR)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### `procedure_change_log`
Procedure change history
- `id` (UUID, PK)
- `procedure_id` (UUID, FK → procedure_documents)
- `changed_by` (INTEGER, FK → users)
- `change_description` (TEXT)
- `changed_at` (TIMESTAMP)

### `procedure_exports`
Exported procedure files
- `id` (UUID, PK)
- `procedure_id` (UUID, FK → procedure_documents)
- `export_format` (VARCHAR) - pdf/docx/html
- `file_path` (VARCHAR)
- `exported_at` (TIMESTAMP)

### `llm_generated_content`
AI-generated content for procedures
- `id` (UUID, PK)
- `procedure_id` (UUID, FK → procedure_documents)
- `section_id` (VARCHAR)
- `generated_content` (TEXT)
- `model_used` (VARCHAR)
- `generated_at` (TIMESTAMP)

### `llm_content_cache`
Cache for LLM-generated content
- `id` (UUID, PK)
- `cache_key` (VARCHAR, UNIQUE)
- `content` (TEXT)
- `created_at` (TIMESTAMP)
- `expires_at` (TIMESTAMP)

---

## Crisis Management Module

### `crisis_plan`
Crisis management plans
- `id` (UUID, PK)
- `organization_id` (UUID, FK → organizations)
- `plan_title` (VARCHAR)
- `plan_data` (JSONB)
- `version` (VARCHAR)
- `status` (VARCHAR)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### `crisis_plan_section`
Individual crisis plan sections
- `id` (UUID, PK)
- `crisis_plan_id` (UUID, FK → crisis_plan)
- `section_id` (VARCHAR)
- `section_heading` (VARCHAR)
- `section_icon` (VARCHAR)
- `content` (JSONB)
- `order` (INTEGER)

### `crisis_template`
Crisis management templates
- `id` (UUID, PK)
- `template_name` (VARCHAR)
- `template_content` (JSONB)
- `is_active` (BOOLEAN)

### `crisis_communication_plan`
Crisis communication strategies
- `id` (UUID, PK)
- `organization_id` (UUID, FK → organizations)
- `communication_plan` (JSONB)

---

## Risk Assessment Module

### `risk_assessments`
Risk assessment records
- `id` (UUID, PK)
- `organization_id` (UUID, FK → organizations)
- `process_id` (UUID, FK → process)
- `risk_data` (JSONB)
- `assessment_date` (TIMESTAMP)
- `assessed_by` (INTEGER, FK → users)

### `ent_risks`
Enterprise risks
- `id` (UUID, PK)
- `risk_name` (VARCHAR)
- `risk_description` (TEXT)
- `likelihood` (INTEGER)
- `impact` (INTEGER)
- `risk_score` (INTEGER)

### `ent_threats`
Enterprise threats
- `id` (UUID, PK)
- `threat_name` (VARCHAR)
- `threat_type` (VARCHAR)
- `description` (TEXT)

### `threat_risks`
Threat-Risk mapping
- `id` (UUID, PK)
- `threat_id` (UUID, FK → ent_threats)
- `risk_id` (UUID, FK → ent_risks)

### `process_threats`
Process-specific threats
- `id` (UUID, PK)
- `process_id` (UUID, FK → process)
- `threat_id` (UUID, FK → ent_threats)

### `process_impact_analysis`
Process impact analysis
- `id` (UUID, PK)
- `process_id` (UUID, FK → process)
- `impact_data` (JSONB)

### `site_risk_assessment`
Site-level risk assessment
- `id` (UUID, PK)
- `site_name` (VARCHAR)
- `risk_data` (JSONB)

### `site_risk_mitigation`
Site risk mitigation strategies
- `id` (UUID, PK)
- `site_risk_id` (UUID, FK → site_risk_assessment)
- `mitigation_strategy` (TEXT)
- `status` (VARCHAR)

### `mitigation_tasks`
Mitigation action items
- `id` (UUID, PK)
- `risk_id` (UUID, FK → ent_risks)
- `task_description` (TEXT)
- `assigned_to` (INTEGER, FK → users)
- `due_date` (DATE)
- `status` (VARCHAR)

---

## Audit & Logging

### `audit_log`
System audit trail
- `id` (UUID, PK)
- `user_id` (INTEGER, FK → users)
- `action` (VARCHAR)
- `resource_type` (VARCHAR)
- `resource_id` (VARCHAR)
- `old_value` (JSONB)
- `new_value` (JSONB)
- `ip_address` (VARCHAR)
- `timestamp` (TIMESTAMP)

### `organization_activity_log`
Organization-level activity log
- `id` (UUID, PK)
- `organization_id` (UUID, FK → organizations)
- `activity_type` (VARCHAR)
- `activity_data` (JSONB)
- `created_at` (TIMESTAMP)

### `alerts`
System alerts and notifications
- `id` (UUID, PK)
- `user_id` (INTEGER, FK → users)
- `alert_type` (VARCHAR)
- `message` (TEXT)
- `is_read` (BOOLEAN)
- `created_at` (TIMESTAMP)

---

## Supporting Tables

### `rbac_departments`
RBAC department mappings
- `id` (UUID, PK)
- `department_id` (UUID, FK → departments)
- `rbac_config` (JSONB)

### `rbac_subdepartments`
RBAC subdepartment mappings
- `id` (UUID, PK)
- `subdepartment_id` (UUID, FK → subdepartment)
- `rbac_config` (JSONB)

### `rbac_processes`
RBAC process-level permissions
- `id` (UUID, PK)
- `process_id` (UUID, FK → process)
- `rbac_config` (JSONB)

### `process_nodes`
Process flow nodes
- `id` (UUID, PK)
- `process_id` (UUID, FK → process)
- `node_data` (JSONB)

### `external_applications_master`
External applications catalog
- `id` (UUID, PK)
- `application_name` (VARCHAR)
- `vendor` (VARCHAR)
- `description` (TEXT)

### `tech_mapping_external_app`
Technology-Application mapping
- `id` (UUID, PK)
- `process_id` (UUID, FK → process)
- `external_app_id` (UUID, FK → external_applications_master)

### `technical_info`
Technical information
- `id` (UUID, PK)
- `process_id` (UUID, FK → process)
- `tech_details` (JSONB)

### `vendor_detail`
Vendor information
- `id` (UUID, PK)
- `vendor_name` (VARCHAR)
- `contact_info` (JSONB)
- `contract_details` (JSONB)

### `scheduled_review`
Scheduled reviews
- `id` (UUID, PK)
- `review_type` (VARCHAR)
- `resource_id` (UUID)
- `scheduled_date` (DATE)
- `status` (VARCHAR)

### `module_requests`
Module access requests
- `id` (UUID, PK)
- `user_id` (INTEGER, FK → users)
- `module_name` (VARCHAR)
- `request_status` (VARCHAR)
- `requested_at` (TIMESTAMP)

### `impact_matrix_edit_requests`
Impact matrix edit requests
- `id` (UUID, PK)
- `requested_by` (INTEGER, FK → users)
- `request_data` (JSONB)
- `status` (VARCHAR)

### `files`
File storage metadata
- `id` (UUID, PK)
- `file_name` (VARCHAR)
- `file_path` (VARCHAR)
- `file_type` (VARCHAR)
- `uploaded_by` (INTEGER, FK → users)
- `uploaded_at` (TIMESTAMP)

### `document_metadata`
Document metadata
- `id` (UUID, PK)
- `document_name` (VARCHAR)
- `document_type` (VARCHAR)
- `metadata` (JSONB)

### `document_embeddings`
Document embeddings for AI/search
- `id` (UUID, PK)
- `document_id` (UUID, FK → document_metadata)
- `embedding_vector` (VECTOR)
- `created_at` (TIMESTAMP)

### `alembic_version`
Database migration version tracking
- `version_num` (VARCHAR, PK)

---

## 🔑 Key Relationships

### User Access Hierarchy
```
users
  ↓
user_roles → roles → role_permissions → permissions
  ↓
user_organization_mapping → organizations
  ↓
user_department_mapping → departments
```

### Organizational Hierarchy
```
organizations
  ↓
departments
  ↓
subdepartment
  ↓
process
```

### BIA → Recovery Strategy Flow
```
bia_process_info
  ↓
recovery_strategies (people, technology, facility, data)
  ↓
bcm_organization_plan / bcm_department_plan
```

### Procedure Generation Flow
```
procedure_templates
  ↓
procedure_documents (draft)
  ↓
llm_generated_content (AI assistance)
  ↓
procedure_change_log (versioning)
  ↓
procedure_exports (PDF/DOCX)
```

---

## 📊 Database Statistics

- **Total Tables**: 88
- **Core Modules**: 7 (BCM, BIA, Recovery, Procedures, Crisis, Risk, RBAC)
- **JSONB Columns**: ~35 (flexible schema storage)
- **Audit Tables**: 3
- **Relationship Tables**: ~15 (Many-to-Many mappings)

---

## 🔒 Security Features

1. **RBAC**: Role-based access control with granular permissions
2. **Audit Logging**: All changes tracked in `audit_log`
3. **Password Encryption**: Stored in `user_passwords` with encryption
4. **Organization Isolation**: Data segregated by `organization_id`
5. **Connection Pooling**: Optimized for Supabase PostgreSQL

---

## 📝 Notes for Developers

1. **JSONB Usage**: Many tables use JSONB for flexible schema. Query with `->` and `->>` operators
2. **UUID Primary Keys**: Most tables use UUID for distributed system compatibility
3. **Timestamps**: All tables have `created_at`, many have `updated_at`
4. **Soft Deletes**: Consider adding `deleted_at` for soft delete pattern
5. **Indexes**: Add indexes on frequently queried columns (organization_id, department_id, process_id)

---

## 🚀 Quick Start Queries

### Get all users with their roles
```sql
SELECT u.username, r.name as role_name
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id;
```

### Get all processes with BIA and Recovery Strategy
```sql
SELECT 
    p.name as process_name,
    bia.rto,
    bia.rpo,
    rs.people_status,
    rs.technology_status
FROM process p
LEFT JOIN bia_process_info bia ON p.id = bia.process_id
LEFT JOIN recovery_strategies rs ON p.id = rs.process_id;
```

### Get organization BCM plan status
```sql
SELECT 
    o.name as organization,
    bop.status,
    bop.version,
    bop.updated_at
FROM organizations o
LEFT JOIN bcm_organization_plan bop ON o.id = bop.organization_id;
```

---

**Document Version**: 1.0  
**Last Updated**: October 25, 2025  
**Maintained By**: BRT Development Team
