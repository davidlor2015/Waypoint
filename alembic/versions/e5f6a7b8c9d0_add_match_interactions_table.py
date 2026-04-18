"""add match interactions table

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-04-17 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "e5f6a7b8c9d0"
down_revision: Union[str, Sequence[str], None] = "d4e5f6a7b8c9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "match_interactions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("request_id", sa.Integer(), nullable=False),
        sa.Column("match_result_id", sa.Integer(), nullable=False),
        sa.Column(
            "status",
            sa.Enum(
                "interested",
                "intro_saved",
                "passed",
                "accepted",
                "declined",
                name="match_interaction_status_enum",
                native_enum=False,
            ),
            nullable=False,
        ),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.ForeignKeyConstraint(["match_result_id"], ["match_results.id"]),
        sa.ForeignKeyConstraint(["request_id"], ["match_requests.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "request_id", "match_result_id", name="uq_match_interaction_user_request_result"),
    )
    op.create_index(op.f("ix_match_interactions_id"), "match_interactions", ["id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_match_interactions_id"), table_name="match_interactions")
    op.drop_table("match_interactions")
