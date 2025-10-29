
"""
Check if crisis management tables and columns exist in the database
"""
import os
import sys
from sqlalchemy import create_engine, text

# Database connection from environment variables
DATABASE_URL = os.getenv(
    'SQLALCHEMY_DATABASE_URI',
    'postgresql://postgres.oucktnjljscewmgoukzd:Ey-cat$2025@aws-0-ap-south-1.pooler.supabase.com:5432/postgres'  # Using Supabase config
)

def check_crisis_tables():
    """Check if crisis management tables exist and have the expected columns"""

    # Check if we are using the default Supabase URL
    if 'postgres.oucktnjljscewmgoukzd' in DATABASE_URL:
        print("✅ Using Supabase database configuration")
    else:
        print("⚠️  WARNING: Using a custom database URL")

    try:
        engine = create_engine(DATABASE_URL)

        with engine.connect() as connection:
            # Check if tables exist
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

            if tables:
                print("\n📋 Existing crisis management tables:")
                for table in tables:
                    table_name = table[0]
                    print(f"  ✓ {table_name}")

                    # Get columns for this table
                    columns_result = connection.execute(text("""
                    SELECT column_name, data_type, is_nullable, column_default
                    FROM information_schema.columns 
                    WHERE table_schema = 'public' 
                    AND table_name = :table_name
                    ORDER BY ordinal_position
                    """), {"table_name": table_name})

                    columns = columns_result.fetchall()
                    print(f"    Columns:")
                    for col in columns:
                        nullable = "NOT NULL" if col[2] == "NO" else "NULL"
                        default = f" DEFAULT {col[3]}" if col[3] else ""
                        print(f"      - {col[0]} ({col[1]}) {nullable}{default}")
            else:
                print("\n❌ No crisis management tables found.")
                return False

            print("\n✅ Crisis management tables check complete.")
            return True

    except Exception as e:
        print(f"❌ Error connecting to database: {e}")
        return False
    finally:
        engine.dispose()

if __name__ == "__main__":
    print("🔍 Checking for existing crisis management database tables and columns...\n")
    tables_exist = check_crisis_tables()

    if tables_exist:
        print("\n✅ Crisis management tables check complete.")
    else:
        print("\n❌ No crisis management tables found. You may need to create them.")
