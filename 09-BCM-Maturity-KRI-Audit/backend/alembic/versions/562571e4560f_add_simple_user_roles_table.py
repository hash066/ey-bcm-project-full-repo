"""add_simple_user_roles_table

Revision ID: 562571e4560f
Revises: cdadf4987954
Create Date: 2025-11-03 11:50:33.891742

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '562571e4560f'
down_revision: Union[str, Sequence[str], None] = 'cdadf4987954'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema: Add simple user roles table."""
    # Create user_roles_simple table
    op.create_table(
        'user_roles_simple',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('role_name', sa.String(length=50), nullable=False),
        sa.Column('assigned_by', sa.Integer(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('assigned_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['gap_assessment_users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['assigned_by'], ['gap_assessment_users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indexes for performance
    op.create_index('ix_user_roles_simple_user_id', 'user_roles_simple', ['user_id'])
    op.create_index('ix_user_roles_simple_role_name', 'user_roles_simple', ['role_name'])
    op.create_index('ix_user_roles_simple_active', 'user_roles_simple', ['is_active'])


def downgrade() -> None:
    """Downgrade schema: Remove simple user roles table."""
    # Drop indexes first
    op.drop_index('ix_user_roles_simple_active')
    op.drop_index('ix_user_roles_simple_role_name')
    op.drop_index('ix_user_roles_simple_user_id')

    # Drop table
    op.drop_table('user_roles_simple')
