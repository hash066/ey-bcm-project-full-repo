#!/usr/bin/env python3
import sys
sys.path.append('backend_brt')

from app.db.postgres import engine
from sqlalchemy import text

def check_process_table():
    try:
        with engine.connect() as conn:
            # Get process table columns
            result = conn.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'process'"))
            print("process table columns:")
            for row in result.fetchall():
                print(f"  - {row[0]}: {row[1]}")

            # Get sample data
            result = conn.execute(text("SELECT * FROM process LIMIT 1"))
            print("\nSample process row:")
            row = result.fetchone()
            if row:
                print(f"  {row}")
            else:
                print("  No data found")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_process_table()