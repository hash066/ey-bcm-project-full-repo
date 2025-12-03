# Business Resilience Tool

A FastAPI backend project with Supabase (primary) and PostgreSQL/SQLite (fallback) for managing business resilience data, PDF processing, and graph transformation.

## Overview

This unified server combines the functionality of:
1. PDF generation and processing
2. Graph transformation for LLM output
3. Organization and module data management
4. Business Impact Analysis (BIA)
5. Authentication and authorization
6. Approval workflows

The tool manages various types of business resilience data including:

- Standard Operating Procedures (SOPs)
- Risk Registers
- Role Charts (RACI)
- Process Manuals
- Architecture Diagrams
- Incident Logs
- Vendor Contracts
- Policies
- DR/BCP Plans
- Chat History Logs
- External Documents (CSV/Excel/Docx)
- Business Impact Analysis data
- Organization approval workflows

## 🗄️ Database Architecture (Post-Migration)

**Primary Database: Supabase**
- Real-time PostgreSQL database with enhanced features
- Row Level Security (RLS) for data protection
- Built-in authentication and authorization
- RESTful API and real-time subscriptions
- Automatic API generation

**Fallback Databases:**
- PostgreSQL (via SQLAlchemy) - secondary fallback
- SQLite - tertiary fallback for development/testing

**Migration Status: ✅ COMPLETE**
- All routers migrated to use Supabase as primary database
- PostgreSQL/SQLAlchemy maintained as fallback
- Zero-downtime migration with automatic failover

## 🔄 Migration Details

### Migrated Components
- ✅ **BIA Router**: All endpoints migrated to Supabase
- ✅ **Auth Router**: Authentication and user management migrated
- ✅ **Organization Router**: CRUD operations and impact matrices migrated
- ✅ **Admin Router**: User and RBAC management migrated
- ✅ **Organization Approvals Router**: Approval workflows migrated
- ✅ **Chat Router**: No database operations (external AI APIs)
- ✅ **Process Service Mapping Router**: No database operations
- ✅ **Module Request Router**: Database operations migrated

### Database Schema
The Supabase database includes the following key tables:
- `global_organizations` - Organization data and metadata
- `global_departments` - Department hierarchy
- `global_subdepartments` - Subdepartment hierarchy
- `global_processes` - Process definitions
- `bia_process_info` - BIA process information
- `process_impact_analysis` - Impact analysis data
- `bia_snapshots` - Encrypted BIA snapshots
- `organization_approval_workflows` - Approval workflow data
- `users` - User accounts and authentication
- `user_passwords` - Password management

### Environment Configuration
Required environment variables:
```bash
# Supabase Configuration (Primary Database)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# PostgreSQL Fallback (Secondary)
POSTGRES_SERVER=your-postgres-server
POSTGRES_PORT=5432
POSTGRES_DB=your-database
POSTGRES_USER=your-username
POSTGRES_PASSWORD=your-password

# SQLite Fallback (Tertiary)
USE_SQLITE=true
SQLITE_PATH=./fallback_sqlite_db.db
```

## Architecture

- **Database Layer**:
  - MongoDB for organization and module data
  - In-memory storage as fallback

- **API Layer**:
  - FastAPI endpoints for CRUD operations
  - PDF processing and generation pipeline
  - Graph transformation service
  - Organization and module management

- **Integration Layer**:
  - LLM output transformation
  - PDF generation and processing

## Setup and Installation

### Prerequisites

- Python 3.11+
- MongoDB (optional, falls back to in-memory storage)

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd business-resilience-tool
```

2. Create a virtual environment and install dependencies:

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. Install optional dependencies for PDF embedding:

```bash
pip install PyPDF2
```

4. Run the FastAPI application:

```bash
python unified_server.py
```

The API will be available at http://localhost:8000

## API Documentation

Once the application is running, you can access the Swagger UI documentation at:

http://localhost:8000/docs

## API Endpoints

### PDF Processing

- **POST /process-pdf**: Process uploaded files into a single PDF
- **GET /retrieve-pdf/{batch_token}**: Retrieve a processed PDF
- **POST /send-to-llm/{batch_token}**: Send PDF to LLM for analysis

### Graph Transformation

- **POST /transform**: Transform LLM output to frontend graph format

### Organization and Module Management

- **GET /organizations**: List all organizations
- **POST /organizations**: Create a new organization
- **GET /organizations/{org_id}**: Get organization details
- **GET /organizations/{org_id}/modules/{module_name}**: Get module data
- **PUT /organizations/{org_id}/modules/{module_name}**: Update module data

## Data Model

### MongoDB Collections

1. **Organizations**:
   - _id: organization ID (UUID)
   - name: Organization name
   - description: Organization description
   - created_at: Creation timestamp
   - modules: List of available modules

2. **Module Collections** (one collection per module):
   - Various module-specific data structures

### In-Memory Storage

The application maintains in-memory storage as a fallback mechanism when MongoDB is unavailable:

1. **PDF_STORAGE**: Temporary storage for processed PDFs
2. **ORG_STORAGE**: Fallback storage for organization and module data

## Features

- **PDF Processing**: Generate and combine PDFs from uploaded files
- **Graph Transformation**: Convert LLM output to frontend-compatible graph format
- **Organization Management**: Create and manage organizations
- **Module Management**: Store and retrieve module-specific data
- **Fallback Mechanism**: In-memory storage when database is unavailable
- **PDF Embedding**: Proper embedding of PDF files using PyPDF2 (when available)

## LLM Integration

The system is designed to integrate with Language Models by:

1. Transforming LLM output into a format suitable for frontend visualization
2. Processing documents for LLM analysis
3. Providing a structured API for LLM interaction
4. Supporting organization and module-based data management for context

## License

[MIT License](LICENSE)
