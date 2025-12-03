-- Supabase Schema for Business Resilience Tool (POC)
-- Generated from existing SQLAlchemy schemas
-- Ready to paste into Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===============================================
-- BUSINESS RESILIENCE TOOL - SUPABASE SCHEMA
-- ===============================================

-- Table: organization
CREATE TABLE IF NOT EXISTS organization (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    head_name TEXT,
    sector TEXT,
    criticality TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: department
CREATE TABLE IF NOT EXISTS department (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    head_name TEXT,
    organization_id UUID REFERENCES organization(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: subdepartment
CREATE TABLE IF NOT EXISTS subdepartment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    head_name TEXT,
    department_id UUID REFERENCES department(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: process
CREATE TABLE IF NOT EXISTS process (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    subdepartment_id UUID REFERENCES subdepartment(id) ON DELETE CASCADE,
    process_owner TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================================
-- BIA TABLES (from bia.schema.sql)
-- ===============================================

-- Table: impact_scale
CREATE TABLE IF NOT EXISTS impact_scale (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organization(id) ON DELETE CASCADE,
    scale JSONB NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: bia_information
CREATE TABLE IF NOT EXISTS bia_information (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID REFERENCES department(id) ON DELETE CASCADE,
    subdepartment_id UUID REFERENCES subdepartment(id) ON DELETE SET NULL,
    department_name TEXT NOT NULL,
    department_description TEXT,
    bcp_coordinator TEXT,
    secondary_spoc TEXT,
    primary_location TEXT,
    secondary_location TEXT,
    primary_staff_count INTEGER,
    secondary_staff_count INTEGER,
    scale_id UUID REFERENCES impact_scale(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: bia_process
CREATE TABLE IF NOT EXISTS bia_process (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    process_id UUID REFERENCES process(id) ON DELETE CASCADE,
    spoc TEXT,
    process_description TEXT,
    peak_period TEXT,
    critical BOOLEAN DEFAULT FALSE,
    bia_information_id UUID REFERENCES bia_information(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: impact_analysis
CREATE TABLE IF NOT EXISTS impact_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bia_process_id UUID REFERENCES bia_process(id) ON DELETE CASCADE,
    impact_data JSONB NOT NULL
);

-- Table: vendor_detail
CREATE TABLE IF NOT EXISTS vendor_detail (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    process_id UUID REFERENCES process(id) ON DELETE CASCADE,
    vendor_name VARCHAR(255) NOT NULL,
    activities VARCHAR(255) NOT NULL,
    primary_contact_details VARCHAR(255) NOT NULL,
    secondary_contact_details VARCHAR(255),
    location VARCHAR(255) NOT NULL,
    bcp_arrangement BOOLEAN NOT NULL DEFAULT FALSE
);

-- Table: minimum_operating_requirements
CREATE TABLE IF NOT EXISTS minimum_operating_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    process_id UUID REFERENCES process(id) ON DELETE CASCADE,
    primary_spoc TEXT,
    fallback_spoc TEXT,
    critical_resources_personnel INTEGER,
    critical_resources_outsourced INTEGER,
    internal_dependency TEXT,
    external_dependency TEXT,
    supporting_it_apps TEXT,
    vendor_app_name TEXT,
    critical_app_rpo TEXT,
    required_workstations INTEGER,
    it_assets_count INTEGER,
    required_software TEXT,
    general_assets TEXT,
    internet_intranet_required BOOLEAN
);

-- Table: rpo_simulation
CREATE TABLE IF NOT EXISTS rpo_simulation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mor_id UUID REFERENCES minimum_operating_requirements(id) ON DELETE CASCADE,
    application_name TEXT NOT NULL,
    critical_data_description TEXT NOT NULL,
    hours_of_data_loss INTEGER NOT NULL,
    data_recreatable TEXT,
    final_rpo TEXT
);

-- Table: vital_records
CREATE TABLE IF NOT EXISTS vital_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    process_id UUID REFERENCES process(id) ON DELETE CASCADE,
    record_name TEXT,
    shared_folder TEXT,
    media_type TEXT,
    location_held TEXT,
    custody TEXT,
    required_when TEXT,
    alternate_source TEXT,
    remarks TEXT
);

-- Table: critical_staff_details
CREATE TABLE IF NOT EXISTS critical_staff_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    process_id UUID REFERENCES process(id) ON DELETE CASCADE,
    employee_name TEXT NOT NULL,
    designation TEXT,
    location TEXT,
    phone TEXT,
    email TEXT,
    reporting_manager TEXT
);

-- Table: timeline_summary
CREATE TABLE IF NOT EXISTS timeline_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    process_id UUID REFERENCES process(id) ON DELETE CASCADE,
    mtpd_summary TEXT,
    rto_summary TEXT,
    moderated_rto TEXT,
    mbco_percentage TEXT,
    criticality TEXT
);

-- ===============================================
-- ADDITIONAL TABLES (RBAC, Audit Logs, etc.)
-- ===============================================

-- Table: user roles and permissions
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    role_id UUID NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID
);

-- Table: roles and permissions mapping
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL,
    permission_id UUID NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: activity logs
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organization(id) ON DELETE CASCADE,
    user_id UUID,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: module requests
CREATE TABLE IF NOT EXISTS module_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organization(id) ON DELETE CASCADE,
    requester_id UUID NOT NULL,
    module_name TEXT NOT NULL,
    module_type TEXT NOT NULL,
    justification TEXT,
    priority TEXT CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
    requested_duration INTEGER,
    client_head_approval BOOLEAN DEFAULT FALSE,
    client_head_approved_by UUID,
    client_head_approved_at TIMESTAMP WITH TIME ZONE,
    project_sponsor_approval BOOLEAN DEFAULT FALSE,
    project_sponsor_approved_by UUID,
    project_sponsor_approved_at TIMESTAMP WITH TIME ZONE,
    final_approval BOOLEAN DEFAULT FALSE,
    final_approved_by UUID,
    final_approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    status TEXT NOT NULL DEFAULT 'Submitted' CHECK (status IN ('Submitted', 'Under Review', 'Approved', 'Rejected', 'Expired')),
    expiry_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: user passwords
CREATE TABLE IF NOT EXISTS user_passwords (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organization(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    encrypted_password TEXT NOT NULL,
    salt TEXT NOT NULL,
    algorithm TEXT NOT NULL DEFAULT 'argon2',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    requires_change BOOLEAN DEFAULT FALSE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_organization_name ON organization(name);
CREATE INDEX IF NOT EXISTS idx_department_organization_id ON department(organization_id);
CREATE INDEX IF NOT EXISTS idx_subdepartment_department_id ON subdepartment(department_id);
CREATE INDEX IF NOT EXISTS idx_process_subdepartment_id ON process(subdepartment_id);
CREATE INDEX IF NOT EXISTS idx_bia_process_process_id ON bia_process(process_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_organization_id ON activity_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_module_requests_organization_id ON module_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_module_requests_status ON module_requests(status);

-- ===============================================
-- END OF FULL SCHEMA
-- ===============================================

-- Enable Row Level Security (RLS) on all tables (recommended for Supabase)
-- ALTER TABLE organization ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE department ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE subdepartment ENABLE ROW LEVEL SECURITY;
-- etc.

-- Insert sample data for POC testing
INSERT INTO organization (name, head_name, sector, criticality) VALUES
('Demo Corporation', 'John Doe', 'Technology', 'High'),
('Test Company Inc', 'Jane Smith', 'Finance', 'Medium')
ON CONFLICT (id) DO NOTHING;
