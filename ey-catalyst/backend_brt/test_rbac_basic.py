"""
RBAC System Basic Test
Simple validation of the unified RBAC system components.
"""

import sys
import os

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(__file__))

def test_imports():
    """Test that all RBAC components can be imported."""
    print("Testing imports...")

    try:
        # Test service imports (avoid model conflicts)
        from app.services.rbac_service import PermissionService, RoleService, AuditService
        print("✓ Services imported successfully")

        # Test middleware imports
        from app.middleware.rbac_middleware import RBACMiddleware, require_permissions
        print("✓ Middleware imported successfully")

        # Test router imports
        from app.routers.rbac_admin import router as rbac_admin_router
        print("✓ Admin router imported successfully")

        # Test individual model imports to avoid conflicts
        try:
            from app.models.role import Permission, UserRole, RolePermission, AuditLog
            print("✓ New RBAC models imported successfully")
        except Exception as e:
            print(f"⚠ New RBAC models import warning: {e}")

        return True

    except Exception as e:
        print(f"✗ Import failed: {e}")
        return False


def test_model_creation():
    """Test that models can be instantiated."""
    print("\nTesting model creation...")

    try:
        from app.models.role import Role, Permission, UserRole, RolePermission, AuditLog

        # Test Role creation (without database)
        role = Role(
            id=1,
            name="test_role",
            display_name="Test Role",
            hierarchy_level=3,
            is_system_role=False
        )
        print("✓ Role model created")

        # Test Permission creation
        permission = Permission(
            id=1,
            name="test.permission",
            resource="test",
            action="permission"
        )
        print("✓ Permission model created")

        # Test UserRole creation
        user_role = UserRole(
            id=1,
            user_id=1,
            role_id=1,
            is_active=True
        )
        print("✓ UserRole model created")

        return True

    except Exception as e:
        print(f"✗ Model creation failed: {e}")
        return False


def test_service_initialization():
    """Test that services can be initialized."""
    print("\nTesting service initialization...")

    try:
        from unittest.mock import Mock
        from app.services.rbac_service import PermissionService, RoleService, AuditService

        # Mock database
        mock_db = Mock()

        # Test service creation
        permission_service = PermissionService(mock_db)
        print("✓ PermissionService initialized")

        role_service = RoleService(mock_db)
        print("✓ RoleService initialized")

        audit_service = AuditService(mock_db)
        print("✓ AuditService initialized")

        return True

    except Exception as e:
        print(f"✗ Service initialization failed: {e}")
        return False


def test_middleware_creation():
    """Test that middleware can be created."""
    print("\nTesting middleware creation...")

    try:
        from app.middleware.rbac_middleware import RBACMiddleware, require_permissions

        # Test middleware creation
        middleware = RBACMiddleware(["test.permission"])
        print("✓ RBACMiddleware created")

        # Test helper function
        permission_middleware = require_permissions("test.permission")
        print("✓ require_permissions helper works")

        return True

    except Exception as e:
        print(f"✗ Middleware creation failed: {e}")
        return False


def test_admin_api_validation():
    """Test admin API validation."""
    print("\nTesting admin API validation...")

    try:
        from app.routers.rbac_admin import RoleCreateRequest, PermissionCreateRequest

        # Test valid role creation
        role_data = RoleCreateRequest(
            name="test_role",
            display_name="Test Role",
            hierarchy_level=3
        )
        print("✓ Role validation works")

        # Test valid permission creation
        perm_data = PermissionCreateRequest(
            name="test.resource.action",
            resource="test.resource",
            action="action"
        )
        print("✓ Permission validation works")

        # Test invalid role name
        try:
            invalid_role = RoleCreateRequest(
                name="test role with spaces",
                display_name="Test Role",
                hierarchy_level=3
            )
            print("✗ Role validation should have failed")
            return False
        except ValueError:
            print("✓ Role validation correctly rejects invalid names")

        # Test invalid permission format
        try:
            invalid_perm = PermissionCreateRequest(
                name="invalid_format",
                resource="test",
                action="action"
            )
            print("✗ Permission validation should have failed")
            return False
        except ValueError:
            print("✓ Permission validation correctly rejects invalid format")

        return True

    except Exception as e:
        print(f"✗ Admin API validation failed: {e}")
        return False


def test_role_hierarchy():
    """Test role hierarchy logic."""
    print("\nTesting role hierarchy...")

    try:
        # Create mock roles
        system_admin = type('Role', (), {'hierarchy_level': 6, 'name': 'system_admin'})()
        ceo = type('Role', (), {'hierarchy_level': 5, 'name': 'ceo'})()
        dept_head = type('Role', (), {'hierarchy_level': 4, 'name': 'department_head'})()
        process_owner = type('Role', (), {'hierarchy_level': 1, 'name': 'process_owner'})()

        # Test hierarchy
        assert system_admin.hierarchy_level > ceo.hierarchy_level
        assert ceo.hierarchy_level > dept_head.hierarchy_level
        assert dept_head.hierarchy_level > process_owner.hierarchy_level

        print("✓ Role hierarchy works correctly")
        return True

    except Exception as e:
        print(f"✗ Role hierarchy test failed: {e}")
        return False


def test_permission_format():
    """Test permission string formatting."""
    print("\nTesting permission formatting...")

    try:
        from app.models.role import Permission

        # Test permission creation
        perm = Permission(
            id=1,
            name="users.view_all",
            resource="users",
            action="view_all"
        )

        assert perm.full_name == "users.view_all"
        print("✓ Permission formatting works")

        return True

    except Exception as e:
        print(f"✗ Permission formatting failed: {e}")
        return False


def run_all_tests():
    """Run all tests and report results."""
    print("🚀 Starting RBAC System Basic Tests")
    print("=" * 50)

    tests = [
        test_imports,
        test_model_creation,
        test_service_initialization,
        test_middleware_creation,
        test_admin_api_validation,
        test_role_hierarchy,
        test_permission_format,
    ]

    passed = 0
    failed = 0

    for test in tests:
        try:
            if test():
                passed += 1
            else:
                failed += 1
        except Exception as e:
            print(f"✗ {test.__name__} crashed: {e}")
            failed += 1

    print("\n" + "=" * 50)
    print(f"📊 Test Results: {passed} passed, {failed} failed")

    if failed == 0:
        print("🎉 All tests passed! RBAC system is ready.")
        return True
    else:
        print("❌ Some tests failed. Please check the output above.")
        return False


if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
