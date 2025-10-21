"""
Celery Configuration and Background Tasks
Handles asynchronous email sending and scheduled tasks
"""

from celery import Celery
from celery.schedules import crontab
from datetime import timedelta
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine
from app.core.config import settings
from app.services.email_service import email_service
from app.models import (
    PasswordResetToken, EmailLog, MonthlyReport, Student, Teacher, Admin,
    Assignment, AssignmentSubmission, Enrollment, Attendance, Course, Payment
)
from sqlalchemy import and_, func
from datetime import datetime
import logging

# Configure logging
logger = logging.getLogger(__name__)

# Initialize Celery app
celery_app = Celery(
    'college_prep_platform',
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend
)

# Configure Celery Beat schedule for periodic tasks
celery_app.conf.beat_schedule = {
    'cleanup-expired-tokens': {
        'task': 'app.services.celery_app.cleanup_expired_reset_tokens',
        'schedule': crontab(hour=2, minute=0),  # Run at 2 AM daily
    },
    'send-daily-notification-digest': {
        'task': 'app.services.celery_app.send_notification_digest',
        'schedule': crontab(hour=9, minute=0),  # Run at 9 AM daily
    },
    'send-monthly-reports': {
        'task': 'app.services.celery_app.send_monthly_reports',
        'schedule': crontab(day_of_month=1, hour=8, minute=0),  # Run at 8 AM on first day of month
    },
}

# Celery configuration
celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes
)


# ==================== Email Sending Tasks ====================

@celery_app.task(bind=True, max_retries=3)
def send_password_reset_email_task(self, email: str, name: str, reset_token: str, reset_url: str = None):
    """
    Celery task to send password reset email asynchronously
    """
    try:
        import asyncio
        result = asyncio.run(
            email_service.send_password_reset_email(email, name, reset_token, reset_url)
        )
        
        if result:
            logger.info(f"Password reset email sent to {email}")
        else:
            logger.error(f"Failed to send password reset email to {email}")
        
        return {"status": "success" if result else "failed", "email": email}
    
    except Exception as exc:
        logger.error(f"Error sending password reset email: {str(exc)}")
        raise self.retry(exc=exc, countdown=60)  # Retry after 60 seconds


@celery_app.task(bind=True, max_retries=3)
def send_assignment_notification_task(
    self,
    student_emails: list,
    assignment_title: str,
    course_title: str,
    due_date: str,
    course_url: str
):
    """
    Celery task to send assignment notifications
    """
    try:
        import asyncio
        result = asyncio.run(
            email_service.send_assignment_notification(
                student_emails, assignment_title, course_title, due_date, course_url
            )
        )
        
        logger.info(f"Assignment notification sent to {len(student_emails)} students")
        return {"status": "success" if result else "failed", "recipients": len(student_emails)}
    
    except Exception as exc:
        logger.error(f"Error sending assignment notification: {str(exc)}")
        raise self.retry(exc=exc, countdown=60)


@celery_app.task(bind=True, max_retries=3)
def send_grade_notification_task(
    self,
    student_email: str,
    student_name: str,
    assignment_title: str,
    grade: float,
    max_points: float,
    feedback: str = None
):
    """
    Celery task to send grade notifications
    """
    try:
        import asyncio
        result = asyncio.run(
            email_service.send_grade_notification(
                student_email, student_name, assignment_title, grade, max_points, feedback
            )
        )
        
        logger.info(f"Grade notification sent to {student_email}")
        return {"status": "success" if result else "failed", "email": student_email}
    
    except Exception as exc:
        logger.error(f"Error sending grade notification: {str(exc)}")
        raise self.retry(exc=exc, countdown=60)


# ==================== Scheduled Tasks ====================

@celery_app.task
def cleanup_expired_reset_tokens():
    """
    Clean up expired password reset tokens (runs daily at 2 AM)
    """
    try:
        db = SessionLocal()
        
        # Delete expired tokens
        deleted_count = db.query(PasswordResetToken).filter(
            and_(
                PasswordResetToken.expires_at < datetime.utcnow(),
                PasswordResetToken.is_used == False  # noqa: E712
            )
        ).delete()
        
        db.commit()
        db.close()
        
        logger.info(f"Cleaned up {deleted_count} expired password reset tokens")
        return {"status": "success", "deleted_count": deleted_count}
    
    except Exception as exc:
        logger.error(f"Error cleaning up expired tokens: {str(exc)}")
        return {"status": "failed", "error": str(exc)}


@celery_app.task
def send_notification_digest():
    """
    Send daily notification digest to users (runs at 9 AM)
    """
    try:
        db = SessionLocal()
        
        # This would aggregate notifications from the day and send digest emails
        # Implementation depends on your notification system
        
        logger.info("Notification digest task executed")
        db.close()
        return {"status": "success"}
    
    except Exception as exc:
        logger.error(f"Error sending notification digest: {str(exc)}")
        return {"status": "failed", "error": str(exc)}


