# 🔔 Notification System Documentation

## Overview

A comprehensive, role-agnostic notification system that sends personalized notifications to all user types (Students, Teachers, Parents, and Admins) through multiple channels.

## Features

### ✅ Multi-Channel Delivery

- **In-App**: Real-time notifications within the application
- **Email**: Email notifications for important updates
- **SMS**: Text message notifications (for urgent items)
- **Push**: Mobile push notifications (future)

### ✅ Personalized by Role

- Each user type receives relevant notifications
- Customizable preferences per notification type
- Role-specific notification types

### ✅ Priority Levels

- **LOW**: General information
- **MEDIUM**: Standard notifications
- **HIGH**: Important updates
- **URGENT**: Critical alerts

### ✅ Smart Features

- Quiet hours support
- Digest mode (batch notifications)
- Expiration dates
- Read/unread tracking
- Soft delete
- Action buttons with deep links

## Architecture

### Database Models

#### 1. **Notification**

Main notification storage

```python
- notification_id (PK)
- user_id, user_type (recipient)
- notification_type (enum)
- title, message
- priority
- action_url, action_text
- related entities (course_id, assignment_id, etc.)
- is_read, read_at
- sent_via (channels used)
- created_at, expires_at
```

#### 2. **NotificationPreference**

User preferences per notification type

```python
- preference_id (PK)
- user_id, user_type
- notification_type
- in_app_enabled, email_enabled, sms_enabled, push_enabled
- quiet_hours_start, quiet_hours_end
- digest_mode, digest_frequency
```

#### 3. **NotificationTemplate**

Reusable templates with variable substitution

```python
- template_id (PK)
- notification_type (unique)
- title_template, message_template
- email_subject_template, email_body_template
- sms_template
- default_priority, default_channels
```

#### 4. **NotificationLog**

Delivery audit trail

```python
- log_id (PK)
- notification_id (FK)
- channel, status
- recipient_email, recipient_phone
- external_id, provider
- attempted_at, delivered_at
```

## Notification Types

### 📚 Academic

- `ASSIGNMENT_CREATED` - New assignment posted
- `ASSIGNMENT_GRADED` - Assignment graded
- `ASSIGNMENT_DUE_SOON` - Assignment deadline approaching
- `COURSE_UPDATE` - Course information updated
- `GRADE_POSTED` - New grade available

### 📊 Attendance

- `ATTENDANCE_MARKED` - Attendance recorded
- `ATTENDANCE_WARNING` - Low attendance alert
- `ABSENCE_REPORTED` - Absence notification

### 💰 Payment

- `PAYMENT_DUE` - Payment deadline approaching
- `PAYMENT_RECEIVED` - Payment confirmed
- `PAYMENT_OVERDUE` - Overdue payment
- `PAYMENT_REMINDER` - Payment reminder

### 📝 Enrollment

- `ENROLLMENT_APPROVED` - Enrollment confirmed
- `ENROLLMENT_REJECTED` - Enrollment denied
- `COURSE_FULL` - Course capacity reached
- `WAITLIST_AVAILABLE` - Spot available from waitlist

### 💬 Communication

- `ANNOUNCEMENT` - General announcement
- `MESSAGE_RECEIVED` - New message
- `CHAT_MENTION` - Mentioned in chat

### 📅 Calendar

- `EVENT_REMINDER` - Upcoming event
- `CLASS_CANCELLED` - Class cancellation
- `SCHEDULE_CHANGE` - Schedule modified

### ⚙️ System

- `ACCOUNT_CREATED` - Welcome notification
- `PASSWORD_RESET` - Password reset link
- `PROFILE_UPDATED` - Profile changes confirmed
- `SYSTEM_MAINTENANCE` - Maintenance announcement

### 👨‍💼 Admin Specific

- `NEW_ENROLLMENT` - New student enrolled
- `PAYMENT_PENDING` - Payment awaiting approval
- `LOW_ATTENDANCE_ALERT` - Student attendance issue

## API Endpoints

### User Endpoints

#### GET `/api/v1/notifications`

Get notifications for current user

```typescript
Query Parameters:
- unread_only: boolean (default: false)
- limit: number (default: 50, max: 100)
- offset: number (default: 0)

Response: NotificationResponse[]
```

#### GET `/api/v1/notifications/count`

