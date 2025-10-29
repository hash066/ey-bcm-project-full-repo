from sqlalchemy import create_engine, text

DATABASE_URL = "postgresql+psycopg2://postgres.oucktnjljscewmgoukzd:Ey-cat$2025@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"
engine = create_engine(DATABASE_URL)

with open('backend_brt/create_bcm_tables.sql', 'r') as f:
    sql = f.read()

with engine.connect() as conn:
    conn.execute(text(sql))
    conn.commit()

print('BCM tables created successfully')
