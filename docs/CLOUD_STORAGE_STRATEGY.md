# ☁️ Cloud Storage Strategy for College Prep Platform

## 📋 Overview

This document outlines the recommended approaches for storing documents and files in the cloud for the College Prep Platform, with analysis of different cloud storage providers and implementation options.

---

## 📁 What Files Need Cloud Storage?

### **1. Course Materials** (High Priority)

- PDFs, videos, presentations, documents
- Uploaded by teachers/admins
- Accessed by enrolled students
- Size: 1MB - 100MB per file
- Quantity: Hundreds to thousands of files

### **2. Student QR Codes** (Critical)

- Generated during student registration
- Used for attendance tracking
- Size: 10-20 KB per code
- Permanent storage needed

### **3. Assignment Submissions** (Future)

- Student project submissions
- Various file types
- Access control needed

### **4. User Profile Pictures** (Optional)

- Student/teacher/admin avatars
- Small files: ~200-500 KB
- Optimization needed

---

## 🎯 Cloud Storage Options Comparison

| Feature                | **Cloudinary** | **AWS S3**       | **Google Cloud Storage** | **Azure Blob**   | **Local Storage**     |
| ---------------------- | -------------- | ---------------- | ------------------------ | ---------------- | --------------------- |
| **Free Tier**          | 25GB storage   | 5GB/12 months    | 5GB/month                | 5GB limited      | Unlimited (ephemeral) |
| **Cost**               | $99/mo (Pro)   | $0.023/GB        | $0.020/GB                | $0.018/GB        | Server storage costs  |
| **CDN**                | ✅ Built-in    | ✅ CloudFront    | ✅ Built-in              | ✅ Built-in      | ❌ No                 |
| **Image Optimization** | ✅ Automatic   | ❌ Manual        | ❌ Manual                | ❌ Manual        | ❌ No                 |
| **Video Streaming**    | ✅ HLS/DASH    | ✅ Need encoding | ✅ Need encoding         | ✅ Need encoding | ❌ Poor               |
| **Setup Complexity**   | ⭐ Easy        | ⭐⭐⭐⭐ Hard    | ⭐⭐⭐ Medium            | ⭐⭐⭐ Medium    | ⭐ Very Easy          |
| **Production Ready**   | ✅ Yes         | ✅ Yes           | ✅ Yes                   | ✅ Yes           | ❌ No                 |
| **Persistence**        | ✅ 100%        | ✅ 100%          | ✅ 100%                  | ✅ 100%          | ❌ ~0% (Docker/K8s)   |
| **Global CDN**         | ✅ 600+ edges  | ✅ 500+ edges    | ✅ 100+ edges            | ✅ 200+ edges    | ❌ None               |

---

## 🏆 Recommended Solution: **Cloudinary**

### Why Cloudinary for This Project?

✅ **Easiest Setup**

- 5 minutes to get started
- No complex IAM policies
- One-line Python integration

✅ **Perfect for Mixed Media**

- Course PDFs → automatic optimization
- Videos → streaming out of the box
- QR codes → instant delivery
- Images → automatic resizing

✅ **Generous Free Tier**

- 25GB storage
- 25GB bandwidth/month
- Up to 25,000 images
- All file types supported

✅ **Media Transformations**

- Auto-compress images
- Generate thumbnails
- Resize on-the-fly
- Video previews

✅ **Built-in CDN**

- Global delivery
- ~600 edge locations
- Automatic caching
- HTTPS included

---

## 🛠️ Implementation Guide

### Current Status in Your App

Your app **already has Cloudinary integration built-in**! ✅

**Location:** `backend/app/utils/cloudinary_helper.py`

**Features:**

- ✅ Upload files to Cloudinary
- ✅ Delete files
- ✅ Get file info
- ✅ Generate signed upload URLs
- ✅ Automatic fallback to local storage

### Step 1: Get Cloudinary Credentials

```bash
# Visit: https://cloudinary.com/users/register/free
# Sign up (no credit card needed)
# Get your credentials:
#   - Cloud Name
#   - API Key
#   - API Secret
```

### Step 2: Add to .env

```bash
# .env (backend)
USE_CLOUDINARY=False  # Set to True in production

# Production only:
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Step 3: Test Upload

```bash
cd backend
python scripts/test_cloudinary.py
```

### Step 4: Enable in Production

**Docker:**

```yaml
environment:
  - USE_CLOUDINARY=True
  - CLOUDINARY_CLOUD_NAME=${CLOUDINARY_CLOUD_NAME}
  - CLOUDINARY_API_KEY=${CLOUDINARY_API_KEY}
  - CLOUDINARY_API_SECRET=${CLOUDINARY_API_SECRET}