Get notification counts

```typescript
Response: {
  unread_count: number;
  total_count: number;
}
```

#### PUT `/api/v1/notifications/{id}/read`

Mark notification as read

```typescript
Response: {
  message: string;
}
```

#### PUT `/api/v1/notifications/read-all`

Mark all as read

```typescript
Response: {
  message: string;
}
```

#### DELETE `/api/v1/notifications/{id}`

Delete notification (soft delete)

```typescript
Response: {
  message: string;
}
```

### Preference Endpoints

#### GET `/api/v1/notifications/preferences`

Get user preferences

```typescript
Response: NotificationPreferenceResponse[]
```

#### PUT `/api/v1/notifications/preferences`

Update preference

```typescript
Request: {
  notification_type: string
  in_app_enabled?: boolean
  email_enabled?: boolean
  sms_enabled?: boolean
  push_enabled?: boolean
  quiet_hours_start?: string  // "22:00"
  quiet_hours_end?: string    // "08:00"
}

Response: NotificationPreferenceResponse
```

### Admin Endpoints

#### POST `/api/v1/admin/notifications`

Create notification (admin only)

```typescript
Request: {
  user_id: number
  user_type: string
  notification_type: string
  title: string
  message: string
  priority?: string
  action_url?: string
  action_text?: string
  related_course_id?: number
}

Response: NotificationResponse
```

#### GET `/api/v1/admin/notifications/types`

Get all notification types

```typescript
Response: {
  types: Array<{
    value: string;
    name: string;
    category: string;
  }>;
}
```

## Usage Examples

### Creating Notifications

#### 1. Simple Notification

```python
from app.services.notification_service import NotificationService
from app.models.notification_models import NotificationType, NotificationPriority

service = NotificationService(db)
notification = service.create_notification(
    user_id=123,
    user_type="student",
    notification_type=NotificationType.ANNOUNCEMENT,
    title="Important Update",
    message="Classes will start 30 minutes late tomorrow.",
    priority=NotificationPriority.HIGH
)
```

#### 2. With Action Button

```python
notification = service.create_notification(
    user_id=123,
    user_type="student",
    notification_type=NotificationType.ASSIGNMENT_CREATED,
    title="New Assignment: Python Basics",
    message="A new assignment has been posted. Due: Oct 20, 2025",
    priority=NotificationPriority.MEDIUM,
    action_url="/dashboard/student/assignments/456",
    action_text="View Assignment",
    related_assignment_id=456,
    related_course_id=789
)
```

#### 3. From Template

```python
notification = service.create_from_template(
    user_id=123,
    user_type="student",
    notification_type=NotificationType.PAYMENT_DUE,
    variables={
        "student_name": "John Doe",
        "amount": "₮150,000",
        "due_date": "October 25, 2025"
    },
    related_enrollment_id=456
)
```

#### 4. Bulk Notify (Multiple Users)

```python
users = [
    {'user_id': 1, 'user_type': 'student'},
    {'user_id': 2, 'user_type': 'student'},
    {'user_id': 3, 'user_type': 'student'}
]

notifications = service.bulk_notify(
    users=users,
    notification_type=NotificationType.ANNOUNCEMENT,
    title="Class Cancelled",
    message="Tomorrow's class is cancelled due to weather.",
    priority=NotificationPriority.URGENT
)
```

#### 5. Notify All Course Students

```python
notifications = service.notify_course_students(
    course_id=789,
    notification_type=NotificationType.COURSE_UPDATE,
    title="Course Schedule Changed",
    message="The class time has been moved to 2:00 PM.",
    priority=NotificationPriority.HIGH
)
```

### Helper Functions

Pre-built notification helpers are available:

```python
from app.services.notification_service import (
    notify_assignment_created,
    notify_payment_due,
    notify_attendance_marked
)

# Notify about new assignment
notify_assignment_created(db, assignment_id=456, course_id=789)

# Notify about payment due
notify_payment_due(
    db,
    enrollment_id=123,
    student_id=456,
    amount=150000,
    due_date=datetime(2025, 10, 25)
)

# Notify about attendance
notify_attendance_marked(
    db,
    student_id=456,
    course_id=789,
    status="present"
)
```

## Frontend Integration

### React Hook Example

