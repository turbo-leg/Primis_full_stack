# Email System Testing - Visual Guide

## 🎬 Start Here

```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│  Open PowerShell in college-prep-platform folder          │
│                                                            │
│  Run:  .\start-email-system.ps1                           │
│                                                            │
│  This opens 4 windows:                                     │
│  ✓ Backend API (port 8000)                                │
│  ✓ Celery Worker (processes emails)                       │
│  ✓ Celery Beat (schedules tasks)                          │
│  ✓ Frontend (port 3000)                                   │
│                                                            │
│  All start automatically in 10 seconds ⏱️                 │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## 🧪 Test 1: Password Reset (Simplest)

```
STEP 1: Go to Website
┌─────────────────────────────────────────┐
│ Open: http://localhost:3000             │
│ Look for: "Forgot Password?" link       │
│ Click it                                │
└─────────────────────────────────────────┘
           ↓
STEP 2: Request Reset
┌─────────────────────────────────────────┐
│ Email field: student@example.com        │
│ Click: "Send Reset Link"                │
│ Wait for: Success message               │
└─────────────────────────────────────────┘
           ↓
STEP 3: Check Email
┌─────────────────────────────────────────┐
│ Open: https://mail.google.com           │
│ Login: tubulol12345@gmail.com           │
│ Password: Check your .env file          │
│ Look for: Email from "College Prep..."  │
│ Subject: "Password Reset Request"       │
└─────────────────────────────────────────┘
           ↓
STEP 4: Click Link
┌─────────────────────────────────────────┐
│ Open email                              │
│ Click: Big blue "Reset Password" button │
│ You'll be taken to reset form           │
└─────────────────────────────────────────┘
           ↓
STEP 5: Enter New Password
┌─────────────────────────────────────────┐
│ New Password: MyNewPassword123          │
│ Confirm: MyNewPassword123               │
│ Click: "Reset Password"                 │
│ See: "Success! Redirecting..."          │
└─────────────────────────────────────────┘
           ↓
STEP 6: Verify It Works
┌─────────────────────────────────────────┐
│ Try old password: ❌ FAILS              │
│ Try new password: ✅ WORKS              │
│ You're logged in!                       │
└─────────────────────────────────────────┘

✨ TEST PASSED! Email system is working!
```

---

## 🔍 Test 2: API Testing (Interactive)

```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│  Backend API is now documenting itself at:                 │
│                                                            │
│  👉  http://localhost:8000/docs  👈                        │
│                                                            │
│  This is an interactive API tester!                        │
│                                                            │
│  You can:                                                  │
│  • See all 100+ endpoints                                 │
│  • Click any endpoint to expand                           │
│  • Click "Try it out" to test                             │
│  • Fill in parameters                                     │
│  • See responses in real time                             │
│                                                            │
│  Look for endpoints under "email" tag:                     │
│  ✓ forgot-password                                        │
│  ✓ reset-password                                         │
│  ✓ email-preferences                                      │
│  ✓ admin/email-logs                                       │
│  ✓ admin/email-logs/stats                                 │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## 📊 Test 3: Admin Email Logs

```
┌──────────────────────────────────────────────────────────┐
│ Admin Email Logs Testing                                 │
└──────────────────────────────────────────────────────────┘

STEP 1: Log in as Admin
┌─────────────────────────────────────────┐
│ http://localhost:3000/login             │
│ Email: admin@example.com                │
│ Password: adminpassword                 │
│ Click: Login                            │
└─────────────────────────────────────────┘
           ↓
STEP 2: Go to API Docs
┌─────────────────────────────────────────┐
│ Open: http://localhost:8000/docs        │
│ Scroll to: "admin" section              │
│ Find: "GET /admin/email-logs"           │
│ Click: Email logs endpoint              │
└─────────────────────────────────────────┘
           ↓
STEP 3: Try It Out
┌─────────────────────────────────────────┐
│ Click: "Try it out" button              │
│ Scroll down to: "Execute" button        │
│ Click: "Execute"                        │
│ See: List of all emails sent            │
│ Each shows: Status, recipient, type     │
└─────────────────────────────────────────┘
           ↓
STEP 4: View Statistics
┌─────────────────────────────────────────┐
│ Find: "GET /admin/email-logs/stats"    │
│ Click: "Try it out"                     │
│ Click: "Execute"                        │
│ See: Summary of all emails:             │
│   • Total sent                          │
│   • By type (reset, notification, etc)  │
│   • By status (sent, failed, pending)   │
│   • Today's counts                      │
└─────────────────────────────────────────┘

✨ Admin can now monitor all emails!
```

---

## 📈 Test 4: Email Statistics

```
API Response Example:

{
  "total_emails": 12,

  "by_type": {
    "password_reset": 3,           👈 Most common
    "assignment_notification": 2,
    "grade_notification": 2,
    "attendance_notification": 2,
    "monthly_report": 2,
    "course_announcement": 1
  },

  "by_status": {
    "sent": 11,     👈 Success!
    "failed": 1,    👈 One failed
    "pending": 0,
    "bounced": 0
  },

  "sent_today": 8,
  "failed_today": 0,

  "last_email_sent": "2025-10-20T14:35:22.123456"
}

This tells you:
✓ How many emails were sent
✓ What types of emails (purpose)
✓ If any failed (problems)
✓ Real-time status
```

