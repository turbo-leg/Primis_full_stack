"""
Email and Password Reset API Endpoints
"""

from fastapi import APIRouter, HTTPException, status, Depends, Request
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
import hashlib
import logging

from app.core.database import get_db
from app.core.security import get_current_user, get_password_hash, verify_password
from app.models import Student, Teacher, Admin, Parent, PasswordResetToken, EmailLog, EmailPreference
from app.api.schemas import Message
from app.services.email_service import email_service
# from app.services.celery_app import send_password_reset_email_task  # Not needed - sending directly
from app.core.config import settings

router = APIRouter(tags=["authentication"])  # No prefix here - added in main.py
admin_router = APIRouter(tags=["admin"])  # No prefix here - added in main.py

logger = logging.getLogger(__name__)

# ==================== Schemas ====================

class ForgotPasswordRequest(BaseModel):
    """Request to initiate password reset"""
    email: EmailStr = Field(..., description="User email address")


class ResetPasswordRequest(BaseModel):
    """Request to reset password with token"""
    token: str = Field(..., description="Reset token from email")
    new_password: str = Field(..., min_length=8, description="New password (min 8 characters)")
    confirm_password: str = Field(..., description="Confirm new password")


class PasswordResetResponse(BaseModel):
    """Response for password reset"""
    message: str
    token_valid: bool = True


class EmailLogResponse(BaseModel):
    """Email log response"""
    log_id: int
    recipient_email: str
    subject: str
    email_type: str
    status: str
    sent_at: Optional[datetime]
    attempted_at: datetime

    class Config:
        from_attributes = True


class EmailPreferenceUpdate(BaseModel):
    """Update email preferences"""
    email_notifications_enabled: Optional[bool] = None
    assignment_notifications: Optional[bool] = None
    grade_notifications: Optional[bool] = None
    attendance_notifications: Optional[bool] = None
    course_announcements: Optional[bool] = None
    digest_frequency: Optional[str] = None  # immediate, daily, weekly, never
    monthly_report_enabled: Optional[bool] = None


# ==================== Password Reset Endpoints ====================

@router.post("/forgot-password", response_model=Message)
async def forgot_password(
    request: ForgotPasswordRequest,
    db: Session = Depends(get_db)
):
    """
    Request password reset token
    
    - User provides email
    - System generates secure token (24 hour expiration)
    - Email sent with reset link
    - Max 3 requests per hour per email (rate limiting)
    """
    
    email = request.email.lower()
    
    # Find user by email (check all user types)
    user = None
    user_type = None
    user_id = None
    user_name = None
    
    student = db.query(Student).filter(Student.email == email).first()
    if student:
        user = student
        user_type = "student"
        user_id = student.student_id
        user_name = student.name
    
    if not user:
        teacher = db.query(Teacher).filter(Teacher.email == email).first()
        if teacher:
            user = teacher
            user_type = "teacher"
            user_id = teacher.teacher_id
            user_name = teacher.name
    
    if not user:
        admin = db.query(Admin).filter(Admin.email == email).first()
        if admin:
            user = admin
            user_type = "admin"
            user_id = admin.admin_id
            user_name = admin.name
    
    if not user:
        parent = db.query(Parent).filter(Parent.email == email).first()
        if parent:
            user = parent
            user_type = "parent"
            user_id = parent.parent_id
            user_name = parent.name
    
    # For security, always return success even if user not found
    # This prevents email enumeration attacks
    if not user:
        return {"message": "If an account exists with this email, you will receive a password reset link shortly."}
    
    # Rate limiting: Max 3 requests per hour
    recent_requests = db.query(PasswordResetToken).filter(
        PasswordResetToken.email == email,
        PasswordResetToken.created_at > datetime.utcnow() - timedelta(hours=1),
        PasswordResetToken.is_used == False  # noqa: E712
    ).count()
    
    if recent_requests >= 3:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many password reset requests. Please try again later."
        )
    
    # Generate secure token
    plain_token, token_hash = email_service.generate_reset_token()
    
    # Store token in database
    expires_at = datetime.utcnow() + timedelta(hours=settings.password_reset_token_expire_hours)
    
    reset_token = PasswordResetToken(
        email=email,
        user_type=user_type,
        user_id=user_id,
        token_hash=token_hash,
        expires_at=expires_at,
        ip_address="127.0.0.1"  # In production, get from request
    )
    db.add(reset_token)
    db.commit()
    
    # Send email directly (no Celery needed for simple emails)
    reset_url = f"{settings.password_reset_url}?token={plain_token}"
    
    try:
        logger.info(f"📧 Attempting to send password reset email to {email}")
        result = await email_service.send_password_reset_email(
            email=email,
            name=user_name,
            reset_token=plain_token,
            reset_url=reset_url
        )
        if result:
            logger.info(f"✅ Password reset email sent successfully to {email}")
        else:
            logger.error(f"❌ Password reset email FAILED to send to {email} - check email service configuration")
    except Exception as e:
        # Log error but don't reveal to user for security
        logger.error(f"❌ Exception sending password reset email to {email}: {e}", exc_info=True)
    
    return {"message": "If an account exists with this email, you will receive a password reset link shortly."}


