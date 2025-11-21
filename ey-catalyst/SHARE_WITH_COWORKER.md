# Business Resilience Tool - Database Documentation Package

Hi! Here's everything you need to understand our database structure.

## 📦 Files Included

### 1. **DATABASE_SCHEMA.md** (Main Documentation)
- Complete table definitions with all columns
- Relationships and foreign keys
- Organized by module (BCM, BIA, Recovery, etc.)
- Sample queries
- ER relationship diagrams

### 2. **database_schema.json** (Machine-Readable)
- JSON format of entire schema
- Includes all tables, columns, types, and relationships
- Can be imported into database design tools
- Useful for automated tooling

### 3. **QUICK_DB_REFERENCE.md** (Quick Reference)
- Common SQL queries
- Connection details
- Performance tips
- Troubleshooting guide

## 🔗 Connection Information

```
Database Type: PostgreSQL (Supabase)
Host: aws-0-ap-south-1.pooler.supabase.com
Port: 5432
Database: postgres
Schema: public
```

**Note**: Contact admin for credentials

## 📊 Database Overview

### Total Tables: 75

### Main Modules:
1. **Core** (5 tables) - Organizations, Departments, Processes
2. **RBAC** (5 tables) - Users, Roles, Permissions
3. **BCM** (5 tables) - Business Continuity Plans
4. **BIA** (4 tables) - Business Impact Analysis
5. **Recovery** (2 tables) - Recovery Strategies
6. **Procedures** (4 tables) - BIA, Risk Assessment, BCP procedures
7. **Crisis** (4 tables) - Crisis Management Plans
8. **Risk** (4 tables) - Risk Assessments
9. **Audit** (3 tables) - Activity Logs

## 🔑 Key Tables You Should Know

### Authentication
- `users` - User accounts
- `roles` - Role definitions (Admin, CEO, Dept Head, etc.)
- `user_roles` - User-role assignments

### Core Data
- `organizations` - Top-level organizations
- `departments` - Department hierarchy
- `process` - Business processes

### Business Continuity
- `bcm_organization_plan` - Org-level BCM plans
- `bia_process_info` - Business impact analysis
- `recovery_strategies` - Recovery strategies (People, Tech, Facility, Data)

## 🛠️ Tools to Visualize

You can import `database_schema.json` into:
- **dbdiagram.io** - Create ER diagrams
- **DBeaver** - Database management
- **pgAdmin** - PostgreSQL admin tool
- **DataGrip** - JetBrains database IDE

## 📖 How to Use These Files

### For Understanding Structure:
1. Start with `DATABASE_SCHEMA.md` - Read the module you're working on
2. Check relationships section to understand data flow

### For Development:
1. Use `QUICK_DB_REFERENCE.md` for common queries
2. Reference `database_schema.json` for exact column types

### For Database Design:
1. Import `database_schema.json` into your design tool
2. Use `DATABASE_SCHEMA.md` for context and business logic

## 🔍 Quick Start Queries

### Get all users with their roles:
```sql
SELECT u.username, r.name as role_name
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id;
```

### Get processes with BIA and recovery status:
```sql
SELECT 
    p.name as process,
    bia.rto, bia.rpo,
    rs.people_status, rs.technology_status
FROM process p
LEFT JOIN bia_process_info bia ON p.id = bia.process_id
LEFT JOIN recovery_strategies rs ON p.id = rs.process_id;
```

### Get organization BCM plan:
```sql
SELECT * FROM bcm_organization_plan 
WHERE organization_id = 'your-org-id';
```

## 📝 Important Notes

1. **JSONB Columns**: Many tables use JSONB for flexible schema
   - Query with `->` for JSON object, `->>` for text
   - Example: `plan_data->>'version'`

2. **UUIDs**: Most tables use UUID primary keys
   - Good for distributed systems
   - Use `gen_random_uuid()` for new records

3. **Timestamps**: All tables have `created_at`, many have `updated_at`

4. **Soft Deletes**: Not implemented yet (consider adding `deleted_at`)

## 🚀 Next Steps

1. Review `DATABASE_SCHEMA.md` for your module
2. Run sample queries from `QUICK_DB_REFERENCE.md`
3. Import `database_schema.json` into your preferred tool
4. Ask questions if anything is unclear!

## 📞 Questions?

If you need clarification on:
- Specific table relationships
- Business logic behind certain fields
- How to query specific data
- Performance optimization

Feel free to reach out!

---

**Generated**: October 25, 2025  
**Database Version**: PostgreSQL 14+  
**Total Tables**: 75  
**Total Relationships**: 46+
