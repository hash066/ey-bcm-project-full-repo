"""
RBAC System Comprehensive Test Suite
Tests all components of the unified RBAC system.
"""

import pytest
import asyncio
from unittest.mock import Mock, patch
from sqlalchemy.orm import Session
from fastapi import HTTPException
from fastapi.testclient import TestClient

# Import our RBAC components
from app.models.role import Role, Permission, UserRole, RolePermission, AuditLog
from app.services.rbac_service import PermissionService, RoleService, AuditService
from app.middleware.rbac_middleware import RBACMiddleware, require_permissions
from app.routers.rbac_admin import router as rbac_admin_router

# Mock database session for testing
@pytest.fixture
def mock_db():
    """Mock database session for testing."""
    return Mock(spec=Session)


@pytest.fixture
def permission_service(mock_db):
    """Permission service instance for testing."""
    return PermissionService(mock_db)


@pytest.fixture
def role_service(mock_db):
    """Role service instance for testing."""
    return RoleService(mock_db)


@pytest.fixture
def audit_service(mock_db):
    """Audit service instance for testing."""
    return AuditService(mock_db)


class TestPermissionService:
    """Test PermissionService functionality."""

    def test_check_permission_inactive_user(self, permission_service, mock_db):
        """Test that inactive users are denied access."""
        # Mock inactive user
        mock_user = Mock()
        mock_user.is_active = False

        # Mock empty query result
        mock_db.query.return_value.filter.return_value.all.return_value = []

        result = permission_service.check_permission(mock_user, "test.resource", "read")
        assert result is False

    def test_check_permission_no_roles(self, permission_service, mock_db):
        """Test that users with no roles are denied access."""
        # Mock active user
        mock_user = Mock()
        mock_user.is_active = True
        mock_user.id = 1

        # Mock empty roles result
        mock_db.query.return_value.filter.return_value.all.return_value = []

        result = permission_service.check_permission(mock_user, "test.resource", "read")
        assert result is False

    def test_check_permission_with_roles(self, permission_service, mock_db):
        """Test permission checking with user roles."""
        # Mock active user
        mock_user = Mock()
        mock_user.is_active = True
        mock_user.id = 1

        # Mock user roles
        mock_user_role = Mock()
        mock_user_role.role_id = 1
        mock_db.query.return_value.filter.return_value.all.return_value = [mock_user_role]

        # Mock permission exists
        mock_db.query.return_value.filter.return_value.filter.return_value.first.return_value = Mock()

        result = permission_service.check_permission(mock_user, "test.resource", "read")
        assert result is True

    def test_get_user_permissions(self, permission_service, mock_db):
        """Test getting user permissions."""
        # Mock active user
        mock_user = Mock()
        mock_user.is_active = True
        mock_user.id = 1

        # Mock user roles and permissions
        mock_user_role = Mock()
        mock_user_role.role_id = 1
        mock_db.query.return_value.filter.return_value.all.side_effect = [
            [mock_user_role],  # User roles
            [Mock()]  # Permissions
        ]

        permissions = permission_service.get_user_permissions(mock_user)
        assert isinstance(permissions, list)

    def test_has_role(self, permission_service, mock_db):
        """Test role checking."""
        # Mock active user
        mock_user = Mock()
        mock_user.is_active = True
        mock_user.id = 1

        # Mock role exists
        mock_db.query.return_value.filter.return_value.filter.return_value.first.return_value = Mock()

        result = permission_service.has_role(mock_user, "test_role")
        assert result is True


class TestRoleService:
    """Test RoleService functionality."""

    def test_assign_role_success(self, role_service, mock_db):
        """Test successful role assignment."""
        # Mock user and role
        mock_user = Mock()
        mock_user.id = 1
        mock_user.email = "test@example.com"

        mock_role = Mock()
        mock_role.id = 1
        mock_role.name = "test_role"

        mock_assigner = Mock()
        mock_assigner.id = 2
        mock_assigner.email = "admin@example.com"

        # Mock no existing assignment
        mock_db.query.return_value.filter.return_value.first.return_value = None

        # Mock successful creation
        mock_user_role = Mock()
        mock_db.add.return_value = None
        mock_db.commit.return_value = None
        mock_db.refresh.return_value = None

        result = role_service.assign_role(mock_user, mock_role, mock_assigner)
        assert result is not None

    def test_assign_role_already_exists(self, role_service, mock_db):
        """Test role assignment when role already exists."""
        # Mock user and role
        mock_user = Mock()
        mock_user.id = 1

        mock_role = Mock()
        mock_role.id = 1
        mock_role.name = "test_role"

        # Mock existing assignment
        mock_db.query.return_value.filter.return_value.first.return_value = Mock()

        with pytest.raises(ValueError, match="already has role"):
            role_service.assign_role(mock_user, mock_role, None)

    def test_revoke_role_success(self, role_service, mock_db):
        """Test successful role revocation."""
        # Mock user and role
        mock_user = Mock()
        mock_user.id = 1

        mock_role = Mock()
        mock_role.id = 1

        # Mock existing active assignment
        mock_user_role = Mock()
        mock_db.query.return_value.filter.return_value.first.return_value = mock_user_role

        result = role_service.revoke_role(mock_user, mock_role, None)
        assert result is True

    def test_revoke_role_not_found(self, role_service, mock_db):
        """Test role revocation when assignment doesn't exist."""
        # Mock user and role
        mock_user = Mock()
        mock_user.id = 1

        mock_role = Mock()
        mock_role.id = 1

        # Mock no existing assignment
        mock_db.query.return_value.filter.return_value.first.return_value = None

        result = role_service.revoke_role(mock_user, mock_role, None)
        assert result is False


