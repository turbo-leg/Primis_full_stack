"""
Add this endpoint temporarily to your backend auth.py file to generate QR codes
"""

@router.post("/admin/generate-qr-codes")
async def generate_qr_codes_for_students(
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["admin"]))
):
    """Generate QR codes for all students who don't have one (admin only)"""
    from app.utils.qr_generator import generate_qr_code
    
    # Find students without QR codes
    students_without_qr = db.query(Student).filter(
        (Student.qr_code == None) | (Student.qr_code == '')
    ).all()
    
    if not students_without_qr:
        return {
            "message": "All students already have QR codes",
            "count": 0
        }
    
    success_count = 0
    errors = []
    
    for student in students_without_qr:
        try:
            qr_code_url = generate_qr_code(f"student_{student.student_id}")
            student.qr_code = qr_code_url
            db.commit()
            success_count += 1
        except Exception as e:
            errors.append({
                "student_id": student.student_id,
                "name": student.name,
                "error": str(e)
            })
            db.rollback()
    
    return {
        "message": f"Generated QR codes for {success_count} students",
        "success_count": success_count,
        "total_processed": len(students_without_qr),
        "errors": errors
    }
