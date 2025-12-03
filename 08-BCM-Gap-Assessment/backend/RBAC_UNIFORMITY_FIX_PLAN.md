# 🔧 RBAC Uniformity Fix Plan

## 🎯 **OBJECTIVE**
Make RBAC uniform across all modules with single source of truth, eliminating confusing duplicates and security risks.

## 📊 **CURRENT STATE ANALYSIS**
- **5 different RBAC systems** with conflicting logic
- **4 major inconsistencies** identified
- **Gap assessment module** uses completely separate system
- **Different role hierarchies** (ey_admin: 4 vs 5 vs 6)
- **Multiple function names** for same functionality

## 🛠️ **COMPREHENSIVE FIX PLAN**

### **Phase 1: Update Gap Assessment Module** 🔴 **HIGH PRIORITY**
**Problem**: Gap assessment uses separate RBAC with different functions and hierarchy
**Solution**: Replace with unified RBAC system

**Files to Update:**
- `app/gap_assessment_module/auth.py` - Replace approval functions
- `app/gap_assessment_module/middleware/rbac.py` - Update middleware
- `app/gap_assessment_module/models.py` - Update role constants

**Changes:**
```python
# BEFORE (gap assessment)
def check_approval_permission(user: User, target_role: str) -> bool:
    # Separate logic

# AFTER (unified)
def check_approval_permission(user: User, target_role: str) -> bool:
    # DEPRECATED: Redirect to unified system
    from app.models.unified_rbac import user_can_approve
    # Convert user object to user_id and call unified function
```

### **Phase 2: Standardize Role Hierarchy** 🟡 **MEDIUM PRIORITY**
**Problem**: Different role sets and hierarchy levels
**Solution**: Single definitive hierarchy everywhere

**Standard Hierarchy:**
```python
ROLE_HIERARCHY = {
    'process_owner': 1,
    'sub_department_head': 2,
    'department_head': 3,
    'bcm_coordinator': 4,
    'ceo': 5,
    'ey_admin': 6
}
```

### **Phase 3: Function Name Standardization** 🟡 **MEDIUM PRIORITY**
**Problem**: Multiple function names for same functionality
**Solution**: Single function name across all modules

**Standard Functions:**
- `user_can_approve(db, user_id, target_role)` - Primary approval function
- `user_has_role(db, user_id, role_name)` - Role checking function

### **Phase 4: Remove Deprecated Systems** 🟢 **LOW PRIORITY**
**Problem**: Multiple redirecting systems create confusion
**Solution**: Clean up and simplify

**Cleanup:**
- Mark simple RBAC as deprecated
- Simplify RBAC service redirects
- Remove config settings complexity

## 📋 **IMPLEMENTATION STEPS**

### **Step 1: Update Gap Assessment Auth** ⏳ **IN PROGRESS**
- Replace `check_role_hierarchy()` with unified logic
- Replace `check_approval_permission()` with unified logic
- Update imports to use unified system

### **Step 2: Update Gap Assessment Middleware**
- Update RBACMiddleware to use unified functions
- Replace role constants with unified ones
- Update permission checking logic

### **Step 3: Update Gap Assessment Models**
- Replace role constants with unified hierarchy
- Update any model-level permission checks

### **Step 4: Verify Consistency**
- Run uniformity analysis to confirm all systems consistent
- Test approval logic across modules
- Verify no breaking changes

### **Step 5: Documentation Update**
- Update all documentation to reference unified system
- Add deprecation warnings for old functions
- Create migration guide for developers

## ✅ **SUCCESS CRITERIA**

1. **Single RBAC System**: All modules use unified RBAC
2. **Consistent Results**: Same user gets same permissions everywhere
3. **Single Hierarchy**: One definitive role hierarchy
4. **Standard Functions**: Single function names across modules
5. **No Breaking Changes**: Existing functionality preserved

## 🚨 **RISK MITIGATION**

- **Backward Compatibility**: All old functions redirect to new ones
- **Gradual Migration**: Phase-by-phase implementation
- **Testing**: Comprehensive tests before/after each phase
- **Documentation**: Clear migration path for developers

## 📈 **EXPECTED OUTCOME**

- **Security**: No more conflicting permission checks
- **Maintainability**: Single source of truth for RBAC
- **Developer Experience**: Clear, consistent API
- **Performance**: Reduced complexity and duplication

---

**Status**: Phase 1 in progress
**Priority**: HIGH - Security and consistency critical
**Timeline**: Complete within current session
