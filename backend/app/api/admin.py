from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Optional
from datetime import datetime, timedelta

from app.core.database import get_db
from app.api.auth import get_current_user, require_role
from app.models.models import Student, Teacher, Admin, Course, Enrollment, Attendance
from app.api.schemas import (
    StudentResponse, TeacherResponse, AdminResponse
)

router = APIRouter()


@router.get("/stats")
async def get_admin_stats(
    current_user=Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """Get comprehensive admin dashboard statistics"""
    try:
        # Count totals - these should work
        total_students = db.query(Student).count()
        total_teachers = db.query(Teacher).count()
        total_courses = db.query(Course).count()
        
        # Count active enrollments
        active_enrollments = db.query(Enrollment).filter(
            Enrollment.status == "active"
        ).count()
        
        # Count pending payments - simplified
        pending_payments = db.query(Enrollment).filter(
            Enrollment.paid == False
        ).count()
        
        # Simplified revenue calculation to avoid complex joins for now
        total_revenue = 0.0  # Will implement later when basic stats work
        monthly_revenue = 0.0  # Will implement later when basic stats work
        
        # Simplified attendance calculation
        avg_attendance = 85.0  # Mock value for now
        
        return {
            "totalStudents": total_students,
            "totalTeachers": total_teachers,
            "totalCourses": total_courses,
            "totalRevenue": total_revenue,
            "activeEnrollments": active_enrollments,
            "pendingPayments": pending_payments,
            "monthlyRevenue": monthly_revenue,
            "averageAttendance": avg_attendance
        }
    except Exception as e:
        print(f"Admin stats error: {e}")  # Log to console for debugging
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching admin stats: {str(e)}"
        )


@router.get("/users/recent", response_model=List[dict])
async def get_recent_users(
    limit: int = Query(10, ge=1, le=50),
    current_user=Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """Get recently registered users across all types"""
    try:
        # Get recent students
        recent_students = db.query(Student).order_by(desc(Student.created_at)).limit(limit//3).all()
        # Get recent teachers
        recent_teachers = db.query(Teacher).order_by(desc(Teacher.created_at)).limit(limit//3).all()
        # Get recent admins
        recent_admins = db.query(Admin).order_by(desc(Admin.created_at)).limit(limit//3).all()
        
        users = []
        
        # Format students
        for student in recent_students:
            users.append({
                "id": student.student_id,
                "name": student.name,
                "email": student.email,
                "user_type": "student",
                "is_active": student.is_active,
                "created_at": student.created_at.isoformat(),
                "last_login": None  # TODO: Implement last login tracking
            })
        
        # Format teachers
        for teacher in recent_teachers:
            users.append({
                "id": teacher.teacher_id,
                "name": teacher.name,
                "email": teacher.email,
                "user_type": "teacher",
                "is_active": teacher.is_active,
                "created_at": teacher.created_at.isoformat(),
                "last_login": None  # TODO: Implement last login tracking
            })
        
        # Format admins
        for admin in recent_admins:
            users.append({
                "id": admin.admin_id,
                "name": admin.name,
                "email": admin.email,
                "user_type": "admin",
                "is_active": admin.is_active,
                "created_at": admin.created_at.isoformat(),
                "last_login": None  # TODO: Implement last login tracking
            })
        
        # Sort by created_at descending
        users.sort(key=lambda x: x["created_at"], reverse=True)
        
        return users[:limit]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching recent users: {str(e)}"
        )


@router.get("/payments/pending")
async def get_pending_payments(
    limit: int = Query(20, ge=1, le=100),
    current_user=Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """Get pending payments"""
    try:
        pending_enrollments = db.query(Enrollment).join(
            Student, Enrollment.student_id == Student.student_id
        ).join(
            Course, Enrollment.course_id == Course.course_id
        ).filter(
            Enrollment.paid == False
        ).order_by(desc(Enrollment.payment_due)).limit(limit).all()
        
        payments = []
        for enrollment in pending_enrollments:
            payments.append({
                "enrollment_id": enrollment.enrollment_id,
                "student_name": enrollment.student.name,
                "course_title": enrollment.course.title,
                "paid": enrollment.paid,
                "payment_due": enrollment.payment_due.isoformat() if enrollment.payment_due is not None else None,
                "enrollment_date": enrollment.enrollment_date.isoformat(),
                "status": enrollment.status,
                "amount": float(enrollment.course.price)
            })
        
        return payments
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching pending payments: {str(e)}"
        )


@router.get("/activity/recent")
async def get_recent_activity(
    limit: int = Query(20, ge=1, le=100),
    current_user=Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """Get recent platform activity"""
    try:
        activities = []
        
        # Recent enrollments
        recent_enrollments = db.query(Enrollment).join(
            Student, Enrollment.student_id == Student.student_id
        ).join(
            Course, Enrollment.course_id == Course.course_id
        ).order_by(desc(Enrollment.enrollment_date)).limit(5).all()
        
        for enrollment in recent_enrollments:
            activities.append({
                "id": f"enrollment_{enrollment.enrollment_id}",
                "type": "enrollment",
                "description": f"New student enrolled in {enrollment.course.title}",
                "timestamp": enrollment.enrollment_date.isoformat(),
                "user_name": enrollment.student.name
            })
        
        # Recent courses
        recent_courses = db.query(Course).order_by(desc(Course.created_at)).limit(3).all()
        
        for course in recent_courses:
            activities.append({
                "id": f"course_{course.course_id}",
                "type": "course_created",
                "description": f"New course '{course.title}' created",
                "timestamp": course.created_at.isoformat(),
                "user_name": "System"
            })
        
        # Sort by timestamp descending
        activities.sort(key=lambda x: x["timestamp"], reverse=True)
        
        return activities[:limit]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching recent activity: {str(e)}"
        )