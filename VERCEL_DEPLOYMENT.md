# Vercel Deployment Guide

## Frontend Deployment to Vercel

This guide walks you through deploying the College Prep Platform frontend to Vercel.

---

## 🚀 Prerequisites

- GitHub account with repository access: `https://github.com/turbo-leg/Primis_full_stack`
- Vercel account (free tier available): https://vercel.com
- Backend deployed on Render: `https://primis-full-stack-1.onrender.com`

---

## 📋 Step-by-Step Deployment

### 1. Sign Up / Log In to Vercel

1. Go to https://vercel.com
2. Click "Sign Up" or "Log In"
3. Connect with your GitHub account

### 2. Import Your Project

1. Click "Add New..." → "Project"
2. Import from GitHub: `turbo-leg/Primis_full_stack`
3. Vercel will detect it's a monorepo

### 3. Configure Project Settings

**Root Directory:**

```
frontend
```

**Framework Preset:**

```
Next.js
```

**Build Command (Auto-detected):**

```
npm run build
```

**Output Directory (Auto-detected):**

```
.next
```

**Install Command:**

```
npm install
```

### 4. Set Environment Variables

In the Vercel project settings, add these environment variables:

```bash
# Backend API URL
NEXT_PUBLIC_API_URL=https://primis-full-stack-1.onrender.com

# Application Info
NEXT_PUBLIC_APP_NAME=College Prep Platform
NEXT_PUBLIC_APP_VERSION=1.0.0
```

**How to add:**

1. Go to Project Settings → Environment Variables
2. Add each variable with name and value
3. Select environment: Production, Preview, Development (check all)

### 5. Deploy

1. Click "Deploy"
2. Wait 2-3 minutes for build to complete
3. Your app will be live at: `https://your-project-name.vercel.app`

---

## 🔧 Configuration Files

### Files Created for Vercel

1. **`vercel.json`** - Vercel-specific configuration

   - Build commands
   - Environment variables
   - Security headers
   - Region settings

2. **`.env.production`** - Production environment variables

   - Backend API URL
   - App configuration

3. **`next.config.js`** - Updated for Vercel
   - Removed `output: 'standalone'` (Vercel handles this)
   - Added image domains for Render and Cloudinary
   - Added remote patterns for security

---

## ⚙️ Backend CORS Configuration

**IMPORTANT:** Update backend CORS to allow your Vercel domain.

In `backend/app/main.py`, update the CORS middleware:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://your-vercel-app.vercel.app",  # Add your Vercel URL
        "https://primis-full-stack-1.onrender.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Then push changes and redeploy backend on Render.

---

## 🔍 Post-Deployment Checklist

### Test Your Deployment

1. **Homepage**

   - Visit your Vercel URL
   - Check if the app loads

2. **API Connection**

   - Try logging in
   - Check browser console for errors
   - Look for CORS errors (if any, update backend CORS)

3. **Features Test**
   - Authentication (login/logout)
   - Dashboard loading
   - Course management
   - Notifications
   - QR code scanning
   - File uploads (Cloudinary)

### Monitor Logs

1. Go to Vercel Dashboard → Your Project → Logs
2. Check Runtime Logs for errors
3. Check Build Logs if deployment fails

---

## 🐛 Troubleshooting

### Build Fails

**Error: "Module not found"**

```bash
# Make sure all dependencies are in package.json
cd frontend
npm install
```

**Error: "Type check failed"**

```bash
# Run type check locally first
npm run type-check
# Fix any TypeScript errors before deploying
```

### CORS Errors

If you see CORS errors in browser console:

1. Update backend CORS origins with your Vercel URL
2. Redeploy backend on Render
3. Clear browser cache and test again

### API Connection Issues

**Error: "Failed to fetch"**

1. Check `NEXT_PUBLIC_API_URL` is set correctly
2. Verify backend is running: https://primis-full-stack-1.onrender.com/health
3. Check Vercel environment variables are set

### Images Not Loading

1. Verify Cloudinary domains in `next.config.js`
2. Check `remotePatterns` includes your image sources
3. Redeploy frontend after config changes

---

## 🔄 Continuous Deployment

Vercel automatically deploys when you push to GitHub:

- **Main branch** → Production deployment
- **Other branches** → Preview deployments

To trigger a new deployment:

```bash
git add .
git commit -m "Update frontend"
git push origin main
```

Vercel will automatically build and deploy!

---

## 📊 Custom Domain (Optional)

### Add Your Own Domain

1. Go to Project Settings → Domains
2. Add your domain (e.g., `collegeprepplatform.com`)
3. Update DNS records as instructed
4. SSL certificate is automatically provisioned

### Update Backend CORS

Don't forget to add your custom domain to backend CORS:

```python
allow_origins=[
    "https://collegeprepplatform.com",
    # ... other origins
]
```

---

## 💰 Pricing

### Vercel Free Tier Includes:

- Unlimited deployments
- 100GB bandwidth/month
- Automatic HTTPS
- Preview deployments
- Edge Network (CDN)
- 6000 build minutes/month

**Perfect for this project!**

---

## 🎯 Expected URLs After Deployment

- **Frontend (Vercel):** `https://your-project-name.vercel.app`
- **Backend (Render):** `https://primis-full-stack-1.onrender.com`
- **API Docs:** `https://primis-full-stack-1.onrender.com/docs`

---

## 📱 Next Steps After Deployment

1. ✅ Test all features thoroughly
2. ✅ Update backend CORS with Vercel URL
3. ✅ Set up error tracking (Sentry)
4. ✅ Configure analytics (Vercel Analytics)
5. ✅ Set up monitoring and alerts
6. ✅ Share your live app URL!

---

## 🆘 Need Help?

- **Vercel Documentation:** https://vercel.com/docs
- **Next.js Deployment:** https://nextjs.org/docs/deployment
- **Vercel Support:** https://vercel.com/support

---

## 🎉 Success Indicator

Your frontend is successfully deployed when:

- ✅ Build completes without errors
- ✅ App loads at Vercel URL
- ✅ Can log in successfully
- ✅ API calls work (check Network tab)
- ✅ No CORS errors in console
- ✅ Images load correctly
- ✅ All features functional

**Congratulations! Your College Prep Platform is now live! 🚀**
