from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.api.auth import get_current_user, require_role
from app.models.models import Parent, Student

router = APIRouter()


@router.get("/{parent_id}/children")
async def get_parent_children(
    parent_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get children associated with a parent"""
    try:
        # Check if current user can access this parent's data
        user_type = current_user.get("user_type")
        current_user_id = current_user.get("sub")
        
        if user_type == "parent" and str(parent_id) != current_user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot access other parent's data"
            )
        
        # For now, we'll use a simple relationship where parents and students
        # are connected through a naming convention or similar logic
        # In a real system, you would have a parent_student_relationship table
        
        # Get parent info
        parent = db.query(Parent).filter(Parent.parent_id == parent_id).first()
        if not parent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent not found"
            )
        
        # For demo purposes, we'll assume the parent with the email pattern
        # can access students with similar names or emails
        # In production, you'd have a proper relationship table
        children = []
        
        # Simple demo logic: if parent email contains "johnson", 
        # they can see students with "johnson" in their details
        if "johnson" in parent.email.lower():
            students = db.query(Student).filter(
                Student.name.ilike("%johnson%")
            ).all()
            
            for student in students:
                children.append({
                    "student_id": student.student_id,
                    "name": student.name,
                    "email": student.email,
                    "phone": student.phone,
                    "date_of_birth": student.date_of_birth.isoformat() if student.date_of_birth is not None else None,
                    "address": student.address,
                    "qr_code": student.qr_code
                })
        
        return children
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching parent's children: {str(e)}"
        )