"""Add BIA snapshots and audit logs

Revision ID: 07_add_bia_snapshots
Revises: 05_add_organization_activity_log
Create Date: 2025-10-27 19:45:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
import uuid


# revision identifiers, used by Alembic.
revision = '07_add_bia_snapshots'
down_revision = '05_add_organization_activity_log'
branch_labels = None
depends_on = None


def upgrade():
    # Create bia_snapshots table
    op.create_table(
        'bia_snapshots',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('organization_id', UUID(as_uuid=True), nullable=False, index=True),
        sa.Column('version', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('snapshot_data', sa.Text(), nullable=False),  # Encrypted JSON data
        sa.Column('encryption_metadata', sa.Text(), nullable=False),  # JSON string with IV, tag, algorithm, etc.
        sa.Column('saved_by', UUID(as_uuid=True), nullable=False),  # User ID who saved the snapshot
        sa.Column('source', sa.String(20), nullable=False, server_default='HUMAN'),  # HUMAN or AI
        sa.Column('saved_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column('checksum', sa.String(64), nullable=True),  # SHA-256 checksum of decrypted data
        sa.Column('notes', sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indexes for bia_snapshots
    op.create_index('ix_bia_snapshots_org_id', 'bia_snapshots', ['organization_id'])
    op.create_index('ix_bia_snapshots_org_version', 'bia_snapshots', ['organization_id', 'version'])

    # Create bia_audit_logs table
    op.create_table(
        'bia_audit_logs',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('snapshot_id', UUID(as_uuid=True), sa.ForeignKey('bia_snapshots.id'), nullable=True),
        sa.Column('action', sa.String(20), nullable=False),  # SAVE, APPROVE, REJECT, ROLLBACK
        sa.Column('user_id', UUID(as_uuid=True), nullable=False),
        sa.Column('organization_id', UUID(as_uuid=True), nullable=False),
        sa.Column('details', sa.Text(), nullable=True),  # JSON string with additional context
        sa.Column('timestamp', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column('request_id', sa.String(100), nullable=True),  # For tracing requests
        sa.PrimaryKeyConstraint('id')
    )

    # Create indexes for bia_audit_logs
    op.create_index('ix_bia_audit_logs_org_id', 'bia_audit_logs', ['organization_id'])
    op.create_index('ix_bia_audit_logs_action', 'bia_audit_logs', ['action'])
    op.create_index('ix_bia_audit_logs_timestamp', 'bia_audit_logs', ['timestamp'])


def downgrade():
    # Drop tables in reverse order
    op.drop_table('bia_audit_logs')
    op.drop_table('bia_snapshots')
