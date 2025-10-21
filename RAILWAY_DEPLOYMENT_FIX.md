# Railway Deployment Quick Fix

## Problem

Railway couldn't find the Dockerfile because this is a monorepo with separate backend/frontend.

## Solution

Created the following files to help Railway deploy the backend:

1. **Dockerfile** (root) - Points to backend
2. **Procfile** - Alternative deployment method
3. **nixpacks.toml** - Railway-specific configuration
4. **railway.json** - Railway service configuration

## Deploy Steps

### Option 1: Use Railway Dashboard (Recommended)

1. Go to your Railway project
2. Click on your service
3. Go to "Settings"
4. Under "Build", set:
   - **Root Directory**: `backend`
   - **Dockerfile Path**: `Dockerfile` (it will use `backend/Dockerfile`)
5. Click "Deploy"

### Option 2: Update Railway Configuration

Railway will now auto-detect the root Dockerfile and deploy correctly.

### Option 3: Manual Configuration

If using Railway CLI:

```bash
railway up --service backend
```

## Environment Variables Needed

Set these in Railway dashboard under "Variables":

```bash
# Required
SECRET_KEY=<generate-new-secret-key>
DATABASE_URL=<railway-postgres-url>
REDIS_URL=<railway-redis-url>

# Email
SMTP_USER=tubulol12345@gmail.com
SMTP_PASSWORD=ftldbknzkbgngzqn
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
MAIL_FROM=tubulol12345@gmail.com
MAIL_FROM_NAME=College Prep Platform

# Configuration
DEBUG=False
PASSWORD_RESET_URL=https://yourdomain.com/reset-password

# Cloudinary (optional, use for file uploads)
USE_CLOUDINARY=True
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## Health Check

Once deployed, test:

```bash
curl https://your-railway-app.railway.app/health
```

Should return:

```json
{ "status": "healthy", "timestamp": "..." }
```

## Next Steps

1. ✅ Commit and push these changes
2. ✅ Railway will auto-redeploy
3. ✅ Add PostgreSQL database in Railway
4. ✅ Add Redis cache in Railway
5. ✅ Set environment variables
6. ✅ Test the deployment

## Troubleshooting

If build still fails:

1. Check Railway build logs
2. Ensure Root Directory is set to `backend`
3. Verify Dockerfile path
4. Check environment variables are set
