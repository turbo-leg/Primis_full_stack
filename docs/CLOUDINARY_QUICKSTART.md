# 🚀 Quick Start - Cloudinary Setup

## For Local Development (5 minutes)

### Option 1: Use Local Storage (Easiest)

```bash
# In backend/.env
USE_CLOUDINARY=False
```

That's it! Files will save to local folders. ✅

---

### Option 2: Use Cloudinary (Optional)

1. **Sign up:** https://cloudinary.com/users/register/free
2. **Get credentials** from dashboard
3. **Add to `.env`:**
   ```bash
   USE_CLOUDINARY=True
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   ```
4. **Install:**
   ```bash
   pip install cloudinary
   ```
5. **Test:**
   ```bash
   python scripts/test_cloudinary.py
   ```

---

## For Production Deployment (Required)

### 1. Create Cloudinary Account

- Go to: https://cloudinary.com/users/register/free
- No credit card needed
- Free tier: 25GB storage

### 2. Add to Render Environment Variables

```bash
USE_CLOUDINARY=True
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### 3. That's it!

Files will now upload to Cloudinary cloud storage instead of local filesystem.

---

## Testing

### Test Local Setup

```bash
# Start backend
cd backend
uvicorn app.main:app --reload

# Test endpoints:
# - Register student → QR code should generate
# - Upload course material → File should upload
```

### Test Cloudinary Setup

```bash
cd backend
python scripts/test_cloudinary.py

# Should show:
# ✅ Cloudinary configured successfully
# ✅ Upload successful!
```

---

## Files That Get Stored

| File Type        | Size        | Where                      |
| ---------------- | ----------- | -------------------------- |
| Student QR codes | 10KB        | `qr_codes/` folder         |
| Course materials | 1-100MB     | `course_materials/` folder |
| Videos           | Up to 100MB | `course_materials/` folder |

---

## Free Tier Limits

- **Storage:** 25 GB (enough for 10,000+ users)
- **Bandwidth:** 25 GB/month
- **Cost:** $0

---

## Troubleshooting

### "Import cloudinary error"

```bash
pip install cloudinary
```

### "Upload failed"

- Check credentials in Cloudinary dashboard
- Verify no extra spaces in `.env`
- Restart backend after changing `.env`

### "Files not showing"

- Check `USE_CLOUDINARY=True` in production
- Verify files in Cloudinary Media Library
- Check browser console for errors

---

## Documentation

- **Full setup guide:** `backend/CLOUDINARY.md`
- **Deployment guide:** `DEPLOYMENT.md`
- **Implementation details:** `CLOUDINARY_IMPLEMENTATION.md`

---

## Quick Commands

```bash
# Install dependencies
pip install -r requirements.txt

# Test Cloudinary
python scripts/test_cloudinary.py

# Run backend
uvicorn app.main:app --reload

# Check Cloudinary usage
# Visit: https://cloudinary.com/console/usage
```

---

## Need Help?

1. Read `CLOUDINARY.md` for detailed guide
2. Run test script: `python scripts/test_cloudinary.py`
3. Check Cloudinary dashboard: https://cloudinary.com/console
4. Review logs in Render dashboard

---

✨ **That's it! You're ready to deploy with cloud storage.** ✨
