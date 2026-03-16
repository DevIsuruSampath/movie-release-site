from logging.config import fileConfig
from logging import getLogger
from sqlalchemy import engine_from_config, pool
from alembic import context
import sys
import os

# Add the project root directory to Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

# this is the Alembic Config object
from alembic.config import Config as BaseConfig
from sqlalchemy import create_engine

class Config(BaseConfig):
    # Override the sqlalchemy.url from alembic.ini with environment variable
    sqlalchemy.url = os.getenv("DATABASE_URL")

# Interpret the config file for Python logging.
fileConfig(Config.config_file_name)

# add your model's MetaData object here for 'autogenerate' support
from app.db.database import Base
target_metadata = Base.metadata


def run_migrations_offline():
    """Run migrations in 'offline' mode."""
    context.configure(
        url=Config.sqlalchemy.url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    """Run migrations in 'online' mode."""
    configuration = Config()
    configuration.connectable = engine_from_config(
        configuration.get_section(configuration.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    context.configure(
        connection=configuration.connectable,
        target_metadata=target_metadata,
    )

    try:
        with context.begin_transaction():
            context.run_migrations()
    except Exception as e:
        context.rollback()
        raise e
