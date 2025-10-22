#!/usr/bin/env python3
"""
Script to create test users for all roles
"""
import sys
import os

# Add the app directory to the path
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine
from app.core.security import get_password_hash
from app.models.models import Admin, Teacher, Student, Parent
from app.core.database import Base

def create_test_users():
    """Create test users for all roles"""
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    db: Session = SessionLocal()
    
    try:
        password_hash = get_password_hash("password123")
        
        # Create Admin if doesn't exist
        existing_admin = db.query(Admin).filter(Admin.email == "admin@gmail.com").first()
        if not existing_admin:
            admin = Admin(
                name="Admin User",
                email="admin@gmail.com",
                password=password_hash,
                role="super_admin",
                permissions='{"all": true}'
            )
            db.add(admin)
            print("✓ Created admin: admin@gmail.com")
        else:
            print("✓ Admin already exists: admin@gmail.com")
        
        # Create Teacher if doesn't exist
        existing_teacher = db.query(Teacher).filter(Teacher.email == "teacher@gmail.com").first()
        if not existing_teacher:
            teacher = Teacher(
                name="Teacher User",
                email="teacher@gmail.com",
                password=password_hash,
                phone="1234567890",
                specialization="Mathematics"
            )
            db.add(teacher)
            print("✓ Created teacher: teacher@gmail.com")
        else:
            print("✓ Teacher already exists: teacher@gmail.com")
        
        # Create Student if doesn't exist
        existing_student = db.query(Student).filter(Student.email == "student@gmail.com").first()
        if not existing_student:
            student = Student(
                name="Student User",
                email="student@gmail.com",
                password=password_hash,
                phone="0987654321",
                parent_email="parent@gmail.com",
                parent_phone="5555555555"
            )
            db.add(student)
            print("✓ Created student: student@gmail.com")
        else:
            print("✓ Student already exists: student@gmail.com")
        
        # Create Parent if doesn't exist
        existing_parent = db.query(Parent).filter(Parent.email == "parent@gmail.com").first()
        if not existing_parent:
            parent = Parent(
                name="Parent User",
                email="parent@gmail.com",
                phone="5555555555"
            )
            db.add(parent)
            print("✓ Created parent: parent@gmail.com")
        else:
            print("✓ Parent already exists: parent@gmail.com")
        
        db.commit()
        print("\n✅ All test users created/verified successfully!")
        print("\nLogin credentials for all users:")
        print("  Admin:   admin@gmail.com / password123")
        print("  Teacher: teacher@gmail.com / password123")
        print("  Student: student@gmail.com / password123")
        print("  Parent:  parent@gmail.com / password123")
        
    except Exception as e:
        print(f"❌ Error creating test users: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_test_users()
