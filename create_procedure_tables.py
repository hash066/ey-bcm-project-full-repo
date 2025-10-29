
"""
Create all procedure-related database tables
Run this once to set up the database schema
"""
import os
import sys
from sqlalchemy import create_engine, text

# Database connection from environment variables
DATABASE_URL = os.getenv(
    'SQLALCHEMY_DATABASE_URI',
    'postgresql://postgres.oucktnjljscewmgoukzd:Ey-cat$2025@aws-0-ap-south-1.pooler.supabase.com:5432/postgres'  # Using Supabase config
)

def create_tables():
    """Create all required tables for procedures module"""

    # Check if we are using the default Supabase URL
    if 'postgres.oucktnjljscewmgoukzd' in DATABASE_URL:
        print("[OK] Using Supabase database configuration")
    else:
        print("[WARNING] Using a custom database URL")

    engine = create_engine(DATABASE_URL)

    sql_script = """
    -- ================================================
    -- PROCEDURES MODULE - DATABASE TABLES
    -- ================================================

    -- 1. PROCEDURE_TEMPLATES TABLE
    CREATE TABLE IF NOT EXISTS procedure_templates (
        id SERIAL PRIMARY KEY,
        procedure_type VARCHAR(100) NOT NULL UNIQUE,
        template_name VARCHAR(255) NOT NULL,
        description TEXT,
        default_document_info JSONB,
        sections JSONB,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER,
        updated_by INTEGER
    );

    -- 2. PROCEDURE_DOCUMENTS TABLE
    CREATE TABLE IF NOT EXISTS procedure_documents (
        id SERIAL PRIMARY KEY,
        procedure_type VARCHAR(100) NOT NULL,
        organization_id INTEGER NOT NULL,
        document_name VARCHAR(255) NOT NULL,
        document_owner VARCHAR(255),
        document_version_no VARCHAR(50),
        document_version_date DATE,
        prepared_by VARCHAR(255),
        reviewed_by VARCHAR(255),
        approved_by VARCHAR(255),
        use_llm_content BOOLEAN DEFAULT FALSE,
        llm_content JSONB,
        custom_content JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER,
        updated_by INTEGER,
        CONSTRAINT unique_procedure_org UNIQUE (procedure_type, organization_id)
    );

    -- 3. PROCEDURE_CHANGE_LOG TABLE
    CREATE TABLE IF NOT EXISTS procedure_change_log (
        id SERIAL PRIMARY KEY,
        procedure_document_id INTEGER NOT NULL REFERENCES procedure_documents(id) ON DELETE CASCADE,
        sr_no INTEGER NOT NULL,
        version_no VARCHAR(50) NOT NULL,
        approval_date DATE,
        description_of_change TEXT,
        reviewed_by VARCHAR(255),
        approved_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER
    );

    -- 4. LLM_CONTENT_CACHE TABLE
    CREATE TABLE IF NOT EXISTS llm_content_cache (
        id SERIAL PRIMARY KEY,
        content_type VARCHAR(100) NOT NULL,
        procedure_type VARCHAR(100) NOT NULL,
        organization_id INTEGER NOT NULL,
        content_key VARCHAR(255) NOT NULL UNIQUE,
        generated_content JSONB NOT NULL,
        generation_parameters JSONB,
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER
    );

    -- 5. LLM_GENERATED_CONTENT TABLE
    CREATE TABLE IF NOT EXISTS llm_generated_content (
        id SERIAL PRIMARY KEY,
        procedure_type VARCHAR(100) NOT NULL,
        organization_id INTEGER NOT NULL,
        content_type VARCHAR(100),
        content JSONB NOT NULL,
        version VARCHAR(20) DEFAULT '1.0',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER,
        CONSTRAINT unique_llm_procedure_version UNIQUE (procedure_type, organization_id, version)
    );

    -- 6. PROCEDURE_EXPORTS TABLE
    CREATE TABLE IF NOT EXISTS procedure_exports (
        id SERIAL PRIMARY KEY,
        procedure_document_id INTEGER NOT NULL REFERENCES procedure_documents(id) ON DELETE CASCADE,
        export_format VARCHAR(50) NOT NULL,
        file_path VARCHAR(500),
        file_size BIGINT,
        download_url VARCHAR(500),
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER
    );

    -- ================================================
    -- CREATE INDEXES
    -- ================================================

    CREATE INDEX IF NOT EXISTS idx_procedure_documents_org ON procedure_documents(organization_id, procedure_type);
    CREATE INDEX IF NOT EXISTS idx_llm_cache_lookup ON llm_content_cache(content_key, organization_id);
    CREATE INDEX IF NOT EXISTS idx_llm_cache_expiry ON llm_content_cache(expires_at) WHERE expires_at IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_change_log_procedure ON procedure_change_log(procedure_document_id);
    CREATE INDEX IF NOT EXISTS idx_llm_generated_content_lookup ON llm_generated_content(procedure_type, organization_id);
    """

    try:
        with engine.connect() as connection:
            # Execute the script
            connection.execute(text(sql_script))
            connection.commit()

            print("[SUCCESS] All tables created successfully!")
            
            # Insert sample template separately with error handling
            try:
                insert_sql = """
                INSERT INTO procedure_templates (
                    procedure_type,
                    template_name,
                    description,
                    default_document_info,
                    sections,
                    is_active,
                    version,
                    created_by
                ) VALUES (
                    'bia',
                    'Business Impact Analysis Procedure',
                    'Standard BIA procedure template for ISO 22301 compliance',
                    '{"document_name": "BCMS BIA Procedure", "document_owner": "H.O. BCM Team", "document_version_no": "1.0", "document_version_date": "2024-01-01", "prepared_by": "H.O. BCM Team", "reviewed_by": "Head-O&FRMD", "approved_by": "IT Strategy Committee (ITSC)"}'::jsonb,
                    '{"sections": ["introduction", "scope", "objectives", "methodology", "process_flow", "roles_responsibilities", "review_frequency"]}'::jsonb,
                    true,
                    '1.0',
                    1
                )
                """
                connection.execute(text(insert_sql))
                connection.commit()
                print("[SUCCESS] Sample BIA template inserted!")
            except Exception as insert_error:
                connection.rollback()  # Rollback the failed transaction
                if "duplicate key" in str(insert_error).lower() or "unique constraint" in str(insert_error).lower():
                    print("[INFO] Sample template already exists, skipping insert")
                else:
                    print(f"[WARNING] Could not insert sample template: {insert_error}")

            # Verify tables were created
            result = connection.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name IN (
                    'procedure_templates',
                    'procedure_documents',
                    'procedure_change_log',
                    'llm_content_cache',
                    'llm_generated_content',
                    'procedure_exports'
                )
                ORDER BY table_name
            """))

            tables = result.fetchall()
            print("\n[INFO] Created tables:")
            for table in tables:
                print(f"  [OK] {table[0]}")

            print("\n[SUCCESS] Database setup complete! Restart your backend server.")

    except Exception as e:
        print(f"[ERROR] {e}")
        sys.exit(1)
    finally:
        engine.dispose()

if __name__ == "__main__":
    print("[INFO] Creating procedures module database tables...\n")
    create_tables()
