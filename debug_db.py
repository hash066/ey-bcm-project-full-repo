import sys
sys.path.append('backend_brt')
from app.db.postgres import get_db_context
from sqlalchemy import text

with get_db_context() as db:
    try:
        # Check if critical column exists in bia_process_info
        result = db.execute(text("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'bia_process_info'
            AND column_name = 'critical'
        """)).fetchone()
        print('critical column in bia_process_info:', result is not None)

        # Check organization exists
        org_result = db.execute(text("""
            SELECT id, name FROM organization WHERE id = 'e9d0b13d-18b5-4618-9fd0-4ef39c4ceee6'
        """)).fetchone()
        print('Organization e9d0... exists:', org_result is not None)
        if org_result:
            print('Org name:', org_result.name)

        # Check the other org
        org2_result = db.execute(text("""
            SELECT id, name FROM organization WHERE id = '97f03185-0d4b-4055-b511-e2fcba1df42d'
        """)).fetchone()
        print('Organization 97f0... exists:', org2_result is not None)
        if org2_result:
            print('Org2 name:', org2_result.name)

        # Check department exists
        dept_result = db.execute(text("""
            SELECT id, name, organization_id FROM department WHERE id = 'e228fe6f-ace2-47d5-9305-3ecfe1aa82f3'
        """)).fetchone()
        print('Department exists:', dept_result is not None)
        if dept_result:
            print('Dept name:', dept_result.name)
            print('Dept org_id:', dept_result.organization_id)

        # Check if there are any processes
        process_count = db.execute(text("SELECT COUNT(*) FROM process")).fetchone()[0]
        print('Total processes:', process_count)

        # Check if there are critical processes
        if result:  # if critical column exists
            critical_count = db.execute(text("SELECT COUNT(*) FROM bia_process_info WHERE critical = true")).fetchone()[0]
            print('Critical processes:', critical_count)

        # Check organization table schema
        columns = db.execute(text("""
            SELECT column_name FROM information_schema.columns
            WHERE table_name = 'organization'
            ORDER BY ordinal_position
        """)).fetchall()
        print('Organization table columns:', [col[0] for col in columns])

        # Create the missing organization
        if not org_result:
            print('Creating missing organization...')
            # Use raw SQL to insert only existing columns
            db.execute(text("""
                INSERT INTO organization (id, name, created_at)
                VALUES ('e9d0b13d-18b5-4618-9fd0-4ef39c4ceee6', 'Test Organization', NOW())
            """))
            db.commit()
            print('Created organization e9d0b13d-18b5-4618-9fd0-4ef39c4ceee6')

        # Update department to belong to the new org
        if dept_result and str(dept_result.organization_id) != 'e9d0b13d-18b5-4618-9fd0-4ef39c4ceee6':
            db.execute(text("""
                UPDATE department
                SET organization_id = 'e9d0b13d-18b5-4618-9fd0-4ef39c4ceee6'
                WHERE id = 'e228fe6f-ace2-47d5-9305-3ecfe1aa82f3'
            """))
            db.commit()
            print('Updated department to belong to new organization')

    except Exception as e:
        print('Error:', e)