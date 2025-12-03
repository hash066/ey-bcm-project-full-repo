#!/usr/bin/env python3
"""
Analysis of Inconsistent Approval Logic
This script identifies and documents all conflicting approval functions.
"""

def analyze_approval_functions():
    """Analyze all approval functions in the codebase."""

    print("🔍 ANALYZING INCONSISTENT APPROVAL LOGIC")
    print("=" * 60)

    approval_functions = [
        {
            "file": "app/models/unified_rbac.py",
            "function": "user_can_approve(db, user_id, target_role)",
            "logic": "user_max_level = max(ROLE_HIERARCHY[role.role_name] for role in user_roles); return user_max_level > target_level",
            "hierarchy": "ROLE_HIERARCHY = {'process_owner': 1, 'department_head': 2, 'organization_head': 3, 'bcm_coordinator': 3, 'client_head': 3, 'project_sponsor': 3, 'cxo': 4, 'ey_admin': 5}",
            "issue": "Uses unified RBAC hierarchy"
        },
        {
            "file": "app/models/simple_rbac.py",
            "function": "user_can_approve(db, user_id, target_role)",
            "logic": "user_max_level = max(ROLE_HIERARCHY[role.role_name] for role in user_roles); return user_max_level > target_level",
            "hierarchy": "Imports ROLE_HIERARCHY from app.gap_assessment_module.models",
            "issue": "Uses gap assessment hierarchy (potentially different)"
        },
        {
            "file": "app/services/rbac_service.py",
            "function": "can_user_approve(user, target_user, target_role)",
            "logic": "user_max_level = max(role.hierarchy_level for role in user_roles); return user_max_level > target_level",
            "hierarchy": "Uses role.hierarchy_level from database Role model",
            "issue": "Uses database-driven hierarchy levels"
        },
        {
            "file": "app/config_settings/role_mapping.py",
            "function": "can_user_approve(main_app_role, target_approval_role)",
            "logic": "user_level = ROLE_HIERARCHY_LEVELS[user_approval_role]; return user_level > target_level",
            "hierarchy": "ROLE_HIERARCHY_LEVELS = {PROCESS_OWNER: 1, DEPARTMENT_HEAD: 2, ORGANIZATION_HEAD: 3, EY_ADMIN: 4}",
            "issue": "Uses config-based hierarchy (different levels)"
        }
    ]

    print("📋 FOUND APPROVAL FUNCTIONS:")
    print()

    for i, func in enumerate(approval_functions, 1):
        print(f"{i}. {func['file']}")
        print(f"   Function: {func['function']}")
        print(f"   Logic: {func['logic']}")
        print(f"   Hierarchy: {func['hierarchy']}")
        print(f"   ⚠️  Issue: {func['issue']}")
        print()

    print("🚨 SECURITY RISKS IDENTIFIED:")
    print("1. Different functions return different results for same inputs")
    print("2. Multiple role hierarchies with conflicting level assignments")
    print("3. No single source of truth for approval logic")
    print("4. Potential security gaps where one function allows but another denies")
    print()

    print("🔧 REQUIRED FIXES:")
    print("1. Consolidate all approval functions to use single logic")
    print("2. Establish single role hierarchy as source of truth")
    print("3. Remove duplicate functions and redirect to unified function")
    print("4. Add comprehensive tests to ensure consistency")
    print()

    # Check for actual conflicts
    hierarchies = {
        "unified_rbac": {'process_owner': 1, 'department_head': 2, 'organization_head': 3, 'bcm_coordinator': 3, 'client_head': 3, 'project_sponsor': 3, 'cxo': 4, 'ey_admin': 5},
        "gap_assessment": {'process_owner': 1, 'department_head': 2, 'organization_head': 3, 'bcm_coordinator': 3, 'ey_admin': 4},  # Assuming from gap assessment
        "config_settings": {'process_owner': 1, 'department_head': 2, 'organization_head': 3, 'ey_admin': 4}
    }

    print("⚖️  HIERARCHY COMPARISON:")
    roles = ['process_owner', 'department_head', 'organization_head', 'ey_admin']

    print("Role".ljust(15), "Unified".ljust(8), "Gap Assess".ljust(11), "Config".ljust(7))
    print("-" * 50)

    for role in roles:
        unified = hierarchies['unified_rbac'].get(role, 'N/A')
        gap = hierarchies['gap_assessment'].get(role, 'N/A')
        config = hierarchies['config_settings'].get(role, 'N/A')

        conflict = "❌" if len(set([unified, gap, config])) > 1 else "✅"
        print(f"{role.ljust(15)} {str(unified).ljust(8)} {str(gap).ljust(11)} {str(config).ljust(7)} {conflict}")

    print()
    print("CONCLUSION: Multiple conflicting approval functions exist with different logic.")
    print("This is a HIGH SECURITY RISK that must be addressed immediately.")

if __name__ == "__main__":
    analyze_approval_functions()
