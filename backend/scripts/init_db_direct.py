#!/usr/bin/env python3
"""
Direct database initialization script.
Creates all tables using SQLAlchemy models directly without Alembic.
This is useful when migrations are having issues.
"""

import os
import sys
from pathlib import Path

# Add the parent directory to the path so we can import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv
from sqlalchemy import create_engine
from app.models.models import Base as BaseModels
from app.models.notification_models import Base as NotificationBase

# Load environment variables
load_dotenv()

def init_database():
    """Initialize database by creating all tables."""
    try:
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            print("❌ DATABASE_URL environment variable not set")
            return False
        
        print(f"📡 Connecting to database...")
        engine = create_engine(database_url, echo=False)
        
        print("🔨 Creating tables from models...")
        # Create all tables from models
        BaseModels.metadata.create_all(engine)
        NotificationBase.metadata.create_all(engine)
        
        print("✅ Database initialized successfully!")
        print(f"📊 Tables created from models")
        
        engine.dispose()
        return True
        
    except Exception as e:
        print(f"❌ Error initializing database: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = init_database()
    sys.exit(0 if success else 1)
