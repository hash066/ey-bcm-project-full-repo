# 🔧 RBAC Architecture Fix Plan

## 🎯 **PROBLEM STATEMENT**

Current system has **3 separate role systems** with inconsistent logic:

### **System A: Main App Roles**
- **Table:** `users.role` (single role per user)
- **Values:** "Process Owner", "Department Head", "Client Head", "BCM Coordinator"
- **Used for:** UI display, general permissions
- **Issue:** Single role limitation

### **System B: Approval Hierarchy**
- **Hierarchy:** process_owner(1) → department_head(2) → organization_head(3) → ey_admin(4)
- **Used for:** Approval workflows only
- **Issue:** Separate from main roles

### **System C: Simple RBAC (Recently Added)**
- **Table:** `user_roles_simple`
- **Issue:** Third system adds complexity, not multiple roles

## ✅ **SOLUTION: Unified RBAC Architecture**

### **Single Role System Design**

**Table: `user_roles`** (many-to-many)
```
user_roles:
- id (PK)
- user_id (FK → users.id)
- role_name (string) - standardized names
- is_active (boolean)
- assigned_at (datetime)
- assigned_by (FK → users.id, nullable)
```

**Standardized Role Names:**
- `process_owner` (level 1)
- `department_head` (level 2)
- `organization_head` (level 3)
- `bcm_coordinator` (level 3)
- `client_head` (level 3)
- `project_sponsor` (level 3)
- `cxo` (level 4)
- `ey_admin` (level 5)

**Single Approval Function:**
```python
def can_user_approve(user_id: int, target_role: str) -> bool:
    """Single, consistent approval logic"""
    user_roles = get_user_roles(user_id)
    user_max_level = max(ROLE_HIERARCHY[role] for role in user_roles)
    target_level = ROLE_HIERARCHY.get(target_role, 0)
    return user_max_level > target_level
```

## 📋 **IMPLEMENTATION PLAN**

### **Phase 1: Database Migration**
1. Create new unified `user_roles` table
2. Migrate data from existing systems
3. Update foreign key references
4. Remove old tables

### **Phase 2: Model Unification**
1. Update all models to use unified system
2. Remove duplicate User models
3. Fix foreign key relationships

### **Phase 3: Service Consolidation**
1. Single `can_user_approve()` function
2. Unified role checking logic
3. Remove complex mappings

### **Phase 4: API Updates**
1. Update all routers to use unified system
2. Maintain backward compatibility
3. Update tests

### **Phase 5: Cleanup**
1. Remove deprecated code
2. Update documentation
3. Performance optimization

## 🎯 **SUCCESS CRITERIA**

- ✅ **Single role system** with multiple roles per user
- ✅ **Consistent approval logic** across all functions
- ✅ **Proper database schema** with foreign keys
- ✅ **Clean architecture** without duplication
- ✅ **Maintainable codebase** with clear role mappings
