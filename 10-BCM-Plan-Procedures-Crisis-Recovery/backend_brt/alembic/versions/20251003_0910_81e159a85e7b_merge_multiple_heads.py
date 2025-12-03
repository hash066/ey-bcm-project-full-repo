"""Merge multiple heads

Revision ID: 81e159a85e7b
Revises: 617e5b364821
Create Date: 2025-10-03 09:10:21.676670+00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '81e159a85e7b'
down_revision: Union[str, Sequence[str], None] = '617e5b364821'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
