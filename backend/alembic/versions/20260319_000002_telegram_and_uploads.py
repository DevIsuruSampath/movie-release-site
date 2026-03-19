"""telegram integration and upload support

Revision ID: 20260319_000002
Revises: 20260319_000001
Create Date: 2026-03-19 00:00:02
"""

from alembic import op
import sqlalchemy as sa


revision = "20260319_000002"
down_revision = "20260319_000001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "telegram_settings",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("is_enabled", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("bot_token_encrypted", sa.Text(), nullable=True),
        sa.Column("bot_username", sa.String(length=255), nullable=True),
        sa.Column("channel_id", sa.String(length=255), nullable=True),
        sa.Column("channel_username", sa.String(length=255), nullable=True),
        sa.Column("channel_title", sa.String(length=255), nullable=True),
        sa.Column("channel_invite_link", sa.String(length=500), nullable=True),
        sa.Column("auto_post_on_publish", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("auto_post_on_update", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("caption_template", sa.Text(), nullable=True),
        sa.Column("button_text", sa.String(length=255), nullable=True),
        sa.Column("default_hashtags", sa.String(length=500), nullable=True),
        sa.Column("send_poster_mode", sa.String(length=20), nullable=False, server_default="photo"),
        sa.Column("parse_mode", sa.String(length=20), nullable=True),
        sa.Column("disable_web_page_preview", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("test_status", sa.String(length=50), nullable=True),
        sa.Column("last_tested_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True, server_default=sa.func.now()),
    )
    op.create_index("ix_telegram_settings_id", "telegram_settings", ["id"])

    op.create_table(
        "telegram_post_logs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("movie_id", sa.Integer(), sa.ForeignKey("movies.id", ondelete="CASCADE"), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="pending"),
        sa.Column("telegram_chat_id", sa.String(length=255), nullable=True),
        sa.Column("telegram_message_id", sa.String(length=255), nullable=True),
        sa.Column("request_payload_json", sa.JSON(), nullable=True),
        sa.Column("response_payload_json", sa.JSON(), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("retry_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True, server_default=sa.func.now()),
    )
    op.create_index("ix_telegram_post_logs_id", "telegram_post_logs", ["id"])
    op.create_index("ix_telegram_post_logs_movie_id", "telegram_post_logs", ["movie_id"])
    op.create_index("ix_telegram_post_logs_status", "telegram_post_logs", ["status"])

    op.create_table(
        "telegram_media_cache",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("movie_id", sa.Integer(), sa.ForeignKey("movies.id", ondelete="CASCADE"), nullable=False),
        sa.Column("telegram_file_id", sa.String(length=255), nullable=False),
        sa.Column("media_type", sa.String(length=50), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True, server_default=sa.func.now()),
    )
    op.create_index("ix_telegram_media_cache_id", "telegram_media_cache", ["id"])
    op.create_index("ix_telegram_media_cache_movie_id", "telegram_media_cache", ["movie_id"])


def downgrade() -> None:
    op.drop_index("ix_telegram_media_cache_movie_id", table_name="telegram_media_cache")
    op.drop_index("ix_telegram_media_cache_id", table_name="telegram_media_cache")
    op.drop_table("telegram_media_cache")

    op.drop_index("ix_telegram_post_logs_status", table_name="telegram_post_logs")
    op.drop_index("ix_telegram_post_logs_movie_id", table_name="telegram_post_logs")
    op.drop_index("ix_telegram_post_logs_id", table_name="telegram_post_logs")
    op.drop_table("telegram_post_logs")

    op.drop_index("ix_telegram_settings_id", table_name="telegram_settings")
    op.drop_table("telegram_settings")
