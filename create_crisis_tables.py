
"""
Create crisis management tables in the database
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
    """Create all required tables for crisis management module"""

    # Check if we are using the default Supabase URL
    if 'postgres.oucktnjljscewmgoukzd' in DATABASE_URL:
        print("✅ Using Supabase database configuration")
    else:
        print("⚠️  WARNING: Using a custom database URL")

    engine = create_engine(DATABASE_URL)

    sql_script = """
    -- ================================================
    -- CRISIS MANAGEMENT MODULE - DATABASE TABLES
    -- ================================================

    -- 1. CRISIS_TEMPLATE TABLE
    CREATE TABLE IF NOT EXISTS crisis_template (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        content_type TEXT NOT NULL,
        extracted_text TEXT,
        missing_fields JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- 2. CRISIS_PLAN TABLE
    CREATE TABLE IF NOT EXISTS crisis_plan (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        template_id UUID NOT NULL REFERENCES crisis_template(id) ON DELETE CASCADE,
        organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        file_path TEXT,
        status TEXT NOT NULL DEFAULT 'draft',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- 3. CRISIS_PLAN_SECTION TABLE
    CREATE TABLE IF NOT EXISTS crisis_plan_section (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        crisis_plan_id UUID NOT NULL REFERENCES crisis_plan(id) ON DELETE CASCADE,
        heading TEXT NOT NULL,
        content TEXT,
        "order" INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- 4. CRISIS_COMMUNICATION_PLAN TABLE
    CREATE TABLE IF NOT EXISTS crisis_communication_plan (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        crisis_plan_id UUID NOT NULL REFERENCES crisis_plan(id) ON DELETE CASCADE,
        organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
        file_path TEXT,
        media_statement TEXT,
        faq JSONB,
        stakeholder_communications JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- ================================================
    -- CREATE INDEXES
    -- ================================================

    CREATE INDEX IF NOT EXISTS idx_crisis_template_org ON crisis_template(organization_id);
    CREATE INDEX IF NOT EXISTS idx_crisis_plan_template ON crisis_plan(template_id);
    CREATE INDEX IF NOT EXISTS idx_crisis_plan_org ON crisis_plan(organization_id);
    CREATE INDEX IF NOT EXISTS idx_crisis_plan_section_plan ON crisis_plan_section(crisis_plan_id);
    CREATE INDEX IF NOT EXISTS idx_crisis_comm_plan_plan ON crisis_communication_plan(crisis_plan_id);
    CREATE INDEX IF NOT EXISTS idx_crisis_comm_plan_org ON crisis_communication_plan(organization_id);
    """

    try:
        with engine.connect() as connection:
            # Execute the script
            connection.execute(text(sql_script))
            connection.commit()

            print("✅ All crisis management tables created successfully!")

            # Verify tables were created
            result = connection.execute(text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN (
                'crisis_template',
                'crisis_plan',
                'crisis_plan_section',
                'crisis_communication_plan'
            )
            ORDER BY table_name
            """))

            tables = result.fetchall()
            print("
📋 Created tables:")
            for table in tables:
                print(f"  ✓ {table[0]}")

            print("
✅ Database setup complete! Restart your backend server.")

    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)
    finally:
        engine.dispose()

if __name__ == "__main__":
    print("🚀 Creating crisis management module database tables...
")
    create_tables()
