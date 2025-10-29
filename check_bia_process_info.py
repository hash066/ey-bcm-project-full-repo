#!/usr/bin/env python3
import sys
sys.path.append('backend_brt')

from app.db.postgres import engine
from sqlalchemy import text

def check_bia_process_info():
    try:
        with engine.connect() as conn:
            # Get bia_process_info table columns
            result = conn.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'bia_process_info'"))
            print("bia_process_info table columns:")
            for row in result.fetchall():
                print(f"  - {row[0]}: {row[1]}")

            # Get sample data
            result = conn.execute(text("SELECT * FROM bia_process_info LIMIT 1"))
            print("\nSample bia_process_info row:")
            row = result.fetchone()
            if row:
                print(f"  {row}")
            else:
                print("  No data found")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_bia_process_info()