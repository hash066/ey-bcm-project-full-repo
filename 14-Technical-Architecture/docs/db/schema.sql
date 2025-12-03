-- ============================================
-- Resilience Management System - Database Schema
-- Version: 1.0
-- Date: 2025-01-XX
-- ============================================

-- ============================================
-- AUTHENTICATION MODULE
-- ============================================

-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Roles Table
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Roles Junction Table
CREATE TABLE user_roles (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id)
);

-- Permissions Table
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL
);

-- Role Permissions Junction Table
CREATE TABLE role_permissions (
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- Refresh Tokens Table
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Authentication Module
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);

-- ============================================
-- ASSETS MODULE
-- ============================================

-- Assets Table
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_assets_type ON assets(type);
CREATE INDEX idx_assets_name ON assets(name);

-- ============================================
-- BIA MODULE
-- ============================================

-- BIA Assessments Table
CREATE TABLE bia_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    assessment_data JSONB NOT NULL,
    impact_score DECIMAL(5,2),
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- BIA Processes Table
CREATE TABLE bia_processes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bia_assessment_id UUID REFERENCES bia_assessments(id) ON DELETE CASCADE,
    process_name VARCHAR(255) NOT NULL,
    description TEXT,
    criticality_level VARCHAR(50),
    rto_hours INTEGER,
    rpo_hours INTEGER,
    dependencies JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- BIA Impacts Table
CREATE TABLE bia_impacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bia_assessment_id UUID REFERENCES bia_assessments(id) ON DELETE CASCADE,
    impact_type VARCHAR(50) NOT NULL,
    impact_level VARCHAR(50),
    impact_score DECIMAL(5,2),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for BIA Module
CREATE INDEX idx_bia_assessments_user_id ON bia_assessments(user_id);
CREATE INDEX idx_bia_assessments_asset_id ON bia_assessments(asset_id);
CREATE INDEX idx_bia_assessments_status ON bia_assessments(status);
CREATE INDEX idx_bia_processes_assessment_id ON bia_processes(bia_assessment_id);

-- ============================================
-- RISK ASSESSMENT MODULE
-- ============================================

-- Risk Assessments Table
CREATE TABLE risk_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    risk_data JSONB NOT NULL,
    risk_score DECIMAL(5,2),
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Risks Table
CREATE TABLE risks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    risk_assessment_id UUID REFERENCES risk_assessments(id) ON DELETE CASCADE,
    risk_name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    description TEXT,
    likelihood DECIMAL(3,2),
    impact DECIMAL(3,2),
    risk_score DECIMAL(5,2),
    mitigation_plan JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Threats Table
CREATE TABLE threats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    risk_assessment_id UUID REFERENCES risk_assessments(id) ON DELETE CASCADE,
    threat_name VARCHAR(255) NOT NULL,
    threat_type VARCHAR(100),
    description TEXT,
    severity VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vulnerabilities Table
CREATE TABLE vulnerabilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    risk_assessment_id UUID REFERENCES risk_assessments(id) ON DELETE CASCADE,
    vulnerability_name VARCHAR(255) NOT NULL,
    cvss_score DECIMAL(3,1),
    description TEXT,
    remediation_steps JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Risk Mitigations Table
CREATE TABLE risk_mitigations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    risk_id UUID REFERENCES risks(id) ON DELETE CASCADE,
    mitigation_strategy TEXT NOT NULL,
    implementation_status VARCHAR(50),
    effectiveness_score DECIMAL(3,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Risk Assessment Module
CREATE INDEX idx_risk_assessments_user_id ON risk_assessments(user_id);
CREATE INDEX idx_risk_assessments_asset_id ON risk_assessments(asset_id);
CREATE INDEX idx_risk_assessments_status ON risk_assessments(status);
CREATE INDEX idx_risks_assessment_id ON risks(risk_assessment_id);
CREATE INDEX idx_risks_category ON risks(category);
CREATE INDEX idx_risks_risk_score ON risks(risk_score);

-- ============================================
-- DASHBOARD MODULE
-- ============================================

-- Dashboard Configurations Table
CREATE TABLE dashboard_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    dashboard_name VARCHAR(255) NOT NULL,
    widget_configs JSONB NOT NULL,
    layout_config JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dashboard Cache Table (for Redis backup)
CREATE TABLE dashboard_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cache_key VARCHAR(255) UNIQUE NOT NULL,
    cache_data JSONB NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Dashboard Module
CREATE INDEX idx_dashboard_configs_user_id ON dashboard_configs(user_id);
CREATE INDEX idx_dashboard_cache_key ON dashboard_cache(cache_key);
CREATE INDEX idx_dashboard_cache_expires ON dashboard_cache(expires_at);

-- ============================================
-- EXPORT MODULE
-- ============================================

-- Export Templates Table
CREATE TABLE export_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_name VARCHAR(255) NOT NULL,
    template_type VARCHAR(50) NOT NULL,
    template_content TEXT NOT NULL,
    format VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Exports Table
CREATE TABLE exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    export_type VARCHAR(50) NOT NULL,
    format VARCHAR(20) NOT NULL,
    template_id UUID REFERENCES export_templates(id),
    file_path VARCHAR(500),
    file_size BIGINT,
    status VARCHAR(50) DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Export Files Table
CREATE TABLE export_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    export_id UUID REFERENCES exports(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50),
    file_size BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Export Module
CREATE INDEX idx_exports_user_id ON exports(user_id);
CREATE INDEX idx_exports_status ON exports(status);
CREATE INDEX idx_exports_export_type ON exports(export_type);
CREATE INDEX idx_export_files_export_id ON export_files(export_id);

-- ============================================
-- AI MODULE
-- ============================================

-- AI Analyses Table
CREATE TABLE ai_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_type VARCHAR(50) NOT NULL,
    reference_id UUID NOT NULL,
    reference_type VARCHAR(50) NOT NULL,
    input_data JSONB NOT NULL,
    output_data JSONB NOT NULL,
    model_name VARCHAR(255) NOT NULL,
    model_version VARCHAR(50) NOT NULL,
    confidence_score DECIMAL(3,2),
    requires_review BOOLEAN DEFAULT false,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI Embeddings Metadata Table (metadata for vector DB)
CREATE TABLE ai_embeddings_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    embedding_id VARCHAR(255) NOT NULL,
    vector_index_name VARCHAR(100) NOT NULL,
    content_type VARCHAR(50) NOT NULL,
    content_id UUID NOT NULL,
    embedding_dimensions INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI Audit Log Table
CREATE TABLE ai_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    analysis_id UUID REFERENCES ai_analyses(id),
    action VARCHAR(50) NOT NULL,
    prior_output JSONB,
    override_output JSONB,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for AI Module
CREATE INDEX idx_ai_analyses_reference ON ai_analyses(reference_type, reference_id);
CREATE INDEX idx_ai_analyses_type ON ai_analyses(analysis_type);
CREATE INDEX idx_ai_analyses_confidence ON ai_analyses(confidence_score);
CREATE INDEX idx_ai_analyses_requires_review ON ai_analyses(requires_review);
CREATE INDEX idx_ai_audit_log_user_id ON ai_audit_log(user_id);
CREATE INDEX idx_ai_audit_log_analysis_id ON ai_audit_log(analysis_id);
CREATE INDEX idx_ai_embeddings_metadata_content ON ai_embeddings_metadata(content_type, content_id);

-- ============================================
-- END OF SCHEMA
-- ============================================

