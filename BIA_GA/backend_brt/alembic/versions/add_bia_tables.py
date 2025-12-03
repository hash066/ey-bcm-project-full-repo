"""Add BIA tables for process, department, and subdepartment info

Revision ID: 03_add_bia_tables
Revises: 02_add_impact_matrix
Create Date: 2025-07-10 14:45:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
import uuid


# revision identifiers, used by Alembic.
revision = '03_add_bia_tables'
down_revision = '02_add_impact_matrix'  # Adjust this based on your previous migration
branch_labels = None
depends_on = None


def upgrade():
    # Create bia_process_info table
    op.create_table(
        'bia_process_info',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('process_id', UUID(as_uuid=True), sa.ForeignKey('process.id', ondelete='CASCADE'), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('peak_period', sa.String(255), nullable=True),
        sa.Column('spoc', sa.String(255), nullable=True),
        sa.Column('review_status', sa.String(50), nullable=False, server_default='Draft'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create bia_department_info table
    op.create_table(
        'bia_department_info',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('department_id', UUID(as_uuid=True), sa.ForeignKey('department.id', ondelete='CASCADE'), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('impact_level', sa.String(50), nullable=True),
        sa.Column('review_status', sa.String(50), nullable=False, server_default='Draft'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create bia_subdepartment_info table
    op.create_table(
        'bia_subdepartment_info',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('subdepartment_id', UUID(as_uuid=True), sa.ForeignKey('subdepartment.id', ondelete='CASCADE'), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('impact_level', sa.String(50), nullable=True),
        sa.Column('review_status', sa.String(50), nullable=False, server_default='Draft'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create unique indexes to ensure one-to-one relationship
    op.create_index('ix_bia_process_info_process_id', 'bia_process_info', ['process_id'], unique=True)
    op.create_index('ix_bia_department_info_department_id', 'bia_department_info', ['department_id'], unique=True)
    op.create_index('ix_bia_subdepartment_info_subdepartment_id', 'bia_subdepartment_info', ['subdepartment_id'], unique=True)


def downgrade():
    # Drop tables in reverse order
    op.drop_table('bia_subdepartment_info')
    op.drop_table('bia_department_info')
    op.drop_table('bia_process_info')
