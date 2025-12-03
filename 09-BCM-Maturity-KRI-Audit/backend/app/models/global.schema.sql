-- Updated Table: organization
CREATE TABLE IF NOT EXISTS organization (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    head_name TEXT,
    sector TEXT, -- Nullable sector field
    criticality TEXT, -- New criticality input field
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: department
CREATE TABLE IF NOT EXISTS department (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    head_name TEXT, -- Head name of the department
    organization_id UUID REFERENCES organization(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ✅ New Table: subdepartment
CREATE TABLE IF NOT EXISTS subdepartment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    head_name TEXT, -- Head of the sub-department
    department_id UUID REFERENCES department(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ✅ Updated Table: process
CREATE TABLE IF NOT EXISTS process (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    subdepartment_id UUID REFERENCES subdepartment(id) ON DELETE CASCADE,
    process_owner TEXT, -- AD DS Username
    created_at TIMESTAMPTZ DEFAULT NOW()
);
