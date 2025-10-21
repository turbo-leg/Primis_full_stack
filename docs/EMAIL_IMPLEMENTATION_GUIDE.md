# Email System Implementation Guide

## Quick Start

### Step 1: Configure SMTP Credentials

#### For Gmail:

1. Enable 2-Factor Authentication on your Google Account
2. Go to [Google Account Security](https://myaccount.google.com/apppasswords)
3. Select "Mail" and "Windows"
4. Copy the 16-character app password
5. Add to `.env`:

```
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-16-char-app-password
```

#### For Other Email Providers:

- **SendGrid**: `SMTP_SERVER=smtp.sendgrid.net` with API key
- **Mailgun**: `SMTP_SERVER=smtp.mailgun.org`
- **Office 365**: `SMTP_SERVER=smtp.office365.com`

### Step 2: Install Dependencies

```bash
cd backend
pip install -r requirements.txt  # All dependencies already included
# fastapi-mail==1.4.1
# celery==5.3.4
# redis==5.0.1
```

### Step 3: Set Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/college_prep

# Redis
REDIS_URL=redis://localhost:6379

# Email (SMTP)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
MAIL_FROM_NAME=College Prep Platform

# Password Reset
PASSWORD_RESET_URL=http://localhost:3000/reset-password
PASSWORD_RESET_TOKEN_EXPIRE_HOURS=24

# Celery
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
```

### Step 4: Run Database Migration

```bash
cd backend
alembic upgrade head
```

This creates the following tables:

- `password_reset_tokens` - Store password reset tokens
- `email_logs` - Track all sent emails
- `monthly_reports` - Store monthly report data
- `email_preferences` - User email notification preferences
- `email_templates` - Customizable email templates

### Step 5: Start Services

#### Terminal 1: Start Backend API

```bash
cd backend
uvicorn app.main:app --reload
# API running on http://localhost:8000
```

#### Terminal 2: Start Celery Worker

```bash
cd backend
celery -A app.services.celery_app worker --loglevel=info
# Worker running and listening for tasks
```

#### Terminal 3: Start Celery Beat (Optional - for scheduled tasks)

```bash
cd backend
celery -A app.services.celery_app beat --loglevel=info
# Scheduler running
```

#### Terminal 4: Start Frontend (if testing)

```bash
cd frontend
npm run dev -- --port 3001
```

## API Endpoints

### Password Reset Flow

#### 1. Request Password Reset

```bash
POST /api/v1/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}

Response:
{
  "message": "If an account exists with this email, you will receive a password reset link shortly."
}
```

#### 2. Reset Password

```bash
POST /api/v1/auth/reset-password
Content-Type: application/json

{
  "token": "reset-token-from-email",
  "new_password": "NewSecurePassword123!",
  "confirm_password": "NewSecurePassword123!"
}

Response:
{
  "message": "Password reset successfully",
  "token_valid": true
}
```

### Email Preferences

#### Get Email Preferences

```bash
GET /api/v1/auth/email-preferences
Authorization: Bearer <user-token>

Response:
{
  "email": "user@example.com",
  "email_notifications_enabled": true,
  "assignment_notifications": true,
  "grade_notifications": true,
  "attendance_notifications": true,
  "course_announcements": true,
  "digest_frequency": "daily",
  "monthly_report_enabled": true
}
```

#### Update Email Preferences

```bash
PUT /api/v1/auth/email-preferences
Authorization: Bearer <user-token>
Content-Type: application/json

{
  "email_notifications_enabled": true,
  "digest_frequency": "weekly",
  "monthly_report_enabled": false
}

Response:
{
  "message": "Email preferences updated successfully"
}
```

### Admin Email Management

#### Get Email Logs

```bash
GET /api/v1/admin/email-logs?skip=0&limit=50&email_type=password_reset&status=sent
Authorization: Bearer <admin-token>

Response:
[
  {
    "log_id": 1,
    "recipient_email": "user@example.com",
    "subject": "Reset Your Password - College Prep Platform",
    "email_type": "password_reset",
    "status": "sent",
    "sent_at": "2025-01-20T10:30:00Z",
    "attempted_at": "2025-01-20T10:29:00Z"
  }
]
```

#### Get Email Statistics

```bash
GET /api/v1/admin/email-logs/stats
Authorization: Bearer <admin-token>

