"""Update highest_impact column type in process_impact_analysis table

Revision ID: 04_update_highest_impact
Revises: 03_add_bia_tables
Create Date: 2025-07-16 12:38:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '04_update_highest_impact'
down_revision = '03_add_bia_tables'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Update the highest_impact column type from VARCHAR(50) to TEXT
    op.alter_column('process_impact_analysis', 'highest_impact',
                    existing_type=sa.VARCHAR(length=50),
                    type_=sa.Text(),
                    existing_nullable=True)


def downgrade() -> None:
    # WARNING: This downgrade might cause data loss if the TEXT values are longer than 50 characters
    op.alter_column('process_impact_analysis', 'highest_impact',
                    existing_type=sa.Text(),
                    type_=sa.VARCHAR(length=50),
                    existing_nullable=True)
