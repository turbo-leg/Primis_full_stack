#!/usr/bin/env python3
"""
Database initialization script for College Prep Platform
Creates tables and populates with initial data
"""

import sys
import os
import hashlib
from datetime import datetime, timedelta

# Add the project root to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.core.database import engine, SessionLocal, Base
from app.models.models import *
from app.core.security import get_password_hash

def simple_hash_password(password: str) -> str:
    """Simple password hashing for initialization - use same method as security module"""
    return get_password_hash(password)

def create_tables():
    """Create all database tables"""
    print("Creating database tables...")
    
    # Import models to ensure they're registered
    from app.models import models
    
    Base.metadata.create_all(bind=engine)
    print("✅ Tables created successfully!")

def create_test_users(db: Session):
    """Create test users for development"""
    print("Creating test users...")
    
    # Create admin user
    admin = Admin(
        name="Admin User",
        email="admin@demo.com",
        password=simple_hash_password("password123"),
        phone="1234567890",
        role="admin",
        permissions='{"all": true}'
    )
    db.add(admin)
    
    # Create teacher user
    teacher = Teacher(
        name="John Smith",
        email="teacher@demo.com",
        password=simple_hash_password("password123"),
        phone="1234567891",
        specialization="Mathematics",
        bio="Experienced mathematics teacher with 10+ years of experience",
        hire_date=datetime.now() - timedelta(days=365)
    )
    db.add(teacher)
    
    # Create student user
    student = Student(
        name="Jane Doe",
        email="student@demo.com",
        password=simple_hash_password("password123"),
        phone="1234567892",
        date_of_birth=datetime(2000, 1, 15),
        address="123 Student St, Learning City",
        emergency_contact="Parent Doe",
        emergency_phone="1234567893",
        parent_email="parent@demo.com",
        parent_phone="1234567893",
        qr_code="student_qr_code_placeholder"
    )
    db.add(student)
    
    # Create another student
    student2 = Student(
        name="Bob Wilson",
        email="student2@demo.com",
        password=simple_hash_password("password123"),
        phone="1234567894",
        date_of_birth=datetime(1999, 5, 20),
        address="456 Learning Ave, Study Town",
        emergency_contact="Guardian Wilson",
        emergency_phone="1234567895",
        parent_email="guardian@demo.com",
        parent_phone="1234567895",
        qr_code="student2_qr_code_placeholder"
    )
    db.add(student2)
    
    # Create parent
    parent = Parent(
        name="Parent Doe",
        email="parent@demo.com",
        phone="1234567893",
        address="123 Student St, Learning City",
        relationship_to_student="mother"
    )
    db.add(parent)
    
    db.commit()
    print("✅ Test users created successfully!")
    return admin, teacher, student, student2, parent

def create_test_courses(db: Session, admin, teacher):
    """Create test courses"""
    print("Creating test courses...")
    
    # Math course
    math_course = Course(
        title="Advanced Mathematics",
        description="Comprehensive mathematics course covering algebra, calculus, and statistics",
        start_time=datetime.now(),
        end_time=datetime.now() + timedelta(days=90),
        price=299.99,
        max_students=25,
        is_online=False,
        location="Room 101, Math Building",
        admin_id=admin.admin_id
    )
    db.add(math_course)
    
    # Science course
    science_course = Course(
        title="Physics Fundamentals",
        description="Introduction to physics concepts including mechanics, thermodynamics, and electromagnetism",
        start_time=datetime.now() + timedelta(days=7),
        end_time=datetime.now() + timedelta(days=97),
        price=349.99,
        max_students=20,
        is_online=True,
        location="Online Platform",
        admin_id=admin.admin_id
    )
    db.add(science_course)
    
    # English course
    english_course = Course(
        title="English Literature",
        description="Explore classic and modern literature while developing critical thinking and writing skills",
        start_time=datetime.now() + timedelta(days=14),
        end_time=datetime.now() + timedelta(days=104),
        price=249.99,
        max_students=30,
        is_online=False,
        location="Room 205, Literature Hall",
        admin_id=admin.admin_id
    )
    db.add(english_course)
    
    db.commit()
    
    # Associate teacher with courses
    math_course.teachers.append(teacher)
    science_course.teachers.append(teacher)
    english_course.teachers.append(teacher)
    
    db.commit()
    print("✅ Test courses created successfully!")
    return math_course, science_course, english_course

def create_test_enrollments(db: Session, student, student2, courses):
    """Create test enrollments"""
    print("Creating test enrollments...")
    
    math_course, science_course, english_course = courses
    
    # Enroll student 1 in math and science
    enrollment1 = Enrollment(
        student_id=student.student_id,
        course_id=math_course.course_id,
        paid=True,
        paid_date=datetime.now(),
        payment_due=datetime.now() + timedelta(days=30)
    )
    db.add(enrollment1)
    
    enrollment2 = Enrollment(
        student_id=student.student_id,
        course_id=science_course.course_id,
        paid=False,
        payment_due=datetime.now() + timedelta(days=7)
    )
    db.add(enrollment2)
    
    # Enroll student 2 in all courses
    enrollment3 = Enrollment(
        student_id=student2.student_id,
        course_id=math_course.course_id,
        paid=True,
        paid_date=datetime.now(),
        payment_due=datetime.now() + timedelta(days=30)
    )
    db.add(enrollment3)
    
    enrollment4 = Enrollment(
        student_id=student2.student_id,
        course_id=english_course.course_id,
        paid=True,
        paid_date=datetime.now(),
        payment_due=datetime.now() + timedelta(days=30)
    )
    db.add(enrollment4)
    
    db.commit()
    print("✅ Test enrollments created successfully!")

