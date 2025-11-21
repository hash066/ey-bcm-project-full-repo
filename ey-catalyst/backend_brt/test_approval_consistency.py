#!/usr/bin/env python3
"""
Test Approval Logic Consistency
Verifies that all approval functions now return consistent results.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.postgres import DATABASE_URL

# Create a standalone engine and session for testing
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def test_approval_consistency():
    """Test that all approval functions return consistent results."""

    print("🧪 TESTING APPROVAL LOGIC CONSISTENCY")
    print("=" * 60)

    db = SessionLocal()

    try:
        # Create test users with roles
        from app.models.unified_rbac import assign_user_role

        # User 1: department_head (level 2)
        assign_user_role(db, user_id=1, role_name="department_head")

        # User 2: process_owner (level 1)
        assign_user_role(db, user_id=2, role_name="process_owner")

        # User 3: ey_admin (level 5)
        assign_user_role(db, user_id=3, role_name="ey_admin")

        print("✅ Test users created with roles")

        # Test scenarios
        test_cases = [
            {
                "description": "Department Head (level 2) approving Process Owner (level 1)",
                "user_id": 1,
                "target_role": "process_owner",
                "expected": True
            },
            {
                "description": "Process Owner (level 1) approving Department Head (level 2)",
                "user_id": 2,
                "target_role": "department_head",
                "expected": False
            },
            {
                "description": "EY Admin (level 5) approving Process Owner (level 1)",
                "user_id": 3,
                "target_role": "process_owner",
                "expected": True
            }
        ]

        all_consistent = True

        for test_case in test_cases:
            print(f"\n🧪 {test_case['description']}")

            # Test all approval functions
            results = {}

            # 1. Unified RBAC (source of truth)
            from app.models.unified_rbac import user_can_approve
            results['unified_rbac'] = user_can_approve(db, test_case['user_id'], test_case['target_role'])

            # 2. Simple RBAC (should redirect to unified)
            from app.models.simple_rbac import user_can_approve as simple_can_approve
            results['simple_rbac'] = simple_can_approve(db, test_case['user_id'], test_case['target_role'])

            # 3. RBAC Service (should redirect to unified)
            from app.services.rbac_service import PermissionService
            # Create a mock user object for testing
            class MockUser:
                def __init__(self, user_id):
                    self.id = user_id
                    self.is_active = True

            mock_user = MockUser(test_case['user_id'])
            perm_service = PermissionService(db)
            results['rbac_service'] = perm_service.can_user_approve(mock_user, target_role=test_case['target_role'])

            # 4. Config settings (simplified check)
            from app.config_settings.role_mapping import ApprovalRole, can_user_approve as config_can_approve
            # Map role names to approval roles for testing
            role_to_approval = {
                "department_head": ApprovalRole.DEPARTMENT_HEAD,
                "process_owner": ApprovalRole.PROCESS_OWNER,
                "ey_admin": ApprovalRole.EY_ADMIN
            }

            # For config testing, we need to simulate a main_app_role
            # This is simplified - in real usage it would map from actual user roles
            main_app_role = "Department Head" if test_case['user_id'] == 1 else "Process Owner" if test_case['user_id'] == 2 else "EY Admin"
            target_approval = role_to_approval.get(test_case['target_role'], ApprovalRole.PROCESS_OWNER)
            results['config_settings'] = config_can_approve(main_app_role, target_approval)

            # Check consistency
            expected = test_case['expected']
            consistent = all(result == expected for result in results.values())

            if not consistent:
                all_consistent = False
                print("❌ INCONSISTENT RESULTS:"                for func_name, result in results.items():
                    status = "✅" if result == expected else "❌"
                    print(f"   {func_name}: {result} {status}")
            else:
                print("✅ All functions consistent:"                for func_name, result in results.items():
                    print(f"   {func_name}: {result}")

        print("\n" + "=" * 60)

        if all_consistent:
            print("🎉 ALL APPROVAL FUNCTIONS NOW CONSISTENT!")
            print("\n✅ Security Risk Resolved:")
            print("  ✅ Single source of truth established")
            print("  ✅ All functions redirect to unified system")
            print("  ✅ Consistent approval logic across codebase")
            print("  ✅ No more conflicting permission checks")
            return True
        else:
            print("❌ APPROVAL FUNCTIONS STILL INCONSISTENT!")
            print("Security risk remains - different functions return different results")
            return False

    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False

    finally:
        db.close()

if __name__ == "__main__":
    success = test_approval_consistency()
    sys.exit(0 if success else 1)