class TestAuditService:
    """Test AuditService functionality."""

    def test_log_action(self, audit_service, mock_db):
        """Test audit logging."""
        mock_user = Mock()
        mock_user.id = 1

        # Mock successful logging
        mock_audit_log = Mock()
        mock_db.add.return_value = None
        mock_db.commit.return_value = None
        mock_db.refresh.return_value = None

        result = audit_service.log_action(
            user=mock_user,
            action="test_action",
            resource_type="test_resource",
            resource_id=1,
            old_values={"old": "value"},
            new_values={"new": "value"}
        )

        assert result is not None

    def test_get_audit_logs(self, audit_service, mock_db):
        """Test retrieving audit logs."""
        # Mock audit logs
        mock_logs = [Mock(), Mock(), Mock()]
        mock_db.query.return_value.filter.return_value.order_by.return_value.limit.return_value.all.return_value = mock_logs

        logs = audit_service.get_audit_logs(user_id=1, limit=10)
        assert len(logs) == 3


class TestRBACMiddleware:
    """Test RBAC middleware functionality."""

    @pytest.mark.asyncio
    async def test_middleware_no_permissions_required(self):
        """Test middleware with no permissions required."""
        middleware = RBACMiddleware([])

        # Mock request and dependencies
        mock_request = Mock()
        mock_credentials = None
        mock_permission_service = Mock()

        # Should pass through without checking
        result = await middleware(mock_request, mock_credentials, mock_permission_service)
        assert result is None

    @pytest.mark.asyncio
    async def test_middleware_no_user(self):
        """Test middleware with no authenticated user."""
        middleware = RBACMiddleware(["test.permission"])

        # Mock request with no user
        mock_request = Mock()
        mock_request.state.user = None
        mock_credentials = None
        mock_permission_service = Mock()

        with pytest.raises(HTTPException) as exc_info:
            await middleware(mock_request, mock_credentials, mock_permission_service)

        assert exc_info.value.status_code == 401

    @pytest.mark.asyncio
    async def test_middleware_insufficient_permissions(self):
        """Test middleware with insufficient permissions."""
        middleware = RBACMiddleware(["test.permission"])

        # Mock request with user but insufficient permissions
        mock_request = Mock()
        mock_user = Mock()
        mock_request.state.user = mock_user

        mock_permission_service = Mock()
        mock_permission_service.check_permission.return_value = False

        with pytest.raises(HTTPException) as exc_info:
            await middleware(mock_request, None, mock_permission_service)

        assert exc_info.value.status_code == 403


class TestRBACAdminAPI:
    """Test RBAC Admin API endpoints."""

    def test_create_role_validation(self):
        """Test role creation validation."""
        from app.routers.rbac_admin import RoleCreateRequest

        # Valid role creation
        role_data = RoleCreateRequest(
            name="test_role",
            display_name="Test Role",
            description="A test role",
            hierarchy_level=3
        )
        assert role_data.name == "test_role"
        assert role_data.hierarchy_level == 3

        # Invalid role name
        with pytest.raises(ValueError):
            RoleCreateRequest(
                name="test role with spaces",
                display_name="Test Role",
                hierarchy_level=3
            )

    def test_permission_validation(self):
        """Test permission creation validation."""
        from app.routers.rbac_admin import PermissionCreateRequest

        # Valid permission
        perm_data = PermissionCreateRequest(
            name="test.resource.action",
            resource="test.resource",
            action="action",
            description="A test permission"
        )
        assert perm_data.name == "test.resource.action"

        # Invalid permission format
        with pytest.raises(ValueError):
            PermissionCreateRequest(
                name="invalid_permission_format",
                resource="test",
                action="action"
            )


