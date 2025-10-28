# Services & Environment Configuration Guide

**Last Updated:** October 25, 2025  
**Project:** College Prep Platform (Primis Full Stack)

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Infrastructure Services](#infrastructure-services)
3. [Backend Services](#backend-services)
4. [Data Storage](#data-storage)
5. [File Storage & Media](#file-storage--media)
6. [Email Service](#email-service)
7. [Environment Variables Reference](#environment-variables-reference)
8. [Production Deployment Checklist](#production-deployment-checklist)
9. [Local Development Setup](#local-development-setup)
10. [Troubleshooting](#troubleshooting)

---

## Overview

The College Prep Platform uses the following technology stack:

- **Backend:** FastAPI (Python 3.11+) with SQLAlchemy ORM
- **Frontend:** Next.js (React) with TypeScript
- **Database:** PostgreSQL (Supabase for production)
- **File Storage:** Cloudinary (production) / Local filesystem (development)
- **Email:** Gmail SMTP (direct sending, no queue)
- **Hosting:** Render (backend) + Vercel (frontend recommended)

### Key Architecture Decisions

✅ **No Redis/Celery Required** - Emails sent directly via SMTP  
✅ **Cloud File Storage** - Cloudinary for production uploads  
✅ **Managed Database** - Supabase PostgreSQL for reliability  
✅ **Container-Ready** - Docker support for local development

---

## Infrastructure Services

### 1. Render (Backend Hosting)

**Purpose:** Hosts the FastAPI backend API  
**Production URL:** https://primis-full-stack.onrender.com  
**Dashboard:** https://dashboard.render.com

**Configuration:**

- Connected to GitHub repo: `turbo-leg/Primis_full_stack`
- Auto-deploys on push to `main` branch
- Build command: Uses `requirements.txt`
- Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

**Required Environment Variables:**

```bash
# Database
DATABASE_URL=postgresql://postgres.zizleblpekdmfqkzbkan:U0zuDzleL1H5Y0va@aws-1-us-east-2.pooler.supabase.com:5432/postgres

# Security
SECRET_KEY=<your-secret-key-change-in-production>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Email (Gmail SMTP)
SMTP_USER=tubulol12345@gmail.com
SMTP_PASSWORD=ftldbknzkbgngzqn
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
MAIL_FROM_NAME=College Prep Platform

# Password Reset
PASSWORD_RESET_URL=https://your-frontend-domain.vercel.app/reset-password
PASSWORD_RESET_TOKEN_EXPIRE_HOURS=24

# Cloudinary
USE_CLOUDINARY=True
CLOUDINARY_CLOUD_NAME=db9973jrc
CLOUDINARY_API_KEY=761352199315859
CLOUDINARY_API_SECRET=V31lQwGil7vkqWkSCwUz5p8tqA4

# Optional
DEBUG=False
ENVIRONMENT=production
```

**Health Check:** https://primis-full-stack.onrender.com/health

---

### 2. Vercel (Frontend Hosting - Recommended)

**Purpose:** Hosts the Next.js frontend  
**Dashboard:** https://vercel.com/dashboard

**Required Environment Variables:**

```bash
NEXT_PUBLIC_API_URL=https://primis-full-stack.onrender.com
NEXT_PUBLIC_APP_NAME=College Prep Platform
NEXT_PUBLIC_APP_VERSION=1.0.0
```

**Note:** Frontend must implement `/reset-password` page to handle password reset flow.

---

### 3. Supabase (PostgreSQL Database)

**Purpose:** Production PostgreSQL database  
**Dashboard:** https://supabase.com/dashboard

**Connection Details:**

- Host: `aws-1-us-east-2.pooler.supabase.com`
- Port: `5432`
- Database: `postgres`
- User: `postgres.zizleblpekdmfqkzbkan`

**Connection String:**

```
postgresql://postgres.zizleblpekdmfqkzbkan:U0zuDzleL1H5Y0va@aws-1-us-east-2.pooler.supabase.com:5432/postgres
```

**Tables:**

- `admins`, `teachers`, `students`, `parents`
- `courses`, `enrollments`, `materials`
- `password_reset_tokens`
- `email_logs`, `email_preferences`
- `notifications`

**Access Methods:**

1. Supabase Dashboard → Table Editor
2. psql: `psql "<connection-string>"`
3. SQLAlchemy via backend API

---

### 4. Docker (Local Development)

**Purpose:** Run PostgreSQL, backend, and optional services locally  
**Configuration File:** `docker-compose.yml`

**Services:**

- `postgres`: PostgreSQL 15
- `backend`: FastAPI application
- `redis` (optional, currently unused)

**Commands:**

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down

# Rebuild after code changes
docker-compose up -d --build
```

**Requirements:**

- Docker Desktop for Windows
- WSL 2 backend enabled

---

## Backend Services

### FastAPI Application

**Framework:** FastAPI 0.100+  
**Runtime:** Uvicorn ASGI server  
**Language:** Python 3.11+

**Key Files:**

- `backend/app/main.py` - Application entry point
- `backend/requirements.txt` - Python dependencies
- `backend/alembic/` - Database migrations

**API Documentation:**

- Swagger UI: `/docs`
- ReDoc: `/redoc`
- OpenAPI JSON: `/openapi.json`

**Authentication:**

- JWT tokens (30-minute expiration)
- Bearer token in Authorization header
- Password hashing with bcrypt

---

### Database Migrations (Alembic)

**Purpose:** Version control for database schema  
**Configuration:** `backend/alembic.ini`

**Commands:**

```bash
# Generate new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback last migration
alembic downgrade -1

# View migration history
alembic history
```

**Migration Files:** `backend/alembic/versions/`

---

## Data Storage

### PostgreSQL

**Local Development:**

- Host: `localhost`
- Port: `5432`
- User: `postgres`
- Password: `postgres`
- Database: `college_prep`

**Production (Supabase):**

- See [Supabase section](#3-supabase-postgresql-database)

**Connection Pooling:**

- Supabase uses PgBouncer (pooler.supabase.com)
- Session pooling mode
- Max connections handled automatically

---

### Redis (Optional - Currently Unused)

**Status:** ⚠️ Not required for current implementation  
**Previous Use:** Celery task queue broker  
**Current Status:** Commented out in `.env`

**If Re-enabling:**

```bash
# Local
REDIS_URL=redis://localhost:6379

# Production (required if using Celery)
REDIS_URL=redis://<redis-host>:6379
CELERY_BROKER_URL=redis://<redis-host>:6379/0
CELERY_RESULT_BACKEND=redis://<redis-host>:6379/0
```

---

## File Storage & Media

### Cloudinary

**Purpose:** Store course materials, images, and documents  
**Dashboard:** https://cloudinary.com/console

**Account Details:**

- Cloud Name: `db9973jrc`
- API Key: `761352199315859`
- API Secret: `V31lQwGil7vkqWkSCwUz5p8tqA4`

**Features Used:**

- Raw file uploads (PDFs, documents)
- Image transformations
- CDN delivery
- 25 GB free storage

**Configuration:**

```bash
USE_CLOUDINARY=True
CLOUDINARY_CLOUD_NAME=db9973jrc
CLOUDINARY_API_KEY=761352199315859
CLOUDINARY_API_SECRET=V31lQwGil7vkqWkSCwUz5p8tqA4
```

**Helper Functions:** `backend/app/utils/cloudinary_helper.py`

**URL Format:**

```
https://res.cloudinary.com/db9973jrc/raw/upload/v{timestamp}/course_materials/{uuid}
```

---

### Local File Storage (Development Fallback)

**Purpose:** Store uploads when Cloudinary disabled  
**Directory:** `backend/uploads/`

**Configuration:**

```bash
USE_CLOUDINARY=False
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760  # 10MB
```

**Note:** Not recommended for production (files lost on Render restart)

---

## Email Service

### Gmail SMTP

**Purpose:** Send password reset emails, notifications, reports  
**Method:** Direct SMTP (no Celery queue required)

**⚠️ Direct SMTP Trade-offs:**

**Advantages:**

- ✅ Simple setup - no Redis/Celery infrastructure needed
- ✅ Immediate delivery - emails sent instantly
- ✅ Lower costs - one less service to run
- ✅ Easier debugging - errors visible in request logs
- ✅ Good for low-volume apps (< 100 emails/hour)

**Disadvantages:**

- ❌ **Blocks API response** - User waits ~1-3 seconds while email sends
- ❌ **No retry mechanism** - If Gmail is down, email is lost forever
- ❌ **Timeout risk** - If SMTP is slow (>30s), request times out
- ❌ **No rate limiting** - Can't queue emails or throttle sends
- ❌ **Scaling issues** - With many users, concurrent SMTP connections can overwhelm server
- ❌ **No email analytics** - Can't track delivery status, opens, clicks
- ❌ **Poor failure handling** - User gets success message even if email fails (for security)
- ❌ **Gmail limits** - 100-500 emails/day depending on account type

**When to Switch to Queue-Based (Celery + Redis):**

- Sending > 100 emails per hour
- Need guaranteed delivery with retries
- Want async/background processing
- Need to batch/schedule emails
- Require delivery tracking and analytics
- User experience matters (can't wait for email to send)

**Alternative Solutions:**

1. **SendGrid/Mailgun/Postmark** - Dedicated email services with APIs (better reliability, analytics, higher limits)
2. **AWS SES** - Amazon Simple Email Service (99.9% uptime, cheap at scale)
3. **Celery + Redis** - Add back the queue for background processing
4. **Firebase Cloud Functions** - Serverless email triggers

**Configuration:**

```bash
SMTP_USER=tubulol12345@gmail.com
SMTP_PASSWORD=ftldbknzkbgngzqn  # Gmail App Password
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
MAIL_FROM_NAME=College Prep Platform
```

**Gmail Setup:**

1. Enable 2-Factor Authentication on Gmail account
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use App Password (not regular password) in `SMTP_PASSWORD`

**Email Types:**

- Password reset (`/api/v1/auth/forgot-password`)
- Welcome emails
- Assignment notifications
- Grade reports
- Monthly summaries

---

### fastapi-mail

**Package:** `fastapi-mail==1.4.1`  
**Purpose:** Python library for sending emails from FastAPI  
**Documentation:** https://sabuhish.github.io/fastapi-mail/

**Service File:** `backend/app/services/email_service.py`

**Usage:**

```python
from app.services.email_service import email_service

result = await email_service.send_password_reset_email(
    email="user@example.com",
    name="User Name",
    reset_token="secure-token",
    reset_url="https://frontend.com/reset-password?token=..."
)
```

---

## Environment Variables Reference

### Complete `.env` Template

```bash
# ==================== DATABASE ====================
DATABASE_URL=postgresql://user:password@host:5432/dbname

# ==================== SECURITY ====================
SECRET_KEY=your-secret-key-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# ==================== EMAIL (SMTP) ====================
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
MAIL_FROM_NAME=College Prep Platform

# Alternative naming (legacy support)
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_FROM=your-email@gmail.com
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_STARTTLS=True
MAIL_SSL_TLS=False

# ==================== PASSWORD RESET ====================
PASSWORD_RESET_URL=https://your-frontend.vercel.app/reset-password
PASSWORD_RESET_TOKEN_EXPIRE_HOURS=24

# ==================== CLOUDINARY ====================
USE_CLOUDINARY=True
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# ==================== FILE UPLOADS ====================
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760  # 10MB in bytes

# ==================== QR CODES ====================
QR_CODE_DIR=qr_codes

# ==================== DEVELOPMENT ====================
DEBUG=False  # True for local dev
TESTING=False
ENVIRONMENT=production  # or development

# ==================== REDIS/CELERY (Optional - Currently Unused) ====================
# REDIS_URL=redis://localhost:6379
# CELERY_BROKER_URL=redis://localhost:6379/0
# CELERY_RESULT_BACKEND=redis://localhost:6379/0
```

---

## Production Deployment Checklist

### Pre-Deployment

- [ ] Update `SECRET_KEY` to secure random value (min 32 characters)
- [ ] Set `DEBUG=False` and `ENVIRONMENT=production`
- [ ] Verify `DATABASE_URL` points to production Supabase
- [ ] Configure all SMTP variables for Gmail
- [ ] Update `PASSWORD_RESET_URL` to production frontend domain
- [ ] Set Cloudinary credentials (API key, secret, cloud name)
- [ ] Remove or comment out unused Redis/Celery variables
- [ ] Review CORS settings in `backend/app/main.py`

### Render Configuration

- [ ] Connect GitHub repository
- [ ] Set all environment variables in Render dashboard
- [ ] Configure build command: `pip install -r requirements.txt`
- [ ] Configure start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- [ ] Enable auto-deploy on push to main
- [ ] Set health check endpoint: `/health`

### Vercel Configuration (Frontend)

- [ ] Set `NEXT_PUBLIC_API_URL` to Render backend URL
- [ ] Implement `/reset-password` page with token handling
- [ ] Test frontend → backend API connectivity
- [ ] Configure custom domain (optional)

### Post-Deployment

- [ ] Test `/health` endpoint
- [ ] Test `/docs` Swagger UI
- [ ] Test login with test users
- [ ] Test password reset flow end-to-end
- [ ] Test file upload to Cloudinary
- [ ] Check Render logs for errors
- [ ] Verify email delivery (check spam folder)

---

## Local Development Setup

### Prerequisites

- Python 3.11+
- Docker Desktop with WSL 2
- Git
- Node.js 18+ (for frontend)

### Backend Setup

```bash
# Clone repository
git clone https://github.com/turbo-leg/Primis_full_stack.git
cd Primis_full_stack/college-prep-platform

# Start Docker services
docker-compose up -d

# Create Python virtual environment (optional)
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Install dependencies
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Create test users
python scripts/create_test_users.py

# Start backend (if not using Docker)
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend  # (if you have frontend directory)
npm install
npm run dev
```

### Test Accounts

```bash
Admin:   admin@gmail.com / password123
Teacher: teacher@gmail.com / password123
Student: student@gmail.com / password123
Parent:  parent@gmail.com / password123
```

### Useful Commands

```bash
# View Docker logs
docker-compose logs -f backend
docker-compose logs -f postgres

# Connect to PostgreSQL
docker exec -it college-prep-platform-postgres-1 psql -U postgres -d college_prep

# Run tests
pytest backend/tests/

# Check email service
python backend/test_email_config.py

# Test password reset
.\backend\test_password_reset.ps1
```

---

## Troubleshooting

### Password Reset Issues

**Problem:** Email not received

**Solutions:**

1. Check Render logs for email send attempts
2. Verify SMTP credentials in Render environment variables
3. Check Gmail App Password is correct (not regular password)
4. Look for "❌ Password reset email FAILED" in logs
5. Check spam folder
6. Verify `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_SERVER`, `SMTP_PORT` are set

**Problem:** 404 on `/api/v1/auth/forgot-password`

**Solutions:**

1. Verify Render deployment completed successfully
2. Check `backend/app/api/email_routes.py` is in repository
3. Ensure router registered in `backend/app/main.py`
4. Check OpenAPI spec: `/openapi.json`

---

### Cloudinary Upload Issues

**Problem:** Files not uploading to Cloudinary

**Solutions:**

1. Verify `USE_CLOUDINARY=True` in Render environment
2. Check Cloudinary credentials match dashboard
3. Verify API key is `761352199315859` (not `718623946177612`)
4. Check logs for Cloudinary errors
5. Test credentials with `backend/scripts/test_cloudinary.py`

**Problem:** Frontend shows malformed URLs

**Solutions:**

1. Check frontend isn't prepending API URL to absolute Cloudinary URLs
2. URLs starting with `https://res.cloudinary.com` should not be modified
3. Add URL validation in frontend: `if (url.startsWith('http')) return url;`

---

### Database Connection Issues

**Problem:** Connection refused or timeout

**Solutions:**

1. Verify `DATABASE_URL` format is correct
2. Check Supabase pooler address (must be `pooler.supabase.com`)
3. Whitelist Render IP in Supabase (or allow all)
4. Test connection with: `psql "<DATABASE_URL>"`
5. Check Supabase project is not paused

---

### Docker Issues

**Problem:** WSL error on Windows

**Solutions:**

1. Ensure WSL 2 is installed: `wsl --list --verbose`
2. Update Docker Desktop to latest version
3. Restart Docker Desktop
4. Run: `wsl --shutdown` then restart Docker

**Problem:** Port already in use

**Solutions:**

1. Stop conflicting service: `docker-compose down`
2. Check port usage: `netstat -ano | findstr :8000`
3. Kill process: `taskkill /PID <pid> /F`

---

## Quick Reference

### Service URLs

| Service                  | URL                                           | Purpose             |
| ------------------------ | --------------------------------------------- | ------------------- |
| Backend API (Production) | https://primis-full-stack.onrender.com        | FastAPI backend     |
| Backend API (Local)      | http://localhost:8000                         | Local development   |
| API Docs                 | https://primis-full-stack.onrender.com/docs   | Swagger UI          |
| Health Check             | https://primis-full-stack.onrender.com/health | Status check        |
| Render Dashboard         | https://dashboard.render.com                  | Hosting management  |
| Supabase Dashboard       | https://supabase.com/dashboard                | Database management |
| Cloudinary Console       | https://cloudinary.com/console                | Media management    |

### Important Files

| File                                     | Purpose                       |
| ---------------------------------------- | ----------------------------- |
| `backend/.env`                           | Environment variables (local) |
| `backend/requirements.txt`               | Python dependencies           |
| `backend/alembic.ini`                    | Migration configuration       |
| `docker-compose.yml`                     | Docker services definition    |
| `backend/app/main.py`                    | FastAPI application entry     |
| `backend/app/api/email_routes.py`        | Password reset endpoints      |
| `backend/app/services/email_service.py`  | Email sending logic           |
| `backend/app/utils/cloudinary_helper.py` | Cloudinary integration        |

### Support

- GitHub Repository: https://github.com/turbo-leg/Primis_full_stack
- Documentation: `docs/` directory in repository
- Email: tubulol12345@gmail.com

---

**Last Updated:** October 25, 2025  
**Version:** 1.0.0
