"""Add additional procedure templates

Revision ID: add_additional_procedure_templates
Revises: add_procedures_tables
Create Date: 2024-12-19 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_additional_procedure_templates'
down_revision = 'add_procedures_tables'
branch_labels = None
depends_on = None


def upgrade():
    # Insert additional procedure templates
    op.execute("""
        INSERT INTO procedure_templates (procedure_type, template_name, description, default_document_info, sections, is_active, version, created_by)
        VALUES 
        ('crisis_communication', 'Crisis Communication Procedure Template', 'Standard Crisis Communication procedure template', 
         '{"document_name": "Crisis Communication Procedure", "document_owner": "BCM Team", "document_version_no": "1.0", "document_version_date": "", "prepared_by": "BCM Team", "reviewed_by": "Head-ORMD", "approved_by": "ORMC - Operational Risk Management Committee"}',
         '["Introduction", "Scope", "Objective", "Communication Strategy", "Roles and Responsibilities", "Communication Channels", "Review Frequency", "Annexure"]',
         true, '1.0', 1),
        ('nonconformity', 'Nonconformity and Corrective Actions Procedure Template', 'Standard Nonconformity and Corrective Actions procedure template',
         '{"document_name": "Nonconformity and Corrective Actions Procedure", "document_owner": "BCM Team", "document_version_no": "1.0", "document_version_date": "", "prepared_by": "BCM Team", "reviewed_by": "Head-ORMD", "approved_by": "ORMC - Operational Risk Management Committee"}',
         '["Introduction", "Scope", "Objective", "Nonconformity Management", "Corrective Actions", "Roles and Responsibilities", "Review Frequency", "Annexure"]',
         true, '1.0', 1),
        ('performance_monitoring', 'Performance Monitoring Procedure Template', 'Standard Performance Monitoring procedure template',
         '{"document_name": "Performance Monitoring Procedure", "document_owner": "Performance Management Team", "document_version_no": "1.0", "document_version_date": "", "prepared_by": "Performance Management Team", "reviewed_by": "Head-PMO", "approved_by": "Performance Management Committee"}',
         '["Introduction", "Scope", "Objective", "Performance Indicators", "Monitoring Frequency", "Reporting Structure", "Review Frequency", "Annexure"]',
         true, '1.0', 1),
        ('testing_exercising', 'Testing and Exercising Procedure Template', 'Standard Testing and Exercising procedure template',
         '{"document_name": "Testing and Exercising Procedure", "document_owner": "BCM Team", "document_version_no": "1.0", "document_version_date": "", "prepared_by": "BCM Team", "reviewed_by": "Head-ORMD", "approved_by": "ORMC - Operational Risk Management Committee"}',
         '["Introduction", "Scope", "Objective", "Testing Types", "Exercise Schedule", "Evaluation Criteria", "Roles and Responsibilities", "Review Frequency", "Annexure"]',
         true, '1.0', 1),
        ('training_awareness', 'Training and Awareness Procedure Template', 'Standard Training and Awareness procedure template',
         '{"document_name": "Training and Awareness Procedure", "document_owner": "BCM Team", "document_version_no": "1.0", "document_version_date": "", "prepared_by": "BCM Team", "reviewed_by": "Head-ORMD", "approved_by": "ORMC - Operational Risk Management Committee"}',
         '["Introduction", "Scope", "Objective", "Training Programs", "Awareness Activities", "Competency Framework", "Roles and Responsibilities", "Review Frequency", "Annexure"]',
         true, '1.0', 1);
    """)


def downgrade():
    # Remove the additional procedure templates
    op.execute("""
        DELETE FROM procedure_templates 
        WHERE procedure_type IN ('crisis_communication', 'nonconformity', 'performance_monitoring', 'testing_exercising', 'training_awareness');
    """)