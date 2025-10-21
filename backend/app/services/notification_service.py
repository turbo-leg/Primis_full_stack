"""
Notification Service - Handles creation, delivery, and management of notifications
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from app.models.notification_models import (
    Notification,
    NotificationPreference,
    NotificationTemplate,
    NotificationLog,
    NotificationType,
    NotificationPriority,
    NotificationChannel
)


class NotificationService:
    """Service for managing notifications"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_notification(
        self,
        user_id: int,
        user_type: str,
        notification_type: NotificationType,
        title: str,
        message: str,
        priority: NotificationPriority = NotificationPriority.MEDIUM,
        action_url: Optional[str] = None,
        action_text: Optional[str] = None,
        related_course_id: Optional[int] = None,
        related_assignment_id: Optional[int] = None,
        related_enrollment_id: Optional[int] = None,
        related_payment_id: Optional[int] = None,
        expires_in_days: Optional[int] = None
    ) -> Notification:
        """Create a new notification"""
        
        notification = Notification(
            user_id=user_id,
            user_type=user_type,
            notification_type=notification_type,
            title=title,
            message=message,
            priority=priority,
            action_url=action_url,
            action_text=action_text,
            related_course_id=related_course_id,
            related_assignment_id=related_assignment_id,
            related_enrollment_id=related_enrollment_id,
            related_payment_id=related_payment_id,
            expires_at=datetime.utcnow() + timedelta(days=expires_in_days) if expires_in_days else None
        )
        
        self.db.add(notification)
        self.db.commit()
        self.db.refresh(notification)
        
        # Send via preferred channels
        self._deliver_notification(notification)
        
        return notification
    
    def create_from_template(
        self,
        user_id: int,
        user_type: str,
        notification_type: NotificationType,
        variables: Dict[str, Any],
        **kwargs
    ) -> Notification:
        """Create notification from template with variable substitution"""
        
        template = self.db.query(NotificationTemplate).filter(
            NotificationTemplate.notification_type == notification_type,
            NotificationTemplate.is_active == True
        ).first()
        
        if not template:
            raise ValueError(f"No active template found for {notification_type}")
        
        # Substitute variables in templates
        title = template.title_template.format(**variables)
        message = template.message_template.format(**variables)
        
        return self.create_notification(
            user_id=user_id,
            user_type=user_type,
            notification_type=notification_type,
            title=title,
            message=message,
            priority=template.default_priority,
            **kwargs
        )
    
    def bulk_notify(
        self,
        users: List[Dict[str, Any]],
        notification_type: NotificationType,
        title: str,
        message: str,
        **kwargs
    ) -> List[Notification]:
        """Send notification to multiple users"""
        
        notifications = []
        for user in users:
            notification = self.create_notification(
                user_id=user['user_id'],
                user_type=user['user_type'],
                notification_type=notification_type,
                title=title,
                message=message,
                **kwargs
            )
            notifications.append(notification)
        
        return notifications
    
    def notify_course_students(
        self,
        course_id: int,
        notification_type: NotificationType,
        title: str,
        message: str,
        **kwargs
    ) -> List[Notification]:
        """Notify all students enrolled in a course"""
        
        from app.models.models import Enrollment
        
        enrollments = self.db.query(Enrollment).filter(
            Enrollment.course_id == course_id,
            Enrollment.status == "active"
        ).all()
        
        users = [
            {'user_id': e.student_id, 'user_type': 'student'}
            for e in enrollments
        ]
        
        return self.bulk_notify(
            users=users,
            notification_type=notification_type,
            title=title,
            message=message,
            related_course_id=course_id,
            **kwargs
        )
    
    def get_user_notifications(
        self,
        user_id: int,
        user_type: str,
        unread_only: bool = False,
        limit: int = 50,
        offset: int = 0,
        notification_type: Optional[NotificationType] = None,
        priority: Optional[NotificationPriority] = None,
        since: Optional[datetime] = None
    ) -> List[Notification]:
        """Get notifications for a user with optional filtering"""
        
        query = self.db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.user_type == user_type,
            Notification.is_deleted == False
        )
        
        if unread_only:
            query = query.filter(Notification.is_read == False)

        if notification_type:
            query = query.filter(Notification.notification_type == notification_type)

        if priority:
            query = query.filter(Notification.priority == priority)

        if since:
            query = query.filter(Notification.created_at >= since)
        
        # Filter out expired notifications
        query = query.filter(
            or_(
                Notification.expires_at == None,
                Notification.expires_at > datetime.utcnow()
            )
        )
        
        return query.order_by(
            Notification.created_at.desc()
        ).limit(limit).offset(offset).all()
    
    def get_unread_count(self, user_id: int, user_type: str) -> int:
        """Get count of unread notifications"""
        
        return self.db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.user_type == user_type,
            Notification.is_read == False,
            Notification.is_deleted == False,
            or_(
                Notification.expires_at == None,
                Notification.expires_at > datetime.utcnow()
            )
        ).count()
    
    def mark_as_read(self, notification_id: int, user_id: int) -> bool:
        """Mark notification as read"""
        
        notification = self.db.query(Notification).filter(
            Notification.notification_id == notification_id,
            Notification.user_id == user_id
        ).first()
        
        if notification:
            setattr(notification, 'is_read', True)
            setattr(notification, 'read_at', datetime.utcnow())
            self.db.commit()
            return True
        
        return False
    
    def mark_all_as_read(self, user_id: int, user_type: str) -> int:
        """Mark all notifications as read for a user"""
        
        count = self.db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.user_type == user_type,
            Notification.is_read == False
        ).update({
            'is_read': True,
            'read_at': datetime.utcnow()
        })
        
        self.db.commit()
        return count
    
    def delete_notification(self, notification_id: int, user_id: int) -> bool:
        """Soft delete a notification"""
        
        notification = self.db.query(Notification).filter(
            Notification.notification_id == notification_id,
            Notification.user_id == user_id
        ).first()
        
        if notification:
            setattr(notification, 'is_deleted', True)
            self.db.commit()
            return True
        
        return False
    
    def get_user_preferences(
        self,
        user_id: int,
        user_type: str
    ) -> List[NotificationPreference]:
        """Get notification preferences for a user"""
        
        return self.db.query(NotificationPreference).filter(
            NotificationPreference.user_id == user_id,
            NotificationPreference.user_type == user_type
        ).all()
    
    def update_preference(
        self,
        user_id: int,
        user_type: str,
        notification_type: NotificationType,
        **settings
    ) -> NotificationPreference:
        """Update notification preference"""
        
        preference = self.db.query(NotificationPreference).filter(
            NotificationPreference.user_id == user_id,
            NotificationPreference.user_type == user_type,
            NotificationPreference.notification_type == notification_type
        ).first()
        
        if not preference:
            preference = NotificationPreference(
                user_id=user_id,
                user_type=user_type,
                notification_type=notification_type
            )
            self.db.add(preference)
        
        for key, value in settings.items():
            if hasattr(preference, key):
                setattr(preference, key, value)
        
        self.db.commit()
        self.db.refresh(preference)
        return preference
    
    def _deliver_notification(self, notification: Notification):
        """Deliver notification via configured channels"""
        
        # Get user preferences
        preferences = self.db.query(NotificationPreference).filter(
            NotificationPreference.user_id == notification.user_id,
            NotificationPreference.user_type == notification.user_type,
            NotificationPreference.notification_type == notification.notification_type
        ).first()
        
        channels = []
        
        # Always deliver in-app
        channels.append(NotificationChannel.IN_APP)
        
        # Check preferences for other channels
        if preferences:
            if getattr(preferences, 'email_enabled', False):
                channels.append(NotificationChannel.EMAIL)
                self._send_email_notification(notification)
            
            if getattr(preferences, 'sms_enabled', False):
                channels.append(NotificationChannel.SMS)
                self._send_sms_notification(notification)
            
            if getattr(preferences, 'push_enabled', False):
                channels.append(NotificationChannel.PUSH)
                self._send_push_notification(notification)
        else:
            # Default: send email for high priority
            if notification.priority in [NotificationPriority.HIGH, NotificationPriority.URGENT]:
                channels.append(NotificationChannel.EMAIL)
                self._send_email_notification(notification)
        
        setattr(notification, 'sent_via', ','.join([c.value for c in channels]))
        self.db.commit()
    
    def _send_email_notification(self, notification: Notification):
        """Send email notification (placeholder for actual implementation)"""
        # TODO: Implement with FastAPI-Mail or similar
        log = NotificationLog(
            notification_id=notification.notification_id,
            channel=NotificationChannel.EMAIL,
            status="pending",
            attempted_at=datetime.utcnow()
        )
        self.db.add(log)
        setattr(notification, 'email_sent', True)
        setattr(notification, 'email_sent_at', datetime.utcnow())
        self.db.commit()
    
    def _send_sms_notification(self, notification: Notification):
        """Send SMS notification (placeholder for actual implementation)"""
        # TODO: Implement with Twilio or similar
        log = NotificationLog(
            notification_id=notification.notification_id,
            channel=NotificationChannel.SMS,
            status="pending",
            attempted_at=datetime.utcnow()
        )
        self.db.add(log)
        setattr(notification, 'sms_sent', True)
        setattr(notification, 'sms_sent_at', datetime.utcnow())
        self.db.commit()
    
    def _send_push_notification(self, notification: Notification):
        """Send push notification (placeholder for actual implementation)"""
        # TODO: Implement with Firebase Cloud Messaging or similar
        log = NotificationLog(
            notification_id=notification.notification_id,
            channel=NotificationChannel.PUSH,
            status="pending",
            attempted_at=datetime.utcnow()
        )
        self.db.add(log)
        self.db.commit()


