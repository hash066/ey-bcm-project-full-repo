# Quick Database Reference Guide

## Connection Details

```
Host: aws-0-ap-south-1.pooler.supabase.com
Port: 5432
Database: postgres
Type: PostgreSQL
```

## Key Tables by Feature

### User Authentication & RBAC
```sql
-- Get user with roles
SELECT u.username, r.name as role 
FROM users u 
JOIN user_roles ur ON u.id = ur.user_id 
JOIN roles r ON ur.role_id = r.id;

-- Check user permissions
SELECT p.name, p.action, p.resource 
FROM permissions p
JOIN role_permissions rp ON p.id = rp.permission_id
JOIN user_roles ur ON rp.role_id = ur.role_id
WHERE ur.user_id = ?;
```

### BCM Plans
```sql
-- Organization BCM Plan
SELECT * FROM bcm_organization_plan WHERE organization_id = ?;

-- Department BCM Plan
SELECT * FROM bcm_department_plan WHERE department_id = ?;
```

### BIA & Recovery
```sql
-- Process BIA with Recovery Strategy
SELECT 
    p.name as process,
    bia.rto, bia.rpo, bia.criticality_level,
    rs.people_status, rs.technology_status
FROM process p
JOIN bia_process_info bia ON p.id = bia.process_id
LEFT JOIN recovery_strategies rs ON p.id = rs.process_id;
```

### Procedures
```sql
-- Get current procedure
SELECT * FROM procedure_documents 
WHERE organization_id = ? 
AND procedure_type = 'bia' 
AND status = 'published'
ORDER BY created_at DESC LIMIT 1;
```

### Crisis Management
```sql
-- Crisis plan with sections
SELECT cp.plan_title, cps.section_heading, cps.content
FROM crisis_plan cp
JOIN crisis_plan_section cps ON cp.id = cps.crisis_plan_id
WHERE cp.organization_id = ?
ORDER BY cps.order;
```

## Common Queries

### Organizational Hierarchy
```sql
-- Full hierarchy
SELECT 
    o.name as org,
    d.name as dept,
    sd.name as subdept,
    p.name as process
FROM organizations o
LEFT JOIN departments d ON o.id = d.organization_id
LEFT JOIN subdepartment sd ON d.id = sd.department_id
LEFT JOIN process p ON sd.id = p.subdepartment_id;
```

### Audit Trail
```sql
-- Recent activity
SELECT 
    u.username,
    al.action,
    al.resource_type,
    al.timestamp
FROM audit_log al
JOIN users u ON al.user_id = u.id
ORDER BY al.timestamp DESC
LIMIT 50;
```

## Important JSONB Columns

Many tables use JSONB for flexible data:
- `bcm_organization_plan.plan_data`
- `recovery_strategies.people_strategy`
- `procedure_documents.content`
- `crisis_plan_section.content`

Query JSONB:
```sql
-- Extract JSON field
SELECT plan_data->>'version' FROM bcm_organization_plan;

-- Filter by JSON field
SELECT * FROM recovery_strategies 
WHERE people_strategy->>'status' = 'approved';
```

## Table Counts

```sql
SELECT 
    'Users' as entity, COUNT(*) as count FROM users
UNION ALL
SELECT 'Organizations', COUNT(*) FROM organizations
UNION ALL
SELECT 'Departments', COUNT(*) FROM departments
UNION ALL
SELECT 'Processes', COUNT(*) FROM process
UNION ALL
SELECT 'BIA Records', COUNT(*) FROM bia_process_info
UNION ALL
SELECT 'Recovery Strategies', COUNT(*) FROM recovery_strategies;
```

## Backup & Export

```bash
# Export schema
pg_dump -h aws-0-ap-south-1.pooler.supabase.com -U postgres.oucktnjljscewmgoukzd -d postgres --schema-only > schema.sql

# Export data
pg_dump -h aws-0-ap-south-1.pooler.supabase.com -U postgres.oucktnjljscewmgoukzd -d postgres --data-only > data.sql

# Full backup
pg_dump -h aws-0-ap-south-1.pooler.supabase.com -U postgres.oucktnjljscewmgoukzd -d postgres > full_backup.sql
```

## Performance Tips

1. **Add indexes** on frequently queried columns:
```sql
CREATE INDEX idx_process_org ON process(organization_id);
CREATE INDEX idx_bia_process ON bia_process_info(process_id);
CREATE INDEX idx_recovery_process ON recovery_strategies(process_id);
```

2. **Use connection pooling** (already configured in app)

3. **Query optimization**:
   - Use `EXPLAIN ANALYZE` to check query plans
   - Avoid N+1 queries - use JOINs
   - Use `SELECT` specific columns, not `*`

## Migration Commands

```bash
# Create new migration
alembic revision -m "description"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1

# Check current version
alembic current
```

## Useful Views (Create These)

```sql
-- User access summary
CREATE VIEW user_access_summary AS
SELECT 
    u.username,
    r.name as role,
    uo.organization_id,
    ud.department_id
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
LEFT JOIN user_organization_mapping uo ON u.id = uo.user_id
LEFT JOIN user_department_mapping ud ON u.id = ud.user_id;

-- Process criticality dashboard
CREATE VIEW process_criticality_dashboard AS
SELECT 
    p.name as process_name,
    d.name as department,
    bia.criticality_level,
    bia.rto,
    bia.rpo,
    CASE 
        WHEN rs.id IS NOT NULL THEN 'Has Strategy'
        ELSE 'Missing Strategy'
    END as recovery_status
FROM process p
JOIN subdepartment sd ON p.subdepartment_id = sd.id
JOIN departments d ON sd.department_id = d.id
LEFT JOIN bia_process_info bia ON p.id = bia.process_id
LEFT JOIN recovery_strategies rs ON p.id = rs.process_id;
```

## Troubleshooting

### Connection Issues
```python
# Test connection
from app.db.postgres import engine
from sqlalchemy import text

with engine.connect() as conn:
    result = conn.execute(text("SELECT 1"))
    print("Connected!" if result.fetchone()[0] == 1 else "Failed")
```

### Check Table Exists
```sql
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'your_table_name'
);
```

### Find Missing Foreign Keys
```sql
SELECT 
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY';
```

---

**For detailed schema**: See `DATABASE_SCHEMA.md`  
**For machine-readable format**: See `database_schema.json`
