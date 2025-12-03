# Functional Document

**Project:** Resilience Management System  
**Version:** 1.0  
**Date:** 2025-01-XX  
**Author:** [Author Name]  
**Revision History:** See REVISION_HISTORY.md

---

## Table of Contents

1. [Title Page & Revision History](#title-page--revision-history)
2. [Executive Summary](#executive-summary)
3. [Scope Boundaries](#scope-boundaries)
4. [User Personas](#user-personas)
5. [User Journeys](#user-journeys)
6. [Implemented Feature Matrix](#implemented-feature-matrix)
7. [Acceptance Criteria](#acceptance-criteria)
8. [Sample Data](#sample-data)
9. [Open Issues & Assumptions](#open-issues--assumptions)
10. [Module-Wise Details](#module-wise-details)

---

## Title Page & Revision History

### Document Information

| Field | Value |
|-------|-------|
| **Document Title** | Functional Document - Resilience Management System |
| **Version** | 1.0 |
| **Date** | 2025-01-XX |
| **Status** | Draft |
| **Classification** | Internal |

### Revision History

| Version | Date | Author | Commit Hash | Changes |
|---------|------|--------|-------------|---------|
| 1.0 | 2025-01-XX | [Author] | abc123def | Initial version |
| | | | | |

---

## Executive Summary

The Resilience Management System is a comprehensive platform designed to help organizations assess business impact, evaluate risks, and build resilience strategies. The system provides modules for Business Impact Analysis (BIA), Risk Assessment (RA), Dashboard visualization, Authentication, and Export capabilities.

**Key Features:**
- User authentication and role-based access control
- Business Impact Analysis with AI-powered insights
- Risk Assessment with threat and vulnerability analysis
- Real-time dashboard with key metrics
- Export functionality for reports in multiple formats

**Target Users:**
- Resilience Managers
- Risk Analysts
- Administrators
- End Users
- Third-party integrators

---

## Scope Boundaries

### In Scope

1. **Authentication Module**
   - User registration and login
   - JWT-based authentication
   - Role-based access control (RBAC)
   - Password reset functionality

2. **Business Impact Analysis (BIA) Module**
   - Create and manage BIA assessments
   - Analyze business processes
   - Calculate impact scores
   - Generate BIA reports

3. **Risk Assessment (RA) Module**
   - Create risk assessments
   - Identify and categorize risks
   - Calculate risk scores
   - Generate mitigation plans
   - AI-powered risk analysis

4. **Dashboard Module**
   - Real-time metrics visualization
   - Customizable widgets
   - Trend analysis
   - Alert notifications

5. **Export Module**
   - Export assessments to PDF
   - Export data to Excel/CSV
   - Custom report templates
   - Batch export functionality

### Out of Scope

1. Mobile native applications (web-responsive only)
2. Real-time collaboration features
3. Third-party integrations (future phase)
4. Advanced analytics and ML model training UI
5. Multi-tenant architecture (single-tenant only)

---

## User Personas

### 1. Administrator

**Profile:** System administrator responsible for managing users, roles, permissions, and system configuration.

**Characteristics:**
- Technical expertise in system administration
- Needs full access to all system features
- Manages user accounts and security settings
- Monitors system health and performance

**Goals:**
- Manage user accounts and permissions
- Configure system settings
- Monitor system usage and performance
- Ensure security compliance

**Pain Points:**
- Complex permission management
- Lack of audit trails
- Difficult user onboarding process

### 2. Resilience Manager

**Profile:** Senior professional responsible for organizational resilience planning and strategy.

**Characteristics:**
- Strategic thinking and planning skills
- Needs comprehensive view of all assessments
- Reviews and approves risk assessments
- Generates executive reports

**Goals:**
- Oversee all BIA and RA assessments
- Review and approve critical assessments
- Generate executive-level reports
- Track organizational resilience metrics

**Pain Points:**
- Lack of consolidated view
- Difficult report generation
- No historical trend analysis

### 3. Risk Analyst / End User

**Profile:** Professional who creates and manages risk assessments and BIA analyses.

**Characteristics:**
- Domain expertise in risk management
- Creates detailed assessments
- Needs AI assistance for analysis
- Requires export capabilities

**Goals:**
- Create comprehensive risk assessments
- Leverage AI for risk identification
- Generate detailed reports
- Track assessment status

**Pain Points:**
- Time-consuming manual risk identification
- Lack of AI-powered insights
- Difficult data entry process

### 4. Third-Party Integrator

**Profile:** External system or API consumer integrating with the platform.

**Characteristics:**
- Technical API integration expertise
- Needs programmatic access
- Requires API documentation
- Needs authentication mechanisms

**Goals:**
- Integrate with REST APIs
- Automate data exchange
- Access assessment data programmatically
- Maintain secure connections

**Pain Points:**
- Incomplete API documentation
- Lack of API versioning
- Authentication complexity

---

## User Journeys

### Journey 1: Administrator - User Management

**Persona:** Administrator  
**Goal:** Create a new user account and assign roles

**Steps:**

1. **Landing Page**
   - Administrator navigates to system URL
   - Screenshot: `docs/screenshots/admin_landing.png`

2. **Login**
   - Enters admin credentials
   - Screenshot: `docs/screenshots/admin_login.png`

3. **Dashboard**
   - Views admin dashboard with user management options
   - Screenshot: `docs/screenshots/admin_dashboard.png`

4. **User Management**
   - Clicks "User Management" → "Add New User"
   - Screenshot: `docs/screenshots/user_management.png`

5. **Create User**
   - Fills user form (name, email, role)
   - Screenshot: `docs/screenshots/create_user_form.png`

6. **Assign Roles**
   - Selects roles from dropdown
   - Screenshot: `docs/screenshots/assign_roles.png`

7. **Confirmation**
   - User created successfully
   - Screenshot: `docs/screenshots/user_created.png`

**Annotated Flow:**
```
Landing → Login → Dashboard → User Management → Create User Form → 
Assign Roles → Confirmation
```

### Journey 2: Resilience Manager - Review Assessment

**Persona:** Resilience Manager  
**Goal:** Review and approve a risk assessment

**Steps:**

1. **Login**
   - Logs in with manager credentials
   - Screenshot: `docs/screenshots/manager_login.png`

2. **Dashboard**
   - Views pending assessments
   - Screenshot: `docs/screenshots/manager_dashboard.png`

3. **Assessment List**
   - Clicks on "Pending Assessments"
   - Screenshot: `docs/screenshots/pending_assessments.png`

4. **Assessment Details**
   - Opens risk assessment for review
   - Screenshot: `docs/screenshots/assessment_details.png`

5. **Review**
   - Reviews risk scores, mitigation plans
   - Screenshot: `docs/screenshots/review_assessment.png`

6. **Approve/Reject**
   - Approves assessment or requests changes
   - Screenshot: `docs/screenshots/approve_assessment.png`

7. **Confirmation**
   - Status updated
   - Screenshot: `docs/screenshots/assessment_approved.png`

### Journey 3: Risk Analyst - Create Risk Assessment

**Persona:** Risk Analyst  
**Goal:** Create a new risk assessment with AI assistance

**Steps:**

1. **Login**
   - Logs in as risk analyst
   - Screenshot: `docs/screenshots/analyst_login.png`

2. **Dashboard**
   - Views analyst dashboard
   - Screenshot: `docs/screenshots/analyst_dashboard.png`

3. **Create Assessment**
   - Clicks "New Risk Assessment"
   - Screenshot: `docs/screenshots/new_assessment.png`

4. **Asset Selection**
   - Selects asset to assess
   - Screenshot: `docs/screenshots/select_asset.png`

5. **Risk Input**
   - Enters risk details manually or uses AI assistance
   - Screenshot: `docs/screenshots/risk_input.png`

6. **AI Analysis**
   - Triggers AI analysis for similar risks
   - Screenshot: `docs/screenshots/ai_analysis.png`

7. **Review AI Results**
   - Reviews AI-suggested risks
   - Screenshot: `docs/screenshots/ai_results.png`

8. **Calculate Scores**
   - System calculates risk scores
   - Screenshot: `docs/screenshots/risk_scores.png`

9. **Save Assessment**
   - Saves assessment as draft or submits
   - Screenshot: `docs/screenshots/save_assessment.png`

### Journey 4: End User - Export Report

**Persona:** End User  
**Goal:** Export a BIA assessment as PDF

**Steps:**

1. **Login**
   - Logs in to system
   - Screenshot: `docs/screenshots/user_login.png`

2. **BIA Assessments**
   - Navigates to BIA assessments
   - Screenshot: `docs/screenshots/bia_list.png`

3. **Select Assessment**
   - Opens completed assessment
   - Screenshot: `docs/screenshots/bia_details.png`

4. **Export Options**
   - Clicks "Export" button
   - Screenshot: `docs/screenshots/export_options.png`

5. **Select Format**
   - Chooses PDF format
   - Screenshot: `docs/screenshots/select_format.png`

6. **Generate Report**
   - System generates PDF
   - Screenshot: `docs/screenshots/generating_report.png`

7. **Download**
   - Downloads generated PDF
   - Screenshot: `docs/screenshots/download_report.png`

---

## Implemented Feature Matrix

See `docs/DELIVERABLE_CHECKLIST.xlsx` for detailed feature matrix.

**Summary:**

| EY SRS Section | FR ID | Feature | Status | Proof |
|----------------|-------|---------|--------|-------|
| AUTH-001 | FR-AUTH-001 | User Registration | Done | `docs/screenshots/user_registration.png`, commit: abc123 |
| AUTH-002 | FR-AUTH-002 | User Login | Done | `docs/screenshots/user_login.png`, commit: abc124 |
| AUTH-003 | FR-AUTH-003 | Password Reset | Partial | `docs/screenshots/password_reset.png`, commit: abc125 |
| BIA-001 | FR-BIA-001 | Create BIA Assessment | Done | `docs/screenshots/create_bia.png`, commit: def456 |
| BIA-002 | FR-BIA-002 | Calculate Impact Scores | Done | `docs/screenshots/impact_scores.png`, commit: def457 |
| RA-001 | FR-RA-001 | Create Risk Assessment | Done | `docs/screenshots/create_ra.png`, commit: ghi789 |
| RA-002 | FR-RA-002 | AI-Powered Risk Analysis | Done | `docs/screenshots/ai_risk_analysis.png`, commit: ghi790 |
| RA-003 | FR-RA-003 | Risk Score Calculation | Done | `docs/screenshots/risk_calculation.png`, commit: ghi791 |
| DASH-001 | FR-DASH-001 | Dashboard Visualization | Done | `docs/screenshots/dashboard.png`, commit: jkl012 |
| EXPORT-001 | FR-EXPORT-001 | PDF Export | Done | `docs/screenshots/pdf_export.png`, commit: mno345 |
| EXPORT-002 | FR-EXPORT-002 | Excel Export | Done | `docs/screenshots/excel_export.png`, commit: mno346 |

---

## Acceptance Criteria

### FR-AUTH-001: User Registration

**Given:** A new user wants to register  
**When:** User submits registration form with valid email and password  
**Then:**
- User account is created
- Verification email is sent
- User can log in after email verification
- User is assigned default role

**Example:**
```
Given: User is on registration page
When: User enters email="user@example.com", password="SecurePass123!"
Then: Account is created
And: Verification email sent to user@example.com
And: User can login after verification
```

### FR-BIA-001: Create BIA Assessment

**Given:** A logged-in user with BIA permissions  
**When:** User creates a new BIA assessment with asset and process data  
**Then:**
- BIA assessment is saved
- Impact scores are calculated
- Assessment is visible in user's dashboard
- Assessment can be edited or deleted

**Example:**
```
Given: User is logged in as Risk Analyst
When: User creates BIA for "Payment Processing System"
And: User adds 5 business processes
Then: BIA assessment is saved with ID
And: Impact scores are calculated for each process
And: Assessment appears in dashboard
```

### FR-RA-001: Create Risk Assessment

**Given:** A logged-in user with RA permissions  
**When:** User creates a risk assessment for an asset  
**Then:**
- Risk assessment is created
- User can add risks manually
- AI analysis can be triggered
- Risk scores are calculated
- Assessment can be saved as draft or submitted

**Example:**
```
Given: User is logged in as Risk Analyst
When: User creates RA for "Database Server"
And: User triggers AI analysis
Then: AI suggests 10 similar risks
And: User selects 5 risks to include
And: Risk scores are calculated automatically
And: Assessment is saved
```

### FR-RA-002: AI-Powered Risk Analysis

**Given:** A risk assessment is in progress  
**When:** User triggers AI analysis  
**Then:**
- System generates embeddings for input
- Similar risks are retrieved from vector DB
- AI provides risk recommendations
- Confidence scores are displayed
- Low confidence (<0.7) items flagged for review

**Example:**
```
Given: Risk assessment for "Web Application" is open
When: User clicks "AI Analyze"
Then: System queries vector DB for similar risks
And: Returns top 10 similar risks with confidence scores
And: Risks with confidence < 0.7 are flagged
And: User can accept or reject recommendations
```

### FR-EXPORT-001: PDF Export

**Given:** A completed assessment exists  
**When:** User requests PDF export  
**Then:**
- PDF is generated using template
- PDF includes all assessment data
- PDF is downloadable
- Export status is tracked

**Example:**
```
Given: BIA assessment "Payment System Analysis" is completed
When: User clicks "Export PDF"
Then: PDF generation job is queued
And: PDF is generated within 30 seconds
And: Download link is provided
And: Export record is saved
```

---

## Sample Data

Sample input and output files are located in `sample_data/` directory.

### Sample Input Files

1. **BIA Input** (`sample_data/bia_input.csv`)
   - Business processes with RTO/RPO values
   - Dependencies between processes
   - Criticality levels

2. **Risk Assessment Input** (`sample_data/risk_input.xlsx`)
   - Asset information
   - Threat categories
   - Vulnerability data

3. **User Import** (`sample_data/users_import.csv`)
   - Bulk user import template
   - Role assignments

### Sample Output Files

1. **BIA Report** (`sample_data/output/bia_report_sample.pdf`)
   - Generated PDF report
   - Impact scores visualization
   - Process dependency diagram

2. **Risk Assessment Report** (`sample_data/output/ra_report_sample.pdf`)
   - Risk matrix
   - Mitigation plans
   - Risk scores

3. **Dashboard Export** (`sample_data/output/dashboard_export.xlsx`)
   - Metrics data
   - Trend analysis
   - Charts data

---

## Open Issues & Assumptions

### Open Issues

1. **ISSUE-001:** Password reset email delivery sometimes delayed
   - **Status:** Under investigation
   - **Priority:** Medium
   - **Assigned:** [Developer Name]

2. **ISSUE-002:** AI analysis timeout for large assessments
   - **Status:** In progress
   - **Priority:** High
   - **Assigned:** [Developer Name]

3. **ISSUE-003:** PDF export fails for assessments with >100 processes
   - **Status:** Open
   - **Priority:** Medium
   - **Assigned:** [Developer Name]

### Assumptions

1. **ASSUMPTION-001:** Users have valid email addresses for verification
2. **ASSUMPTION-002:** AI service (OpenAI) is available and within rate limits
3. **ASSUMPTION-003:** Database has sufficient capacity for all assessments
4. **ASSUMPTION-004:** Users have modern browsers (Chrome, Firefox, Safari, Edge)
5. **ASSUMPTION-005:** Network connectivity is stable for API calls

### Dependencies

1. **External Services:**
   - OpenAI API for AI analysis
   - Email service for notifications
   - File storage (S3) for exports

2. **Infrastructure:**
   - PostgreSQL database
   - Redis cache
   - Vector database (Pinecone/Weaviate)

3. **Third-Party Libraries:**
   - JWT library for authentication
   - PDF generation library
   - Excel generation library

---

## Module-Wise Details

### Module 1: Authentication

**Purpose:** Manage user authentication, authorization, and access control.

**UI Screens:**
- Login page
- Registration page
- Password reset page
- User management (admin)
- Role management (admin)

**Inputs:**
- Email and password (login)
- User details (registration)
- New password (reset)

**Outputs:**
- JWT access token
- Refresh token
- User profile data

**API Endpoints:**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/reset-password` - Password reset
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile

**DB Tables:**
- `users`
- `roles`
- `user_roles`
- `permissions`
- `role_permissions`
- `refresh_tokens`

**Owner:** [Team/Developer Name]

**Implemented Functionality:**
1. **User Registration:** Users can register with email and password. Email verification required.
2. **User Login:** JWT-based authentication with access and refresh tokens.
3. **Password Reset:** Secure password reset via email link.
4. **Role-Based Access Control:** Users assigned roles with specific permissions.
5. **Token Management:** Automatic token refresh and secure token storage.

**Tech Stack:**
- Backend: Node.js/Express or Python/FastAPI
- Authentication: JWT (jsonwebtoken)
- Password Hashing: bcrypt
- Database: PostgreSQL

### Module 2: Business Impact Analysis (BIA)

**Purpose:** Analyze business processes, calculate impact scores, and generate BIA reports.

**UI Screens:**
- BIA assessment list
- Create/edit BIA assessment
- BIA assessment details
- Process dependency visualization
- Impact score dashboard

**Inputs:**
- Asset information
- Business processes
- RTO/RPO values
- Dependencies
- Criticality levels

**Outputs:**
- BIA assessment records
- Impact scores
- Dependency graphs
- BIA reports (PDF/Excel)

**API Endpoints:**
- `GET /api/bia/assessments` - List assessments
- `POST /api/bia/assessments` - Create assessment
- `GET /api/bia/assessments/:id` - Get assessment
- `PUT /api/bia/assessments/:id` - Update assessment
- `DELETE /api/bia/assessments/:id` - Delete assessment
- `POST /api/bia/assessments/:id/calculate` - Calculate scores

**DB Tables:**
- `bia_assessments`
- `bia_processes`
- `bia_impacts`
- `bia_dependencies`
- `assets`

**Owner:** [Team/Developer Name]

**Implemented Functionality:**
1. **Assessment Creation:** Create BIA assessments with multiple business processes.
2. **Process Analysis:** Define processes with RTO, RPO, and criticality.
3. **Impact Calculation:** Automatic calculation of impact scores based on process criticality.
4. **Dependency Mapping:** Visual representation of process dependencies.
5. **Report Generation:** Export BIA assessments as PDF or Excel.

**Tech Stack:**
- Backend: Node.js/Express or Python/FastAPI
- Database: PostgreSQL
- Visualization: D3.js or Chart.js
- Report Generation: PDFKit or ReportLab

### Module 3: Risk Assessment (RA)

**Purpose:** Identify, assess, and mitigate risks with AI-powered analysis.

**UI Screens:**
- Risk assessment list
- Create/edit risk assessment
- Risk assessment details
- Risk matrix visualization
- AI analysis results
- Mitigation plan editor

**Inputs:**
- Asset information
- Risk descriptions
- Threat data
- Vulnerability data
- Likelihood and impact values

**Outputs:**
- Risk assessment records
- Risk scores
- Risk matrix
- AI analysis results
- Mitigation plans
- Risk reports

**API Endpoints:**
- `GET /api/risk/assessments` - List assessments
- `POST /api/risk/assessments` - Create assessment
- `GET /api/risk/assessments/:id` - Get assessment
- `PUT /api/risk/assessments/:id` - Update assessment
- `POST /api/risk/assessments/:id/analyze` - AI analysis
- `POST /api/risk/assessments/:id/calculate` - Calculate scores
- `GET /api/risk/assessments/:id/matrix` - Get risk matrix

**DB Tables:**
- `risk_assessments`
- `risks`
- `threats`
- `vulnerabilities`
- `risk_mitigations`
- `assets`
- `ai_analyses`

**Owner:** [Team/Developer Name]

**Implemented Functionality:**
1. **Risk Identification:** Manual and AI-assisted risk identification.
2. **AI Analysis:** Uses embeddings to find similar risks from historical data.
3. **Risk Scoring:** Calculates risk scores based on likelihood and impact.
4. **Threat Modeling:** Identifies and categorizes threats.
5. **Vulnerability Assessment:** Tracks vulnerabilities with CVSS scores.
6. **Mitigation Planning:** Create and track mitigation strategies.
7. **Risk Matrix:** Visual representation of risks on likelihood-impact matrix.

**Tech Stack:**
- Backend: Python/FastAPI (for AI integration)
- AI/ML: OpenAI API, sentence-transformers
- Vector DB: Pinecone/Weaviate/Qdrant
- Database: PostgreSQL
- Visualization: D3.js

### Module 4: Dashboard

**Purpose:** Provide real-time visualization of metrics and key performance indicators.

**UI Screens:**
- Main dashboard
- Customizable widgets
- Trend charts
- Alert notifications
- Filter and date range selection

**Inputs:**
- Date range filters
- Widget configuration
- Refresh interval

**Outputs:**
- Aggregated metrics
- Chart data (JSON)
- Alert notifications
- Trend analysis

**API Endpoints:**
- `GET /api/dashboard/metrics` - Get dashboard metrics
- `GET /api/dashboard/trends` - Get trend data
- `GET /api/dashboard/alerts` - Get alerts
- `POST /api/dashboard/config` - Save dashboard config
- `GET /api/dashboard/config` - Get dashboard config

**DB Tables:**
- `dashboard_configs`
- `dashboard_cache` (Redis)
- `bia_assessments` (read)
- `risk_assessments` (read)

**Owner:** [Team/Developer Name]

**Implemented Functionality:**
1. **Metrics Aggregation:** Real-time aggregation of assessment data.
2. **Widget System:** Customizable dashboard widgets.
3. **Caching:** Redis-based caching for performance.
4. **Trend Analysis:** Historical trend visualization.
5. **Alerts:** Configurable alert notifications.

**Tech Stack:**
- Frontend: React.js with Chart.js/Recharts
- Backend: Node.js/Express or Python/FastAPI
- Cache: Redis
- Database: PostgreSQL

### Module 5: Export

**Purpose:** Generate and export reports in multiple formats.

**UI Screens:**
- Export options dialog
- Export history
- Template management (admin)

**Inputs:**
- Assessment ID
- Export format (PDF/Excel/CSV)
- Template selection
- Date range

**Outputs:**
- PDF files
- Excel files
- CSV files
- Export status

**API Endpoints:**
- `POST /api/export/generate` - Generate export
- `GET /api/export/:id` - Get export status
- `GET /api/export/:id/download` - Download file
- `GET /api/export/history` - Get export history
- `GET /api/export/templates` - List templates

**DB Tables:**
- `exports`
- `export_templates`
- `export_files`

**Owner:** [Team/Developer Name]

**Implemented Functionality:**
1. **PDF Generation:** Generate PDF reports from templates.
2. **Excel Export:** Export data to Excel format.
3. **CSV Export:** Export data to CSV format.
4. **Template System:** Customizable report templates.
5. **Async Processing:** Background job processing for large exports.
6. **File Storage:** Secure file storage and download.

**Tech Stack:**
- Backend: Node.js/Express or Python/FastAPI
- PDF: PDFKit, ReportLab, or WeasyPrint
- Excel: ExcelJS, openpyxl, or xlsxwriter
- Storage: S3 or local file system
- Queue: RabbitMQ or Celery

---

**Document End**

