from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_
from typing import List, Optional
from datetime import datetime, timedelta

from app.core.database import get_db
from app.api.auth import get_current_user, require_role
from app.models.models import (
    Student, Teacher, Course, Enrollment, Assignment, 
    AssignmentSubmission, Material, Announcement
)

router = APIRouter()


@router.get("/{student_id}/enrollments")
async def get_student_enrollments(
    student_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get student's course enrollments"""
    try:
        # Check if current user can access this student's data
        user_type = current_user.get("user_type")
        current_user_id = current_user.get("sub")
        
        if user_type == "student" and str(student_id) != current_user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot access other student's data"
            )
        
        enrollments = db.query(Enrollment).join(
            Course, Enrollment.course_id == Course.course_id
        ).filter(Enrollment.student_id == student_id).all()
        
        result = []
        for enrollment in enrollments:
            # Get teacher info
            teacher = db.query(Teacher).filter(Teacher.teacher_id == enrollment.course.admin_id).first()
            
            result.append({
                "enrollment_id": enrollment.enrollment_id,
                "course": {
                    "course_id": enrollment.course.course_id,
                    "title": enrollment.course.title,
                    "description": enrollment.course.description,
                    "start_time": enrollment.course.start_time.isoformat(),
                    "end_time": enrollment.course.end_time.isoformat(),
                    "is_online": enrollment.course.is_online,
                    "location": enrollment.course.location,
                    "status": enrollment.course.status,
                    "teacher_name": teacher.name if teacher else "Not assigned"
                },
                "paid": enrollment.paid,
                "payment_due": enrollment.payment_due.isoformat() if enrollment.payment_due is not None else None,
                "status": enrollment.status,
                "amount": float(enrollment.course.price)
            })
        
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching student enrollments: {str(e)}"
        )


@router.get("/{student_id}/assignments")
async def get_student_assignments(
    student_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get student's assignments across all courses"""
    try:
        # Check permissions
        user_type = current_user.get("user_type")
        current_user_id = current_user.get("sub")
        
        if user_type == "student" and str(student_id) != current_user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot access other student's data"
            )
        
        # Get student's enrolled courses
        enrolled_course_ids = [e.course_id for e in db.query(Enrollment.course_id).filter(
            Enrollment.student_id == student_id
        ).all()]
        
        # Get assignments for those courses
        assignments = db.query(Assignment).join(
            Course, Assignment.course_id == Course.course_id
        ).filter(Assignment.course_id.in_(enrolled_course_ids)).order_by(
            desc(Assignment.due_date)
        ).all()
        
        result = []
        for assignment in assignments:
            # Get submission status
            submission = db.query(AssignmentSubmission).filter(
                and_(
                    AssignmentSubmission.assignment_id == assignment.assignment_id,
                    AssignmentSubmission.student_id == student_id
                )
            ).first()
            
            submission_status = "pending"
            grade = None
            if submission:
                submission_status = "submitted"
                grade = submission.grade
            else:
                # Check if assignment is overdue
                now = datetime.now()
                due_date = getattr(assignment, 'due_date', None)
                if due_date is not None and due_date < now:
                    submission_status = "overdue"
            
            result.append({
                "assignment_id": assignment.assignment_id,
                "course_id": assignment.course_id,
                "title": assignment.title,
                "description": assignment.description,
                "due_date": assignment.due_date.isoformat(),
                "max_points": assignment.max_points,
                "course_title": assignment.course.title,
                "submission_status": submission_status,
                "grade": grade
            })
        
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching student assignments: {str(e)}"
        )


@router.get("/assignments/upcoming")
async def get_upcoming_assignments(
    current_user=Depends(require_role(["student"])),
    db: Session = Depends(get_db)
):
    """Get upcoming assignments for the current student"""
    try:
        student_id = int(current_user.get("sub"))
        
        # Get student's enrolled courses
        enrolled_course_ids = [e.course_id for e in db.query(Enrollment.course_id).filter(
            Enrollment.student_id == student_id
        ).all()]
        
        # Get upcoming assignments (next 30 days)
        upcoming_date = datetime.now() + timedelta(days=30)
        assignments = db.query(Assignment).join(
            Course, Assignment.course_id == Course.course_id
        ).filter(
            and_(
                Assignment.course_id.in_(enrolled_course_ids),
                Assignment.due_date >= datetime.now(),
                Assignment.due_date <= upcoming_date
            )
        ).order_by(Assignment.due_date).all()
        
        result = []
        for assignment in assignments:
            # Check if already submitted
            submission = db.query(AssignmentSubmission).filter(
                and_(
                    AssignmentSubmission.assignment_id == assignment.assignment_id,
                    AssignmentSubmission.student_id == student_id
                )
            ).first()
            
            if not submission:  # Only include if not submitted
                result.append({
                    "assignment_id": assignment.assignment_id,
                    "course_id": assignment.course_id,
                    "title": assignment.title,
                    "description": assignment.description,
                    "due_date": assignment.due_date.isoformat(),
                    "max_points": assignment.max_points,
                    "course_title": assignment.course.title
                })
        
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching upcoming assignments: {str(e)}"
        )


@router.get("/materials/recent")
async def get_recent_materials(
    limit: int = Query(10, ge=1, le=50),
    current_user=Depends(require_role(["student"])),
    db: Session = Depends(get_db)
):
    """Get recent materials for the current student"""
    try:
        student_id = int(current_user.get("sub"))
        
        # Get student's enrolled courses
        enrolled_course_ids = [e.course_id for e in db.query(Enrollment.course_id).filter(
            Enrollment.student_id == student_id
        ).all()]
        
        # Get recent materials from enrolled courses
        materials = db.query(Material).join(
            Course, Material.course_id == Course.course_id
        ).filter(
            and_(
                Material.course_id.in_(enrolled_course_ids),
                Material.is_public == True
            )
        ).order_by(desc(Material.upload_date)).limit(limit).all()
        
        result = []
        for material in materials:
            result.append({
                "material_id": material.material_id,
                "course_id": material.course_id,
                "title": material.title,
                "type": material.type,
                "url": material.url,
                "description": material.description,
                "upload_date": material.upload_date.isoformat(),
                "course_title": material.course.title
            })
        
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching recent materials: {str(e)}"
        )