@celery_app.task
def send_monthly_reports():
    """
    Send monthly reports to all users (runs at 8 AM on the 1st of each month)
    """
    try:
        db = SessionLocal()
        import asyncio
        
        # Get current month and year
        now = datetime.utcnow()
        month = now.month
        year = now.year
        
        # Send reports to all students
        students = db.query(Student).filter(Student.is_active == True).all()  # noqa: E712
        
        for student in students:
            task_id = send_student_monthly_report.delay(
                student_id=student.student_id,
                month=month,
                year=year
            )
            logger.info(f"Queued monthly report for student {student.student_id}: {task_id}")
        
        # Send reports to all teachers
        teachers = db.query(Teacher).filter(Teacher.is_active == True).all()  # noqa: E712
        
        for teacher in teachers:
            task_id = send_teacher_monthly_report.delay(
                teacher_id=teacher.teacher_id,
                month=month,
                year=year
            )
            logger.info(f"Queued monthly report for teacher {teacher.teacher_id}: {task_id}")
        
        # Send reports to all admins
        admins = db.query(Admin).filter(Admin.is_active == True).all()  # noqa: E712
        
        for admin in admins:
            task_id = send_admin_monthly_report.delay(
                admin_id=admin.admin_id,
                month=month,
                year=year
            )
            logger.info(f"Queued monthly report for admin {admin.admin_id}: {task_id}")
        
        db.close()
        
        return {
            "status": "success",
            "students_count": len(students),
            "teachers_count": len(teachers),
            "admins_count": len(admins)
        }
    
    except Exception as exc:
        logger.error(f"Error sending monthly reports: {str(exc)}")
        return {"status": "failed", "error": str(exc)}


@celery_app.task(bind=True, max_retries=3)
def send_student_monthly_report(self, student_id: int, month: int, year: int):
    """
    Generate and send monthly report for a specific student
    """
    try:
        db = SessionLocal()
        
        student = db.query(Student).filter(Student.student_id == student_id).first()
        if not student:
            db.close()
            return {"status": "failed", "error": "Student not found"}
        
        # Calculate attendance
        attendances = db.query(Attendance).filter(
            and_(
                Attendance.student_id == student_id,
                func.extract('month', Attendance.attendance_date) == month,
                func.extract('year', Attendance.attendance_date) == year
            )
        ).all()
        
        total_classes = len(set(a.course_id for a in attendances))
        attended_classes = len([a for a in attendances if a.status == "present"])
        attendance_percentage = (attended_classes / total_classes * 100) if total_classes > 0 else 0
        
        # Calculate grades
        submissions = db.query(AssignmentSubmission).filter(
            and_(
                AssignmentSubmission.student_id == student_id,
                AssignmentSubmission.grade != None  # noqa: E711
            )
        ).all()
        
        assignments_completed = len(submissions)
        average_grade = (sum(s.grade for s in submissions) / len(submissions)) if submissions else 0
        
        # Find outstanding assignments
        outstanding = db.query(Assignment).filter(
            and_(
                Assignment.due_date > datetime.utcnow(),
                ~Assignment.submissions.any(AssignmentSubmission.student_id == student_id)
            )
        ).count()
        
        # Send email
        import asyncio
        month_name = datetime(year, month, 1).strftime("%B")
        
        result = asyncio.run(
            email_service.send_monthly_student_report(
                student_email=student.email,
                student_name=student.name,
                month=month_name,
                year=str(year),
                total_classes=total_classes,
                attended_classes=attended_classes,
                attendance_percentage=attendance_percentage,
                assignments_completed=assignments_completed,
                average_grade=average_grade,
                outstanding_assignments=outstanding
            )
        )
        
        # Log report generation
        report = MonthlyReport(
            month=month,
            year=year,
            report_type="student",
            recipient_id=student_id,
            recipient_type="student",
            recipient_email=student.email,
            total_classes=total_classes,
            classes_attended=attended_classes,
            attendance_percentage=attendance_percentage,
            assignments_completed=assignments_completed,
            average_grade=average_grade,
            outstanding_assignments=outstanding,
            status="sent" if result else "failed",
            sent_at=datetime.utcnow() if result else None
        )
        db.add(report)
        db.commit()
        db.close()
        
        logger.info(f"Sent monthly report to student {student_id}")
        return {"status": "success" if result else "failed", "student_id": student_id}
    
    except Exception as exc:
        logger.error(f"Error sending student monthly report: {str(exc)}")
        raise self.retry(exc=exc, countdown=60)


