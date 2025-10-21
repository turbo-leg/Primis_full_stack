"""fix_attendance_columns

Revision ID: e6d8e7b2f3bd
Revises: 9febc248d676
Create Date: 2025-10-20 08:02:05.871385

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e6d8e7b2f3bd'
down_revision = '9febc248d676'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Rename date to attendance_date
    op.alter_column('attendances', 'date', new_column_name='attendance_date')
    
    # Add missing columns
    op.add_column('attendances', sa.Column('scanned_at', sa.DateTime(), nullable=True))
    op.add_column('attendances', sa.Column('marked_by_id', sa.Integer(), nullable=True))


def downgrade() -> None:
    # Reverse the changes
    op.drop_column('attendances', 'marked_by_id')
    op.drop_column('attendances', 'scanned_at')
    op.alter_column('attendances', 'attendance_date', new_column_name='date')
