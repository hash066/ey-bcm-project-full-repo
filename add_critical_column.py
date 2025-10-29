#!/usr/bin/env python3
import sys
sys.path.append('backend_brt')

from app.db.postgres import engine
from sqlalchemy import text

def add_critical_column():
    try:
        with engine.connect() as conn:
            # Check if critical column exists
            result = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'bia_process_info' AND column_name = 'critical'"))
            if result.fetchone():
                print("Critical column already exists")
                return

            # Add the critical column
            print("Adding critical column to bia_process_info table...")
            conn.execute(text("ALTER TABLE bia_process_info ADD COLUMN critical BOOLEAN DEFAULT false"))
            conn.commit()
            print("Critical column added successfully")

            # Set some sample critical processes
            conn.execute(text("UPDATE bia_process_info SET critical = true WHERE id IN (SELECT id FROM bia_process_info LIMIT 3)"))
            conn.commit()
            print("Set some sample critical processes")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    add_critical_column()