"""empty message

Revision ID: 617e5b364821
Revises: merge_heads
Create Date: 2025-09-28 09:41:32.110490+00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '617e5b364821'
down_revision: Union[str, Sequence[str], None] = 'merge_heads'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