```

**Render/Railway:**

```
Set environment variables in dashboard
```

---

## 📊 Usage Patterns & Costs

### Estimated Monthly Costs

**Scenario: 1,000 Active Users**

| Usage            | Amount | Cost   |
| ---------------- | ------ | ------ |
| Storage          | 1 GB   | FREE   |
| Bandwidth        | 5 GB   | FREE   |
| Transformations  | 10,000 | FREE   |
| **Monthly Cost** |        | **$0** |

**Scenario: 10,000 Active Users (High Usage)**

| Usage            | Amount  | Cost                     |
| ---------------- | ------- | ------------------------ |
| Storage          | 10 GB   | FREE                     |
| Bandwidth        | 50 GB   | FREE                     |
| Transformations  | 100,000 | FREE                     |
| **Monthly Cost** |         | **$0** (Still free tier) |

**⚠️ When to upgrade:**

- Storage > 25GB → Need paid plan ($99/mo for 75GB)
- Bandwidth > 25GB/mo → Need paid plan ($99/mo for 75GB)
- This would support **100,000+ active users**

---

## 🔧 API Examples

### Upload Course Material

```python
from app.utils.cloudinary_helper import upload_file

# File is already being uploaded in materials.py
result = upload_file(
    file_content=file_bytes,
    folder="course_materials",
    resource_type="raw"  # For PDFs, docs
)

print(result['secure_url'])
# https://res.cloudinary.com/dq1a2b3c4/raw/upload/.../document.pdf
```

### Generate QR Code & Upload

```python
from qrcode import QRCode, constants as qr_constants
from io import BytesIO
from app.utils.cloudinary_helper import upload_file

# Generate QR code
qr = QRCode(
    version=1,
    error_correction=qr_constants.ERROR_CORRECT_L,
    box_size=10,
    border=4,
)
qr.add_data(f"https://example.com/student/{student_id}")
qr.make(fit=True)

# Save to bytes
img = qr.make_image(fill_color="black", back_color="white")
img_bytes = BytesIO()
img.save(img_bytes, format='PNG')
img_bytes.seek(0)

# Upload to Cloudinary
result = upload_file(
    file_content=img_bytes,
    folder="qr_codes",
    public_id=f"qr_student_{student_id}",
    resource_type="image"
)

qr_url = result['secure_url']
# https://res.cloudinary.com/dq1a2b3c4/image/upload/.../qr_student_123.png
```

### Direct Client-Side Upload

```python
from app.utils.cloudinary_helper import generate_upload_url

# Generate upload credentials for frontend
upload_config = generate_upload_url(
    folder="course_materials",
    allowed_formats=["pdf", "docx", "pptx"],
    max_file_size=10485760  # 10MB
)

return {
    "upload_url": upload_config["upload_url"],
    "api_key": upload_config["api_key"],
    "signature": upload_config["signature"],
    "timestamp": upload_config["timestamp"]
}
```

### Delete File

```python
from app.utils.cloudinary_helper import delete_file

result = delete_file(
    public_id="course_materials/document_123",
    resource_type="raw"
)
```

---

## 🔐 Security Considerations

### 1. API Secret Protection

```bash
# ✅ GOOD: Store in environment variable
CLOUDINARY_API_SECRET=xyz789

# ❌ BAD: Hardcode in code
api_secret = "xyz789"

# ❌ BAD: Expose in frontend
fetch(`/upload?api_secret=${secret}`)
```

### 2. Signed URLs with Expiration

```python
import cloudinary
from datetime import datetime, timedelta

# Generate time-limited URL
resource = cloudinary.api.resource(
    "course_materials/document_123",
    sign_url=True,
    type="authenticated",
    eager=[{"quality": "auto"}]
)

# URL valid for 1 hour
signed_url = cloudinary.utils.cloudinary_url(
    "course_materials/document_123",
    sign_url=True,
    sign_version=2,
    expire_at=int((datetime.now() + timedelta(hours=1)).timestamp())
)
```

### 3. Access Control

```python
# Public materials (anyone can view)
is_public = True
resource_type = "upload"

# Private materials (students only)
is_public = False
# Store in database with access control checks
# Use signed URLs for delivery
```

### 4. Audit Trail

```python
# Log all uploads and deletions
import logging

