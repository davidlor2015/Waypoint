"""add packing_items, budget_expenses tables and budget_limit to trips

Revision ID: c1d2e3f4a5b6
Revises: 8d7f1c2a9b4e
Create Date: 2026-04-17 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'c1d2e3f4a5b6'
down_revision: Union[str, Sequence[str], None] = '8d7f1c2a9b4e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'trips',
        sa.Column('budget_limit', sa.Float(), nullable=True),
    )

    op.create_table(
        'packing_items',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('trip_id', sa.Integer(), nullable=False),
        sa.Column('label', sa.String(length=255), nullable=False),
        sa.Column('checked', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['trip_id'], ['trips.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_packing_items_id'), 'packing_items', ['id'], unique=False)
    op.create_index(op.f('ix_packing_items_trip_id'), 'packing_items', ['trip_id'], unique=False)

    op.create_table(
        'budget_expenses',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('trip_id', sa.Integer(), nullable=False),
        sa.Column('label', sa.String(length=255), nullable=False),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('category', sa.String(length=100), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['trip_id'], ['trips.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_budget_expenses_id'), 'budget_expenses', ['id'], unique=False)
    op.create_index(op.f('ix_budget_expenses_trip_id'), 'budget_expenses', ['trip_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_budget_expenses_trip_id'), table_name='budget_expenses')
    op.drop_index(op.f('ix_budget_expenses_id'), table_name='budget_expenses')
    op.drop_table('budget_expenses')

    op.drop_index(op.f('ix_packing_items_trip_id'), table_name='packing_items')
    op.drop_index(op.f('ix_packing_items_id'), table_name='packing_items')
    op.drop_table('packing_items')

    op.drop_column('trips', 'budget_limit')
