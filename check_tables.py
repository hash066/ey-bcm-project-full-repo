
import os
import sys
from sqlalchemy import create_engine, text

# Database connection from environment variables
DATABASE_URL = os.getenv(
    'SQLALCHEMY_DATABASE_URI',
    'postgresql://postgres.oucktnjljscewmgoukzd:Ey-cat$2025@aws-0-ap-south-1.pooler.supabase.com:5432/postgres'  # Using Supabase config
)

def check_tables():
    """Check if procedure-related tables already exist"""

    # Check if we are using the default Supabase URL
    if 'postgres.oucktnjljscewmgoukzd' in DATABASE_URL:
        print("✅ Using Supabase database configuration")
        return True

    try:
        engine = create_engine(DATABASE_URL)

        with engine.connect() as connection:
            # Check if tables exist
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

            if tables:
                print("\n📋 Existing procedure-related tables:")
                for table in tables:
                    print(f"  ✓ {table[0]}")
                print("\n⚠️  Some tables already exist. You may want to drop them before creating new ones.")
                return True
            else:
                print("\n❌ No procedure-related tables found.")
                return False

    except Exception as e:
        print(f"❌ Error connecting to database: {e}")
        return False
    finally:
        engine.dispose()

if __name__ == "__main__":
    print("🔍 Checking for existing procedure-related database tables...\n")
    tables_exist = check_tables()

    if tables_exist:
        print("\n⚠️  Tables already exist. Consider dropping them first if you want to recreate.")
    else:
        print("\n✅ No existing tables found. You can proceed with creating new tables.")