def create_test_materials(db: Session, courses):
    """Create test course materials"""
    print("Creating test materials...")
    
    math_course, science_course, english_course = courses
    
    # Math materials
    math_material1 = Material(
        course_id=math_course.course_id,
        title="Algebra Fundamentals",
        type="pdf",
        url="/materials/algebra_fundamentals.pdf",
        description="Basic algebra concepts and equations",
        is_public=True
    )
    db.add(math_material1)
    
    math_material2 = Material(
        course_id=math_course.course_id,
        title="Calculus Introduction Video",
        type="video",
        url="/materials/calculus_intro.mp4",
        description="Introduction to calculus concepts",
        is_public=False
    )
    db.add(math_material2)
    
    # Science materials
    science_material = Material(
        course_id=science_course.course_id,
        title="Physics Lab Manual",
        type="pdf",
        url="/materials/physics_lab_manual.pdf",
        description="Complete physics laboratory manual",
        is_public=True
    )
    db.add(science_material)
    
    # English materials
    english_material = Material(
        course_id=english_course.course_id,
        title="Shakespeare Analysis Guide",
        type="document",
        url="/materials/shakespeare_guide.docx",
        description="Guide to analyzing Shakespearean literature",
        is_public=True
    )
    db.add(english_material)
    
    db.commit()
    print("✅ Test materials created successfully!")

def create_test_announcements(db: Session, courses, teacher):
    """Create test announcements"""
    print("Creating test announcements...")
    
    math_course, science_course, english_course = courses
    
    # Math course announcement
    math_announcement = Announcement(
        course_id=math_course.course_id,
        title="Welcome to Advanced Mathematics!",
        content="Welcome to our Advanced Mathematics course. Please review the syllabus and complete the pre-assessment by next week.",
        posted_by_id=teacher.teacher_id,
        posted_by_type="teacher",
        is_important=True
    )
    db.add(math_announcement)
    
    # Science course announcement
    science_announcement = Announcement(
        course_id=science_course.course_id,
        title="Lab Safety Requirements",
        content="All students must complete the lab safety training before attending the first physics lab session.",
        posted_by_id=teacher.teacher_id,
        posted_by_type="teacher",
        is_important=True
    )
    db.add(science_announcement)
    
    # English course announcement
    english_announcement = Announcement(
        course_id=english_course.course_id,
        title="Reading Assignment",
        content="Please read chapters 1-3 of 'Romeo and Juliet' for next class. We will have a discussion on the themes.",
        posted_by_id=teacher.teacher_id,
        posted_by_type="teacher",
        is_important=False
    )
    db.add(english_announcement)
    
    db.commit()
    print("✅ Test announcements created successfully!")

def main():
    """Main initialization function"""
    print("🚀 Starting database initialization...")
    
    # Create tables
    try:
        create_tables()
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        return
    
    # Create session
    db = SessionLocal()
    
    try:
        # Check if admin already exists
        existing_admin = db.query(Admin).filter(Admin.email == "admin@demo.com").first()
        if existing_admin:
            print("⚠️  Test data already exists. Skipping data creation.")
            print("\n📋 Existing Test Accounts:")
            print("Admin: admin@demo.com / password123")
            print("Teacher: teacher@demo.com / password123")
            print("Student: student@demo.com / password123")
            print("Student 2: student2@demo.com / password123")
            print("Parent: parent@demo.com (no login access)")
            return
        
        # Create test data
        admin, teacher, student, student2, parent = create_test_users(db)
        # Create test courses - DISABLED to start with clean database
        # courses = create_test_courses(db, admin, teacher)
        # Create test enrollments - DISABLED (no courses to enroll in)
        # create_test_enrollments(db, student, student2, courses)
        # Create test materials - DISABLED (no courses to add materials to)
        # create_test_materials(db, courses)
        # Create test announcements - DISABLED (no courses to announce for)
        # create_test_announcements(db, courses, teacher)
        
        # Associate parent with student
        parent.students.append(student)
        db.commit()
        
        print("\n🎉 Database initialization completed successfully!")
        print("\n📋 Test Accounts Created:")
        print("Admin: admin@demo.com / password123")
        print("Teacher: teacher@demo.com / password123")
        print("Student: student@demo.com / password123")
        print("Student 2: student2@demo.com / password123")
        print("Parent: parent@demo.com (no login access)")
        print("\n📚 Sample Data Created:")
        print("- 3 courses (Math, Physics, English)")
        print("- Student enrollments")
        print("- Course materials")
        print("- Announcements")
        
    except Exception as e:
        print(f"❌ Error during initialization: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    main()