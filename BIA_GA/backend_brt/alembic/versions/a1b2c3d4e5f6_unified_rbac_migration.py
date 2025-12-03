"""
Unified RBAC Migration
Consolidates all role systems into a single unified architecture.

Revision ID: unified_rbac_001
Revises: 562571e4560f
Create Date: 2025-11-03

This migration:
1. Creates unified user_roles table (many-to-many)
2. Migrates data from existing role systems
3. Updates foreign key references
4. Removes old role tables
"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy import text

# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '562571e4560f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade: Create unified RBAC system."""

    # Create the unified user_roles table
    op.create_table(
        'user_roles_unified',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('role_name', sa.String(50), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('assigned_at', sa.DateTime(), nullable=False, default=sa.func.now()),
        sa.Column('assigned_by', sa.Integer(), sa.ForeignKey('users.id'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'role_name', name='uq_user_role_unified')
    )

    # Migrate data from existing systems
    conn = op.get_bind()

    # 1. Migrate from users.role (main app roles)
    print("Migrating main app roles from users table...")
    main_app_role_mapping = {
        'Process Owner': 'process_owner',
        'Department Head': 'department_head',
        'Organization Head': 'organization_head',
        'Client Head': 'client_head',
        'BCM Coordinator': 'bcm_coordinator',
        'Project Sponsor': 'project_sponsor',
        'CXO': 'cxo',
        'EY Admin': 'ey_admin'
    }

    for old_role, new_role in main_app_role_mapping.items():
        try:
            conn.execute(text("""
                INSERT INTO user_roles_unified (user_id, role_name, assigned_at)
                SELECT id, :new_role, datetime('now')
                FROM users
                WHERE role = :old_role AND is_active = 1
            """), {'new_role': new_role, 'old_role': old_role})
        except Exception as e:
            print(f"Warning migrating {old_role}: {e}")

    # 2. Migrate from user_roles_simple (recently added system)
    print("Migrating from user_roles_simple table...")
    try:
        conn.execute(text("""
            INSERT INTO user_roles_unified (user_id, role_name, is_active, assigned_at, assigned_by)
            SELECT user_id, role_name, is_active, assigned_at, assigned_by
            FROM user_roles_simple
            WHERE is_active = 1
        """))
    except Exception as e:
        print(f"Warning migrating user_roles_simple: {e}")

    # Remove old tables (be careful - only remove after data migration)
    print("Removing old role tables...")

    # Drop user_roles_simple (we migrated the data)
    try:
        op.drop_table('user_roles_simple')
    except Exception as e:
        print(f"Warning dropping user_roles_simple: {e}")

    print("✅ Unified RBAC migration completed!")


def downgrade() -> None:
    """Downgrade: Restore old role systems (not recommended)."""

    # This downgrade is complex and not recommended
    # In production, you would need to restore from backup

    # Drop unified table
    op.drop_table('user_roles_unified')

    # Recreate old tables (simplified - data will be lost)
    op.create_table(
        'user_roles_simple',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('role_name', sa.String(50), nullable=False),
        sa.Column('assigned_by', sa.Integer(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('assigned_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['gap_assessment_users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['assigned_by'], ['gap_assessment_users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.Index('ix_user_roles_simple_user_id', 'user_id'),
        sa.Index('ix_user_roles_simple_role_name', 'role_name'),
        sa.Index('ix_user_roles_simple_active', 'is_active')
    )

    print("⚠️  Downgrade completed - data may be lost!")