logger = logging.getLogger(__name__)
logger.info(f"Material uploaded: {public_id} by user {user_id}")
logger.info(f"File deleted: {public_id}")
```

---

## 📈 Performance Optimization

### 1. Image Optimization URLs

```python
# Original URL
https://res.cloudinary.com/cloud/image/upload/v1.jpg

# Automatic format selection + quality
https://res.cloudinary.com/cloud/image/upload/f_auto,q_auto/v1.jpg

# Resize to thumbnail
https://res.cloudinary.com/cloud/image/upload/w_200,h_200,c_fill/v1.jpg

# Progressive JPEG
https://res.cloudinary.com/cloud/image/upload/f_auto,q_auto,fl_progressive/v1.jpg
```

### 2. Video Optimization

```python
# HLS streaming (adaptive bitrate)
https://res.cloudinary.com/cloud/video/upload/vc_h264,q_auto/lecture.mp4

# With poster image
https://res.cloudinary.com/cloud/video/upload/so_0,l_poster/lecture.mp4

# Generate thumbnail
https://res.cloudinary.com/cloud/video/upload/so_5000/lecture.mp4
```

### 3. Caching Headers

```python
# Cloudinary sets optimal cache headers automatically
# Files cache for:
# - 1 year for versioned assets
# - 1 hour for unversioned assets
# - Immutable for hashed filenames
```

---

## 🚀 Deployment Checklist

### Before Going Live

- [ ] Create Cloudinary free account
- [ ] Add credentials to production environment
- [ ] Set `USE_CLOUDINARY=True` in production
- [ ] Test material upload
- [ ] Test QR code generation
- [ ] Verify files appear in Cloudinary dashboard
- [ ] Test file deletion
- [ ] Check bandwidth usage
- [ ] Set up CORS if needed
- [ ] Create backup/restore procedure

### Monitoring

```bash
# Check usage weekly
# Dashboard: https://cloudinary.com/console/usage

# Monitor from Python
from app.utils.cloudinary_helper import get_file_info
info = get_file_info("course_materials/document")
print(f"File size: {info['bytes']} bytes")
print(f"Format: {info['format']}")
```

---

## 🆚 Alternative Solutions

### If You Need More Control: **AWS S3**

```python
import boto3

s3 = boto3.client('s3')

# Upload
s3.upload_file(
    'material.pdf',
    'college-prep-bucket',
    'course_materials/material.pdf'
)

# Generate URL
url = s3.generate_presigned_url(
    'get_object',
    Params={'Bucket': 'bucket', 'Key': 'key'},
    ExpiresIn=3600
)
```

**Pros:**

- Most control
- Cheapest at scale (> 100GB)
- Can use for everything

**Cons:**

- Complex setup (IAM, policies)
- Need CloudFront for CDN
- No built-in transformations
- Manual video encoding

---

### If You Want Simplicity: **Google Cloud Storage**

```python
from google.cloud import storage

client = storage.Client()
bucket = client.bucket('college-prep')

blob = bucket.blob('course_materials/material.pdf')
blob.upload_from_file(file_content)

url = blob.public_url
```

**Pros:**

- Simple API
- Good free tier
- Global CDN

**Cons:**

- Less transformations
- More expensive than Cloudinary
- Video handling not optimal

---

## 📚 Reference

### Cloudinary Dashboard

- https://cloudinary.com/console
- Usage: https://cloudinary.com/console/usage
- Media Library: https://cloudinary.com/console/media_library

### Documentation

- Python SDK: https://cloudinary.com/documentation/python_integration
- Transformations: https://cloudinary.com/documentation/transformation_reference
- Video: https://cloudinary.com/documentation/video_manipulation_and_delivery

### Pricing

- https://cloudinary.com/pricing

---

## ✅ Conclusion

**For your College Prep Platform, we recommend:**

1. **Development:** Local storage (faster, no internet)

   ```
   USE_CLOUDINARY=False
   ```

2. **Production:** Cloudinary (free tier covers 10,000+ users)

   ```
   USE_CLOUDINARY=True
   CLOUDINARY_CLOUD_NAME=your-name
   CLOUDINARY_API_KEY=your-key
   CLOUDINARY_API_SECRET=your-secret
   ```

3. **Scale Beyond:** Upgrade to AWS S3 + CloudFront when you need:
   - Storage > 100GB
   - Bandwidth > 500GB/month
   - Complex file transformations
   - Multi-region replication

**Current implementation is production-ready.** Just add credentials and enable Cloudinary! 🚀
