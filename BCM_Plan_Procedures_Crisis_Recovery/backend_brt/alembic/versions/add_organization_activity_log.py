"""
Add organization activity log table

Revision ID: 05_add_organization_activity_log
Revises: 
Create Date: 2025-07-25

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


# revision identifiers, used by Alembic.
revision = '05_add_organization_activity_log'
down_revision = 'update_highest_impact_column_type'  # Link to the previous migration
branch_labels = None
depends_on = None


def upgrade():
    # Try to create the uuid-ossp extension if it doesn't exist
    try:
        op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    except Exception as e:
        print(f"Warning: Could not create uuid-ossp extension: {e}")
    
    op.create_table(
        'organization_activity_log',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),  # No server_default
        sa.Column('organization_id', UUID(as_uuid=True), sa.ForeignKey('organization.id', ondelete='CASCADE'), nullable=False),
        sa.Column('username', sa.Text(), nullable=False),
        sa.Column('department', sa.Text(), nullable=True),
        sa.Column('subdepartment', sa.Text(), nullable=True),
        sa.Column('action_info', sa.Text(), nullable=False),
        sa.Column('endpoint', sa.Text(), nullable=True),
        sa.Column('timestamp', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    
    # Create index for faster queries by organization_id
    op.create_index(
        'ix_organization_activity_log_organization_id',
        'organization_activity_log',
        ['organization_id']
    )
    
    # Create index for faster queries by timestamp
    op.create_index(
        'ix_organization_activity_log_timestamp',
        'organization_activity_log',
        ['timestamp']
    )


def downgrade():
    op.drop_index('ix_organization_activity_log_timestamp')
    op.drop_index('ix_organization_activity_log_organization_id')
    op.drop_table('organization_activity_log')
