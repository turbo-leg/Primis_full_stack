# Init file for models module
from .models import (
    Student,
    Teacher,
    Admin,
    Parent,
    Course,
    Enrollment,
    Material,
    ClassChat,
    ChatMessage,
    Announcement,
    Assignment,
    AssignmentSubmission,
    Attendance,
    Payment,
    CalendarEvent,
    parent_student_association,
    teacher_course_association,
)

from .notification_models import (
    Notification,
    NotificationPreference,
    NotificationTemplate,
    NotificationLog,
    NotificationType,
    NotificationPriority,
    NotificationChannel,
)

from .email_models import (
    PasswordResetToken,
    EmailLog,
    MonthlyReport,
    EmailPreference,
    EmailTemplate,
    EmailStatusEnum,
)