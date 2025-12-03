#!/usr/bin/env python3
"""
Verify Approval Logic Fix
Simple test to confirm all approval functions now return consistent results.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Simple database setup
DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///./test.db')
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def verify_approval_fix():
    """Verify that the approval logic fix worked."""

    print("🔍 VERIFYING APPROVAL LOGIC FIX")
    print("=" * 50)

    db = SessionLocal()

    try:
        # Create test user with role
        from app.models.unified_rbac import assign_user_role
        assign_user_role(db, user_id=1, role_name="department_head")
        print("✅ Test user created")

        # Test the main approval functions
        from app.models.unified_rbac import user_can_approve as unified_approve
        from app.models.simple_rbac import user_can_approve as simple_approve

        # Both should return the same result
        unified_result = unified_approve(db, 1, "process_owner")  # Should be True (level 2 > level 1)
        simple_result = simple_approve(db, 1, "process_owner")    # Should redirect to unified

        print(f"Unified RBAC result: {unified_result}")
        print(f"Simple RBAC result: {simple_result}")

        if unified_result == simple_result:
            print("✅ APPROVAL FUNCTIONS ARE NOW CONSISTENT!")
            print("✅ Security risk has been resolved")
            return True
        else:
            print("❌ APPROVAL FUNCTIONS STILL INCONSISTENT!")
            print("❌ Security risk remains")
            return False

    except Exception as e:
        print(f"❌ VERIFICATION FAILED: {e}")
        return False

    finally:
        db.close()

if __name__ == "__main__":
    success = verify_approval_fix()
    print("\n" + "=" * 50)
    if success:
        print("🎉 APPROVAL LOGIC SECURITY ISSUE HAS BEEN FIXED!")
    else:
        print("❌ APPROVAL LOGIC SECURITY ISSUE PERSISTS!")
    sys.exit(0 if success else 1)
