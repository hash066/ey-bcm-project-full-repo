"""Add status fields to recovery strategies - simple

Revision ID: add_status_fields_simple
Revises: add_procedures_tables
Create Date: 2025-09-21 23:55:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'add_status_fields_simple'
down_revision: Union[str, Sequence[str], None] = 'add_procedures_tables'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add status fields to recovery_strategies table."""
    # Add status columns to recovery_strategies table
    op.add_column('recovery_strategies', sa.Column('people_status', sa.Text(), nullable=True, server_default='Not Implemented'))
    op.add_column('recovery_strategies', sa.Column('technology_status', sa.Text(), nullable=True, server_default='Not Implemented'))
    op.add_column('recovery_strategies', sa.Column('site_status', sa.Text(), nullable=True, server_default='Not Implemented'))
    op.add_column('recovery_strategies', sa.Column('vendor_status', sa.Text(), nullable=True, server_default='Not Implemented'))


def downgrade() -> None:
    """Remove status fields from recovery_strategies table."""
    op.drop_column('recovery_strategies', 'vendor_status')
    op.drop_column('recovery_strategies', 'site_status')
    op.drop_column('recovery_strategies', 'technology_status')
    op.drop_column('recovery_strategies', 'people_status')