Response:
{
  "total_sent": 150,
  "total_failed": 5,
  "total_pending": 2,
  "by_type": {
    "password_reset": 10,
    "assignment": 60,
    "grade": 40,
    "notification": 30,
    "report": 10,
    "welcome": 15
  }
}
```

#### Trigger Monthly Reports

```bash
POST /api/v1/admin/trigger-monthly-reports
Authorization: Bearer <admin-token>

Response:
{
  "message": "Monthly reports generation triggered",
  "task_id": "celery-task-id-123"
}
```

## Email Types

### 1. Password Reset

- **Trigger**: User requests password reset
- **Recipients**: User requesting reset
- **Content**: Reset link, token, 24-hour expiration warning
- **Async**: Yes (via Celery task)

### 2. Welcome Email

- **Trigger**: New user account created
- **Recipients**: New user
- **Content**: Account info, login link, join date
- **Async**: Yes

### 3. Assignment Notification

- **Trigger**: Teacher posts new assignment
- **Recipients**: All enrolled students
- **Content**: Assignment title, course, due date
- **Async**: Yes (bulk email)

### 4. Grade Notification

- **Trigger**: Teacher grades assignment
- **Recipients**: Student whose work was graded
- **Content**: Grade, percentage, letter grade, feedback
- **Async**: Yes

### 5. Attendance Summary

- **Trigger**: Manual trigger or scheduled
- **Recipients**: Students in course
- **Content**: Attendance statistics, percentage
- **Async**: Yes

### 6. Monthly Student Report

- **Trigger**: Runs automatically on 1st of month at 8 AM
- **Recipients**: All students
- **Content**: Attendance summary, grades, outstanding assignments
- **Frequency**: Monthly
- **Async**: Yes (queued per student)

### 7. Monthly Teacher Report

- **Trigger**: Runs automatically on 1st of month at 8 AM
- **Recipients**: All teachers
- **Content**: Class statistics, grading summary, student performance
- **Frequency**: Monthly
- **Async**: Yes (queued per teacher)

### 8. Monthly Admin Report

- **Trigger**: Runs automatically on 1st of month at 8 AM
- **Recipients**: All admins
- **Content**: Platform statistics, revenue, user counts
- **Frequency**: Monthly
- **Async**: Yes (queued per admin)

## Scheduled Tasks (Celery Beat)

### Daily Tasks (Run Every Day)

```
- 2:00 AM UTC: Cleanup expired password reset tokens
- 9:00 AM UTC: Send notification digest to users
```

### Monthly Tasks (Run on 1st of Month)

```
- 8:00 AM UTC: Generate and send all monthly reports
  - Student reports (attendance, grades, assignments)
  - Teacher reports (class stats, grading summary)
  - Admin reports (platform overview, revenue)
```

### How to Verify Scheduled Tasks

```python
# Check what tasks are scheduled
from app.services.celery_app import celery_app
print(celery_app.conf.beat_schedule)

# Check task queue
celery -A app.services.celery_app inspect active

# Check scheduled tasks
celery -A app.services.celery_app inspect scheduled
```

## Frontend Integration

### Password Reset Page

```typescript
// src/app/[locale]/reset-password/page.tsx
import ResetPasswordForm from "@/components/ResetPasswordForm";