---

## 🎯 What Each Service Does

```
┌─────────────────┐
│   FRONTEND      │  User visits website
│   Port 3000     │  • Forgot password page
└────────┬────────┘  • Reset password page
         │           • Dark mode support
         ↓
┌─────────────────┐
│  BACKEND API    │  Processes requests
│   Port 8000     │  • Validates input
└────────┬────────┘  • Generates tokens
         │           • Saves to database
         ↓           • Queues email tasks
┌─────────────────┐
│   DATABASE      │  Stores everything
│ PostgreSQL      │  • Tokens
│  Port 5432      │  • Email logs
└────────┬────────┘  • Preferences
         │           • User data
         ↓
┌─────────────────┐
│ CELERY WORKER   │  Sends emails
│  (background)   │  • Reads from queue
└────────┬────────┘  • Sends via Gmail
         │           • Logs results
         ↓           • Retries if fails
┌─────────────────┐
│  EMAIL SERVICE  │  Gmail SMTP
│  smtp.gmail.com │  • Real email delivery
│   Port 587      │  • TLS encryption
└─────────────────┘

Everything is connected! Data flows automatically.
```

---

## 🐛 Troubleshooting Guide

```
PROBLEM: "Connection refused" on http://localhost:3000
SOLUTION:
  1. Check frontend terminal - should show "ready - started server"
  2. Restart frontend: Ctrl+C then restart
  3. Try different port: http://localhost:3001

PROBLEM: API returns 500 error
SOLUTION:
  1. Check backend terminal for red error messages
  2. Verify database is running
  3. Check .env file for SMTP credentials
  4. Restart backend API

PROBLEM: Email not received
SOLUTION:
  1. Check Celery worker terminal - should show "[INFO/MainProcess]"
  2. Wait 5-10 seconds (email is sent async)
  3. Check Gmail spam folder
  4. Check email_logs via API:
     http://localhost:8000/docs → email-logs → Try it out → Execute
  5. If status is "failed", see error message

PROBLEM: "Token validation failed"
SOLUTION:
  1. Token expired? (24 hour limit)
  2. Token already used? (one-time only)
  3. Try requesting new reset link

PROBLEM: Celery not processing tasks
SOLUTION:
  1. Verify Redis is running (should see "Connected to Redis")
  2. Verify Celery worker window shows "[INFO/MainProcess]"
  3. Restart both Redis and Celery worker
```

---

## ✅ Success Checklist

Track your testing progress:

```
□ All 4 services started
  □ Backend (port 8000)
  □ Frontend (port 3000)
  □ Celery worker
  □ Celery beat

□ Website working
  □ Can visit http://localhost:3000
  □ Can navigate to /forgot-password
  □ Can fill out form

□ Email system working
  □ Received email in Gmail
  □ Email has reset link
  □ Email looks professional

□ Password reset working
  □ Clicked email link
  □ Reset password form appears
  □ Successfully changed password
  □ Old password doesn't work
  □ New password works

□ Admin features working
  □ Can view email logs
  □ Can see email statistics
  □ Logs show correct status

□ API working
  □ Can access http://localhost:8000/docs
  □ Can test endpoints
  □ Get responses back
```

---

## 🎓 Learning Resources

After testing, explore these concepts:

- **Password Reset Security**: How tokens are generated and validated securely
- **Async Task Processing**: How Celery queues and processes background jobs
- **Email Service Integration**: How FastMail handles SMTP connections
- **Database Migrations**: How Alembic manages schema changes
- **Rate Limiting**: How to prevent email spam attacks
- **Audit Logging**: How to track all email delivery for compliance

---

## 📚 Documentation Files

Three guides available:

1. **QUICK_START.md** ← Start here (5 min)
   Quick setup and basic test

2. **EMAIL_TESTING_GUIDE.md** (15 min)
   Detailed procedures and examples

3. **EMAIL_TESTING_FLOW.md** (20 min)
   Architecture and data flows

4. **http://localhost:8000/docs**
   Interactive API documentation

---

## 🚀 Next Steps

After basic testing:

1. Test with multiple user types

   - Student password reset
   - Teacher password reset
   - Admin password reset

2. Test edge cases

   - Invalid token
   - Expired token
   - Rate limiting

3. Test admin features

   - View email logs
   - Check statistics
   - Trigger reports

4. Prepare for production
   - Document configuration
   - Test with production data
   - Set up monitoring

---

## 💡 Pro Tips

- Keep email logs open to debug issues
- Watch Celery worker terminal to see tasks being processed
- Use browser DevTools (F12) to see network requests
- Check terminal output for detailed error messages
- Gmail may delay emails by 1-2 seconds

---

## 🎉 You're All Set!

Everything is installed, configured, and ready.

**Just start the script and test!**

```powershell
.\start-email-system.ps1
```

Then visit: http://localhost:3000/forgot-password

**Questions? Read the documentation or check http://localhost:8000/docs**
