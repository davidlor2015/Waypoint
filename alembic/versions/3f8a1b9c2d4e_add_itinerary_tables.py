"""add itinerary_days and itinerary_events tables

Revision ID: 3f8a1b9c2d4e
Revises: 70fee314e52b
Create Date: 2026-04-05 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3f8a1b9c2d4e'
down_revision: Union[str, Sequence[str], None] = '70fee314e52b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'itinerary_days',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('trip_id', sa.Integer(), nullable=False),
        sa.Column('day_number', sa.Integer(), nullable=False),
        sa.Column('day_date', sa.String(length=50), nullable=True),
        sa.ForeignKeyConstraint(['trip_id'], ['trips.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_itinerary_days_id'), 'itinerary_days', ['id'], unique=False)
    op.create_index(op.f('ix_itinerary_days_trip_id'), 'itinerary_days', ['trip_id'], unique=False)

    op.create_table(
        'itinerary_events',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('day_id', sa.Integer(), nullable=False),
        sa.Column('sort_order', sa.Integer(), nullable=False),
        sa.Column('time', sa.String(length=50), nullable=True),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('location', sa.String(length=255), nullable=True),
        sa.Column('lat', sa.Float(), nullable=True),
        sa.Column('lon', sa.Float(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('cost_estimate', sa.String(length=100), nullable=True),
        sa.ForeignKeyConstraint(['day_id'], ['itinerary_days.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_itinerary_events_id'), 'itinerary_events', ['id'], unique=False)
    op.create_index(op.f('ix_itinerary_events_day_id'), 'itinerary_events', ['day_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_itinerary_events_day_id'), table_name='itinerary_events')
    op.drop_index(op.f('ix_itinerary_events_id'), table_name='itinerary_events')
    op.drop_table('itinerary_events')

    op.drop_index(op.f('ix_itinerary_days_trip_id'), table_name='itinerary_days')
    op.drop_index(op.f('ix_itinerary_days_id'), table_name='itinerary_days')
    op.drop_table('itinerary_days')