@celery_app.task(bind=True, max_retries=3)
def send_teacher_monthly_report(self, teacher_id: int, month: int, year: int):
    """
    Generate and send monthly report for a specific teacher
    """
    try:
        db = SessionLocal()
        
        teacher = db.query(Teacher).filter(Teacher.teacher_id == teacher_id).first()
        if not teacher:
            db.close()
            return {"status": "failed", "error": "Teacher not found"}
        
        # Get teacher's courses
        courses = [c.course_id for c in teacher.courses]
        
        # Count students taught
        students_taught = db.query(Enrollment).filter(
            Enrollment.course_id.in_(courses)
        ).distinct(Enrollment.student_id).count()
        
        # Count assignments posted this month
        assignments_posted = db.query(Assignment).filter(
            and_(
                Assignment.course_id.in_(courses),
                func.extract('month', Assignment.created_at) == month,
                func.extract('year', Assignment.created_at) == year
            )
        ).count()
        
        # Count assignments graded
        assignments_graded = db.query(AssignmentSubmission).filter(
            and_(
                Assignment.course_id.in_(courses),
                AssignmentSubmission.graded_by_id == teacher_id,
                func.extract('month', AssignmentSubmission.graded_at) == month,
                func.extract('year', AssignmentSubmission.graded_at) == year
            )
        ).count()
        
        # Calculate average grade
        submissions = db.query(AssignmentSubmission).filter(
            and_(
                AssignmentSubmission.graded_by_id == teacher_id,
                AssignmentSubmission.grade != None  # noqa: E711
            )
        ).all()
        average_grade = (sum(s.grade for s in submissions) / len(submissions)) if submissions else 0
        
        # Pending assignments
        pending_assignments = db.query(AssignmentSubmission).filter(
            and_(
                Assignment.course_id.in_(courses),
                AssignmentSubmission.graded_at == None  # noqa: E711
            )
        ).count()
        
        # Send email
        import asyncio
        month_name = datetime(year, month, 1).strftime("%B")
        
        result = asyncio.run(
            email_service.send_monthly_teacher_report(
                teacher_email=teacher.email,
                teacher_name=teacher.name,
                month=month_name,
                year=str(year),
                students_taught=students_taught,
                assignments_posted=assignments_posted,
                assignments_graded=assignments_graded,
                pending_assignments=pending_assignments,
                average_class_grade=average_grade
            )
        )
        
        # Log report generation
        report = MonthlyReport(
            month=month,
            year=year,
            report_type="teacher",
            recipient_id=teacher_id,
            recipient_type="teacher",
            recipient_email=teacher.email,
            students_count=students_taught,
            assignments_graded=assignments_graded,
            pending_assignments=pending_assignments,
            status="sent" if result else "failed",
            sent_at=datetime.utcnow() if result else None
        )
        db.add(report)
        db.commit()
        db.close()
        
        logger.info(f"Sent monthly report to teacher {teacher_id}")
        return {"status": "success" if result else "failed", "teacher_id": teacher_id}
    
    except Exception as exc:
        logger.error(f"Error sending teacher monthly report: {str(exc)}")
        raise self.retry(exc=exc, countdown=60)


@celery_app.task(bind=True, max_retries=3)
def send_admin_monthly_report(self, admin_id: int, month: int, year: int):
    """
    Generate and send monthly platform report for admin
    """
    try:
        db = SessionLocal()
        
        admin = db.query(Admin).filter(Admin.admin_id == admin_id).first()
        if not admin:
            db.close()
            return {"status": "failed", "error": "Admin not found"}
        
        # Get platform statistics
        total_students = db.query(Student).filter(Student.is_active == True).count()  # noqa: E712
        total_teachers = db.query(Teacher).filter(Teacher.is_active == True).count()  # noqa: E712
        total_courses = db.query(Course).filter(Course.status == "active").count()
        total_enrollments = db.query(Enrollment).count()
        
        # Revenue calculation
        payments = db.query(Payment).filter(
            and_(
                Payment.payment_status == "completed",
                func.extract('month', Payment.payment_date) == month,
                func.extract('year', Payment.payment_date) == year
            )
        ).all()
        total_revenue = sum(p.amount for p in payments)
        
        # New enrollments this month
        new_enrollments = db.query(Enrollment).filter(
            and_(
                func.extract('month', Enrollment.enrollment_date) == month,
                func.extract('year', Enrollment.enrollment_date) == year
            )
        ).count()
        
        # Active users (logged in this month) - simplified
        active_users = total_students + total_teachers
        
        # Send email
        import asyncio
        month_name = datetime(year, month, 1).strftime("%B")
        
        result = asyncio.run(
            email_service.send_monthly_admin_report(
                admin_email=admin.email,
                admin_name=admin.name,
                month=month_name,
                year=str(year),
                total_students=total_students,
                total_teachers=total_teachers,
                total_courses=total_courses,
                total_enrollments=total_enrollments,
                total_revenue=total_revenue,
                active_users=active_users,
                new_enrollments=new_enrollments
            )
        )
        
        # Log report generation
        report = MonthlyReport(
            month=month,
            year=year,
            report_type="admin",
            recipient_id=admin_id,
            recipient_type="admin",
            recipient_email=admin.email,
            total_students=total_students,
            total_teachers=total_teachers,
            total_courses=total_courses,
            total_enrollments=total_enrollments,
            total_revenue=total_revenue,
            status="sent" if result else "failed",
            sent_at=datetime.utcnow() if result else None
        )
        db.add(report)
        db.commit()
        db.close()
        
        logger.info(f"Sent monthly report to admin {admin_id}")
        return {"status": "success" if result else "failed", "admin_id": admin_id}
    
    except Exception as exc:
        logger.error(f"Error sending admin monthly report: {str(exc)}")
        raise self.retry(exc=exc, countdown=60)
