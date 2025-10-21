"""add_missing_course_columns

Revision ID: f87d74ede647
Revises: e65cd20c446e
Create Date: 2025-10-20 07:54:32.542205

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'f87d74ede647'
down_revision = 'e65cd20c446e'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add missing columns to courses table
    op.add_column('courses', sa.Column('start_time', sa.DateTime(), nullable=True))
    op.add_column('courses', sa.Column('end_time', sa.DateTime(), nullable=True))
    op.add_column('courses', sa.Column('price', sa.Numeric(precision=10, scale=2), nullable=True))


def downgrade() -> None:
    # Remove the columns in reverse order
    op.drop_column('courses', 'price')
    op.drop_column('courses', 'end_time')
    op.drop_column('courses', 'start_time')
