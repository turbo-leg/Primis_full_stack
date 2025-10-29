"""
Test Password Reset Flow
Run this to test the complete password reset functionality
"""

import requests
import time

# Configuration
API_URL = "http://localhost:8000"
TEST_EMAIL = "student@gmail.com"  # Use one of your test users

print("🔐 Testing Password Reset Flow")
print("=" * 60)

# Step 1: Request password reset
print("\n1️⃣ Requesting password reset...")
response = requests.post(
    f"{API_URL}/api/v1/auth/forgot-password",
    json={"email": TEST_EMAIL}
)

print(f"Status: {response.status_code}")
print(f"Response: {response.json()}")

if response.status_code == 200:
    print("✅ Password reset email request successful!")
    print("\n📧 Check your email (or backend logs) for the reset token")
    print("\n⏳ Waiting 5 seconds for email to send...")
    time.sleep(5)
    
    print("\n" + "=" * 60)
    print("NEXT STEPS:")
    print("=" * 60)
    print("1. Check your email inbox for the password reset link")
    print("2. OR check backend logs for the token")
    print("3. OR query the database:")
    print(f"   docker exec college-prep-platform-postgres-1 psql -U postgres -d college_prep -c \"SELECT token_hash, created_at, expires_at FROM password_reset_tokens WHERE email='{TEST_EMAIL}' ORDER BY created_at DESC LIMIT 1;\"")
    print("\n4. To reset password with token, run:")
    print("   $token = 'YOUR_TOKEN_HERE'")
    print(f"   Invoke-WebRequest -Method POST -Uri '{API_URL}/api/v1/auth/reset-password' -ContentType 'application/json' -Body (ConvertTo-Json @{{token=$token; new_password='newpass123'; confirm_password='newpass123'}}) | ConvertFrom-Json")
    
else:
    print(f"❌ Error: {response.json()}")

print("\n" + "=" * 60)
print("📝 Note: No Redis/Celery needed - emails sent directly!")
print("=" * 60)
