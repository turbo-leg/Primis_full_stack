# Email System Testing Guide

## Prerequisites

Before testing, ensure all services are running:

### 1. Start PostgreSQL Database

```bash
# If using Docker
docker-compose up -d postgres

# Or if PostgreSQL is installed locally
# Windows: Start PostgreSQL service from Services
```

### 2. Start Redis (for Celery)

```bash
# If using Docker
docker-compose up -d redis

# Or if Redis is installed locally
# Download from: https://github.com/microsoftarchive/redis/releases
# Or use Windows Subsystem for Linux (WSL)
redis-server
```

### 3. Start Backend API

```bash
cd backend
& "C:/Users/tubul/OneDrive/Documents/Primis/.venv/Scripts/python.exe" -m uvicorn app.main:app --reload --port 8000
```

### 4. Start Celery Worker (in a new terminal)

```bash
cd backend
& "C:/Users/tubul/OneDrive/Documents/Primis/.venv/Scripts/celery.exe" -A app.services.celery_app worker --loglevel=info
```

### 5. Start Celery Beat (for scheduled tasks, in another terminal)

```bash
cd backend
& "C:/Users/tubul/OneDrive/Documents/Primis/.venv/Scripts/celery.exe" -A app.services.celery_app beat --loglevel=info
```

### 6. Start Frontend Development Server

```bash
cd frontend
npm run dev
```

All services should now be running on:

- **Backend API**: http://localhost:8000
- **Frontend**: http://localhost:3000
- **API Docs**: http://localhost:8000/docs

---

## Testing Password Reset Flow

### Test 1: Request Password Reset

**On the Website:**

1. Navigate to: `http://localhost:3000/forgot-password`
2. Enter your email address (e.g., `student@example.com`)
3. Click "Send Reset Link"
4. You should see: "Check your email for password reset instructions"

**In Backend Logs:**

- You should see Celery task queued
- If using real Gmail, check your inbox

**Using API:**

```bash
curl -X POST "http://localhost:8000/api/v1/auth/forgot-password" \
  -H "Content-Type: application/json" \
  -d '{"email": "student@example.com"}'
```

**Expected Response:**

```json
{
  "message": "Password reset email sent successfully",
  "email": "student@example.com"
}
```

---

### Test 2: Check Email Logs (Admin)

**Using API:**

```bash
curl -X GET "http://localhost:8000/api/v1/admin/email-logs" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Expected Response:**

```json
{
  "total": 1,
  "logs": [
    {
      "log_id": "uuid",
      "recipient_email": "student@example.com",
      "subject": "Password Reset Request",
      "email_type": "password_reset",
      "status": "sent",
      "sent_at": "2025-10-20T12:00:00",
      "retry_count": 0
    }
  ]
}
```

---

### Test 3: Get Reset Token from Gmail

**Steps:**

1. Go to your Gmail inbox (tubulol12345@gmail.com)
2. Look for an email from "College Prep Platform"
3. Subject: "Password Reset Request"
4. Click the reset link in the email, or copy the token from the link

**Email Format:**

```
Password Reset Email

Dear [User Name],

You requested a password reset. Click the button below to reset your password:

[RESET PASSWORD BUTTON]
http://localhost:3000/reset-password?token=YOUR_TOKEN_HERE

This link will expire in 24 hours.

If you didn't request this, you can ignore this email.

---
College Prep Platform
```

---

### Test 4: Reset Password

**Option A: Using the Email Link**

1. Click the reset link from the email
2. You'll be taken to: `http://localhost:3000/reset-password?token=YOUR_TOKEN`
3. Enter your new password (minimum 8 characters)
4. Confirm password
5. Click "Reset Password"
6. You should see: "Password reset successful! Redirecting to login..."
7. Should redirect to login page after 2 seconds

**Option B: Using API**

```bash
curl -X POST "http://localhost:8000/api/v1/auth/reset-password" \
  -H "Content-Type: application/json" \
  -d {
    "token": "YOUR_TOKEN_FROM_EMAIL",
    "new_password": "NewPassword123!"
  }
```

**Expected Response:**

```json
{
  "message": "Password reset successful",
  "user_id": "uuid"
}
```

**Verify Password Changed:**

- Try logging in with old password (should fail)
- Try logging in with new password (should succeed)

---

## Testing Email Preferences

### Test 5: Get Email Preferences

**Using API:**

```bash
curl -X GET "http://localhost:8000/api/v1/auth/email-preferences" \
  -H "Authorization: Bearer YOUR_USER_TOKEN"
```

**Expected Response:**

