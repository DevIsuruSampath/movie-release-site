"""telegram storage upgrade

Revision ID: 20260319_000003
Revises: 20260319_000002
Create Date: 2026-03-19 00:00:03
"""

from alembic import op
import sqlalchemy as sa


revision = "20260319_000003"
down_revision = "20260319_000002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("telegram_settings", sa.Column("api_id_encrypted", sa.Text(), nullable=True))
    op.add_column("telegram_settings", sa.Column("api_hash_encrypted", sa.Text(), nullable=True))
    op.add_column("telegram_settings", sa.Column("private_channel_id", sa.String(length=255), nullable=True))
    op.add_column("telegram_settings", sa.Column("private_channel_username", sa.String(length=255), nullable=True))
    op.add_column("telegram_settings", sa.Column("private_channel_title", sa.String(length=255), nullable=True))
    op.add_column("telegram_settings", sa.Column("private_channel_invite_link", sa.String(length=500), nullable=True))
    op.add_column("telegram_settings", sa.Column("enable_telegram_storage", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("telegram_settings", sa.Column("telegram_storage_mode", sa.String(length=20), nullable=False, server_default="local_only"))

    op.execute("UPDATE telegram_settings SET private_channel_id = channel_id WHERE private_channel_id IS NULL")
    op.execute("UPDATE telegram_settings SET private_channel_username = channel_username WHERE private_channel_username IS NULL")
    op.execute("UPDATE telegram_settings SET private_channel_title = channel_title WHERE private_channel_title IS NULL")
    op.execute("UPDATE telegram_settings SET private_channel_invite_link = channel_invite_link WHERE private_channel_invite_link IS NULL")

    op.add_column("telegram_post_logs", sa.Column("send_mode", sa.String(length=20), nullable=False, server_default="bot_api"))
    op.add_column("telegram_post_logs", sa.Column("used_cached_media", sa.Boolean(), nullable=False, server_default=sa.false()))

    op.alter_column("telegram_media_cache", "movie_id", existing_type=sa.Integer(), nullable=True)
    op.add_column("telegram_media_cache", sa.Column("media_role", sa.String(length=50), nullable=False, server_default="other"))
    op.add_column("telegram_media_cache", sa.Column("storage_source", sa.String(length=20), nullable=False, server_default="local"))
    op.add_column("telegram_media_cache", sa.Column("local_file_path", sa.String(length=1000), nullable=True))
    op.add_column("telegram_media_cache", sa.Column("telegram_chat_id", sa.String(length=255), nullable=True))
    op.add_column("telegram_media_cache", sa.Column("telegram_message_id", sa.String(length=255), nullable=True))
    op.add_column("telegram_media_cache", sa.Column("telegram_file_unique_id", sa.String(length=255), nullable=True))
    op.add_column("telegram_media_cache", sa.Column("telegram_media_type", sa.String(length=50), nullable=True))
    op.add_column("telegram_media_cache", sa.Column("original_filename", sa.String(length=255), nullable=True))
    op.add_column("telegram_media_cache", sa.Column("mime_type", sa.String(length=255), nullable=True))
    op.add_column("telegram_media_cache", sa.Column("file_size", sa.Integer(), nullable=True))
    op.add_column("telegram_media_cache", sa.Column("public_url", sa.String(length=1000), nullable=True))
    op.add_column("telegram_media_cache", sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True))
    op.execute("UPDATE telegram_media_cache SET telegram_media_type = media_type WHERE telegram_media_type IS NULL")


def downgrade() -> None:
    op.drop_column("telegram_media_cache", "updated_at")
    op.drop_column("telegram_media_cache", "public_url")
    op.drop_column("telegram_media_cache", "file_size")
    op.drop_column("telegram_media_cache", "mime_type")
    op.drop_column("telegram_media_cache", "original_filename")
    op.drop_column("telegram_media_cache", "telegram_media_type")
    op.drop_column("telegram_media_cache", "telegram_file_unique_id")
    op.drop_column("telegram_media_cache", "telegram_message_id")
    op.drop_column("telegram_media_cache", "telegram_chat_id")
    op.drop_column("telegram_media_cache", "local_file_path")
    op.drop_column("telegram_media_cache", "storage_source")
    op.drop_column("telegram_media_cache", "media_role")
    op.alter_column("telegram_media_cache", "movie_id", existing_type=sa.Integer(), nullable=False)

    op.drop_column("telegram_post_logs", "used_cached_media")
    op.drop_column("telegram_post_logs", "send_mode")

    op.drop_column("telegram_settings", "telegram_storage_mode")
    op.drop_column("telegram_settings", "enable_telegram_storage")
    op.drop_column("telegram_settings", "private_channel_invite_link")
    op.drop_column("telegram_settings", "private_channel_title")
    op.drop_column("telegram_settings", "private_channel_username")
    op.drop_column("telegram_settings", "private_channel_id")
    op.drop_column("telegram_settings", "api_hash_encrypted")
    op.drop_column("telegram_settings", "api_id_encrypted")
