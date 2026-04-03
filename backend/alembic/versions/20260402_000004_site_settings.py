"""site settings

Revision ID: 20260402_000004
Revises: 20260319_000003
Create Date: 2026-04-02 00:00:04
"""

from alembic import op
import sqlalchemy as sa


revision = "20260402_000004"
down_revision = "20260319_000003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "site_settings",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("key", sa.String(length=100), nullable=False),
        sa.Column("value", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_site_settings_key", "site_settings", ["key"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_site_settings_key", table_name="site_settings")
    op.drop_table("site_settings")
