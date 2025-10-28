"""
Script to generate QR codes for existing students who don't have one
Run this script to add QR codes to students created before the QR feature was implemented
"""
import sys
import os

# Add the parent directory to the path to import app modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine
from app.models.models import Student
from app.utils.qr_generator import generate_qr_code


def generate_missing_qr_codes():
    """Generate QR codes for students who don't have one"""
    db: Session = SessionLocal()
    
    try:
        # Find all students without QR codes
        students_without_qr = db.query(Student).filter(
            (Student.qr_code == None) | (Student.qr_code == '')
        ).all()
        
        if not students_without_qr:
            print("✅ All students already have QR codes!")
            return
        
        print(f"Found {len(students_without_qr)} students without QR codes")
        print("Generating QR codes...\n")
        
        success_count = 0
        error_count = 0
        
        for student in students_without_qr:
            try:
                print(f"Generating QR code for student: {student.name} (ID: {student.student_id})")
                qr_code_url = generate_qr_code(f"student_{student.student_id}")
                
                # Update student with QR code
                student.qr_code = qr_code_url
                db.commit()
                
                print(f"  ✅ QR code generated: {qr_code_url}\n")
                success_count += 1
                
            except Exception as e:
                print(f"  ❌ Error generating QR code for student {student.student_id}: {str(e)}\n")
                error_count += 1
                db.rollback()
        
        print("\n" + "="*60)
        print(f"✅ Successfully generated QR codes for {success_count} students")
        if error_count > 0:
            print(f"❌ Failed to generate {error_count} QR codes")
        print("="*60)
        
    except Exception as e:
        print(f"❌ Fatal error: {str(e)}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    print("="*60)
    print("QR Code Generator for Existing Students")
    print("="*60)
    print()
    
    generate_missing_qr_codes()
