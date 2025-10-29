#!/usr/bin/env python3
import sys
import os
sys.path.append('backend_brt')

from app.db.postgres import engine
from sqlalchemy import text

def check_database_tables():
    try:
        with engine.connect() as conn:
            # Get all tables
            result = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"))
            tables = result.fetchall()

            print("Tables in database:")
            for row in tables:
                print(f"  - {row[0]}")

            # Check specific BCM tables
            bcm_tables = ['department', 'subdepartment', 'process', 'bia_process_info', 'recovery_strategy']
            print("\nBCM-related tables:")
            for table in bcm_tables:
                exists_query = f"SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '{table}')"
                exists = conn.execute(text(exists_query)).scalar()
                if exists:
                    # Get row count
                    try:
                        count_query = f"SELECT COUNT(*) FROM {table}"
                        count_result = conn.execute(text(count_query)).scalar()
                        print(f"  ✓ {table}: {count_result} rows")
                    except Exception as e:
                        print(f"  ✓ {table}: exists but error counting rows - {e}")
                else:
                    print(f"  ✗ {table}: does not exist")

    except Exception as e:
        print(f"Error connecting to database: {e}")

if __name__ == "__main__":
    check_database_tables()
