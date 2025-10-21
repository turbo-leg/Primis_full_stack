#!/usr/bin/env python3
"""
Manual script to run Alembic migrations.
This script connects to the database and runs all pending migrations.
"""

import os
import sys
from pathlib import Path

# Add the parent directory to the path so we can import alembic
sys.path.insert(0, str(Path(__file__).parent.parent))

from alembic import command
from alembic.config import Config
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def run_migrations():
    """Run all pending migrations."""
    try:
        # Get the alembic directory path
        alembic_cfg_path = Path(__file__).parent.parent / "alembic.ini"
        
        if not alembic_cfg_path.exists():
            print(f"❌ alembic.ini not found at {alembic_cfg_path}")
            return False
        
        # Configure Alembic
        alembic_cfg = Config(str(alembic_cfg_path))
        
        # Set the sqlalchemy.url from environment variable
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            print("❌ DATABASE_URL environment variable not set")
            return False
        
        print(f"📡 Connecting to database...")
        alembic_cfg.set_main_option("sqlalchemy.url", database_url)
        
        # Run migrations - use 'heads' to handle multiple heads
        print("🚀 Running migrations...")
        try:
            command.upgrade(alembic_cfg, "heads")
        except Exception as e:
            # If heads fails, try 'head'
            if "Multiple head revisions" in str(e) or "overlaps" in str(e):
                print("⚠️  Multiple heads detected, attempting to resolve...")
                command.upgrade(alembic_cfg, "head")
            else:
                raise
        
        print("✅ Migrations completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error running migrations: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = run_migrations()
    sys.exit(0 if success else 1)
