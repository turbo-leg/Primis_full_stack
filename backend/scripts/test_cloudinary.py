"""
Cloudinary setup verification script
Run this to test your Cloudinary credentials
"""

import os
import sys

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    import cloudinary
    import cloudinary.uploader
    from app.core.config import settings
    from io import BytesIO
    from PIL import Image
except ImportError as e:
    print(f"❌ Error importing required packages: {e}")
    print("Run: pip install -r requirements.txt")
    sys.exit(1)


def test_cloudinary_connection():
    """Test Cloudinary configuration and connection"""
    
    print("🔍 Testing Cloudinary Configuration...")
    print("-" * 50)
    
    # Check environment variables
    print(f"USE_CLOUDINARY: {settings.use_cloudinary}")
    print(f"CLOUDINARY_CLOUD_NAME: {settings.cloudinary_cloud_name or '❌ Not set'}")
    print(f"CLOUDINARY_API_KEY: {settings.cloudinary_api_key or '❌ Not set'}")
    print(f"CLOUDINARY_API_SECRET: {'*' * 10 if settings.cloudinary_api_secret else '❌ Not set'}")
    print("-" * 50)
    
    if not settings.use_cloudinary:
        print("\n⚠️  Cloudinary is disabled (USE_CLOUDINARY=False)")
        print("Files will be stored locally in 'uploads/' and 'qr_codes/' folders")
        print("\nTo enable Cloudinary:")
        print("1. Set USE_CLOUDINARY=True in your .env file")
        print("2. Add your Cloudinary credentials")
        return
    
    if not all([settings.cloudinary_cloud_name, settings.cloudinary_api_key, settings.cloudinary_api_secret]):
        print("\n❌ Cloudinary credentials incomplete!")
        print("\nTo fix this:")
        print("1. Sign up at: https://cloudinary.com/users/register/free")
        print("2. Get your credentials from the dashboard")
        print("3. Add them to your .env file:")
        print("   CLOUDINARY_CLOUD_NAME=your-cloud-name")
        print("   CLOUDINARY_API_KEY=your-api-key")
        print("   CLOUDINARY_API_SECRET=your-api-secret")
        print("   USE_CLOUDINARY=True")
        return
    
    # Configure Cloudinary
    try:
        cloudinary.config(
            cloud_name=settings.cloudinary_cloud_name,
            api_key=settings.cloudinary_api_key,
            api_secret=settings.cloudinary_api_secret,
            secure=True
        )
        print("\n✅ Cloudinary configured successfully")
    except Exception as e:
        print(f"\n❌ Error configuring Cloudinary: {e}")
        return
    
    # Test upload
    try:
        print("\n🧪 Testing file upload...")
        
        # Create a simple test image
        img = Image.new('RGB', (100, 100), color='blue')
        buffer = BytesIO()
        img.save(buffer, format='PNG')
        buffer.seek(0)
        
        # Upload to Cloudinary
        result = cloudinary.uploader.upload(
            buffer.getvalue(),
            folder="test_uploads",
            public_id="test_image",
            resource_type="image"
        )
        
        print(f"✅ Upload successful!")
        print(f"   URL: {result['secure_url']}")
        print(f"   Public ID: {result['public_id']}")
        print(f"   Format: {result['format']}")
        print(f"   Size: {result['bytes']} bytes")
        
        # Delete test image
        cloudinary.uploader.destroy(result['public_id'])
        print("\n🗑️  Test image deleted from Cloudinary")
        
        print("\n" + "=" * 50)
        print("🎉 Cloudinary is working correctly!")
        print("=" * 50)
        print("\nYour app is ready to use cloud storage for:")
        print("  • Student QR codes")
        print("  • Course materials (PDFs, videos, documents)")
        print("  • Any uploaded files")
        
    except Exception as e:
        print(f"\n❌ Upload test failed: {e}")
        print("\nPossible issues:")
        print("  • Invalid credentials")
        print("  • Network connection problem")
        print("  • API quota exceeded")
        print("\nCheck your Cloudinary dashboard: https://cloudinary.com/console")


def print_cloudinary_info():
    """Print helpful Cloudinary information"""
    print("\n" + "=" * 50)
    print("📊 Cloudinary Free Tier Limits")
    print("=" * 50)
    print("Storage:     25 GB")
    print("Bandwidth:   25 GB/month")
    print("Transforms:  25,000/month")
    print("Storage:     25,000 images")
    print("\nCheck usage: https://cloudinary.com/console/usage")
    print("\n" + "=" * 50)


if __name__ == "__main__":
    print("\n" + "=" * 50)
    print("🚀 College Prep Platform - Cloudinary Setup")
    print("=" * 50)
    
    test_cloudinary_connection()
    
    if settings.use_cloudinary and all([
        settings.cloudinary_cloud_name,
        settings.cloudinary_api_key,
        settings.cloudinary_api_secret
    ]):
        print_cloudinary_info()
    
    print("\n✨ Setup verification complete!\n")
