#!/usr/bin/env python3
"""
Test Script for RBAC Login Visibility Demo
Assigns users with different RBAC roles to demonstrate login-based visibility differences.

Run this script with: python test_rbac_login_demo.py
"""

from app.db.postgres import get_db, SessionLocal
from app.models.unified_rbac import UnifiedRBACService
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_demo_rbac_users():
    """Create or update demo users with different RBAC roles."""

    db = SessionLocal()

    try:
        logger.info("Creating RBAC demo users...")

        # Demo user assignments (assuming these user IDs exist)
        demo_users = [
            # (user_id, role_name, description)
            (6, 'process_owner', 'Basic process owner - can access BIA only'),  # Sarah Johnson
            (7, 'sub_department_head', 'Sub-department head - can access more modules'),  # Michael Chen
            (8, 'department_head', 'Department head - senior management access'),  # John Smith
            (9, 'bcm_coordinator', 'BCM coordinator - strategic modules'),  # Emily Davis
            (10, 'ceo', 'CEO - full executive access'),  # Robert Miller
            (5, 'ey_admin', 'EY Admin - full administrative access'),  # Admin User
        ]

        # First revoke any existing roles to ensure clean assignment
        for user_id, _, _ in demo_users:
            for role_name in ['process_owner', 'sub_department_head', 'department_head', 'bcm_coordinator', 'ceo', 'ey_admin']:
                try:
                    UnifiedRBACService.revoke_role(db, user_id, role_name)
                except:
                    pass  # Ignore if role doesn't exist

        # Assign new roles
        for user_id, role_name, description in demo_users:
            try:
                UnifiedRBACService.assign_role(db, user_id, role_name)
                logger.info(f"✓ Assigned '{role_name}' to user {user_id} ({description})")
            except Exception as e:
                logger.error(f"✗ Failed to assign '{role_name}' to user {user_id}: {str(e)}")

        db.commit()
        logger.info("✓ All demo roles assigned successfully!")

        # Display assignment summary
        print("\n" + "="*60)
        print("RBAC DEMO USER ASSIGNMENTS")
        print("="*60)
        for user_id, role_name, description in demo_users:
            role_level = UnifiedRBACService.get_role_hierarchy().get(role_name, 0)
            print(f"User {user_id}: {role_name} (Level {role_level}) - {description}")

        print("\n" + "="*60)
        print("LOGIN VISIBILITY TESTING")
        print("="*60)
        print("1. process_owner:        BIA, Home | Limited access")
        print("2. sub_department_head:  BIA + Some modules | Intermediate access")
        print("3. department_head:      BIA + Many modules + Approvals | Senior access")
        print("4. bcm_coordinator:      Strategic modules + Approvals | Coordinator access")
        print("5. ceo:                  All modules + Approvals | Executive access")
        print("6. ey_admin:            FULL ADMIN ACCESS | All modules + Admin panel")
        print("="*60)

    except Exception as e:
        db.rollback()
        logger.error(f"Failed to create demo users: {str(e)}")
        raise
    finally:
        db.close()

def test_role_assignments():
    """Verify that role assignments are correct."""

    db = SessionLocal()

    try:
        logger.info("Verifying role assignments...")

        demo_users = [
            (6, 'process_owner'),
            (7, 'sub_department_head'),
            (8, 'department_head'),
            (9, 'bcm_coordinator'),
            (10, 'ceo'),
            (5, 'ey_admin'),
        ]

        for user_id, expected_role in demo_users:
            assigned_roles = UnifiedRBACService.get_user_roles(db, user_id)
            if expected_role in [role.role_name for role in assigned_roles]:
                logger.info(f"✓ User {user_id} correctly has role '{expected_role}'")
            else:
                logger.error(f"✗ User {user_id} missing role '{expected_role}'. Found: {[r.role_name for r in assigned_roles]}")

        logger.info("Role verification complete!")

    except Exception as e:
        logger.error(f"Role verification failed: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    print("🎭 RBAC Login Demo Setup")
    print("=" * 40)

    # Create demo users
    create_demo_rbac_users()

    # Test assignments
    test_role_assignments()

    print("\n" + "🎉 READY: Now test login visibility differences!")
    print("\n🔑 Instructions:")
    print("1. Clear localStorage: localStorage.clear() in browser console")
    print("2. Login with different users to see varying menu access")
    print("3. Use User IDs: 5(Admin), 6(Process), 7(Sub-Dept), 8(Dept), 9(BCM), 10(CEO)")
    print("4. Check sidebar to see different modules unlocked per role")