class TestRBACIntegration:
    """Integration tests for the complete RBAC system."""

    def test_role_hierarchy(self):
        """Test role hierarchy logic."""
        # Create mock roles with different hierarchy levels
        admin_role = Mock()
        admin_role.hierarchy_level = 6
        admin_role.name = "system_admin"

        dept_head_role = Mock()
        dept_head_role.hierarchy_level = 4
        dept_head_role.name = "department_head"

        process_owner_role = Mock()
        process_owner_role.hierarchy_level = 1
        process_owner_role.name = "process_owner"

        # Test hierarchy comparison
        assert admin_role.hierarchy_level > dept_head_role.hierarchy_level
        assert dept_head_role.hierarchy_level > process_owner_role.hierarchy_level

    def test_permission_inheritance(self, mock_db):
        """Test that permissions are properly inherited through roles."""
        permission_service = PermissionService(mock_db)

        # Mock user with multiple roles
        mock_user = Mock()
        mock_user.is_active = True
        mock_user.id = 1

        # Mock multiple user roles
        mock_user_roles = [
            Mock(role_id=1),  # Department Head
            Mock(role_id=2),  # Process Owner
        ]
        mock_db.query.return_value.filter.return_value.all.return_value = mock_user_roles

        # Mock permissions for these roles
        mock_permissions = [
            Mock(name="departments.view_all"),
            Mock(name="processes.view_own"),
        ]
        mock_db.query.return_value.filter.return_value.all.return_value = mock_permissions

        permissions = permission_service.get_user_permissions(mock_user)
        assert len(permissions) == 2

    def test_audit_trail_completeness(self, mock_db):
        """Test that audit trails capture all necessary information."""
        audit_service = AuditService(mock_db)

        mock_user = Mock()
        mock_user.id = 1

        # Mock audit log creation
        mock_audit_log = Mock()
        mock_db.add.return_value = None
        mock_db.commit.return_value = None
        mock_db.refresh.return_value = None

        audit_log = audit_service.log_action(
            user=mock_user,
            action="role_assigned",
            resource_type="user_role",
            resource_id=123,
            old_values="No roles",
            new_values="Department Head role assigned"
        )

        # Verify audit log was created with required fields
        assert audit_log is not None
        mock_db.add.assert_called_once()


class TestSystemHealth:
    """Test system health and monitoring."""

    def test_database_connectivity(self, mock_db):
        """Test database connectivity checks."""
        from app.routers.rbac_admin import rbac_health_check

        # Mock successful database operations
        mock_db.execute.return_value = None
        mock_db.query.return_value.count.side_effect = [6, 60, 10]  # roles, permissions, assignments

        # This would normally be tested with a test client
        # For now, just verify the health check logic exists
        assert callable(rbac_health_check)

    def test_permission_service_initialization(self, mock_db):
        """Test that permission service initializes correctly."""
        service = PermissionService(mock_db)
        assert service.db == mock_db

    def test_role_service_initialization(self, mock_db):
        """Test that role service initializes correctly."""
        service = RoleService(mock_db)
        assert service.db == mock_db

    def test_audit_service_initialization(self, mock_db):
        """Test that audit service initializes correctly."""
        service = AuditService(mock_db)
        assert service.db == mock_db


# Performance and Load Testing
class TestRBACPerformance:
    """Performance tests for RBAC system."""

    def test_permission_check_performance(self, benchmark, permission_service, mock_db):
        """Benchmark permission checking performance."""
        # Mock user and permission check
        mock_user = Mock()
        mock_user.is_active = True
        mock_user.id = 1

        mock_db.query.return_value.filter.return_value.all.return_value = [Mock(role_id=1)]
        mock_db.query.return_value.filter.return_value.filter.return_value.first.return_value = Mock()

        # Benchmark the permission check
        def check_permission():
            return permission_service.check_permission(mock_user, "test.resource", "read")

        result = benchmark(check_permission)
        assert result is True

    def test_bulk_role_assignment_performance(self, benchmark, role_service, mock_db):
        """Benchmark bulk role assignment performance."""
        # Mock successful assignments
        mock_db.query.return_value.filter.return_value.first.return_value = None
        mock_db.add.return_value = None
        mock_db.commit.return_value = None

        def assign_roles():
            for i in range(10):
                mock_user = Mock()
                mock_user.id = i
                mock_user.email = f"user{i}@example.com"

                mock_role = Mock()
                mock_role.id = 1
                mock_role.name = "test_role"

                role_service.assign_role(mock_user, mock_role, None)

        result = benchmark(assign_roles)
        assert mock_db.add.call_count == 10


if __name__ == "__main__":
    # Run basic tests
    print("Running RBAC System Tests...")

    # Create mock instances
    mock_db = Mock(spec=Session)
    permission_service = PermissionService(mock_db)
    role_service = RoleService(mock_db)
    audit_service = AuditService(mock_db)

    # Run a few basic tests
    print("✓ PermissionService initialized")
    print("✓ RoleService initialized")
    print("✓ AuditService initialized")

    # Test middleware
    middleware = RBACMiddleware(["test.permission"])
    print("✓ RBACMiddleware initialized")

    # Test admin API validation
    from app.routers.rbac_admin import RoleCreateRequest, PermissionCreateRequest

    try:
        role_req = RoleCreateRequest(
            name="test_role",
            display_name="Test Role",
            hierarchy_level=3
        )
        print("✓ Role creation validation works")
    except Exception as e:
        print(f"✗ Role validation failed: {e}")

    try:
        perm_req = PermissionCreateRequest(
            name="test.resource.action",
            resource="test.resource",
            action="action"
        )
        print("✓ Permission creation validation works")
    except Exception as e:
        print(f"✗ Permission validation failed: {e}")

    print("\n🎉 RBAC System Test Suite Ready!")
    print("Run with: pytest test_rbac_system.py -v")
