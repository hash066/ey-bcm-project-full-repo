"""Rename head_name to head_username in global models

Revision ID: 01_rename_head_name
Revises: 
Create Date: 2023-07-10 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '01_rename_head_name'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Rename head_name to head_username in organization table
    op.alter_column('organization', 'head_name', new_column_name='head_username')
    
    # Rename head_name to head_username in department table
    op.alter_column('department', 'head_name', new_column_name='head_username')
    
    # Rename head_name to head_username in subdepartment table
    op.alter_column('subdepartment', 'head_name', new_column_name='head_username')


def downgrade():
    # Rename head_username back to head_name in organization table
    op.alter_column('organization', 'head_username', new_column_name='head_name')
    
    # Rename head_username back to head_name in department table
    op.alter_column('department', 'head_username', new_column_name='head_name')
    
    # Rename head_username back to head_name in subdepartment table
    op.alter_column('subdepartment', 'head_username', new_column_name='head_name')
