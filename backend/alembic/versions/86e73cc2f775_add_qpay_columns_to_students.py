"""add_qpay_columns_to_students

Revision ID: 86e73cc2f775
Revises: 7719ca296be0
Create Date: 2025-10-20 18:10:35.477843

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '86e73cc2f775'
down_revision = '7719ca296be0'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add qpay columns to students table
    op.add_column('students', sa.Column('qpay_qr_code', sa.String(500), nullable=True))
    op.add_column('students', sa.Column('qpay_account_id', sa.String(100), nullable=True))
    op.create_index('ix_students_qpay_account_id', 'students', ['qpay_account_id'])


def downgrade() -> None:
    # Remove qpay columns from students table
    op.drop_index('ix_students_qpay_account_id', 'students')
    op.drop_column('students', 'qpay_account_id')
    op.drop_column('students', 'qpay_qr_code')
