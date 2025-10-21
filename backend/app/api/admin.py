from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Optional
from datetime import datetime, timedelta

from app.core.database import get_db
from app.api.auth import get_current_user, require_role
from app.models.models import Student, Teacher, Admin, Course, Enrollment, Attendance, Payment
from app.api.schemas import (
    StudentResponse, TeacherResponse, AdminResponse
)

router = APIRouter()


@router.get("/stats")
async def get_admin_stats(
    current_user=Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """Get comprehensive admin dashboard statistics from database"""
    try:
        # Count totals
        total_students = db.query(Student).filter(Student.is_active == True).count()
        total_teachers = db.query(Teacher).filter(Teacher.is_active == True).count()
        total_courses = db.query(Course).filter(Course.status == "active").count()
        
        # Count active enrollments
        active_enrollments = db.query(Enrollment).filter(
            Enrollment.status == "active"
        ).count()
        
        # Count pending payments (unpaid enrollments)
        pending_payments = db.query(Enrollment).filter(
            Enrollment.paid == False
        ).count()
        
        # Calculate total revenue from paid enrollments
        paid_enrollments = db.query(Enrollment).join(
            Course, Enrollment.course_id == Course.course_id
        ).filter(
            Enrollment.paid == True
        ).all()
        
        total_revenue = sum(enrollment.course.price for enrollment in paid_enrollments)
        
        # Calculate monthly revenue (last 30 days)
        thirty_days_ago = datetime.now() - timedelta(days=30)
        monthly_paid_enrollments = db.query(Enrollment).join(
            Course, Enrollment.course_id == Course.course_id
        ).filter(
            Enrollment.paid == True,
            Enrollment.paid_date >= thirty_days_ago
        ).all()
        
        monthly_revenue = sum(enrollment.course.price for enrollment in monthly_paid_enrollments)
        
        # Calculate average attendance percentage
        total_attendance_records = db.query(Attendance).count()
        if total_attendance_records > 0:
            present_count = db.query(Attendance).filter(
                Attendance.status.in_(["present", "late"])
            ).count()
            avg_attendance = round((present_count / total_attendance_records) * 100, 1)
        else:
            avg_attendance = 0.0
        
        return {
            "totalStudents": total_students,
            "totalTeachers": total_teachers,
            "totalCourses": total_courses,
            "totalRevenue": round(total_revenue, 2),
            "activeEnrollments": active_enrollments,
            "pendingPayments": pending_payments,
            "monthlyRevenue": round(monthly_revenue, 2),
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
        
        # Recent payments
        recent_payments = db.query(Enrollment).join(
            Student, Enrollment.student_id == Student.student_id
        ).filter(
            Enrollment.paid == True,
            Enrollment.paid_date.isnot(None)
        ).order_by(desc(Enrollment.paid_date)).limit(3).all()
        
        for enrollment in recent_payments:
            activities.append({
                "id": f"payment_{enrollment.enrollment_id}",
                "type": "payment",
                "description": f"Payment received for {enrollment.course.title}",
                "timestamp": enrollment.paid_date.isoformat(),
                "user_name": enrollment.student.name
            })
        
        # Recent user registrations
        recent_students = db.query(Student).order_by(desc(Student.created_at)).limit(2).all()
        for student in recent_students:
            activities.append({
                "id": f"user_{student.student_id}",
                "type": "user_registered",
                "description": f"New student registered: {student.name}",
                "timestamp": student.created_at.isoformat(),
                "user_name": student.name
            })
        
        # Sort by timestamp descending
        activities.sort(key=lambda x: x["timestamp"], reverse=True)
        
        return activities[:limit]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching recent activity: {str(e)}"
        )


@router.get("/analytics/revenue")
async def get_revenue_analytics(
    current_user=Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """Get detailed revenue analytics by month and course"""
    try:
        # Revenue by month (last 12 months)
        twelve_months_ago = datetime.now() - timedelta(days=365)
        paid_enrollments = db.query(Enrollment).join(
            Course, Enrollment.course_id == Course.course_id
        ).filter(
            Enrollment.paid == True,
            Enrollment.paid_date >= twelve_months_ago
        ).all()
        
        # Group by month
        monthly_revenue = {}
        for enrollment in paid_enrollments:
            if enrollment.paid_date:
                month_key = enrollment.paid_date.strftime("%Y-%m")
                if month_key not in monthly_revenue:
                    monthly_revenue[month_key] = 0.0
                monthly_revenue[month_key] += enrollment.course.price
        
        # Revenue by course
        course_revenue = db.query(
            Course.title,
            func.count(Enrollment.enrollment_id).label('enrollment_count'),
            func.sum(Course.price).label('total_revenue')
        ).join(
            Enrollment, Course.course_id == Enrollment.course_id
        ).filter(
            Enrollment.paid == True
        ).group_by(
            Course.course_id, Course.title
        ).all()
        
        return {
            "monthlyRevenue": [
                {"month": month, "revenue": round(revenue, 2)}
                for month, revenue in sorted(monthly_revenue.items())
            ],
            "courseRevenue": [
                {
                    "course": course.title,
                    "enrollments": course.enrollment_count,
                    "revenue": round(float(course.total_revenue or 0), 2)
                }
                for course in course_revenue
            ]
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching revenue analytics: {str(e)}"
        )


@router.get("/analytics/enrollment")
async def get_enrollment_analytics(
    current_user=Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """Get enrollment analytics and trends"""
    try:
        # Enrollments by course
        course_enrollments = db.query(
            Course.title,
            Course.max_students,
            func.count(Enrollment.enrollment_id).label('enrolled_count')
        ).outerjoin(
            Enrollment, Course.course_id == Enrollment.course_id
        ).group_by(
            Course.course_id, Course.title, Course.max_students
        ).all()
        
        # Enrollment status breakdown
        status_breakdown = db.query(
            Enrollment.status,
            func.count(Enrollment.enrollment_id).label('count')
        ).group_by(Enrollment.status).all()
        
        # Enrollment trends (last 6 months)
        six_months_ago = datetime.now() - timedelta(days=180)
        monthly_enrollments = db.query(
            func.strftime('%Y-%m', Enrollment.enrollment_date).label('month'),
            func.count(Enrollment.enrollment_id).label('count')
        ).filter(
            Enrollment.enrollment_date >= six_months_ago
        ).group_by('month').all()
        
        return {
            "courseEnrollments": [
                {
                    "course": course.title,
                    "enrolled": course.enrolled_count,
                    "capacity": course.max_students,
                    "utilization": round((course.enrolled_count / course.max_students * 100) if course.max_students > 0 else 0, 1)
                }
                for course in course_enrollments
            ],
            "statusBreakdown": [
                {"status": status.status, "count": status.count}
                for status in status_breakdown
            ],
            "monthlyTrend": [
                {"month": enrollment.month, "count": enrollment.count}
                for enrollment in monthly_enrollments
            ]
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching enrollment analytics: {str(e)}"
        )


@router.get("/analytics/attendance")
async def get_attendance_analytics(
    current_user=Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """Get attendance analytics by course and student"""
    try:
        # Attendance by course
        course_attendance = db.query(
            Course.title,
            func.count(Attendance.attendance_id).label('total_sessions'),
            func.sum(func.case([(Attendance.status == 'present', 1)], else_=0)).label('present_count'),
            func.sum(func.case([(Attendance.status == 'absent', 1)], else_=0)).label('absent_count'),
            func.sum(func.case([(Attendance.status == 'late', 1)], else_=0)).label('late_count')
        ).join(
            Attendance, Course.course_id == Attendance.course_id
        ).group_by(
            Course.course_id, Course.title
        ).all()
        
        # Top attending students
        top_students = db.query(
            Student.name,
            func.count(Attendance.attendance_id).label('total_sessions'),
            func.sum(func.case([(Attendance.status == 'present', 1)], else_=0)).label('present_count')
        ).join(
            Attendance, Student.student_id == Attendance.student_id
        ).group_by(
            Student.student_id, Student.name
        ).order_by(desc('present_count')).limit(10).all()
        
        return {
            "courseAttendance": [
                {
                    "course": course.title,
                    "totalSessions": course.total_sessions,
                    "present": course.present_count,
                    "absent": course.absent_count,
                    "late": course.late_count,
                    "attendanceRate": round((course.present_count / course.total_sessions * 100) if course.total_sessions > 0 else 0, 1)
                }
                for course in course_attendance
            ],
            "topStudents": [
                {
                    "name": student.name,
                    "totalSessions": student.total_sessions,
                    "present": student.present_count,
                    "attendanceRate": round((student.present_count / student.total_sessions * 100) if student.total_sessions > 0 else 0, 1)
                }
                for student in top_students
            ]
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching attendance analytics: {str(e)}"
        )


@router.get("/users/all")
async def get_all_users(
    user_type: Optional[str] = Query(None, regex="^(student|teacher|admin|parent)$"),
    is_active: Optional[bool] = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user=Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """Get all users with filtering and pagination"""
    try:
        users = []
        
        if user_type is None or user_type == "student":
            query = db.query(Student)
            if is_active is not None:
                query = query.filter(Student.is_active == is_active)
            students = query.order_by(desc(Student.created_at)).limit(limit).offset(offset).all()
            
            for student in students:
                users.append({
                    "id": student.student_id,
                    "name": student.name,
                    "email": student.email,
                    "phone": student.phone,
                    "user_type": "student",
                    "is_active": student.is_active,
                    "created_at": student.created_at.isoformat(),
                    "parent_email": student.parent_email,
                    "parent_phone": student.parent_phone
                })
        
        if user_type is None or user_type == "teacher":
            query = db.query(Teacher)
            if is_active is not None:
                query = query.filter(Teacher.is_active == is_active)
            teachers = query.order_by(desc(Teacher.created_at)).limit(limit).offset(offset).all()
            
            for teacher in teachers:
                users.append({
                    "id": teacher.teacher_id,
                    "name": teacher.name,
                    "email": teacher.email,
                    "phone": teacher.phone,
                    "user_type": "teacher",
                    "is_active": teacher.is_active,
                    "created_at": teacher.created_at.isoformat(),
                    "specialization": teacher.specialization
                })
        
        if user_type is None or user_type == "admin":
            query = db.query(Admin)
            if is_active is not None:
                query = query.filter(Admin.is_active == is_active)
            admins = query.order_by(desc(Admin.created_at)).limit(limit).offset(offset).all()
            
            for admin in admins:
                users.append({
                    "id": admin.admin_id,
                    "name": admin.name,
                    "email": admin.email,
                    "phone": admin.phone,
                    "user_type": "admin",
                    "is_active": admin.is_active,
                    "created_at": admin.created_at.isoformat(),
                    "role": admin.role
                })
        
        return users
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching users: {str(e)}"
        )


@router.put("/users/{user_type}/{user_id}/status")
async def update_user_status(
    user_type: str,
    user_id: int,
    is_active: bool,
    current_user=Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """Activate or deactivate a user"""
    try:
        if user_type == "student":
            user = db.query(Student).filter(Student.student_id == user_id).first()
        elif user_type == "teacher":
            user = db.query(Teacher).filter(Teacher.teacher_id == user_id).first()
        elif user_type == "admin":
            user = db.query(Admin).filter(Admin.admin_id == user_id).first()
        else:
            raise HTTPException(status_code=400, detail="Invalid user type")
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        user.is_active = is_active
        db.commit()
        
        return {
            "message": f"User {'activated' if is_active else 'deactivated'} successfully",
            "user_id": user_id,
            "user_type": user_type,
            "is_active": is_active
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating user status: {str(e)}"
        )


@router.delete("/users/{user_type}/{user_id}")
async def delete_user(
    user_type: str,
    user_id: int,
    current_user=Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """Delete a user (soft delete by deactivating)"""
    try:
        if user_type == "student":
            user = db.query(Student).filter(Student.student_id == user_id).first()
        elif user_type == "teacher":
            user = db.query(Teacher).filter(Teacher.teacher_id == user_id).first()
        elif user_type == "admin":
            user = db.query(Admin).filter(Admin.admin_id == user_id).first()
        else:
            raise HTTPException(status_code=400, detail="Invalid user type")
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Soft delete by deactivating
        user.is_active = False
        db.commit()
        
        return {
            "message": "User deleted successfully (deactivated)",
            "user_id": user_id,
            "user_type": user_type
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting user: {str(e)}"
        )