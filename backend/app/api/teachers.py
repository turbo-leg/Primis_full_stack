from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_, func
from typing import List, Optional
from datetime import datetime, timedelta

from app.core.database import get_db
from app.api.auth import get_current_user, require_role
from app.models.models import (
    Teacher, Student, Course, Enrollment, Assignment, 
    AssignmentSubmission, Attendance
)

router = APIRouter()


@router.get("/courses")
async def get_teacher_courses(
    current_user=Depends(require_role(["teacher"])),
    db: Session = Depends(get_db)
):
    """Get courses assigned to the current teacher"""
    try:
        teacher_id = int(current_user.get("sub"))
        
        courses = db.query(Course).filter(Course.admin_id == teacher_id).all()
        
        result = []
        for course in courses:
            # Count enrolled students
            enrolled_count = db.query(Enrollment).filter(
                Enrollment.course_id == course.course_id
            ).count()
            
            result.append({
                "course_id": course.course_id,
                "title": course.title,
                "description": course.description,
                "start_time": course.start_time.isoformat(),
                "end_time": course.end_time.isoformat(),
                "price": course.price,
                "max_students": course.max_students,
                "enrolled_count": enrolled_count,
                "is_online": course.is_online,
                "location": course.location,
                "status": course.status,
                "created_at": course.created_at.isoformat()
            })
        
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching teacher courses: {str(e)}"
        )


@router.get("/students")
async def get_teacher_students(
    current_user=Depends(require_role(["teacher"])),
    db: Session = Depends(get_db)
):
    """Get all students enrolled in the teacher's courses"""
    try:
        teacher_id = int(current_user.get("sub"))
        
        # Get all students from teacher's courses
        students = db.query(Student).join(
            Enrollment, Student.student_id == Enrollment.student_id
        ).join(
            Course, Enrollment.course_id == Course.course_id
        ).filter(Course.admin_id == teacher_id).distinct().all()
        
        result = []
        for student in students:
            # Calculate attendance rate for this student across teacher's courses
            total_classes = db.query(Attendance).join(
                Course, Attendance.course_id == Course.course_id
            ).filter(
                and_(
                    Attendance.student_id == student.student_id,
                    Course.admin_id == teacher_id
                )
            ).count()
            
            present_classes = db.query(Attendance).join(
                Course, Attendance.course_id == Course.course_id
            ).filter(
                and_(
                    Attendance.student_id == student.student_id,
                    Course.admin_id == teacher_id,
                    Attendance.status == 'present'
                )
            ).count()
            
            attendance_rate = (present_classes / total_classes * 100) if total_classes > 0 else 0
            
            result.append({
                "student_id": student.student_id,
                "name": student.name,
                "email": student.email,
                "phone": student.phone,
                "attendance_rate": round(attendance_rate, 1),
                "last_login": None  # TODO: Implement last login tracking
            })
        
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching teacher students: {str(e)}"
        )


@router.get("/attendance/recent")
async def get_teacher_recent_attendance(
    limit: int = Query(20, ge=1, le=100),
    current_user=Depends(require_role(["teacher"])),
    db: Session = Depends(get_db)
):
    """Get recent attendance records for teacher's courses"""
    try:
        teacher_id = int(current_user.get("sub"))
        
        attendance_records = db.query(Attendance).join(
            Course, Attendance.course_id == Course.course_id
        ).join(
            Student, Attendance.student_id == Student.student_id
        ).filter(Course.admin_id == teacher_id).order_by(
            desc(Attendance.attendance_date)
        ).limit(limit).all()
        
        result = []
        for record in attendance_records:
            result.append({
                "attendance_id": record.attendance_id,
                "student_id": record.student_id,
                "course_id": record.course_id,
                "attendance_date": record.attendance_date.isoformat(),
                "status": record.status,
                "student_name": record.student.name,
                "course_title": record.course.title
            })
        
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching recent attendance: {str(e)}"
        )


@router.get("/assignments")
async def get_teacher_assignments(
    current_user=Depends(require_role(["teacher"])),
    db: Session = Depends(get_db)
):
    """Get all assignments for teacher's courses"""
    try:
        teacher_id = int(current_user.get("sub"))
        
        assignments = db.query(Assignment).join(
            Course, Assignment.course_id == Course.course_id
        ).filter(Course.admin_id == teacher_id).order_by(
            desc(Assignment.due_date)
        ).all()
        
        result = []
        for assignment in assignments:
            # Count submissions
            submissions_count = db.query(AssignmentSubmission).filter(
                AssignmentSubmission.assignment_id == assignment.assignment_id
            ).count()
            
            result.append({
                "assignment_id": assignment.assignment_id,
                "course_id": assignment.course_id,
                "title": assignment.title,
                "description": assignment.description,
                "due_date": assignment.due_date.isoformat(),
                "max_points": assignment.max_points,
                "course_title": assignment.course.title,
                "submissions_count": submissions_count
            })
        
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching teacher assignments: {str(e)}"
        )