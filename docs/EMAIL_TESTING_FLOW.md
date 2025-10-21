# Email System Testing Flow

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER BROWSER                              │
│                   (http://localhost:3000)                        │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Frontend (Next.js)                                     │   │
│  │  ┌──────────────────┐         ┌──────────────────┐     │   │
│  │  │ ForgotPassword   │────────→│ ResetPassword    │     │   │
│  │  │ Page             │         │ Page             │     │   │
│  │  └──────────────────┘         └──────────────────┘     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                    ↓                              ↑              │
│                                                                   │
└────────────────────┼──────────────────────────────┼──────────────┘
                     │                              │
                     ↓                              ↑
        ┌────────────────────────────────────────────────┐
        │        Backend API (FastAPI)                   │
        │      (http://localhost:8000)                   │
        │                                                │
        │  ┌──────────────────────────────────────────┐ │
        │  │  Email Routes                           │ │
        │  │  • POST /forgot-password                │ │
        │  │  • POST /reset-password                 │ │
        │  │  • GET/PUT /email-preferences           │ │
        │  │  • GET /admin/email-logs                │ │
        │  └──────────────────────────────────────────┘ │
        │                     ↓                          │
        │  ┌──────────────────────────────────────────┐ │
        │  │  Email Service                          │ │
        │  │  • Generate reset tokens                │ │
        │  │  • Queue email tasks                    │ │
        │  │  • Verify tokens                        │ │
        │  └──────────────────────────────────────────┘ │
        │                     ↓                          │
        │  ┌──────────────────────────────────────────┐ │
        │  │  Database (PostgreSQL)                  │ │
        │  │  • password_reset_tokens table          │ │
        │  │  • email_logs table                     │ │
        │  │  • email_preferences table              │ │
        │  │  • monthly_reports table                │ │
        │  └──────────────────────────────────────────┘ │
        └────────────────────┬─────────────────────────┘
                             │
                             ↓
        ┌────────────────────────────────────────────────┐
        │        Task Queue (Redis)                      │
        │      (localhost:6379)                          │
        │                                                │
        │  • Email sending tasks                        │
        │  • Report generation tasks                    │
        └────────────────────┬─────────────────────────┘
                             │
                    ┌────────┴────────┐
                    ↓                 ↓
        ┌─────────────────────┐  ┌──────────────────────┐
        │  Celery Worker      │  │  Celery Beat         │
        │  (Task Processor)   │  │  (Scheduler)         │
        │                     │  │                      │
        │ • Send emails async │  │ • Daily cleanup      │
        │ • Generate reports  │  │ • Monthly reports    │
        │ • Retry on failure  │  │ • Daily digests      │
        └──────────┬──────────┘  └──────────────────────┘
                   │
                   ↓
        ┌─────────────────────────────────────────────────┐
        │  Email Service (SMTP via FastMail)              │
        │  • Gmail SMTP (smtp.gmail.com:587)              │
        │  • tubulol12345@gmail.com                       │
        └──────────────────┬─────────────────────────────┘
                           │
                           ↓
                    ┌──────────────┐
                    │ Gmail Inbox  │
                    │ (Real Email) │
                    └──────────────┘
```

## Testing Flow - Password Reset

```
USER
  │
  ├─→ 1. Visit http://localhost:3000/forgot-password
  │
  ├─→ 2. Enter email and click "Send Reset Link"
  │       [FRONTEND]
  │         │
  │         ├─→ Validates email format
  │         │
  │         └─→ POST /api/v1/auth/forgot-password
  │              │
  │              ↓
  │         [BACKEND API]
  │              │
  │              ├─→ Validate email exists
  │              │
  │              ├─→ Generate secure token
  │              │
  │              ├─→ Save token to database
  │              │
  │              └─→ Queue email task to Celery
  │                   │
  │                   ↓
  │              [REDIS QUEUE]
  │                   │
  │                   ├─→ [CELERY WORKER]
  │                   │      │
  │                   │      ├─→ Read token from DB
  │                   │      │
  │                   │      ├─→ Create HTML email
  │                   │      │
  │                   │      └─→ Send via Gmail SMTP
  │                   │           │
  │                   │           ↓
  │                   │      [GMAIL SERVER]
  │                   │           │
  │                   │           └─→ Email delivered!
  │                   │
  │                   └─→ Log email status in DB
  │
  ├─→ 3. Response: "Check your email"
  │       [FRONTEND shows success message]
  │
  ├─→ 4. Check Gmail inbox
  │       [USER checks tubulol12345@gmail.com]
  │
  ├─→ 5. Click reset link in email
  │       URL: http://localhost:3000/reset-password?token=ABC123...
  │       │
  │       ↓
  │   [FRONTEND]
  │       │
  │       ├─→ Extract token from URL
  │       │
  │       ├─→ Display password reset form
  │       │
  │       └─→ User enters new password
  │
  ├─→ 6. Click "Reset Password"
  │       POST /api/v1/auth/reset-password
  │       │
  │       ↓
  │   [BACKEND API]
  │       │
  │       ├─→ Validate token
  │       │
  │       ├─→ Check token not expired (24 hours)
  │       │
  │       ├─→ Check token not already used
  │       │
  │       ├─→ Hash new password
  │       │
  │       ├─→ Update user password in DB
  │       │
  │       ├─→ Mark token as used
  │       │
  │       └─→ Return success
  │
  └─→ 7. Redirected to login
        [FRONTEND redirects after 2 seconds]
        │
        └─→ Try new password - LOGIN SUCCESS! ✓
```

## What's Running Where

| Service       | Port | URL                        | Purpose                   |
| ------------- | ---- | -------------------------- | ------------------------- |
| Frontend      | 3000 | http://localhost:3000      | User interface            |
| Backend API   | 8000 | http://localhost:8000      | API endpoints             |
| API Docs      | 8000 | http://localhost:8000/docs | Interactive documentation |
| PostgreSQL    | 5432 | localhost                  | Database storage          |
| Redis         | 6379 | localhost                  | Task queue broker         |
| Celery Worker | -    | Console                    | Process async tasks       |
| Celery Beat   | -    | Console                    | Schedule tasks            |
| Gmail SMTP    | 587  | smtp.gmail.com             | Send emails               |

## Testing Endpoints

### 1. Forgot Password (Anyone)

```
POST /api/v1/auth/forgot-password
{
  "email": "student@example.com"
}
Response: { "message": "Email sent" }
```

### 2. Reset Password (Anyone with token)

```
POST /api/v1/auth/reset-password
{
  "token": "token_from_email",
  "new_password": "NewPassword123"
}
Response: { "message": "Password reset successful" }
```

### 3. Get Email Preferences (Authenticated User)

```
GET /api/v1/auth/email-preferences
Headers: Authorization: Bearer YOUR_TOKEN
Response: { preferences object }
```

### 4. Update Email Preferences (Authenticated User)

```
PUT /api/v1/auth/email-preferences
Headers: Authorization: Bearer YOUR_TOKEN
{
  "email_notifications_enabled": false,
  "digest_frequency": "daily"
}
Response: { "message": "Updated" }
```

### 5. View Email Logs (Admin Only)

```
GET /api/v1/admin/email-logs?limit=50&skip=0
Headers: Authorization: Bearer YOUR_ADMIN_TOKEN
Response: { logs array }
```

### 6. Email Statistics (Admin Only)

```
GET /api/v1/admin/email-logs/stats
Headers: Authorization: Bearer YOUR_ADMIN_TOKEN
Response: { statistics object }
```

### 7. Trigger Monthly Reports (Admin Only)

```
POST /api/v1/admin/trigger-monthly-reports
Headers: Authorization: Bearer YOUR_ADMIN_TOKEN
Response: { "message": "Reports queued", "count": 21 }
```

## Checking Logs

### Frontend Console

```
Open: http://localhost:3000
Press: F12 → Console tab
See: Network requests, errors, and logs
```

### Backend Console

```
Watch the terminal where you ran:
  python -m uvicorn app.main:app --reload
See: Request logs, database queries, errors
```

### Celery Worker Console

```
Watch the terminal where you ran:
  celery -A app.services.celery_app worker
See: Task execution, email sending, errors
```

### Celery Beat Console

```
Watch the terminal where you ran:
  celery -A app.services.celery_app beat
See: Scheduled task execution
```

### Database Logs

```
Check email_logs table:
  SELECT * FROM email_logs ORDER BY sent_at DESC LIMIT 10;
```

## Troubleshooting During Testing

### No email received

1. Check Celery worker is running
2. Check backend logs for errors
3. Check email_logs table for status
4. Verify Gmail SMTP credentials in .env
5. Check spam folder

### Token validation fails

1. Ensure token was copied correctly
2. Check token hasn't expired (24 hours)
3. Check token wasn't already used
4. Verify token hash in database matches

### API returns 401 Unauthorized

1. Make sure you have valid auth token
2. Token may have expired
3. Try logging in again
4. For admin endpoints, verify user is admin

### Celery tasks not running

1. Verify Redis is running (redis-cli ping)
2. Verify Celery worker console shows connection
3. Check for errors in worker logs
4. Restart Celery worker

### Port already in use

```bash
# Find process using port 8000
netstat -ano | findstr :8000

# Kill process (replace PID with actual)
taskkill /PID <PID> /F

# Same for port 3000
netstat -ano | findstr :3000
```