@router.post("/reset-password", response_model=PasswordResetResponse)
async def reset_password(
    request: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    """
    Reset password using token from email
    
    - Validates token hasn't expired
    - Validates passwords match
    - Hashes new password
    - Updates user password
    - Marks token as used
    """
    
    # Validate passwords match
    if request.new_password != request.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match"
        )
    
    # Hash the token to find matching record
    token_hash = hashlib.sha256(request.token.encode()).hexdigest()
    
    # Find token in database
    reset_token = db.query(PasswordResetToken).filter(
        PasswordResetToken.token_hash == token_hash,
        PasswordResetToken.is_used == False  # noqa: E712
    ).first()
    
    if not reset_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    # Check if token has expired
    if reset_token.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset token has expired. Please request a new one."
        )
    
    # Find user and update password
    user = None
    
    if reset_token.user_type == "student":
        user = db.query(Student).filter(Student.student_id == reset_token.user_id).first()
    elif reset_token.user_type == "teacher":
        user = db.query(Teacher).filter(Teacher.teacher_id == reset_token.user_id).first()
    elif reset_token.user_type == "admin":
        user = db.query(Admin).filter(Admin.admin_id == reset_token.user_id).first()
    elif reset_token.user_type == "parent":
        user = db.query(Parent).filter(Parent.parent_id == reset_token.user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Prevent reusing current password
    if verify_password(request.new_password, user.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password cannot be the same as current password"
        )
    
    # Update password
    user.password = get_password_hash(request.new_password)
    reset_token.is_used = True
    reset_token.used_at = datetime.utcnow()
    
    db.commit()
    
    return {
        "message": "Password reset successfully",
        "token_valid": True
    }


# ==================== Email Preferences Endpoints ====================

@router.get("/email-preferences")
async def get_email_preferences(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's email preferences"""
    
    user_id = current_user.get("sub")
    user_type = current_user.get("user_type")
    
    # Find user email
    user_email = None
    if user_type == "student":
        student = db.query(Student).filter(Student.student_id == user_id).first()
        user_email = student.email if student else None
    elif user_type == "teacher":
        teacher = db.query(Teacher).filter(Teacher.teacher_id == user_id).first()
        user_email = teacher.email if teacher else None
    elif user_type == "admin":
        admin = db.query(Admin).filter(Admin.admin_id == user_id).first()
        user_email = admin.email if admin else None
    elif user_type == "parent":
        parent = db.query(Parent).filter(Parent.parent_id == user_id).first()
        user_email = parent.email if parent else None
    
    if not user_email:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get or create email preference
    pref = db.query(EmailPreference).filter(
        EmailPreference.email == user_email
    ).first()
    
    if not pref:
        pref = EmailPreference(
            user_id=user_id,
            user_type=user_type,
            email=user_email
        )
        db.add(pref)
        db.commit()
    
    return {
        "email": pref.email,
        "email_notifications_enabled": pref.email_notifications_enabled,
        "assignment_notifications": pref.assignment_notifications,
        "grade_notifications": pref.grade_notifications,
        "attendance_notifications": pref.attendance_notifications,
        "course_announcements": pref.course_announcements,
        "digest_frequency": pref.digest_frequency,
        "monthly_report_enabled": pref.monthly_report_enabled
    }


@router.put("/email-preferences")
async def update_email_preferences(
    preferences: EmailPreferenceUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user's email preferences"""
    
    user_id = current_user.get("sub")
    user_type = current_user.get("user_type")
    
    # Find user email
    user_email = None
    if user_type == "student":
        student = db.query(Student).filter(Student.student_id == user_id).first()
        user_email = student.email if student else None
    elif user_type == "teacher":
        teacher = db.query(Teacher).filter(Teacher.teacher_id == user_id).first()
        user_email = teacher.email if teacher else None
    elif user_type == "admin":
        admin = db.query(Admin).filter(Admin.admin_id == user_id).first()
        user_email = admin.email if admin else None
    elif user_type == "parent":
        parent = db.query(Parent).filter(Parent.parent_id == user_id).first()
        user_email = parent.email if parent else None
    
    if not user_email:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get or create email preference
    pref = db.query(EmailPreference).filter(
        EmailPreference.email == user_email
    ).first()
    
    if not pref:
        pref = EmailPreference(
            user_id=user_id,
            user_type=user_type,
            email=user_email
        )
        db.add(pref)
    
    # Update fields
    if preferences.email_notifications_enabled is not None:
        pref.email_notifications_enabled = preferences.email_notifications_enabled
    if preferences.assignment_notifications is not None:
        pref.assignment_notifications = preferences.assignment_notifications
    if preferences.grade_notifications is not None:
        pref.grade_notifications = preferences.grade_notifications
    if preferences.attendance_notifications is not None:
        pref.attendance_notifications = preferences.attendance_notifications
    if preferences.course_announcements is not None:
        pref.course_announcements = preferences.course_announcements
    if preferences.digest_frequency is not None:
        pref.digest_frequency = preferences.digest_frequency
    if preferences.monthly_report_enabled is not None:
        pref.monthly_report_enabled = preferences.monthly_report_enabled
    
    db.commit()
    
    return {"message": "Email preferences updated successfully"}


# ==================== Admin Email Management Endpoints ====================

@admin_router.get("/email-logs", response_model=list[EmailLogResponse])
async def get_email_logs(
    skip: int = 0,
    limit: int = 50,
    email_type: Optional[str] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get email logs (Admin only)
    
    Query parameters:
    - skip: Number of records to skip (pagination)
    - limit: Number of records to return
    - email_type: Filter by email type (password_reset, assignment, grade, etc.)
    - status: Filter by status (sent, failed, pending)
    """
    
    # Check if user is admin
    if current_user.get("user_type") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = db.query(EmailLog)
    
    if email_type:
        query = query.filter(EmailLog.email_type == email_type)
    
    if status:
        query = query.filter(EmailLog.status == status)
    
    logs = query.order_by(EmailLog.attempted_at.desc()).offset(skip).limit(limit).all()
    
    return logs


@admin_router.post("/trigger-monthly-reports")
async def trigger_monthly_reports(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Manually trigger monthly report generation (Admin only)
    """
    
    # Check if user is admin
    if current_user.get("user_type") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    from app.services.celery_app import send_monthly_reports
    
    task = send_monthly_reports.delay()
    
    return {
        "message": "Monthly reports generation triggered",
        "task_id": task.id
    }


@admin_router.get("/email-logs/stats")
async def get_email_stats(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get email statistics (Admin only)
    """
    
    # Check if user is admin
    if current_user.get("user_type") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    total_sent = db.query(EmailLog).filter(EmailLog.status == "sent").count()
    total_failed = db.query(EmailLog).filter(EmailLog.status == "failed").count()
    total_pending = db.query(EmailLog).filter(EmailLog.status == "pending").count()
    
    # By type
    by_type = {}
    for email_type in ["password_reset", "assignment", "grade", "attendance", "notification", "report", "welcome"]:
        count = db.query(EmailLog).filter(EmailLog.email_type == email_type).count()
        if count > 0:
            by_type[email_type] = count
    
    return {
        "total_sent": total_sent,
        "total_failed": total_failed,
        "total_pending": total_pending,
        "by_type": by_type
    }
