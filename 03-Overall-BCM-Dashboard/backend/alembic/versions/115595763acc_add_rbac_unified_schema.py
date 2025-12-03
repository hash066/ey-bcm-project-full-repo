"""add_rbac_unified_schema

Revision ID: 115595763acc
Revises: 07_add_bia_snapshots
Create Date: 2025-11-03 11:23:23.770879

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '115595763acc'
down_revision: Union[str, Sequence[str], None] = '07_add_bia_snapshots'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema: Add unified RBAC tables."""

    # Create roles table
    op.create_table(
        'roles',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=50), nullable=False),
        sa.Column('display_name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('hierarchy_level', sa.Integer(), nullable=False),
        sa.Column('is_system_role', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )

    # Create permissions table
    op.create_table(
        'permissions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('resource', sa.String(length=100), nullable=False),
        sa.Column('action', sa.String(length=50), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )

    # Create role_permissions junction table
    op.create_table(
        'role_permissions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('role_id', sa.Integer(), nullable=False),
        sa.Column('permission_id', sa.Integer(), nullable=False),
        sa.Column('granted_by', sa.Integer(), nullable=True),
        sa.Column('granted_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['role_id'], ['roles.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['permission_id'], ['permissions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['granted_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('role_id', 'permission_id')
    )

    # Create user_roles junction table
    op.create_table(
        'user_roles',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('role_id', sa.Integer(), nullable=False),
        sa.Column('assigned_by', sa.Integer(), nullable=True),
        sa.Column('assigned_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['role_id'], ['roles.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['assigned_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'role_id')
    )

    # Create audit_logs table
    op.create_table(
        'audit_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('action', sa.String(length=100), nullable=False),
        sa.Column('resource_type', sa.String(length=50), nullable=False),
        sa.Column('resource_id', sa.Integer(), nullable=True),
        sa.Column('old_values', sa.Text(), nullable=True),  # JSON
        sa.Column('new_values', sa.Text(), nullable=True),  # JSON
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('user_agent', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indexes for performance
    op.create_index('ix_roles_hierarchy_level', 'roles', ['hierarchy_level'])
    op.create_index('ix_permissions_resource_action', 'permissions', ['resource', 'action'])
    op.create_index('ix_role_permissions_role_id', 'role_permissions', ['role_id'])
    op.create_index('ix_role_permissions_permission_id', 'role_permissions', ['permission_id'])
    op.create_index('ix_user_roles_user_id', 'user_roles', ['user_id'])
    op.create_index('ix_user_roles_role_id', 'user_roles', ['role_id'])
    op.create_index('ix_user_roles_active', 'user_roles', ['is_active'])
    op.create_index('ix_audit_logs_user_id', 'audit_logs', ['user_id'])
    op.create_index('ix_audit_logs_resource', 'audit_logs', ['resource_type', 'resource_id'])
    op.create_index('ix_audit_logs_created_at', 'audit_logs', ['created_at'])
    op.create_index('ix_audit_logs_action', 'audit_logs', ['action'])

    # Insert default roles
    op.bulk_insert(
        sa.table('roles',
            sa.column('id', sa.Integer()),
            sa.column('name', sa.String(50)),
            sa.column('display_name', sa.String(100)),
            sa.column('description', sa.Text()),
            sa.column('hierarchy_level', sa.Integer()),
            sa.column('is_system_role', sa.Boolean())
        ),
        [
            {'id': 1, 'name': 'process_owner', 'display_name': 'Process Owner', 'description': 'Can submit and view process-level requests', 'hierarchy_level': 1, 'is_system_role': True},
            {'id': 2, 'name': 'subdepartment_head', 'display_name': 'SubDepartment Head', 'description': 'Manages subdepartment operations', 'hierarchy_level': 3, 'is_system_role': True},
            {'id': 3, 'name': 'department_head', 'display_name': 'Department Head', 'description': 'Manages department operations and approvals', 'hierarchy_level': 4, 'is_system_role': True},
            {'id': 4, 'name': 'bcm_coordinator', 'display_name': 'BCM Coordinator', 'description': 'Coordinates business continuity management', 'hierarchy_level': 5, 'is_system_role': True},
            {'id': 5, 'name': 'ceo', 'display_name': 'CEO', 'description': 'Chief Executive Officer with organization oversight', 'hierarchy_level': 5, 'is_system_role': True},
            {'id': 6, 'name': 'system_admin', 'display_name': 'System Admin', 'description': 'Full system administration access', 'hierarchy_level': 6, 'is_system_role': True},
        ]
    )

    # Insert comprehensive permissions
    permissions_data = [
        # Authentication & User Management
        ('auth.login', 'authentication', 'login', 'User login access'),
        ('auth.logout', 'authentication', 'logout', 'User logout access'),
        ('auth.view_profile', 'authentication', 'view_profile', 'View own user profile'),
        ('auth.update_profile', 'authentication', 'update_profile', 'Update own user profile'),
        ('auth.change_password', 'authentication', 'change_password', 'Change own password'),

        # User Management (Admin)
        ('users.view_all', 'users', 'view_all', 'View all users in system'),
        ('users.view_department', 'users', 'view_department', 'View users in own department'),
        ('users.view_organization', 'users', 'view_organization', 'View users in own organization'),
        ('users.create', 'users', 'create', 'Create new users'),
        ('users.update', 'users', 'update', 'Update user information'),
        ('users.deactivate', 'users', 'deactivate', 'Deactivate user accounts'),
        ('users.assign_roles', 'users', 'assign_roles', 'Assign roles to users'),
        ('users.revoke_roles', 'users', 'revoke_roles', 'Revoke roles from users'),

        # Role Management (Admin)
        ('roles.view_all', 'roles', 'view_all', 'View all roles'),
        ('roles.create', 'roles', 'create', 'Create new roles'),
        ('roles.update', 'roles', 'update', 'Update role definitions'),
        ('roles.delete', 'roles', 'delete', 'Delete roles'),
        ('roles.assign_permissions', 'roles', 'assign_permissions', 'Assign permissions to roles'),

        # Permission Management (Admin)
        ('permissions.view_all', 'permissions', 'view_all', 'View all permissions'),
        ('permissions.create', 'permissions', 'create', 'Create new permissions'),
        ('permissions.update', 'permissions', 'update', 'Update permission definitions'),
        ('permissions.delete', 'permissions', 'delete', 'Delete permissions'),

        # Organization Management
        ('organizations.view_all', 'organizations', 'view_all', 'View all organizations'),
        ('organizations.view_own', 'organizations', 'view_own', 'View own organization'),
        ('organizations.create', 'organizations', 'create', 'Create new organizations'),
        ('organizations.update', 'organizations', 'update', 'Update organization details'),
        ('organizations.delete', 'organizations', 'delete', 'Delete organizations'),

        # Department Management
        ('departments.view_all', 'departments', 'view_all', 'View all departments'),
        ('departments.view_organization', 'departments', 'view_organization', 'View departments in own organization'),
        ('departments.view_own', 'departments', 'view_own', 'View own department'),
        ('departments.create', 'departments', 'create', 'Create new departments'),
        ('departments.update', 'departments', 'update', 'Update department details'),
        ('departments.delete', 'departments', 'delete', 'Delete departments'),

        # Process Management
        ('processes.view_all', 'processes', 'view_all', 'View all processes'),
        ('processes.view_organization', 'processes', 'view_organization', 'View processes in own organization'),
        ('processes.view_department', 'processes', 'view_department', 'View processes in own department'),
        ('processes.view_own', 'processes', 'view_own', 'View own processes'),
        ('processes.create', 'processes', 'create', 'Create new processes'),
        ('processes.update', 'processes', 'update', 'Update process details'),
        ('processes.delete', 'processes', 'delete', 'Delete processes'),

        # BIA (Business Impact Analysis)
        ('bia.view_all', 'bia', 'view_all', 'View all BIA data'),
        ('bia.view_organization', 'bia', 'view_organization', 'View BIA data for own organization'),
        ('bia.view_department', 'bia', 'view_department', 'View BIA data for own department'),
        ('bia.view_own', 'bia', 'view_own', 'View own BIA data'),
        ('bia.create', 'bia', 'create', 'Create BIA assessments'),
        ('bia.update', 'bia', 'update', 'Update BIA assessments'),
        ('bia.delete', 'bia', 'delete', 'Delete BIA assessments'),
        ('bia.approve', 'bia', 'approve', 'Approve BIA assessments'),
        ('bia.reject', 'bia', 'reject', 'Reject BIA assessments'),

        # Gap Assessment
        ('gap_assessment.view_all', 'gap_assessment', 'view_all', 'View all gap assessments'),
        ('gap_assessment.view_organization', 'gap_assessment', 'view_organization', 'View gap assessments for own organization'),
        ('gap_assessment.view_department', 'gap_assessment', 'view_department', 'View gap assessments for own department'),
        ('gap_assessment.view_own', 'gap_assessment', 'view_own', 'View own gap assessments'),
        ('gap_assessment.create', 'gap_assessment', 'create', 'Create gap assessments'),
        ('gap_assessment.update', 'gap_assessment', 'update', 'Update gap assessments'),
        ('gap_assessment.delete', 'gap_assessment', 'delete', 'Delete gap assessments'),
        ('gap_assessment.approve', 'gap_assessment', 'approve', 'Approve gap assessments'),
        ('gap_assessment.reject', 'gap_assessment', 'reject', 'Reject gap assessments'),

        # Approval Workflows
        ('approvals.view_all', 'approvals', 'view_all', 'View all approval requests'),
        ('approvals.view_organization', 'approvals', 'view_organization', 'View approval requests for own organization'),
        ('approvals.view_department', 'approvals', 'view_department', 'View approval requests for own department'),
        ('approvals.view_own', 'approvals', 'view_own', 'View own approval requests'),
        ('approvals.create', 'approvals', 'create', 'Create approval requests'),
        ('approvals.approve', 'approvals', 'approve', 'Approve requests'),
        ('approvals.reject', 'approvals', 'reject', 'Reject requests'),
        ('approvals.escalate', 'approvals', 'escalate', 'Escalate approval requests'),

        # Frameworks & Controls
        ('frameworks.view_all', 'frameworks', 'view_all', 'View all frameworks'),
        ('frameworks.view_global', 'frameworks', 'view_global', 'View globally available frameworks'),
        ('frameworks.create', 'frameworks', 'create', 'Create new frameworks'),
        ('frameworks.update', 'frameworks', 'update', 'Update framework details'),
        ('frameworks.delete', 'frameworks', 'delete', 'Delete frameworks'),
        ('frameworks.approve', 'frameworks', 'approve', 'Approve frameworks'),
        ('frameworks.publish', 'frameworks', 'publish', 'Publish frameworks globally'),

        # Training & AI
        ('training.view_all', 'training', 'view_all', 'View all training data'),
        ('training.create', 'training', 'create', 'Create training entries'),
        ('training.update', 'training', 'update', 'Update training entries'),
        ('training.delete', 'training', 'delete', 'Delete training entries'),
        ('training.approve', 'training', 'approve', 'Approve training entries'),
        ('ai.generate', 'ai', 'generate', 'Use AI generation features'),
        ('ai.train', 'ai', 'train', 'Train AI models'),

        # Reports & Analytics
        ('reports.view_all', 'reports', 'view_all', 'View all reports'),
        ('reports.view_organization', 'reports', 'view_organization', 'View reports for own organization'),
        ('reports.view_department', 'reports', 'view_department', 'View reports for own department'),
        ('reports.create', 'reports', 'create', 'Create custom reports'),
        ('reports.export', 'reports', 'export', 'Export report data'),

        # Audit & Compliance
        ('audit.view_all', 'audit', 'view_all', 'View all audit logs'),
        ('audit.view_organization', 'audit', 'view_organization', 'View audit logs for own organization'),
        ('audit.view_own', 'audit', 'view_own', 'View own audit logs'),
        ('audit.export', 'audit', 'export', 'Export audit data'),

        # System Administration
        ('system.view_logs', 'system', 'view_logs', 'View system logs'),
        ('system.manage_settings', 'system', 'manage_settings', 'Manage system settings'),
        ('system.backup', 'system', 'backup', 'Create system backups'),
        ('system.restore', 'system', 'restore', 'Restore system from backup'),
        ('system.maintenance', 'system', 'maintenance', 'Perform system maintenance'),
    ]

    # Insert permissions
    op.bulk_insert(
        sa.table('permissions',
            sa.column('name', sa.String(100)),
            sa.column('resource', sa.String(100)),
            sa.column('action', sa.String(50)),
            sa.column('description', sa.Text())
        ),
        [{'name': p[0], 'resource': p[1], 'action': p[2], 'description': p[3]} for p in permissions_data]
    )


def downgrade() -> None:
    """Downgrade schema: Remove RBAC tables."""

    # Drop indexes first
    op.drop_index('ix_audit_logs_action')
    op.drop_index('ix_audit_logs_created_at')
    op.drop_index('ix_audit_logs_resource')
    op.drop_index('ix_audit_logs_user_id')
    op.drop_index('ix_user_roles_active')
    op.drop_index('ix_user_roles_role_id')
    op.drop_index('ix_user_roles_user_id')
    op.drop_index('ix_role_permissions_permission_id')
    op.drop_index('ix_role_permissions_role_id')
    op.drop_index('ix_permissions_resource_action')
    op.drop_index('ix_roles_hierarchy_level')

    # Drop tables in reverse order
    op.drop_table('audit_logs')
    op.drop_table('user_roles')
    op.drop_table('role_permissions')
    op.drop_table('permissions')
    op.drop_table('roles')
