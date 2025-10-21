# 📦 Cloudinary Integration - File Storage Setup

This document explains how file storage works in the College Prep Platform and how to set up Cloudinary.

---

## 🎯 What Files Does This App Store?

### 1. **Student QR Codes** (Critical)

- Generated when students register
- Used for attendance scanning
- Size: ~10-20 KB per QR code
- Storage: Permanent

### 2. **Course Materials** (Critical)

- Uploaded by teachers/admins
- Types: PDFs, videos, documents, presentations
- Size: Varies (1MB - 100MB)
- Access: Students enrolled in course

### 3. **Future Features** (Planned)

- Assignment submissions
- Message attachments
- Profile pictures

---

## 🚨 Why Cloudinary?

### The Problem with Local Storage

Traditional file storage uses the server's filesystem (`uploads/`, `qr_codes/` folders). This **DOES NOT WORK** in production because:

❌ **Ephemeral filesystem** - Files disappear on server restart/redeploy  
❌ **No persistence** - All uploads lost when app updates  
❌ **No scaling** - Files on one server not available on others  
❌ **No CDN** - Slow downloads for users far from server

### The Cloudinary Solution

✅ **Persistent storage** - Files never disappear  
✅ **Global CDN** - Fast loading worldwide  
✅ **Automatic optimization** - Images/PDFs compressed automatically  
✅ **Generous free tier** - 25GB storage + 25GB bandwidth/month  
✅ **All file types** - Images, videos, PDFs, documents, archives

---

## 🛠️ Setup Instructions

### Step 1: Create Cloudinary Account

1. Go to: https://cloudinary.com/users/register/free
2. Sign up with email (no credit card required)
3. Verify your email

### Step 2: Get Your Credentials

1. Login to Cloudinary dashboard
2. You'll see your credentials on the homepage:
   - **Cloud Name** (e.g., `dq1a2b3c4`)
   - **API Key** (e.g., `123456789012345`)
   - **API Secret** (e.g., `abcdefghijklmnopqrstuvwxyz123`)

### Step 3: Configure Backend

#### For Local Development:

Create/update `.env` file in `backend/` folder:

```bash
# Cloudinary Configuration
USE_CLOUDINARY=False  # Set to False for local development
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

**Note:** Keep `USE_CLOUDINARY=False` for local dev to use local filesystem (faster, no internet required)

#### For Production (Render/Railway):

In your hosting platform's environment variables:

```bash
USE_CLOUDINARY=True  # Enable for production
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Step 4: Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

This installs `cloudinary==1.36.0`

### Step 5: Test Configuration

Run the test script:

```bash
cd backend
python scripts/test_cloudinary.py
```

You should see:

```
✅ Cloudinary configured successfully
✅ Upload successful!
🎉 Cloudinary is working correctly!
```

---

## 📁 How It Works

### Code Architecture

```
backend/
├── app/
│   ├── utils/
│   │   ├── cloudinary_helper.py    # Cloudinary upload/delete functions
│   │   └── qr_generator.py         # Uses cloudinary_helper for QR codes
│   ├── api/
│   │   └── materials.py            # Uses cloudinary_helper for course files
│   └── core/
│       └── config.py               # Cloudinary settings
```

### Upload Flow

#### QR Code Generation:

```
Student registers
→ generate_qr_code() creates QR
→ If USE_CLOUDINARY=True: uploads to Cloudinary
→ Returns: https://res.cloudinary.com/.../qr_code.png
→ URL saved to database
```

#### Course Material Upload:

```
Teacher uploads file
→ upload_material() receives file
→ If USE_CLOUDINARY=True: uploads to Cloudinary
→ Returns: https://res.cloudinary.com/.../document.pdf
→ URL saved to database
```

### Fallback Behavior

If `USE_CLOUDINARY=False`:

- Files saved to local `uploads/` and `qr_codes/` folders
- Works fine for local development
- **DO NOT use in production!**

---

## 🔧 Configuration Options

### Environment Variables

| Variable                | Default | Description                    |
| ----------------------- | ------- | ------------------------------ |
| `USE_CLOUDINARY`        | `False` | Enable/disable Cloudinary      |
| `CLOUDINARY_CLOUD_NAME` | `""`    | Your Cloudinary cloud name     |
| `CLOUDINARY_API_KEY`    | `""`    | Your API key                   |
| `CLOUDINARY_API_SECRET` | `""`    | Your API secret (keep secure!) |

### Cloudinary Folders

Files are organized in folders:

```
Cloudinary/
├── qr_codes/              # Student QR codes
│   ├── qr_student123.png
│   └── attendance_5_20231015.png
└── course_materials/      # Course files
    ├── abc123-lecture1.pdf
    ├── def456-homework.docx
    └── xyz789-intro-video.mp4
```

---

## 📊 Usage & Limits

### Free Tier Limits

- **Storage:** 25 GB
- **Bandwidth:** 25 GB/month
- **Transformations:** 25,000/month
- **Images:** Up to 25,000 images

### Estimated Usage

