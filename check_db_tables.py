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
                exists = conn.execute(text(f"SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '{table}')")).scalar()
