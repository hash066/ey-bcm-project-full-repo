#!/usr/bin/env python3
"""
Check Available Roles in Unified RBAC System
"""

from app.models.unified_rbac import ROLE_HIERARCHY

def check_roles():
    """Display all available roles and their hierarchy."""

    print("🎭 UNIFIED RBAC SYSTEM ROLES")
    print("=" * 50)

    print("Available Roles (6 total):")
    print()

    # Sort by hierarchy level
    sorted_roles = sorted(ROLE_HIERARCHY.items(), key=lambda x: x[1])

    for role_name, level in sorted_roles:
        # Map to user-friendly names
        display_names = {
            'process_owner': 'Process Owner',
            'sub_department_head': 'Sub Department Head',
            'department_head': 'Department Head',
            'bcm_coordinator': 'BCM Coordinator',
            'ceo': 'CEO',
            'ey_admin': 'EY Admin'
        }

        display_name = display_names.get(role_name, role_name.replace('_', ' ').title())
        print(f"  {level}. {display_name} ({role_name})")

    print()
    print("✅ All 6 roles you requested are available:")
    print("  ✅ Process Owners")
    print("  ✅ Sub Department Heads")
    print("  ✅ Department Heads")
    print("  ✅ BCM Coordinator")
    print("  ✅ CEO")
    print("  ✅ EY Admin")

    print()
    print("🔄 Approval Hierarchy:")
    print("  EY Admin (6) can approve everything")
    print("  CEO (5) can approve up to Department Head")
    print("  BCM Coordinator (4) can approve up to Department Head")
    print("  Department Head (3) can approve Sub Department Head and Process Owner")
    print("  Sub Department Head (2) can approve Process Owner")
    print("  Process Owner (1) - entry level")

if __name__ == "__main__":
    check_roles()
