# Quick Start: Email System Testing

## 🚀 Start Everything (Pick One Method)

### Method 1: PowerShell Script (Easiest)

```powershell
cd college-prep-platform
.\start-email-system.ps1
```

### Method 2: Batch Script (Also Easy)

```bash
cd college-prep-platform
start-email-system.bat
```

### Method 3: Manual Start (Full Control)

Open 4 separate terminals:

**Terminal 1 - Backend API:**

```powershell
cd backend
C:\Users\tubul\OneDrive\Documents\Primis\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

**Terminal 2 - Celery Worker:**

```powershell
cd backend
C:\Users\tubul\OneDrive\Documents\Primis\.venv\Scripts\celery.exe -A app.services.celery_app worker --loglevel=info
```

**Terminal 3 - Celery Beat (Scheduler):**

```powershell
cd backend
C:\Users\tubul\OneDrive\Documents\Primis\.venv\Scripts\celery.exe -A app.services.celery_app beat --loglevel=info
```

**Terminal 4 - Frontend:**

```powershell
cd frontend
npm run dev
```

---

## ✅ Verify Services Are Running

| Service     | Check URL                  | Expected                                                  |
| ----------- | -------------------------- | --------------------------------------------------------- |
| Frontend    | http://localhost:3000      | College Prep login page                                   |
| Backend API | http://localhost:8000      | JSON response: `{"message": "College Prep Platform API"}` |
| API Docs    | http://localhost:8000/docs | Interactive Swagger documentation                         |

---

## 🧪 Test 1: Password Reset (Easiest)

### Step 1: Go to Forgot Password

```
Navigate to: http://localhost:3000/forgot-password
```

### Step 2: Request Reset

```
Email: student@example.com
Click: "Send Reset Link"
Expected: "Check your email for password reset instructions"
```

### Step 3: Check Email

```
Go to: https://mail.google.com
Account: tubulol12345@gmail.com
Password: Check your .env file
Look for: Email from "College Prep Platform"
Subject: "Password Reset Request"
```

### Step 4: Click Reset Link

```
Click: The reset password link in the email
URL will be: http://localhost:3000/reset-password?token=ABC123...
```

### Step 5: Reset Password

```
New Password: MyNewPassword123
Confirm Password: MyNewPassword123
Click: "Reset Password"
Expected: "Password reset successful! Redirecting to login..."
```

### Step 6: Verify

```
Try old password: FAILS ❌
Try new password: SUCCESS ✅
```

---

## 🔍 Test 2: API Testing (Advanced)

### Using http://localhost:8000/docs

1. Open http://localhost:8000/docs
2. Look for "email" endpoints under the "email" tag
3. Click any endpoint to expand it
4. Click "Try it out"
5. Fill in parameters
6. Click "Execute"
7. See response below

### Key Endpoints to Test

| Endpoint                         | Method | Purpose            | Auth Required |
| -------------------------------- | ------ | ------------------ | ------------- |
| `/auth/forgot-password`          | POST   | Request reset      | No            |
| `/auth/reset-password`           | POST   | Reset with token   | No            |
| `/auth/email-preferences`        | GET    | View preferences   | Yes           |
| `/auth/email-preferences`        | PUT    | Update preferences | Yes           |
| `/admin/email-logs`              | GET    | View email history | Yes (Admin)   |
| `/admin/email-logs/stats`        | GET    | Email statistics   | Yes (Admin)   |
| `/admin/trigger-monthly-reports` | POST   | Generate reports   | Yes (Admin)   |

---

## 📊 Test 3: Admin Email Logs

### Using API

```bash
curl -X GET "http://localhost:8000/api/v1/admin/email-logs" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### In Browser (with admin token)

1. Login as admin account
2. Open http://localhost:8000/docs
3. Find `/admin/email-logs` endpoint
4. Click "Try it out"
5. Click "Execute"
6. View email sending history

### What You'll See

```json
{
  "total": 5,
  "logs": [
    {
      "log_id": "123e4567-e89b-12d3-a456-426614174000",
      "recipient_email": "student@example.com",
      "recipient_name": "John Doe",
      "subject": "Password Reset Request",
      "email_type": "password_reset",
      "status": "sent",
      "sent_at": "2025-10-20T12:34:56",
      "retry_count": 0,
      "error_message": null
    }
  ]
}
```

---

## 📈 Test 4: Email Statistics

### API Call

```bash
curl -X GET "http://localhost:8000/api/v1/admin/email-logs/stats" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Response Example

```json
{
  "total_emails": 10,
  "by_type": {
    "password_reset": 3,
    "assignment_notification": 2,
    "grade_notification": 2,
    "attendance_notification": 2,
    "monthly_report": 1
  },
  "by_status": {
    "sent": 9,
    "failed": 1,
    "pending": 0,
    "bounced": 0
  },
  "sent_today": 7,
  "failed_today": 0
}
```

---

## 🐛 Troubleshooting

### "Service not available" / Connection refused

- [ ] Check all 4 services are started
- [ ] Check no ports are blocked (8000, 3000, 5432, 6379)
- [ ] Restart all services

### "Email service is disabled"

- [ ] Verify `.env` file has SMTP credentials
- [ ] Restart backend API

### No email received

- [ ] Check Celery worker is running (look for console output)
- [ ] Check email_logs table: http://localhost:8000/docs → `/admin/email-logs`
- [ ] Verify token generation worked (log shows status: "sent")
- [ ] Check Gmail spam folder
- [ ] Verify credentials in .env are correct

### Token validation failed

- [ ] Token may be expired (24 hour limit)
- [ ] Token may already be used
- [ ] Try requesting new reset link

### Port already in use

```powershell
# Find and kill process
Get-Process | Where-Object {$_.Handles -like "8000"} | Stop-Process -Force
```

---

## 📚 Documentation Files

For more detailed information, read:

- `EMAIL_TESTING_GUIDE.md` - Complete testing guide with examples
- `EMAIL_TESTING_FLOW.md` - Architecture diagrams and data flows
- `http://localhost:8000/docs` - Interactive API documentation

---

## 🎯 Full Testing Checklist

- [ ] All 4 services started and running
- [ ] Backend accessible at http://localhost:8000
- [ ] Frontend accessible at http://localhost:3000
- [ ] API docs accessible at http://localhost:8000/docs
- [ ] Requested password reset from website
- [ ] Email received in Gmail inbox
- [ ] Clicked reset link from email
- [ ] Successfully reset password
- [ ] Old password doesn't work
- [ ] New password works (login successful)
- [ ] Email appears in admin email logs
- [ ] Email statistics show correct counts
- [ ] Can update email preferences
- [ ] Can trigger monthly reports (admin)

---

## 🚀 Next Steps

After successful testing:

1. **Create test accounts**

   - Student account
   - Teacher account
   - Admin account

2. **Test with different user roles**

   - Student password reset
   - Teacher password reset
   - Admin password reset

3. **Test advanced features**

   - Email preference updates
   - Monthly report generation
   - Email log viewing

4. **Test error cases**

   - Invalid token
   - Expired token
   - Rate limiting (request 4 resets in 1 hour)

5. **Production prep**
   - Document any issues found
   - Test with production database
   - Set up email monitoring
   - Update PASSWORD_RESET_URL to production HTTPS

---

**Questions? Check the full guides or visit http://localhost:8000/docs for interactive API documentation.**
