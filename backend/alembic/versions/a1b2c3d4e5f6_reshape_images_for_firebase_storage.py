"""
Reshape images table for Firebase Storage metadata.

Revision ID: a1b2c3d4e5f6
Revises: 420c650723d1
Create Date: 2026-08-22 14:00:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "420c650723d1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # No production image rows yet — rebuild the table shape cleanly.
    op.drop_index(op.f("ix_images_visit_id"), table_name="images")
    op.drop_table("images")

    op.create_table(
        "images",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("visit_id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("storage_path", sa.String(length=500), nullable=False),
        sa.Column("slot_index", sa.Integer(), nullable=False),
        sa.Column("mime_type", sa.String(length=50), nullable=False),
        sa.Column("file_size", sa.Integer(), nullable=False),
        sa.Column(
            "uploaded_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "slot_index >= 0 AND slot_index <= 4",
            name="ck_images_slot_index_range",
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["visit_id"], ["visits.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("visit_id", "slot_index", name="uq_images_visit_id_slot_index"),
    )
    op.create_index(op.f("ix_images_visit_id"), "images", ["visit_id"], unique=False)
    op.create_index(op.f("ix_images_user_id"), "images", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_images_user_id"), table_name="images")
    op.drop_index(op.f("ix_images_visit_id"), table_name="images")
    op.drop_table("images")

    op.create_table(
        "images",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("visit_id", sa.UUID(), nullable=False),
        sa.Column("storage_url", sa.String(length=500), nullable=False),
        sa.Column("file_size", sa.Integer(), nullable=True),
        sa.Column("mime_type", sa.String(length=50), nullable=True),
        sa.Column(
            "uploaded_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["visit_id"], ["visits.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_images_visit_id"), "images", ["visit_id"], unique=False)
