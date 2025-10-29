#!/usr/bin/env python3
import sys
sys.path.append('backend_brt')

from app.db.postgres import engine
from sqlalchemy import text

def find_critical_column():
    try:
        with engine.connect() as conn:
            # Get all tables
            result = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"))
            tables = result.fetchall()

            print("Searching for 'critical' column in all tables:")
            found = False
            for table_row in tables:
                table_name = table_row[0]
                # Check if table has 'critical' column
                col_result = conn.execute(text(f"SELECT column_name FROM information_schema.columns WHERE table_name = '{table_name}' AND column_name = 'critical'"))
                if col_result.fetchone():
                    print(f"  Found 'critical' column in table: {table_name}")
                    found = True

            if not found:
                print("  No 'critical' column found in any table")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    find_critical_column()