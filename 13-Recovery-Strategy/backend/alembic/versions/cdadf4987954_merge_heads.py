"""merge_heads

Revision ID: cdadf4987954
Revises: 115595763acc, add_user_password_table
Create Date: 2025-11-03 11:50:24.960958

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'cdadf4987954'
down_revision: Union[str, Sequence[str], None] = ('115595763acc', 'add_user_password_table')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
