"""Add impact_matrix to organization table

Revision ID: 02_add_impact_matrix
Revises: 01_rename_head_name
Create Date: 2023-07-10 11:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB


# revision identifiers, used by Alembic.
revision = '02_add_impact_matrix'
down_revision = '01_rename_head_name'
branch_labels = None
depends_on = None


def upgrade():
    # Add impact_matrix column to organization table
    op.add_column('organization', sa.Column('impact_matrix', JSONB, nullable=True))


def downgrade():
    # Remove impact_matrix column from organization table
    op.drop_column('organization', 'impact_matrix')
