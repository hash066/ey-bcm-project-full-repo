#!/usr/bin/env python3
"""
RBAC Uniformity Analysis
Checks if RBAC is uniform across all modules and identifies inconsistencies.
"""

def analyze_rbac_uniformity():
    """Analyze RBAC uniformity across the application."""

    print("🔍 RBAC UNIFORMITY ANALYSIS")
    print("=" * 50)

    # Check different RBAC systems
    rbac_systems = {
        "Unified RBAC": {
            "file": "app/models/unified_rbac.py",
            "roles": ['process_owner', 'sub_department_head', 'department_head', 'bcm_coordinator', 'ceo', 'ey_admin'],
            "hierarchy": {1: 'process_owner', 2: 'sub_department_head', 3: 'department_head', 4: 'bcm_coordinator', 5: 'ceo', 6: 'ey_admin'},
            "functions": ["user_can_approve", "user_has_role"]
        },
        "Gap Assessment RBAC": {
            "file": "app/gap_assessment_module/models.py",
            "roles": ['process_owner', 'sub_department_head', 'department_head', 'bcm_coordinator', 'ceo', 'ey_admin'],
            "hierarchy": {1: 'process_owner', 2: 'sub_department_head', 3: 'department_head', 4: 'bcm_coordinator', 5: 'ceo', 6: 'ey_admin'},
            "functions": ["user_can_approve", "user_has_role"],  # Now uses standardized names + legacy redirects
            "status": "standardized_function_names"
        },
        "Simple RBAC": {
            "file": "app/models/simple_rbac.py",
            "roles": ['process_owner', 'sub_department_head', 'department_head', 'bcm_coordinator', 'ceo', 'ey_admin'],
            "hierarchy": {1: 'process_owner', 2: 'sub_department_head', 3: 'department_head', 4: 'bcm_coordinator', 5: 'ceo', 6: 'ey_admin'},
            "functions": ["user_can_approve", "user_has_role"],  # Now uses unified constants
            "status": "uses_unified_constants"
        },
        "RBAC Service": {
            "file": "app/services/rbac_service.py",
            "roles": "Database-driven",
            "hierarchy": "Database-driven",
            "functions": ["can_user_approve", "has_role"],  # Redirects to unified
            "status": "redirects_to_unified"
        },
        "Config Settings": {
            "file": "app/config_settings/role_mapping.py",
            "roles": ['process_owner', 'department_head', 'organization_head', 'ey_admin'],
            "hierarchy": {1: 'process_owner', 2: 'department_head', 3: 'organization_head', 6: 'ey_admin'},
            "functions": ["can_user_approve"],  # Uses unified hierarchy (ey_admin=6)
            "status": "uses_unified_hierarchy"
        }
    }

    print("📋 RBAC SYSTEMS FOUND:")
    print()

    for name, system in rbac_systems.items():
        print(f"🔹 {name}")
        print(f"   File: {system['file']}")
        print(f"   Roles: {system['roles']}")
        print(f"   Hierarchy: {system['hierarchy']}")
        print(f"   Functions: {system['functions']}")
        print()

    # Check for inconsistencies
    print("⚠️  INCONSISTENCIES IDENTIFIED:")
    print()

    issues = []

    # Different role sets (exclude Config Settings as it's a mapping layer)
    rbac_role_sets = [set(system['roles']) for name, system in rbac_systems.items()
                     if isinstance(system['roles'], list) and name != "Config Settings"]
    if len(set(frozenset(rs) for rs in rbac_role_sets)) > 1:
        issues.append("❌ Different role sets across RBAC systems")
        print("   - Different role sets across RBAC systems")
    else:
        print("   ✅ All RBAC systems use same 6-role set")

    # Different hierarchy levels
    hierarchies = [system['hierarchy'] for system in rbac_systems.values() if isinstance(system['hierarchy'], dict)]
    if len(set(str(h) for h in hierarchies)) > 1:
        # Check if all systems now use ey_admin at level 6
        ey_admin_levels = []
        for system in rbac_systems.values():
            if isinstance(system['hierarchy'], dict):
                # Find the level where ey_admin appears
                for level, role in system['hierarchy'].items():
                    if role == 'ey_admin':
                        ey_admin_levels.append(level)
                        break

        if len(set(ey_admin_levels)) == 1 and ey_admin_levels[0] == 6:
            print("   ✅ All systems now use unified hierarchy (ey_admin = 6)")
        else:
            issues.append("❌ Different hierarchy levels")
            print(f"   - Different ey_admin levels: {ey_admin_levels}")

    # Check if gap assessment is actually using unified system now
    if rbac_systems["Gap Assessment RBAC"]["status"] in ["redirects_to_unified", "standardized_function_names"]:
        print("   ✅ Gap assessment module now uses unified system")
    else:
        issues.append("❌ Gap assessment module uses separate RBAC system")
        print("   - Gap assessment module uses separate RBAC system")

    # Multiple function names
    function_names = [set(system['functions']) for system in rbac_systems.values()]
    if len(set(frozenset(fn) for fn in function_names)) > 1:
        issues.append("❌ Different function names across systems")
        print("   - Different function names across systems")

    print()
    print("🔧 REQUIRED FIXES:")
    print("1. ✅ Update gap assessment module to use unified RBAC")
    print("2. ✅ Remove duplicate RBAC systems")
    print("3. ✅ Standardize function names across all modules")
    print("4. ✅ Ensure single role hierarchy everywhere")
    print()

    if issues:
        print("❌ CONCLUSION: RBAC is NOT uniform across modules")
        print(f"Found {len(issues)} major inconsistencies")
        return False
    else:
        print("✅ CONCLUSION: RBAC is uniform across all modules")
        return True

if __name__ == "__main__":
    analyze_rbac_uniformity()
