"""
Email System Models - Database models for password reset tokens, email logs, and reports
"""

from sqlalchemy import Column, Integer, String, DateTime, Boolean, Float, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from datetime import datetime
import enum


class EmailStatusEnum(str, enum.Enum):
    """Email sending status"""
    PENDING = "pending"
    SENT = "sent"
    FAILED = "failed"
    BOUNCED = "bounced"


class PasswordResetToken(Base):
    """Store password reset tokens with expiration"""
    __tablename__ = "password_reset_tokens"

    token_id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), nullable=False, index=True)
    user_type = Column(String(20), nullable=False)  # student, teacher, admin, parent
    user_id = Column(Integer, nullable=False)
    token_hash = Column(String(255), unique=True, nullable=False, index=True)  # SHA256 hash
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False, index=True)
    used_at = Column(DateTime(timezone=True), nullable=True)  # When token was used
    is_used = Column(Boolean, default=False, index=True)
    ip_address = Column(String(45), nullable=True)  # IPv4 or IPv6
    user_agent = Column(Text, nullable=True)


class EmailLog(Base):
    """Track all sent emails for audit and debugging"""
    __tablename__ = "email_logs"

    log_id = Column(Integer, primary_key=True, index=True)
    recipient_email = Column(String(255), nullable=False, index=True)
    recipient_name = Column(String(100), nullable=True)
    recipient_type = Column(String(20), nullable=True)  # student, teacher, admin, parent
    recipient_id = Column(Integer, nullable=True, index=True)
    subject = Column(String(255), nullable=False)
    email_type = Column(String(50), nullable=False, index=True)  # welcome, password_reset, assignment, grade, notification, report
    status = Column(String(20), default=EmailStatusEnum.PENDING, index=True)  # pending, sent, failed, bounced
    error_message = Column(Text, nullable=True)
    sent_at = Column(DateTime(timezone=True), nullable=True)
    attempted_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    retry_count = Column(Integer, default=0)
    max_retries = Column(Integer, default=3)
    next_retry_at = Column(DateTime(timezone=True), nullable=True)
    
    # Additional context
    course_id = Column(Integer, ForeignKey("courses.course_id"), nullable=True)
    assignment_id = Column(Integer, ForeignKey("assignments.assignment_id"), nullable=True)
    notification_id = Column(Integer, ForeignKey("notifications.notification_id"), nullable=True)
    
    # Email content hash for deduplication
    content_hash = Column(String(64), nullable=True)
    
    # Tracking
    opened_at = Column(DateTime(timezone=True), nullable=True)
    clicked_at = Column(DateTime(timezone=True), nullable=True)
    unsubscribed_at = Column(DateTime(timezone=True), nullable=True)


class MonthlyReport(Base):
    """Track monthly report generations"""
    __tablename__ = "monthly_reports"

    report_id = Column(Integer, primary_key=True, index=True)
    month = Column(Integer, nullable=False)  # 1-12
    year = Column(Integer, nullable=False)
    report_type = Column(String(20), nullable=False)  # student, teacher, admin
    recipient_id = Column(Integer, nullable=False, index=True)
    recipient_type = Column(String(20), nullable=False)  # student, teacher, admin
    recipient_email = Column(String(255), nullable=False)
    
    # Report content
    total_classes = Column(Integer, nullable=True)  # For students
    classes_attended = Column(Integer, nullable=True)  # For students
    classes_absent = Column(Integer, nullable=True)  # For students
    attendance_percentage = Column(Float, nullable=True)  # For students
    
    assignments_completed = Column(Integer, nullable=True)
    average_grade = Column(Float, nullable=True)
    outstanding_assignments = Column(Integer, nullable=True)
    
    students_count = Column(Integer, nullable=True)  # For teachers
    assignments_graded = Column(Integer, nullable=True)  # For teachers
    pending_assignments = Column(Integer, nullable=True)  # For teachers
    
    # Admin specific
    total_students = Column(Integer, nullable=True)
    total_teachers = Column(Integer, nullable=True)
    total_courses = Column(Integer, nullable=True)
    total_enrollments = Column(Integer, nullable=True)
    total_revenue = Column(Float, nullable=True)
    
    # Status
    status = Column(String(20), default="pending")  # pending, generated, sent, failed
    generated_at = Column(DateTime(timezone=True), nullable=True)
    sent_at = Column(DateTime(timezone=True), nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class EmailPreference(Base):
    """User email notification preferences"""
    __tablename__ = "email_preferences"

    preference_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    user_type = Column(String(20), nullable=False)  # student, teacher, admin, parent
    email = Column(String(255), nullable=False, unique=True, index=True)
    
    # Notification preferences
    email_notifications_enabled = Column(Boolean, default=True)
    assignment_notifications = Column(Boolean, default=True)
    grade_notifications = Column(Boolean, default=True)
    attendance_notifications = Column(Boolean, default=True)
    course_announcements = Column(Boolean, default=True)
    digest_frequency = Column(String(20), default="daily")  # immediate, daily, weekly, never
    
    # Report preferences
    monthly_report_enabled = Column(Boolean, default=True)
    
    # Other
    unsubscribed_at = Column(DateTime(timezone=True), nullable=True)
    subscribed_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class EmailTemplate(Base):
    """Customizable email templates"""
    __tablename__ = "email_templates"

    template_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    template_type = Column(String(50), nullable=False)  # password_reset, welcome, notification, report
    subject = Column(String(255), nullable=False)
    html_content = Column(Text, nullable=False)
    plain_text_content = Column(Text, nullable=True)
    variables = Column(Text, nullable=True)  # JSON list of required variables
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
