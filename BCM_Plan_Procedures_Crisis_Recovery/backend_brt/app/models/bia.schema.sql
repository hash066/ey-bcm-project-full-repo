-- Table: impact_scale
CREATE TABLE IF NOT EXISTS impact_scale (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organization(id) ON DELETE CASCADE,
    scale JSONB NOT NULL, -- Array of objects [{ type, scale: { key: value } }]
    accepted_at TIMESTAMPTZ DEFAULT NOW()
);


-- Table: bia_information
CREATE TABLE IF NOT EXISTS bia_information (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID REFERENCES department(id) ON DELETE CASCADE,
    subdepartment_id UUID REFERENCES subdepartment(id) ON DELETE SET NULL, -- optional
    department_name TEXT NOT NULL,
    department_description TEXT,
    bcp_coordinator TEXT,
    secondary_spoc TEXT,
    primary_location TEXT,
    secondary_location TEXT,
    primary_staff_count INTEGER,
    secondary_staff_count INTEGER,
    scale_id UUID REFERENCES impact_scale(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
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
    created_at TIMESTAMPTZ DEFAULT NOW()
);



-- Table: impact_analysis
CREATE TABLE IF NOT EXISTS impact_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bia_process_id UUID REFERENCES bia_process(id) ON DELETE CASCADE,
    impact_data JSONB NOT NULL -- Array of objects like [{ impact_type: ..., impact_data: {...} }]
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

-- Table: rpo_simulation (linked to minimum_operating_requirements)
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
