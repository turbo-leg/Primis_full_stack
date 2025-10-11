#!/usr/bin/env python3
"""
Script to create the first admin user
"""
import asyncio
import sys
import os

# Add the app directory to the path
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine
from app.core.security import get_password_hash
from app.models.models import Admin
from app.core.database import Base

def create_admin():
    """Create the first admin user"""
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    db: Session = SessionLocal()
    
    try:
        # Check if admin already exists
        existing_admin = db.query(Admin).first()
        if existing_admin:
            print("Admin user already exists!")
            return
        
        # Get admin details
        name = input("Enter admin name: ")
        email = input("Enter admin email: ")
        password = input("Enter admin password: ")
        
        # Create admin
        hashed_password = get_password_hash(password)
        admin = Admin(
            name=name,
            email=email,
            password=hashed_password,
            role="super_admin",
            permissions='{"all": true}'
        )
        
        db.add(admin)
        db.commit()
        db.refresh(admin)
        
        print(f"Admin user created successfully!")
        print(f"Admin ID: {admin.admin_id}")
        print(f"Name: {admin.name}")
        print(f"Email: {admin.email}")
        
    except Exception as e:
        print(f"Error creating admin: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_admin()