```typescript
// hooks/useNotifications.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";

export function useNotifications(unreadOnly = false) {
  return useQuery({
    queryKey: ["notifications", unreadOnly],
    queryFn: () =>
      apiClient.get("/api/v1/notifications", {
        params: { unread_only: unreadOnly },
      }),
  });
}

export function useNotificationCount() {
  return useQuery({
    queryKey: ["notificationCount"],
    queryFn: () => apiClient.get("/api/v1/notifications/count"),
    refetchInterval: 30000, // Poll every 30 seconds
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: number) =>
      apiClient.put(`/api/v1/notifications/${notificationId}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries(["notifications"]);
      queryClient.invalidateQueries(["notificationCount"]);
    },
  });
}
```

### Notification Bell Component

```typescript
// components/NotificationBell.tsx
import { Bell } from "lucide-react";
import { useNotificationCount } from "@/hooks/useNotifications";

export function NotificationBell() {
  const { data } = useNotificationCount();

  return (
    <button className="relative">
      <Bell className="w-6 h-6" />
      {data?.unread_count > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {data.unread_count > 9 ? "9+" : data.unread_count}
        </span>
      )}
    </button>
  );
}
```

## Migration Setup

Generate migration for notification tables:

```bash
cd backend

# Generate migration
python scripts/migrate.py create "Add notification system"

# Apply migration
python scripts/migrate.py upgrade
```

Or with Docker:

```bash
docker-compose exec backend alembic revision --autogenerate -m "Add notification system"
docker-compose exec backend alembic upgrade head
```

## Database Seeding (Optional)

Seed default notification templates:

```python
# scripts/seed_notification_templates.py
from app.core.database import SessionLocal
from app.models.notification_models import NotificationTemplate, NotificationType, NotificationPriority

db = SessionLocal()

templates = [
    {
        "notification_type": NotificationType.ASSIGNMENT_CREATED,
        "name": "New Assignment",
        "title_template": "New Assignment: {assignment_title}",
        "message_template": "A new assignment '{assignment_title}' has been posted. Due: {due_date}",
        "email_subject_template": "New Assignment Posted - {course_title}",
        "default_priority": NotificationPriority.MEDIUM
    },
    {
        "notification_type": NotificationType.PAYMENT_DUE,
        "name": "Payment Due",
        "title_template": "Payment Due",
        "message_template": "Your payment of {amount} is due on {due_date}",
        "email_subject_template": "Payment Reminder - {amount} Due",
        "sms_template": "Payment due: {amount} by {due_date}",
        "default_priority": NotificationPriority.HIGH
    }
    # Add more templates...
]

for template_data in templates:
    template = NotificationTemplate(**template_data)
    db.add(template)

db.commit()
print("✅ Notification templates seeded")
```

## Best Practices

1. **Always provide action URLs** for notifications that require user interaction
2. **Use appropriate priority levels** - reserve URGENT for critical alerts
3. **Include related entity IDs** for context and filtering
4. **Set expiration dates** for time-sensitive notifications
5. **Respect user preferences** - check before sending
6. **Use templates** for consistency and easy updates
7. **Log all deliveries** for debugging and analytics
8. **Handle failures gracefully** - retry logic for email/SMS
9. **Batch notifications** when possible to reduce noise
10. **Test with different roles** to ensure relevance

## Future Enhancements

- 🔄 Real-time WebSocket notifications
- 📱 Mobile push notifications (Firebase)
- 🤖 AI-powered notification summaries
- 📈 Analytics dashboard for notification effectiveness
- 🌍 Multi-language support
- 🔔 Custom notification sounds
- 📊 A/B testing for notification content
- 🎯 Advanced targeting and segmentation

## Troubleshooting

### Notifications not appearing?

1. Check user preferences are enabled
2. Verify notification hasn't expired
3. Check `is_deleted` flag
4. Confirm user_id and user_type match

### Email/SMS not sending?

1. Check `NotificationLog` for errors
2. Verify email/SMS service configuration
3. Ensure user has email/phone in database
4. Check quiet hours settings

### Too many notifications?

1. Enable digest mode for user
2. Adjust notification priorities
3. Review and disable unwanted types
4. Implement notification grouping

---

**Created**: October 14, 2025  
**Version**: 1.0.0  
**Status**: ✅ Ready for use
