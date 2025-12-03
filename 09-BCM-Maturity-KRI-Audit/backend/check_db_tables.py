#!/usr/bin/env python3
"""
Check what tables exist in the database
"""

from app.db.postgres import engine
from sqlalchemy import text

def check_tables():
    try:
        with engine.connect() as conn:
            result = conn.execute(text('SELECT name FROM sqlite_master WHERE type="table"'))
            tables = [row[0] for row in result]
            print('Existing tables:')
            for table in sorted(tables):
                print(f'  {table}')
    except Exception as e:
        print(f"Error checking tables: {e}")

if __name__ == "__main__":
    check_tables()
