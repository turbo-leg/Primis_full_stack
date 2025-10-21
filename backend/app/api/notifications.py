"""
Notification API endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.api.auth import get_current_user
from app.services.notification_service import NotificationService
from app.models.notification_models import (
    NotificationType,
    NotificationPriority,
    NotificationChannel
)
from pydantic import BaseModel


router = APIRouter()


# Helper function to extract user_id from current_user
def get_user_id_and_type(current_user: dict) -> tuple:
    """Extract user_id and user_type from current_user dict"""
    user_type = current_user.get('user_type')
    user = current_user.get('user')
    
    if user_type == 'student':
        return user.student_id, user_type
    elif user_type == 'teacher':
        return user.teacher_id, user_type
    elif user_type == 'admin':
        return user.admin_id, user_type
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user type"
        )


# Pydantic schemas

class NotificationResponse(BaseModel):
    notification_id: int
    notification_type: str
    title: str
    message: str
    priority: str
    action_url: Optional[str]
    action_text: Optional[str]
    is_read: bool
    read_at: Optional[datetime]
    created_at: datetime
    related_course_id: Optional[int]
    related_assignment_id: Optional[int]
    
    class Config:
        from_attributes = True


class NotificationCountResponse(BaseModel):
    unread_count: int
    total_count: int


class NotificationPreferenceUpdate(BaseModel):
    notification_type: str
    in_app_enabled: Optional[bool] = None
    email_enabled: Optional[bool] = None
    sms_enabled: Optional[bool] = None
    push_enabled: Optional[bool] = None
    quiet_hours_start: Optional[str] = None
    quiet_hours_end: Optional[str] = None


class NotificationPreferenceResponse(BaseModel):
    preference_id: int
    notification_type: str
    in_app_enabled: bool
    email_enabled: bool
    sms_enabled: bool
    push_enabled: bool
    quiet_hours_start: Optional[str]
    quiet_hours_end: Optional[str]
    
    class Config:
        from_attributes = True


class CreateNotificationRequest(BaseModel):
    user_id: int
    user_type: str
    notification_type: str
    title: str
    message: str
    priority: Optional[str] = "medium"
    action_url: Optional[str] = None
    action_text: Optional[str] = None
    related_course_id: Optional[int] = None


# Endpoints

@router.get("/notifications", response_model=List[NotificationResponse])
async def get_notifications(
    unread_only: bool = Query(False),
    limit: int = Query(50, le=100),
    offset: int = Query(0),
    notification_type: Optional[NotificationType] = Query(None, description="Filter by notification type"),
    priority: Optional[NotificationPriority] = Query(None, description="Filter by notification priority"),
    since: Optional[datetime] = Query(None, description="Return notifications created on or after this timestamp"),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get notifications for current user"""
    
    user_id, user_type = get_user_id_and_type(current_user)
    
    service = NotificationService(db)
    notifications = service.get_user_notifications(
        user_id=user_id,
        user_type=user_type,
        unread_only=unread_only,
        limit=limit,
        offset=offset,
        notification_type=notification_type,
        priority=priority,
        since=since
    )
    
    return notifications


@router.get("/notifications/count", response_model=NotificationCountResponse)
async def get_notification_count(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get notification counts for current user"""
    
    user_id, user_type = get_user_id_and_type(current_user)
    
    service = NotificationService(db)
    unread_count = service.get_unread_count(user_id, user_type)
    
    # Get total (not deleted, not expired)
    total_notifications = service.get_user_notifications(
        user_id=user_id,
        user_type=user_type,
        unread_only=False,
        limit=1000
    )
    
    return {
        "unread_count": unread_count,
        "total_count": len(total_notifications)
    }


@router.put("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark a notification as read"""
    
    user_id, user_type = get_user_id_and_type(current_user)
    
    service = NotificationService(db)
    success = service.mark_as_read(notification_id, user_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    return {"message": "Notification marked as read"}


@router.put("/notifications/read-all")
async def mark_all_notifications_read(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark all notifications as read"""
    
    user_id, user_type = get_user_id_and_type(current_user)
    
    service = NotificationService(db)
    count = service.mark_all_as_read(user_id, user_type)
    
    return {"message": f"Marked {count} notifications as read"}


@router.delete("/notifications/{notification_id}")
async def delete_notification(
    notification_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a notification"""
    
    user_id, user_type = get_user_id_and_type(current_user)
    
    service = NotificationService(db)
    success = service.delete_notification(notification_id, user_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    return {"message": "Notification deleted"}


@router.get("/notifications/preferences", response_model=List[NotificationPreferenceResponse])
async def get_notification_preferences(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get notification preferences for current user"""
    
    user_id, user_type = get_user_id_and_type(current_user)
    
    service = NotificationService(db)
    preferences = service.get_user_preferences(user_id, user_type)
    
    return preferences


@router.put("/notifications/preferences")
async def update_notification_preference(
    preference: NotificationPreferenceUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update notification preference"""
    
    user_id, user_type = get_user_id_and_type(current_user)
    
    # Validate notification type
    try:
        notification_type = NotificationType(preference.notification_type)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid notification type: {preference.notification_type}"
        )
    
    # Build settings dict from non-None values
    settings = {}
    if preference.in_app_enabled is not None:
        settings['in_app_enabled'] = preference.in_app_enabled
    if preference.email_enabled is not None:
        settings['email_enabled'] = preference.email_enabled
    if preference.sms_enabled is not None:
        settings['sms_enabled'] = preference.sms_enabled
    if preference.push_enabled is not None:
        settings['push_enabled'] = preference.push_enabled
    if preference.quiet_hours_start is not None:
        settings['quiet_hours_start'] = preference.quiet_hours_start
    if preference.quiet_hours_end is not None:
        settings['quiet_hours_end'] = preference.quiet_hours_end
    
    service = NotificationService(db)
    updated_preference = service.update_preference(
        user_id=user_id,
        user_type=user_type,
        notification_type=notification_type,
        **settings
    )
    
    return updated_preference


# Admin endpoints

@router.post("/admin/notifications", response_model=NotificationResponse)
async def create_notification_admin(
    request: CreateNotificationRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a notification (admin only)"""
    
    user_id, user_type = get_user_id_and_type(current_user)
    
    if user_type != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    # Validate notification type and priority
    try:
        notification_type = NotificationType(request.notification_type)
        priority = NotificationPriority(request.priority)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid value: {str(e)}"
        )
    
    service = NotificationService(db)
    notification = service.create_notification(
        user_id=request.user_id,
        user_type=request.user_type,
        notification_type=notification_type,
        title=request.title,
        message=request.message,
        priority=priority,
        action_url=request.action_url,
        action_text=request.action_text,
        related_course_id=request.related_course_id
    )
    
    return notification


@router.get("/admin/notifications/types")
async def get_notification_types(
    current_user: dict = Depends(get_current_user)
):
    """Get all available notification types"""
    
    return {
        "types": [
            {
                "value": t.value,
                "name": t.name,
                "category": t.value.split('_')[0]
            }
            for t in NotificationType
        ]
    }

