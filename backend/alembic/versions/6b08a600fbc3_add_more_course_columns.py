"""add_more_course_columns

Revision ID: 6b08a600fbc3
Revises: f87d74ede647
Create Date: 2025-10-20 07:57:03.320553

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '6b08a600fbc3'
down_revision = 'f87d74ede647'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add remaining missing columns to courses table
    op.add_column('courses', sa.Column('max_students', sa.Integer(), nullable=True, server_default='30'))
    op.add_column('courses', sa.Column('is_online', sa.Boolean(), nullable=True, server_default='false'))
    op.add_column('courses', sa.Column('location', sa.String(200), nullable=True))
    op.add_column('courses', sa.Column('status', sa.String(20), nullable=True, server_default='active'))


def downgrade() -> None:
    # Remove the columns in reverse order
    op.drop_column('courses', 'status')
    op.drop_column('courses', 'location')
    op.drop_column('courses', 'is_online')
    op.drop_column('courses', 'max_students')
