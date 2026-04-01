from logging.config import fileConfig
from logging import getLogger

import sys
import os

# add the project root directory to Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from alembic import command
from alembic.config import Config as BaseConfig
from sqlalchemy import create_engine

class Config(BaseConfig):
    """Configuration for Alembic."""
    sqlalchemy.url = os.getenv("SUPABASE_DB_URL") or os.getenv("DATABASE_URL")

# Interpret the config file for Python logging.
fileConfig(Config.config_file_name)

# add your model's MetaData object here for 'autogenerate' support
from app.db.database import Base
target_metadata = Base.metadata


if __name__ == "__main__":
    command.run()
