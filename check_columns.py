#!/usr/bin/env python3
import sys
sys.path.append('backend_brt')
from app.db.postgres import get_db
from sqlalchemy import text

db = next(get_db())
result = db.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'organization' ORDER BY column_name;"))
columns = [row[0] for row in result]
print('Organization table columns:')
for col in columns:
    print(f'  {col}')