# Helper functions for common notification scenarios

def notify_assignment_created(db: Session, assignment_id: int, course_id: int):
    """Notify students about new assignment"""
    from app.models.models import Assignment
    
    assignment = db.query(Assignment).filter(Assignment.assignment_id == assignment_id).first()
    if not assignment:
        return
    
    service = NotificationService(db)
    service.notify_course_students(
        course_id=course_id,
        notification_type=NotificationType.ASSIGNMENT_CREATED,
        title="New Assignment Posted",
        message=f"A new assignment '{assignment.title}' has been posted. Due: {assignment.due_date.strftime('%B %d, %Y')}",
        priority=NotificationPriority.MEDIUM,
        action_url=f"/dashboard/student/assignments/{assignment_id}",
        action_text="View Assignment",
        related_assignment_id=assignment_id
    )


def notify_payment_due(db: Session, enrollment_id: int, student_id: int, amount: float, due_date: datetime):
    """Notify student about payment due"""
    service = NotificationService(db)
    service.create_notification(
        user_id=student_id,
        user_type="student",
        notification_type=NotificationType.PAYMENT_DUE,
        title="Payment Due",
        message=f"Your payment of ₮{amount:,.0f} is due on {due_date.strftime('%B %d, %Y')}",
        priority=NotificationPriority.HIGH,
        action_url=f"/dashboard/student/payments",
        action_text="Make Payment",
        related_enrollment_id=enrollment_id
    )


def notify_attendance_marked(db: Session, student_id: int, course_id: int, status: str):
    """Notify student about attendance"""
    service = NotificationService(db)
    
    status_emoji = {"present": "✅", "absent": "❌", "late": "⏰", "excused": "📝"}
    
    service.create_notification(
        user_id=student_id,
        user_type="student",
        notification_type=NotificationType.ATTENDANCE_MARKED,
        title="Attendance Marked",
        message=f"{status_emoji.get(status, '')} Your attendance has been marked as {status.upper()}",
        priority=NotificationPriority.LOW,
        related_course_id=course_id
    )