**For 1000 active users:**

| Item                | Quantity  | Size      | Total     |
| ------------------- | --------- | --------- | --------- |
| Student QR codes    | 1,000     | 10 KB     | 10 MB     |
| Attendance QR codes | 500/year  | 10 KB     | 5 MB      |
| Course materials    | 200 files | 2 MB avg  | 400 MB    |
| Videos (optional)   | 10 videos | 50 MB avg | 500 MB    |
| **TOTAL**           |           |           | **~1 GB** |

**Bandwidth:** ~5 GB/month (assuming moderate usage)

✅ **Free tier is more than enough!**

### Check Your Usage

Monitor usage in Cloudinary dashboard:
https://cloudinary.com/console/usage

---

## 🔐 Security Best Practices

### 1. Keep API Secret Secure

❌ **NEVER** commit `.env` file to Git  
❌ **NEVER** expose API secret in frontend  
✅ Only set in backend environment variables  
✅ Use `.env.example` for documentation

### 2. Use Signed URLs (Optional)

For sensitive files, generate signed URLs with expiration:

```python
from app.utils.cloudinary_helper import generate_upload_url

# Generate temporary upload URL
upload_config = generate_upload_url(
    folder="course_materials",
    allowed_formats=["pdf", "docx"],
    max_file_size=10485760  # 10MB
)
```

### 3. Access Control

Cloudinary URLs are public by default. For private files:

```python
result = upload_file(
    file_content=content,
    folder="private_materials",
    resource_type="raw",
    type="private"  # Requires authentication
)
```

---

## 🐛 Troubleshooting

### Problem: "Import cloudinary could not be resolved"

**Solution:**

```bash
pip install cloudinary
```

### Problem: "Invalid credentials"

**Solution:**

1. Check credentials in Cloudinary dashboard
2. Ensure no extra spaces in `.env` file
3. Restart backend server after changing `.env`

### Problem: "Upload failed"

**Possible causes:**

- Network connection issue
- Invalid file type
- File too large (max 100MB on free tier)
- Quota exceeded

**Check:**

```bash
python scripts/test_cloudinary.py
```

### Problem: "Files not loading in frontend"

**Solution:**

1. Check browser console for CORS errors
2. Cloudinary URLs should start with `https://res.cloudinary.com/`
3. Verify files in Cloudinary dashboard Media Library

### Problem: "Quota exceeded"

**Solution:**

1. Check usage: https://cloudinary.com/console/usage
2. Delete old test files
3. Upgrade to paid plan if needed ($99/month for 75GB)

---

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] ✅ Cloudinary account created
- [ ] ✅ Credentials added to production environment
- [ ] ✅ `USE_CLOUDINARY=True` in production
- [ ] ✅ Tested QR code generation
- [ ] ✅ Tested file upload
- [ ] ✅ Verified files accessible from frontend
- [ ] ✅ Checked Cloudinary dashboard shows files

---

## 📚 API Reference

### Upload File

```python
from app.utils.cloudinary_helper import upload_file

result = upload_file(
    file_content=file_bytes,  # bytes or file-like object
    folder="qr_codes",        # Cloudinary folder
    public_id="qr_student1",  # Optional custom ID
    resource_type="image"     # image, video, raw, auto
)

# Returns:
{
    'secure_url': 'https://res.cloudinary.com/.../image.png',
    'public_id': 'qr_codes/qr_student1',
    'format': 'png',
    'bytes': 12345
}
```

### Delete File

```python
from app.utils.cloudinary_helper import delete_file

result = delete_file(
    public_id="qr_codes/qr_student1",
    resource_type="image"
)
```

### Get File Info

```python
from app.utils.cloudinary_helper import get_file_info

info = get_file_info(
    public_id="qr_codes/qr_student1",
    resource_type="image"
)
```

---

## 📖 Additional Resources

- **Cloudinary Docs:** https://cloudinary.com/documentation
- **Python SDK:** https://cloudinary.com/documentation/python_integration
- **Dashboard:** https://cloudinary.com/console
- **Media Library:** https://cloudinary.com/console/media_library

---

## 💡 Tips & Tricks

### 1. Image Optimization

Cloudinary automatically optimizes images. Use transformation URLs:

```
# Original
https://res.cloudinary.com/demo/image/upload/sample.jpg

# Resized to 300x300
https://res.cloudinary.com/demo/image/upload/w_300,h_300,c_fill/sample.jpg

# Compressed quality
https://res.cloudinary.com/demo/image/upload/q_auto/sample.jpg
```

### 2. Video Streaming

Upload videos and get streaming URLs:

```python
result = upload_file(
    file_content=video_bytes,
    folder="course_videos",
    resource_type="video"
)

# Streaming URL
streaming_url = result['secure_url']
```

### 3. Backup Files

Download all files for backup:

```bash
# Install Cloudinary CLI
npm install -g cloudinary-cli

# Download all files
cloudinary sync:download
```

---

🎉 **You're all set!** Your app now has professional cloud storage with global CDN delivery.
