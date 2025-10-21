"""fix_material_columns

Revision ID: 7719ca296be0
Revises: fdc1252f3b1c
Create Date: 2025-10-20 08:14:38.527644

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '7719ca296be0'
down_revision = 'fdc1252f3b1c'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Rename material_type to type
    op.alter_column('materials', 'material_type', new_column_name='type')
    
    # Combine file_url and link_url into single url column
    # Use file_url as the new url column (rename it)
    op.alter_column('materials', 'file_url', new_column_name='url')
    
    # Drop link_url as we now use single url column
    op.drop_column('materials', 'link_url')
    
    # Add file_size column
    op.add_column('materials', sa.Column('file_size', sa.Integer(), nullable=True))
    
    # Rename is_visible to is_public
    op.alter_column('materials', 'is_visible', new_column_name='is_public')
    
    # Rename uploaded_by to match model (though both work, keeping consistency)
    # The model doesn't use uploaded_by, so we can drop it
    op.drop_column('materials', 'uploaded_by')
    
    # Rename created_at to upload_date for consistency with model
    op.alter_column('materials', 'created_at', new_column_name='upload_date')


def downgrade() -> None:
    # Reverse all changes
    op.alter_column('materials', 'upload_date', new_column_name='created_at')
    op.add_column('materials', sa.Column('uploaded_by', sa.Integer(), nullable=False))
    op.alter_column('materials', 'is_public', new_column_name='is_visible')
    op.drop_column('materials', 'file_size')
    op.add_column('materials', sa.Column('link_url', sa.String(500), nullable=True))
    op.alter_column('materials', 'url', new_column_name='file_url')
    op.alter_column('materials', 'type', new_column_name='material_type')