```json
{
  "user_id": "uuid",
  "email": "student@example.com",
  "email_notifications_enabled": true,
  "assignment_notifications": true,
  "grade_notifications": true,
  "attendance_notifications": true,
  "course_announcements": true,
  "digest_frequency": "immediate",
  "monthly_report_enabled": true
}
```

### Test 6: Update Email Preferences

**Using API:**

```bash
curl -X PUT "http://localhost:8000/api/v1/auth/email-preferences" \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d {
    "email_notifications_enabled": false,
    "digest_frequency": "daily",
    "monthly_report_enabled": false
  }
```

**Expected Response:**

```json
{
  "message": "Email preferences updated successfully",
  "preferences": {
    "user_id": "uuid",
    "email_notifications_enabled": false,
    "digest_frequency": "daily"
  }
}
```

---

## Testing Admin Features

### Test 7: View Email Statistics

**Using API:**

```bash
curl -X GET "http://localhost:8000/api/v1/admin/email-logs/stats" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Expected Response:**

```json
{
  "total_emails": 5,
  "by_type": {
    "password_reset": 2,
    "assignment_notification": 1,
    "grade_notification": 1,
    "monthly_report": 1
  },
  "by_status": {
    "sent": 4,
    "failed": 1,
    "pending": 0
  },
  "sent_today": 3,
  "failed_today": 0
}
```

### Test 8: Trigger Monthly Reports

**Using API:**

```bash
curl -X POST "http://localhost:8000/api/v1/admin/trigger-monthly-reports" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Expected Response:**

```json
{
  "message": "Monthly report generation initiated",
  "students_queued": 15,
  "teachers_queued": 5,
  "admins_queued": 1
}
```

**In Celery Logs:**

- You should see tasks queued for report generation
- Reports will be generated and sent asynchronously

---

## Troubleshooting

### Issue: "Email service is disabled"

**Solution:** Check that SMTP credentials are in `.env`:

```bash
SMTP_USER=tubulol12345@gmail.com
SMTP_PASSWORD=ftldbknzkbgngzqn
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
```

### Issue: Emails not received

**Troubleshooting:**

1. Check Gmail inbox and spam folder
2. Verify Celery worker is running (`celery -A app.services.celery_app worker`)
3. Check backend logs for email sending errors
4. Verify Redis is running (for Celery broker)

**Check Email Logs in Database:**

```bash
curl -X GET "http://localhost:8000/api/v1/admin/email-logs?status=failed" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Issue: Token expired errors

- Tokens expire after 24 hours (configurable in `.env`)
- User must request new reset link if expired
- Expired tokens are cleaned up daily at 2 AM UTC

### Issue: Rate limiting (too many reset requests)

- Limited to 3 password reset requests per email per hour
- User should wait before requesting new link
- Limit can be adjusted in `app/api/email_routes.py`

---

## Testing Checklist

- [ ] Backend API running on http://localhost:8000
- [ ] PostgreSQL database connected
- [ ] Redis running for Celery
- [ ] Celery worker running
- [ ] Frontend running on http://localhost:3000
- [ ] Can access `/forgot-password` page
- [ ] Can request password reset
- [ ] Email received in Gmail inbox
- [ ] Can click reset link
- [ ] Can reset password successfully
- [ ] Can login with new password
- [ ] Old password no longer works
- [ ] Email log shows sent status
- [ ] Email preferences can be updated
- [ ] Admin can view email statistics

---

## Getting Auth Tokens for API Testing

### For Student/Parent/Teacher:

```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d {
    "email": "student@example.com",
    "password": "password123"
  }
```

Response includes `access_token` - use this in subsequent requests:

```bash
-H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### For Admin:

```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d {
    "email": "admin@example.com",
    "password": "adminpassword"
  }
```

---

## API Documentation

Once backend is running, visit: **http://localhost:8000/docs**

This shows interactive API documentation where you can:

- See all endpoints
- Test endpoints directly in the browser
- See request/response schemas
- Get detailed parameter descriptions

Look for endpoints under these tags:

- **authentication** - Login, logout, etc.
- **email** - Password reset, preferences
- **admin** - Email logs, statistics

---

## Next Steps After Testing

Once email system is verified working:

1. **Deploy to production**: Update URLs in `.env` to use HTTPS
2. **Switch email provider**: Consider using SendGrid or AWS SES for production
3. **Monitor emails**: Set up email delivery monitoring
4. **User communication**: Notify users about password reset feature
5. **Scheduled reports**: Verify monthly reports run on schedule (1st of month at 8 AM UTC)
