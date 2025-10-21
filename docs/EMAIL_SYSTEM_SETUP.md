# Email System Setup Guide

## Overview

Comprehensive email system for password reset, notifications, and monthly reports using FastAPI, FastMail, and Celery.

## Components

### 1. Database Models (Email Tracking)

- `PasswordResetToken` - Store password reset tokens with expiration
- `EmailLog` - Track all sent emails for audit and debugging
- `MonthlyReport` - Schedule and track monthly report generations

### 2. Email Service (`backend/app/services/email_service.py`)

Enhanced with:

- Password reset email with secure token
- Notification digest emails
- Monthly student/teacher reports
- Admin summary emails
- Template management

### 3. Background Tasks (Celery)

- `send_password_reset_email()` - Send password reset link
- `send_monthly_reports()` - Generate and send monthly reports
- `send_notification_digest()` - Batch send notifications
- `cleanup_expired_tokens()` - Remove expired reset tokens

### 4. API Endpoints

- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password with token
- `POST /api/v1/admin/send-reports` - Trigger monthly reports (Admin only)
- `GET /api/v1/admin/email-logs` - View email logs (Admin only)

### 5. Environment Variables

```
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
MAIL_FROM_NAME=College Prep Platform

# Password Reset
PASSWORD_RESET_TOKEN_EXPIRE_HOURS=24
PASSWORD_RESET_URL=http://localhost:3000/reset-password

# Celery
CELERY_BROKER_URL=redis://localhost:6379
CELERY_RESULT_BACKEND=redis://localhost:6379
```

## Email Templates

### 1. Password Reset

- Subject: "Reset Your Password - College Prep Platform"
- Contains: Reset link with 24-hour expiration, alternative text instructions
- Recipients: User who requested reset

### 2. Notification Digest

- Subject: "Your Updates - College Prep Platform"
- Contains: Summary of daily/weekly notifications
- Recipients: Users with email notifications enabled
- Frequency: Daily at 9 AM

### 3. Monthly Report - Student

- Subject: "Your Monthly Report - [Month] [Year]"
- Contains:
  - Attendance summary (total classes, present, absent)
  - Grade summary (assignments completed, average grade)
  - Outstanding assignments (due this month)
  - Course progress

### 4. Monthly Report - Teacher

- Subject: "Your Monthly Report - [Month] [Year]"
- Contains:
  - Class statistics (students, assignments posted)
  - Grading summary (assignments graded, pending)
  - Class engagement metrics
  - Student performance analysis

### 5. Monthly Report - Admin

- Subject: "Platform Monthly Report - [Month] [Year]"
- Contains:
  - Total active users (students, teachers, admins)
  - Course statistics (active courses, enrollments)
  - Revenue/payment summary
  - System health metrics
  - Top performers

## Setup Instructions

### 1. Gmail Configuration (Recommended)

1. Enable 2FA on Google Account
2. Create App Password: myaccount.google.com/apppasswords
3. Generate 16-character password for "Mail" and "Windows"
4. Use this as SMTP_PASSWORD

### 2. Environment Setup

```bash
# Create .env file in backend directory
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-16-char-app-password
MAIL_FROM_NAME=College Prep Platform
PASSWORD_RESET_TOKEN_EXPIRE_HOURS=24
PASSWORD_RESET_URL=http://localhost:3000/reset-password
CELERY_BROKER_URL=redis://localhost:6379
CELERY_RESULT_BACKEND=redis://localhost:6379
```

### 3. Database Migration

Run Alembic migration to create email-related tables:

```bash
alembic revision --autogenerate -m "Add email system tables"
alembic upgrade head
```

### 4. Start Celery Worker

```bash
# In backend directory
celery -A app.services.celery_app worker --loglevel=info
```

### 5. Start Backend

```bash
uvicorn app.main:app --reload
```

## Usage Examples

### Frontend - Password Reset Flow

```typescript
// Step 1: Request reset
const response = await apiClient.post("/api/v1/auth/forgot-password", {
  email: "user@example.com",
});
// User receives email with reset link

// Step 2: Click link and reset password
const response = await apiClient.post("/api/v1/auth/reset-password", {
  token: "reset-token-from-email",
  new_password: "new-password",
  confirm_password: "new-password",
});
```

### Admin - Trigger Monthly Reports

```bash
# Via API
POST /api/v1/admin/send-reports
Authorization: Bearer <admin-token>

# Or schedule with Celery Beat
# Runs automatically on first day of month
```

## File Structure

```
backend/
├── app/
│   ├── models/
│   │   ├── models.py (existing)
│   │   └── email_models.py (NEW - PasswordResetToken, EmailLog, MonthlyReport)
│   ├── services/
│   │   ├── email_service.py (UPDATED - enhanced with new methods)
│   │   └── celery_app.py (NEW - Celery configuration and tasks)
│   ├── api/
│   │   ├── auth.py (UPDATED - password reset endpoints)
│   │   ├── admin.py (UPDATED - email log endpoints)
│   │   └── schemas.py (UPDATED - new schemas for reset/reports)
│   └── core/
│       └── config.py (UPDATED - new email configuration)
├── alembic/versions/
│   └── [new migration file] (NEW)
└── .env.example (NEW)
```

## Security Considerations

1. **Tokens**: Generated with secrets.token_urlsafe(32), hashed with SHA256 before storage
2. **Expiration**: Default 24 hours, configurable
3. **Rate Limiting**: Max 3 reset requests per hour per email
4. **Hashing**: Store token hash in DB, never plain text
5. **HTTPS Only**: Reset links should only work over HTTPS in production
6. **CSRF Protection**: Include token validation

## Testing

```bash
# Send test email
curl -X POST http://localhost:8000/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# Reset password with token
curl -X POST http://localhost:8000/api/v1/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "reset-token",
    "new_password": "newpass123",
    "confirm_password": "newpass123"
  }'

# Get email logs
curl -X GET http://localhost:8000/api/v1/admin/email-logs \
  -H "Authorization: Bearer admin-token"
```

## Troubleshooting

### Emails Not Sending

1. Check SMTP credentials in .env
2. Ensure fastapi-mail is installed: `pip install fastapi-mail`
3. Check Gmail app password (not account password)
4. Verify SMTP_SERVER and SMTP_PORT correct
5. Check backend logs for errors

### Celery Not Working

1. Ensure Redis is running on localhost:6379
2. Start Celery worker: `celery -A app.services.celery_app worker --loglevel=info`
3. Check celery logs for errors
4. Verify CELERY_BROKER_URL and CELERY_RESULT_BACKEND in .env

### Tokens Expired

1. Adjust PASSWORD_RESET_TOKEN_EXPIRE_HOURS in .env
2. Cleanup job removes expired tokens daily
3. User can request new reset link if token expired

## Next Steps

1. Configure SMTP credentials
2. Run database migrations
3. Start Celery worker
4. Test password reset flow
5. Test monthly report generation
6. Configure email preferences in user settings
