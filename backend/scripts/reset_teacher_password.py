#!/usr/bin/env python3
"""
Script to set/reset teacher password
"""
import sys
import os

# Add the app directory to the path
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine
from app.core.security import get_password_hash
from app.models.models import Teacher
from app.core.database import Base

def reset_teacher_password():
    """Reset teacher password"""
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    db: Session = SessionLocal()
    
    try:
        # Get teacher by email
        email = "teacher@demo.com"
        teacher = db.query(Teacher).filter(Teacher.email == email).first()
        
        if not teacher:
            print(f"Teacher with email {email} not found!")
            return
        
        # Set new password
        new_password = "teacher123"
        hashed_password = get_password_hash(new_password)
        teacher.password = hashed_password
        
        db.commit()
        
        print(f"✅ Teacher password reset successfully!")
        print(f"Email: {email}")
        print(f"Password: {new_password}")
        print(f"\nYou can now login with these credentials.")
        
    except Exception as e:
        print(f"❌ Error resetting password: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    reset_teacher_password()
