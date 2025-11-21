"""Add procedures tables

Revision ID: add_procedures_tables
Revises: update_highest_impact_column_type
Create Date: 2024-12-19 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_procedures_tables'
down_revision = 'add_user_password_table'
branch_labels = None
depends_on = None


def upgrade():
    # Create procedure_documents table
    op.create_table('procedure_documents',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('procedure_type', sa.String(length=50), nullable=False),
        sa.Column('organization_id', sa.Integer(), nullable=False),
        sa.Column('document_name', sa.String(length=255), nullable=False),
        sa.Column('document_owner', sa.String(length=255), nullable=False),
        sa.Column('document_version_no', sa.String(length=50), nullable=False),
        sa.Column('document_version_date', sa.String(length=50), nullable=False),
        sa.Column('prepared_by', sa.String(length=255), nullable=False),
        sa.Column('reviewed_by', sa.String(length=255), nullable=False),
        sa.Column('approved_by', sa.String(length=255), nullable=False),
        sa.Column('use_llm_content', sa.Boolean(), nullable=False),
        sa.Column('llm_content', sa.JSON(), nullable=True),
        sa.Column('custom_content', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.Column('updated_by', sa.Integer(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_procedure_documents_id'), 'procedure_documents', ['id'], unique=False)
    op.create_index(op.f('ix_procedure_documents_organization_id'), 'procedure_documents', ['organization_id'], unique=False)
    op.create_index(op.f('ix_procedure_documents_procedure_type'), 'procedure_documents', ['procedure_type'], unique=False)

    # Create procedure_change_log table
    op.create_table('procedure_change_log',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('procedure_document_id', sa.Integer(), nullable=False),
        sa.Column('sr_no', sa.Integer(), nullable=False),
        sa.Column('version_no', sa.String(length=50), nullable=False),
        sa.Column('approval_date', sa.String(length=50), nullable=True),
        sa.Column('description_of_change', sa.Text(), nullable=False),
        sa.Column('reviewed_by', sa.String(length=255), nullable=False),
        sa.Column('approved_by', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['procedure_document_id'], ['procedure_documents.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_procedure_change_log_id'), 'procedure_change_log', ['id'], unique=False)

    # Create procedure_templates table
    op.create_table('procedure_templates',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('procedure_type', sa.String(length=50), nullable=False),
        sa.Column('template_name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('default_document_info', sa.JSON(), nullable=False),
        sa.Column('sections', sa.JSON(), nullable=False),
        sa.Column('default_content', sa.JSON(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('version', sa.String(length=50), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.Column('updated_by', sa.Integer(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_procedure_templates_id'), 'procedure_templates', ['id'], unique=False)
    op.create_index(op.f('ix_procedure_templates_procedure_type'), 'procedure_templates', ['procedure_type'], unique=False)

    # Create llm_content_cache table
    op.create_table('llm_content_cache',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('content_type', sa.String(length=100), nullable=False),
        sa.Column('procedure_type', sa.String(length=50), nullable=False),
        sa.Column('organization_id', sa.Integer(), nullable=False),
        sa.Column('content_key', sa.String(length=255), nullable=False),
        sa.Column('generated_content', sa.JSON(), nullable=False),
        sa.Column('generation_parameters', sa.JSON(), nullable=True),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_llm_content_cache_content_key'), 'llm_content_cache', ['content_key'], unique=False)
    op.create_index(op.f('ix_llm_content_cache_content_type'), 'llm_content_cache', ['content_type'], unique=False)
    op.create_index(op.f('ix_llm_content_cache_id'), 'llm_content_cache', ['id'], unique=False)
    op.create_index(op.f('ix_llm_content_cache_organization_id'), 'llm_content_cache', ['organization_id'], unique=False)
    op.create_index(op.f('ix_llm_content_cache_procedure_type'), 'llm_content_cache', ['procedure_type'], unique=False)

    # Create procedure_exports table
    op.create_table('procedure_exports',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('procedure_document_id', sa.Integer(), nullable=False),
        sa.Column('export_format', sa.String(length=50), nullable=False),
        sa.Column('file_name', sa.String(length=255), nullable=False),
        sa.Column('file_path', sa.String(length=500), nullable=False),
        sa.Column('file_size', sa.Integer(), nullable=True),
        sa.Column('include_llm_content', sa.Boolean(), nullable=False),
        sa.Column('custom_styling', sa.JSON(), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('download_count', sa.Integer(), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['procedure_document_id'], ['procedure_documents.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_procedure_exports_id'), 'procedure_exports', ['id'], unique=False)

    # Insert default procedure templates
    op.execute("""
        INSERT INTO procedure_templates (procedure_type, template_name, description, default_document_info, sections, is_active, version, created_by)
        VALUES 
        ('bia', 'BIA Procedure Template', 'Standard Business Impact Analysis procedure template', 
         '{"document_name": "BCMS BIA Procedure", "document_owner": "BCM Team", "document_version_no": "1.0", "document_version_date": "", "prepared_by": "BCM Team", "reviewed_by": "Head-ORMD", "approved_by": "ORMC - Operational Risk Management Committee"}',
         '["Introduction", "Scope", "Objective", "BIA Methodology", "Process Flow", "Roles and Responsibilities", "Review Frequency", "Annexure"]',
         true, '1.0', 1),
        ('risk_assessment', 'Risk Assessment Procedure Template', 'Standard Risk Assessment procedure template',
         '{"document_name": "Risk Assessment Procedure", "document_owner": "BCM Team", "document_version_no": "1.0", "document_version_date": "", "prepared_by": "BCM Team", "reviewed_by": "Head-ORMD", "approved_by": "ORMC - Operational Risk Management Committee"}',
         '["Introduction", "Scope", "Objective", "Risk Assessment Methodology", "Governance and Documentation", "Frequency", "Annexure"]',
         true, '1.0', 1),
        ('bcm_plan', 'BCM Plan Development Procedure Template', 'Standard BCM Plan Development procedure template',
         '{"document_name": "BCMS BCM Plan Development Procedure", "document_owner": "BCM Team", "document_version_no": "1.0", "document_version_date": "", "prepared_by": "BCM Team", "reviewed_by": "Head-ORMD", "approved_by": "ORMC - Operational Risk Management Committee"}',
         '["Introduction", "Scope", "Objective", "BCM Plan Development Methodology", "Process Flow", "Roles and Responsibilities", "Review Frequency", "Annexure"]',
         true, '1.0', 1);
    """)


def downgrade():
    # Drop tables in reverse order
    op.drop_table('procedure_exports')
    op.drop_table('llm_content_cache')
    op.drop_table('procedure_templates')
    op.drop_table('procedure_change_log')
    op.drop_table('procedure_documents')