"""merge heads

Revision ID: merge_heads
Revises: add_status_fields_simple
Create Date: 2025-09-28 08:36:26.143284+00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'merge_heads'
down_revision: Union[str, Sequence[str], None] = 'add_status_fields_simple'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = ['add_enhanced_recovery_strategy_fields', 'add_additional_procedure_templates']


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
