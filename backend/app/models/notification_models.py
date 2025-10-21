from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class NotificationType(str, enum.Enum):
    """Types of notifications"""
    # Academic
    ASSIGNMENT_CREATED = "assignment_created"
    ASSIGNMENT_GRADED = "assignment_graded"
    ASSIGNMENT_DUE_SOON = "assignment_due_soon"
    COURSE_UPDATE = "course_update"
    GRADE_POSTED = "grade_posted"
    
    # Attendance
    ATTENDANCE_MARKED = "attendance_marked"
    ATTENDANCE_WARNING = "attendance_warning"
    ABSENCE_REPORTED = "absence_reported"
    
    # Payment
    PAYMENT_DUE = "payment_due"
    PAYMENT_RECEIVED = "payment_received"
    PAYMENT_OVERDUE = "payment_overdue"
    PAYMENT_REMINDER = "payment_reminder"
    
    # Enrollment
    ENROLLMENT_APPROVED = "enrollment_approved"
    ENROLLMENT_REJECTED = "enrollment_rejected"
    COURSE_FULL = "course_full"
    WAITLIST_AVAILABLE = "waitlist_available"
    
    # Communication
    ANNOUNCEMENT = "announcement"
    MESSAGE_RECEIVED = "message_received"
    CHAT_MENTION = "chat_mention"
    
    # Calendar
    EVENT_REMINDER = "event_reminder"
    CLASS_CANCELLED = "class_cancelled"
    SCHEDULE_CHANGE = "schedule_change"
    
    # System
    ACCOUNT_CREATED = "account_created"
    PASSWORD_RESET = "password_reset"
    PROFILE_UPDATED = "profile_updated"
    SYSTEM_MAINTENANCE = "system_maintenance"
    
    # Admin specific
    NEW_ENROLLMENT = "new_enrollment"
    PAYMENT_PENDING = "payment_pending"
    LOW_ATTENDANCE_ALERT = "low_attendance_alert"


class NotificationPriority(str, enum.Enum):
    """Priority levels for notifications"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class NotificationChannel(str, enum.Enum):
    """Channels for sending notifications"""
    IN_APP = "in_app"
    EMAIL = "email"
    SMS = "sms"
    PUSH = "push"


class Notification(Base):
    """Main notification model"""
    __tablename__ = "notifications"

    notification_id = Column(Integer, primary_key=True, index=True)
    
    # Recipient information
    user_id = Column(Integer, nullable=False, index=True)
    user_type = Column(String(20), nullable=False)  # student, teacher, admin, parent
    
    # Notification content
    notification_type = Column(Enum(NotificationType), nullable=False)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    
    # Metadata
    priority = Column(Enum(NotificationPriority), default=NotificationPriority.MEDIUM)
    category = Column(String(50), nullable=True)  # academic, financial, administrative, etc.
    
    # Action links
    action_url = Column(String(500), nullable=True)  # URL to navigate to
    action_text = Column(String(100), nullable=True)  # Button text like "View Assignment"
    
    # Related entities (for context)
    related_course_id = Column(Integer, nullable=True)
    related_assignment_id = Column(Integer, nullable=True)
    related_enrollment_id = Column(Integer, nullable=True)
    related_payment_id = Column(Integer, nullable=True)
    
    # Status
    is_read = Column(Boolean, default=False)
    read_at = Column(DateTime, nullable=True)
    is_deleted = Column(Boolean, default=False)  # Soft delete
    
    # Delivery tracking
    sent_via = Column(String(50), nullable=True)  # in_app, email, sms, push (comma-separated)
    email_sent = Column(Boolean, default=False)
    email_sent_at = Column(DateTime, nullable=True)
    sms_sent = Column(Boolean, default=False)
    sms_sent_at = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    expires_at = Column(DateTime, nullable=True)  # Optional expiration


class NotificationPreference(Base):
    """User notification preferences"""
    __tablename__ = "notification_preferences"

    preference_id = Column(Integer, primary_key=True, index=True)
    
    # User identification
    user_id = Column(Integer, nullable=False, index=True)
    user_type = Column(String(20), nullable=False)
    
    # Notification type
    notification_type = Column(Enum(NotificationType), nullable=False)
    
    # Channel preferences
    in_app_enabled = Column(Boolean, default=True)
    email_enabled = Column(Boolean, default=True)
    sms_enabled = Column(Boolean, default=False)
    push_enabled = Column(Boolean, default=True)
    
    # Quiet hours
    quiet_hours_start = Column(String(5), nullable=True)  # e.g., "22:00"
    quiet_hours_end = Column(String(5), nullable=True)    # e.g., "08:00"
    
    # Frequency control
    digest_mode = Column(Boolean, default=False)  # Batch notifications
    digest_frequency = Column(String(20), default="daily")  # daily, weekly
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class NotificationTemplate(Base):
    """Templates for generating notifications"""
    __tablename__ = "notification_templates"

    template_id = Column(Integer, primary_key=True, index=True)
    
    # Template identification
    notification_type = Column(Enum(NotificationType), nullable=False, unique=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    
    # Template content (supports variables like {student_name}, {course_title})
    title_template = Column(String(200), nullable=False)
    message_template = Column(Text, nullable=False)
    email_subject_template = Column(String(200), nullable=True)
    email_body_template = Column(Text, nullable=True)
    sms_template = Column(String(160), nullable=True)
    
    # Default settings
    default_priority = Column(Enum(NotificationPriority), default=NotificationPriority.MEDIUM)
    default_channels = Column(String(100), default="in_app,email")  # Comma-separated
    
    # Status
    is_active = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class NotificationLog(Base):
    """Audit log for notification delivery"""
    __tablename__ = "notification_logs"

    log_id = Column(Integer, primary_key=True, index=True)
    notification_id = Column(Integer, ForeignKey("notifications.notification_id"))
    
    # Delivery details
    channel = Column(Enum(NotificationChannel), nullable=False)
    status = Column(String(20), nullable=False)  # sent, failed, pending
    error_message = Column(Text, nullable=True)
    
    # Recipient info
    recipient_email = Column(String(255), nullable=True)
    recipient_phone = Column(String(20), nullable=True)
    
    # External service info
    external_id = Column(String(255), nullable=True)  # ID from email/SMS service
    provider = Column(String(50), nullable=True)  # sendgrid, twilio, etc.
    
    # Timestamps
    attempted_at = Column(DateTime(timezone=True), server_default=func.now())
    delivered_at = Column(DateTime, nullable=True)
    
    # Relationships
    notification = relationship("Notification")
