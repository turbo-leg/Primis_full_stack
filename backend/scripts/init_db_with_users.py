#!/usr/bin/env python3
"""
Initialize database with tables and default users.
This script:
1. Creates all tables from SQLAlchemy models
2. Adds default admin, teacher, and student users
"""

import os
import sys
from pathlib import Path
from datetime import datetime, timezone

# Add the parent directory to the path so we can import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.models import Base as BaseModels, Admin, Teacher, Student, Parent
from app.models.notification_models import Base as NotificationBase
from app.core.security import get_password_hash

# Load environment variables
load_dotenv()

def init_database():
    """Initialize database with tables and default data."""
    try:
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            print("❌ DATABASE_URL environment variable not set")
            return False
        
        print("📡 Connecting to database...")
        engine = create_engine(database_url, echo=False)
        
        print("🔨 Creating tables from models...")
        # Create all tables from models
        BaseModels.metadata.create_all(engine)
        NotificationBase.metadata.create_all(engine)
        
        print("✅ Tables created successfully!")
        
        # Create session
        Session = sessionmaker(bind=engine)
        session = Session()
        
        try:
            print("\n👤 Adding default users...")
            
            # Check if users already exist
            admin_exists = session.query(Admin).filter_by(email="admin@primis.edu").first()
            teacher_exists = session.query(Teacher).filter_by(email="teacher@primis.edu").first()
            student_exists = session.query(Student).filter_by(email="student@primis.edu").first()
            
            # Add default admin
            if not admin_exists:
                admin = Admin(
                    name="Admin User",
                    email="admin@primis.edu",
                    password=get_password_hash("admin123"),
                    phone="+1234567890",
                    role="admin",
                    is_active=True,
                    created_at=datetime.now(timezone.utc),
                    updated_at=datetime.now(timezone.utc)
                )
                session.add(admin)
                print("  ✓ Default admin user created")
                print("    Email: admin@primis.edu")
                print("    Password: admin123")
            else:
                print("  ℹ Admin user already exists")
            
            # Add default teacher
            if not teacher_exists:
                teacher = Teacher(
                    name="Teacher User",
                    email="teacher@primis.edu",
                    password=get_password_hash("teacher123"),
                    phone="+1234567891",
                    specialization="General Education",
                    is_active=True,
                    created_at=datetime.now(timezone.utc),
                    updated_at=datetime.now(timezone.utc)
                )
                session.add(teacher)
                print("  ✓ Default teacher user created")
                print("    Email: teacher@primis.edu")
                print("    Password: teacher123")
            else:
                print("  ℹ Teacher user already exists")
            
            # Add default student
            if not student_exists:
                student = Student(
                    name="Student User",
                    email="student@primis.edu",
                    password=get_password_hash("student123"),
                    phone="+1234567892",
                    parent_email="parent@primis.edu",
                    parent_phone="+1234567893",
                    is_active=True,
                    created_at=datetime.now(timezone.utc),
                    updated_at=datetime.now(timezone.utc)
                )
                session.add(student)
                print("  ✓ Default student user created")
                print("    Email: student@primis.edu")
                print("    Password: student123")
            else:
                print("  ℹ Student user already exists")
            
            # Commit all changes
            session.commit()
            print("\n✅ Database initialization completed successfully!")
            print("\n📋 Summary:")
            print("   Tables: Created")
            print("   Default Users: Added")
            print("\n🚀 You can now login with any of the default users above")
            
            return True
            
        except Exception as e:
            session.rollback()
            print(f"❌ Error adding default users: {e}")
            import traceback
            traceback.print_exc()
            return False
        finally:
            session.close()
            engine.dispose()
        
    except Exception as e:
        print(f"❌ Error initializing database: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = init_database()
    sys.exit(0 if success else 1)