export default function ResetPasswordPage() {
  // Extract token from URL query params
  // Pass to form component
  // Form submits to POST /api/v1/auth/reset-password
}
```

### Email Preferences in Settings

Already implemented in `src/app/[locale]/dashboard/settings/page.tsx`:

- Toggle email notifications
- Select digest frequency
- Toggle monthly reports
- Save preferences via API

## Troubleshooting

### Issue: "SMTP connection failed"

**Solution**:

1. Verify SMTP credentials in `.env`
2. Check if 2FA is enabled for Gmail
3. Generate new app-specific password
4. Verify firewall allows port 587 (SMTP)

### Issue: "Celery task not running"

**Solution**:

1. Verify Redis is running: `redis-cli ping`
2. Check Celery worker is running: `celery -A app.services.celery_app inspect active`
3. Check worker logs for errors
4. Restart worker: `celery -A app.services.celery_app worker --loglevel=debug`

### Issue: "No Celery app configured"

**Solution**:

```python
# Ensure celery_app is imported in main.py
from app.services.celery_app import celery_app
```

### Issue: "Password reset token always invalid"

**Solution**:

1. Check token hasn't expired (default 24 hours)
2. Verify token hash matches in database
3. Check token status isn't already used
4. Review logs: `SELECT * FROM password_reset_tokens WHERE is_used = false;`

### Issue: "EmailLog not recording sent emails"

**Solution**:

1. Ensure EmailLog model is imported
2. Check database migration ran: `alembic upgrade head`
3. Manually log email in email_service if needed:

```python
log = EmailLog(
    recipient_email=email,
    subject=subject,
    email_type="custom",
    status="sent",
    sent_at=datetime.utcnow()
)
db.add(log)
db.commit()
```

## Testing

### Test Email Sending

```bash
# Via curl
curl -X POST http://localhost:8000/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# Check logs
tail -f logs/celery.log
```

### Test Password Reset

```bash
# 1. Request reset
curl -X POST http://localhost:8000/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "student@example.com"}'

# 2. Check database for token
psql college_prep -c "SELECT * FROM password_reset_tokens ORDER BY created_at DESC LIMIT 1;"

# 3. Use token to reset password
curl -X POST http://localhost:8000/api/v1/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "YOUR_TOKEN_HERE",
    "new_password": "NewPassword123!",
    "confirm_password": "NewPassword123!"
  }'
```

### Test Scheduled Tasks

```bash
# Trigger monthly reports manually
curl -X POST http://localhost:8000/api/v1/admin/trigger-monthly-reports \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Check if reports were generated
psql college_prep -c "SELECT * FROM monthly_reports ORDER BY created_at DESC;"
```

## Security Considerations

1. **Token Security**:

   - Tokens are hashed with SHA256 before storage
   - Never transmitted in plain text in logs
   - 24-hour expiration by default (configurable)
   - One-time use enforced

2. **Rate Limiting**:

   - Max 3 password reset requests per email per hour
   - Prevents brute force attacks

3. **Email Validation**:

   - Always return success message (prevents email enumeration)
   - Actually validates user exists only server-side
   - Uses BCrypt for password hashing

4. **HTTPS Only**:

   - Reset links should only work over HTTPS in production
   - Configure `PASSWORD_RESET_URL` to use HTTPS

5. **SMTP Security**:
   - Uses TLS encryption (port 587)
   - Never expose SMTP credentials in logs
   - Rotate credentials regularly

## Performance Optimization

### Email Queuing

- All emails sent asynchronously via Celery
- Backend responds immediately (fast UX)
- Tasks retried up to 3 times on failure
- Long-running operations don't block API

### Database Queries

- Password reset tokens indexed by email, token_hash, expires_at
- Email logs indexed by recipient, type, status
- Pagination on admin email logs (default limit 50)

### Caching

- Consider caching user email preferences
- Use Redis for session-based token validation

## Next Steps

1. **Test Complete Flow**: Password reset end-to-end
2. **Monitor Email Logs**: Check `/api/v1/admin/email-logs` for any failures
3. **Configure Celery Beat**: Set up supervisor for persistent task scheduling
4. **Set Up Monitoring**: Add email alerts for task failures
5. **Production Deployment**: Use SendGrid, AWS SES, or similar in production
6. **Custom Templates**: Implement email template management in admin panel
7. **A/B Testing**: Track email engagement metrics

## Support

For issues or questions:

1. Check logs: `docker logs backend` or `tail -f logs/app.log`
2. Review Celery tasks: `celery -A app.services.celery_app inspect active`
3. Test SMTP connection: `python -c "import smtplib; smtplib.SMTP('smtp.gmail.com', 587).starttls()"`
4. Check database: `psql college_prep -c "SELECT * FROM email_logs LIMIT 5;"`
