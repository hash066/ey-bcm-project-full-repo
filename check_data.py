# -*- coding: utf-8 -*-
import sys
import os

# Add the project root to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend_brt.app.core.config import settings
from sqlalchemy import create_engine, text

engine = create_engine(settings.SQLALCHEMY_DATABASE_URI)

with engine.connect() as conn:
    # Check departments
    result = conn.execute(text("SELECT COUNT(*) FROM department"))
    dept_count = result.scalar()
    print(f"Department count: {dept_count}")
    
    if dept_count > 0:
        result = conn.execute(text("SELECT * FROM department LIMIT 3"))
        print("\nSample departments:")
        for row in result:
            print(row)
    
    # Check processes
    result = conn.execute(text("SELECT COUNT(*) FROM process"))
    proc_count = result.scalar()
    print(f"\nProcess count: {proc_count}")
    
    if proc_count > 0:
        result = conn.execute(text("SELECT * FROM process LIMIT 3"))
        print("\nSample processes:")
        for row in result:
            print(row)
    
    # Check bia_process_info
    result = conn.execute(text("SELECT COUNT(*) FROM bia_process_info"))
    bia_count = result.scalar()
    print(f"\nBIA Process Info count: {bia_count}")
    
    if bia_count > 0:
        result = conn.execute(text("SELECT * FROM bia_process_info LIMIT 3"))
        print("\nSample BIA Process Info:")
        for row in result:
            print(row)