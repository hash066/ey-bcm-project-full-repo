"""Add role columns to client table

Revision ID: add_role_columns_to_client
Revises: 05_add_organization_activity_log
Create Date: 2025-07-25 17:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_role_columns_to_client'
down_revision = '05_add_organization_activity_log'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add new role columns to the organization table without foreign key constraints
    op.add_column('organization', sa.Column('ceo_user_id', sa.Text(), nullable=True))
    op.add_column('organization', sa.Column('reportee_user_id', sa.Text(), nullable=True))
    op.add_column('organization', sa.Column('sub_reportee_user_id', sa.Text(), nullable=True))
    op.add_column('organization', sa.Column('cxo_user_id', sa.Text(), nullable=True))
    op.add_column('organization', sa.Column('project_sponsor_user_id', sa.Text(), nullable=True))
    op.add_column('organization', sa.Column('client_head_user_id', sa.Text(), nullable=True))
    op.add_column('organization', sa.Column('bcm_coordinator_user_id', sa.Text(), nullable=True))


def downgrade() -> None:
    # Drop columns
    op.drop_column('organization', 'ceo_user_id')
    op.drop_column('organization', 'reportee_user_id')
    op.drop_column('organization', 'sub_reportee_user_id')
    op.drop_column('organization', 'cxo_user_id')
    op.drop_column('organization', 'project_sponsor_user_id')
    op.drop_column('organization', 'client_head_user_id')
    op.drop_column('organization', 'bcm_coordinator_user_id')
