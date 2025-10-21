"""fix_assignment_columns

Revision ID: fdc1252f3b1c
Revises: e6d8e7b2f3bd
Create Date: 2025-10-20 08:11:57.082913

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'fdc1252f3b1c'
down_revision = 'e6d8e7b2f3bd'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add missing 'instructions' column
    op.add_column('assignments', sa.Column('instructions', sa.Text(), nullable=True))
    
    # Rename teacher_id to created_by_id for consistency with model
    op.alter_column('assignments', 'teacher_id', new_column_name='created_by_id')
    
    # Note: file_url exists in migration but not in model - keeping it for backward compatibility


def downgrade() -> None:
    # Reverse the changes
    op.alter_column('assignments', 'created_by_id', new_column_name='teacher_id')
    op.drop_column('assignments', 'instructions')
