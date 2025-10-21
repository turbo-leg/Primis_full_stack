"""add_missing_enrollment_columns

Revision ID: 9febc248d676
Revises: 6b08a600fbc3
Create Date: 2025-10-20 08:00:47.693172

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '9febc248d676'
down_revision = '6b08a600fbc3'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add missing columns to enrollments table
    op.add_column('enrollments', sa.Column('paid', sa.Boolean(), nullable=True, server_default='false'))
    op.add_column('enrollments', sa.Column('paid_date', sa.DateTime(), nullable=True))
    op.add_column('enrollments', sa.Column('payment_due', sa.DateTime(), nullable=True))
    op.add_column('enrollments', sa.Column('status', sa.String(20), nullable=True, server_default='active'))
    
    # Rename enrolled_date to enrollment_date for consistency with model
    op.alter_column('enrollments', 'enrolled_date', new_column_name='enrollment_date')
    
    # Drop is_active column (replaced by status)
    op.drop_column('enrollments', 'is_active')


def downgrade() -> None:
    # Reverse the changes
    op.add_column('enrollments', sa.Column('is_active', sa.Boolean(), server_default='true'))
    op.alter_column('enrollments', 'enrollment_date', new_column_name='enrolled_date')
    op.drop_column('enrollments', 'status')
    op.drop_column('enrollments', 'payment_due')
    op.drop_column('enrollments', 'paid_date')
    op.drop_column('enrollments', 'paid')
