"""admin system schema refresh

Revision ID: 20260319_000001
Revises:
Create Date: 2026-03-19 00:00:01
"""

from alembic import op
import sqlalchemy as sa


revision = "20260319_000001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("is_admin", sa.Boolean(), nullable=False, server_default=sa.false()))

    op.add_column("categories", sa.Column("image_url", sa.String(length=500), nullable=True))
    op.add_column("categories", sa.Column("meta_title", sa.String(length=255), nullable=True))
    op.add_column("categories", sa.Column("meta_description", sa.String(length=500), nullable=True))
    op.add_column("categories", sa.Column("meta_keywords", sa.String(length=500), nullable=True))
    op.add_column("categories", sa.Column("canonical_url", sa.String(length=500), nullable=True))
    op.add_column("categories", sa.Column("og_image", sa.String(length=500), nullable=True))
    op.add_column("categories", sa.Column("robots", sa.String(length=100), nullable=True, server_default="index,follow"))
    op.add_column("categories", sa.Column("schema_markup", sa.Text(), nullable=True))
    op.add_column("categories", sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True))

    op.add_column("tags", sa.Column("description", sa.Text(), nullable=True))
    op.add_column("tags", sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True))

    op.add_column("movies", sa.Column("quality", sa.String(length=50), nullable=True))
    op.add_column("movies", sa.Column("is_published", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("movies", sa.Column("robots", sa.String(length=100), nullable=True, server_default="index,follow"))
    op.add_column("movies", sa.Column("schema_markup", sa.Text(), nullable=True))
    op.alter_column("movies", "updated_at", existing_type=sa.DateTime(timezone=True), nullable=True, existing_nullable=True, server_default=sa.func.now())

    op.add_column("stream_links", sa.Column("server_name", sa.String(length=100), nullable=True))
    op.add_column("stream_links", sa.Column("quality", sa.String(length=50), nullable=True))
    op.add_column("stream_links", sa.Column("language", sa.String(length=50), nullable=True))
    op.add_column("stream_links", sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True))

    op.add_column("download_links", sa.Column("provider", sa.String(length=100), nullable=True))
    op.add_column("download_links", sa.Column("size", sa.String(length=50), nullable=True))
    op.add_column("download_links", sa.Column("language", sa.String(length=50), nullable=True))
    op.add_column("download_links", sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True))

    op.add_column("subtitles", sa.Column("label", sa.String(length=100), nullable=True))
    op.add_column("subtitles", sa.Column("file_url", sa.String(length=500), nullable=True))
    op.add_column("subtitles", sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True))

    op.execute("UPDATE users SET is_admin = is_superuser")
    op.execute("UPDATE movies SET is_published = CASE WHEN status = 'published' THEN true ELSE false END")
    op.execute("UPDATE stream_links SET server_name = COALESCE(title, 'Primary')")
    op.execute("UPDATE download_links SET provider = COALESCE(title, 'Direct'), size = file_size")
    op.execute("UPDATE subtitles SET label = COALESCE(language, 'Subtitle'), file_url = url")

    op.alter_column("stream_links", "server_name", existing_type=sa.String(length=100), nullable=False)
    op.alter_column("download_links", "provider", existing_type=sa.String(length=100), nullable=False)
    op.alter_column("subtitles", "label", existing_type=sa.String(length=100), nullable=False)
    op.alter_column("subtitles", "file_url", existing_type=sa.String(length=500), nullable=False)


def downgrade() -> None:
    op.drop_column("subtitles", "updated_at")
    op.drop_column("subtitles", "file_url")
    op.drop_column("subtitles", "label")
    op.drop_column("download_links", "updated_at")
    op.drop_column("download_links", "language")
    op.drop_column("download_links", "size")
    op.drop_column("download_links", "provider")
    op.drop_column("stream_links", "updated_at")
    op.drop_column("stream_links", "language")
    op.drop_column("stream_links", "quality")
    op.drop_column("stream_links", "server_name")
    op.drop_column("movies", "schema_markup")
    op.drop_column("movies", "robots")
    op.drop_column("movies", "is_published")
    op.drop_column("movies", "quality")
    op.drop_column("tags", "updated_at")
    op.drop_column("tags", "description")
    op.drop_column("categories", "updated_at")
    op.drop_column("categories", "schema_markup")
    op.drop_column("categories", "robots")
    op.drop_column("categories", "og_image")
    op.drop_column("categories", "canonical_url")
    op.drop_column("categories", "meta_keywords")
    op.drop_column("categories", "meta_description")
    op.drop_column("categories", "meta_title")
    op.drop_column("categories", "image_url")
    op.drop_column("users", "is_admin")
