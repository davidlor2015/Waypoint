"""add explore_destinations table

Revision ID: d4e5f6a7b8c9
Revises: c1d2e3f4a5b6
Create Date: 2026-04-17 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'd4e5f6a7b8c9'
down_revision: Union[str, Sequence[str], None] = 'c1d2e3f4a5b6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'explore_destinations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('slug', sa.String(length=120), nullable=False),
        sa.Column('city', sa.String(length=120), nullable=False),
        sa.Column('country', sa.String(length=120), nullable=False),
        sa.Column('region', sa.String(length=20), nullable=False),
        sa.Column('tag', sa.String(length=40), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('sort_order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_explore_destinations_id'), 'explore_destinations', ['id'], unique=False)
    op.create_index(op.f('ix_explore_destinations_slug'), 'explore_destinations', ['slug'], unique=True)
    op.create_index(op.f('ix_explore_destinations_region'), 'explore_destinations', ['region'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_explore_destinations_region'), table_name='explore_destinations')
    op.drop_index(op.f('ix_explore_destinations_slug'), table_name='explore_destinations')
    op.drop_index(op.f('ix_explore_destinations_id'), table_name='explore_destinations')
    op.drop_table('explore_destinations')
