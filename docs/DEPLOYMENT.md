# 🚀 Deployment Guide - College Prep Platform

Complete guide for deploying the College Prep Platform to production.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Service Setup](#service-setup)
3. [Backend Deployment (Render)](#backend-deployment)
4. [Frontend Deployment (Vercel)](#frontend-deployment)
5. [File Storage (Cloudinary)](#cloudinary-setup)
6. [Environment Variables](#environment-variables)
7. [Post-Deployment](#post-deployment)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying, ensure you have:

- ✅ GitHub account
- ✅ Vercel account (free)
- ✅ Render account (free)
- ✅ Neon/Supabase account (free PostgreSQL)
- ✅ Cloudinary account (free)
- ✅ Code pushed to GitHub repository

---

## Service Setup

### 1. PostgreSQL Database (Neon - Recommended)

**Why Neon?**

- FREE tier with 512MB storage
- Serverless with auto-scaling
- No credit card required

**Steps:**

1. Go to [neon.tech](https://neon.tech) and sign up
2. Create a new project:
   - Name: `college-prep-db`
   - Region: Choose closest to your users
3. Copy the connection string (starts with `postgresql://`)
4. Save it as `DATABASE_URL` for later

**Connection String Format:**

```
postgresql://username:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require
```

---

### 2. File Storage (Cloudinary)

**Why Cloudinary?**

- FREE tier: 25GB storage + 25GB bandwidth/month
- Handles images, PDFs, videos, documents
- Built-in CDN for fast global delivery

**Steps:**

1. Go to [cloudinary.com/users/register/free](https://cloudinary.com/users/register/free)
2. Sign up with email
3. From the Dashboard, copy:
   - **Cloud Name** (e.g., `dxxxxx`)
   - **API Key** (e.g., `123456789012345`)
   - **API Secret** (e.g., `abcdefghijklmnopqrstuvwxyz`)
4. Save these for environment variables

---

## Backend Deployment (Render)

### Step 1: Prepare Repository

Ensure your backend code is in GitHub with:

- ✅ `backend/` folder
- ✅ `requirements.txt` with `cloudinary==1.36.0`
- ✅ `Dockerfile` or Render will use auto-detection

### Step 2: Create Render Web Service

1. Go to [render.com](https://render.com) and sign in
2. Click **New +** → **Web Service**
3. Connect your GitHub repository
4. Configure:
   - **Name:** `college-prep-backend`
   - **Region:** Choose closest to your users
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Runtime:** `Python 3`
   - **Build Command:**
     ```bash
     pip install -r requirements.txt
     ```
   - **Start Command:**
     ```bash
     alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT
     ```
   - **Instance Type:** `Free`

### Step 3: Add Environment Variables

In Render dashboard, go to **Environment** and add:

```bash
# Database
DATABASE_URL=postgresql://your-neon-connection-string

# Security
SECRET_KEY=your-super-secret-key-generate-random-string
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
ENVIRONMENT=production
DEBUG=False

# Cloudinary (File Storage)
USE_CLOUDINARY=True
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Redis (Optional - can skip for MVP)
# REDIS_URL=redis://upstash-url:6379

# Email (Optional)
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_FROM=noreply@yourapp.com
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
```

**Generate SECRET_KEY:**

```bash
# Run in terminal:
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Step 4: Deploy

1. Click **Create Web Service**
2. Wait for deployment (5-10 minutes)
3. Copy your backend URL (e.g., `https://college-prep-backend.onrender.com`)

### Step 5: Run Database Migrations

After first deployment:

1. In Render dashboard, go to **Shell** tab
2. Run:
   ```bash
   alembic upgrade head
   ```

### Step 6: Create Admin User

In Render Shell:

```bash
python scripts/create_admin.py
```

---

## Frontend Deployment (Vercel)

### Step 1: Prepare Repository

Ensure your frontend code has:

- ✅ `frontend/` folder with Next.js 15 app
- ✅ `package.json`
- ✅ `next.config.js`

### Step 2: Import to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **Add New** → **Project**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset:** Next.js
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `.next` (default)

### Step 3: Add Environment Variables

In Vercel project settings → **Environment Variables**:

```bash
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
```

Replace `your-backend` with your actual Render backend URL.

### Step 4: Deploy

1. Click **Deploy**
2. Wait for build (2-5 minutes)
3. Your app will be live at `https://your-app.vercel.app`

### Step 5: Update CORS in Backend

1. Go back to Render
2. Update environment variable:
   ```bash
   ALLOWED_ORIGINS=https://your-app.vercel.app,http://localhost:3000
   ```

Or update `backend/app/core/config.py`:

```python
allowed_origins: List[str] = [
    "https://your-app.vercel.app",
    "http://localhost:3000",  # For local development
]
```

3. Redeploy backend

---

## Environment Variables Summary

### Backend (Render)

| Variable                | Description                            | Required    |
| ----------------------- | -------------------------------------- | ----------- |
| `DATABASE_URL`          | PostgreSQL connection string from Neon | ✅          |
| `SECRET_KEY`            | Random secret for JWT signing          | ✅          |
| `USE_CLOUDINARY`        | Set to `True` for production           | ✅          |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name                  | ✅          |
| `CLOUDINARY_API_KEY`    | Cloudinary API key                     | ✅          |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret                  | ✅          |
| `ENVIRONMENT`           | Set to `production`                    | ✅          |
| `DEBUG`                 | Set to `False`                         | ✅          |
| `MAIL_USERNAME`         | Email for notifications                | ⚠️ Optional |
| `REDIS_URL`             | Redis URL from Upstash                 | ⚠️ Optional |

### Frontend (Vercel)

| Variable              | Description                 | Required |
| --------------------- | --------------------------- | -------- |
| `NEXT_PUBLIC_API_URL` | Backend API URL from Render | ✅       |

---

## Post-Deployment Checklist

After successful deployment:

- [ ] ✅ Backend health check: `https://your-backend.onrender.com/health`
- [ ] ✅ Backend docs: `https://your-backend.onrender.com/docs`
- [ ] ✅ Frontend loads: `https://your-app.vercel.app`
- [ ] ✅ Can register a new student account
- [ ] ✅ Can login with registered account
- [ ] ✅ Can create a course (as admin/teacher)
- [ ] ✅ Can upload course material (file uploads to Cloudinary)
- [ ] ✅ Student QR code generates and displays
- [ ] ✅ Language switcher works (English/Mongolian)

---

## Testing the Deployment

### 1. Test Backend API

```bash
# Health check
curl https://your-backend.onrender.com/health

# Should return:
# {"status": "healthy", "timestamp": "..."}
```

### 2. Test File Upload (QR Codes)

1. Register a new student account
2. Login as student
3. Go to student dashboard
4. Click "View QR Code"
5. QR code should load from Cloudinary (URL starts with `https://res.cloudinary.com/`)

### 3. Test File Upload (Course Materials)

1. Login as admin/teacher
2. Go to a course
3. Upload a PDF/document
4. File should upload to Cloudinary
5. Students should be able to download it

---

## Troubleshooting

### Backend Issues

**Problem:** "Application failed to respond"

- Check Render logs for errors
- Verify `DATABASE_URL` is correct
- Ensure migrations ran: `alembic upgrade head`

**Problem:** "CORS error"

- Update `ALLOWED_ORIGINS` to include Vercel URL
- Check backend logs for CORS errors

**Problem:** "File upload fails"

- Verify Cloudinary credentials are correct
- Check `USE_CLOUDINARY=True` is set
- Test Cloudinary credentials in Shell:
  ```python
  import cloudinary
  cloudinary.config(cloud_name="your-name", api_key="key", api_secret="secret")
  ```

### Frontend Issues

**Problem:** "API request failed"

- Check `NEXT_PUBLIC_API_URL` is set correctly
- Verify backend is running
- Check browser console for CORS errors

**Problem:** "Translation keys showing instead of text"

- Ensure `messages/en.json` and `messages/mn.json` are in repo
- Check build logs for file errors
- Verify all translation keys exist

**Problem:** "Images/files not loading"

- Check Cloudinary URLs in network tab
- Verify files uploaded to Cloudinary (check dashboard)

---

## Monitoring & Maintenance

### Check Cloudinary Usage

1. Login to Cloudinary dashboard
2. Go to **Media Library** to see uploaded files
3. Check **Reports** for storage/bandwidth usage

### Check Database Usage

1. Login to Neon dashboard
2. View **Metrics** for connection count, storage
3. Monitor query performance

### Render Free Tier Limits

- ⚠️ **Spins down after 15 min inactivity**
- First request after spin-down takes 30-60 seconds
- 750 hours/month free
- Consider upgrading for better performance ($7/month)

---

## Cost Breakdown (FREE Tier)

| Service             | Cost         | Limits                             |
| ------------------- | ------------ | ---------------------------------- |
| **Vercel**          | FREE         | Unlimited bandwidth                |
| **Render**          | FREE         | 750 hrs/month, spins down          |
| **Neon PostgreSQL** | FREE         | 512MB storage, 3GB data transfer   |
| **Cloudinary**      | FREE         | 25GB storage, 25GB bandwidth/month |
| **TOTAL**           | **$0/month** | Supports ~1000 users               |

---

## Scaling to Paid Tier

When you outgrow free tier:

| Service        | Paid Plan | Cost                     |
| -------------- | --------- | ------------------------ |
| **Render**     | Starter   | $7/month (stays active)  |
| **Neon**       | Pro       | $19/month (5GB storage)  |
| **Cloudinary** | Plus      | $99/month (75GB storage) |
| **Total**      |           | ~$125/month              |

---

## Custom Domain (Optional)

### Add Custom Domain to Vercel

1. In Vercel project settings → **Domains**
2. Add your domain (e.g., `collegeprep.mn`)
3. Follow DNS setup instructions
4. Update CORS in backend to include custom domain

### Add Custom Domain to Render

1. In Render service → **Settings** → **Custom Domain**
2. Add backend subdomain (e.g., `api.collegeprep.mn`)
3. Update DNS records
4. Update `NEXT_PUBLIC_API_URL` in Vercel

---

## Support

- **Render Docs:** https://render.com/docs
- **Vercel Docs:** https://vercel.com/docs
- **Cloudinary Docs:** https://cloudinary.com/documentation
- **Neon Docs:** https://neon.tech/docs

---

🎉 **Congratulations!** Your College Prep Platform is now live!
