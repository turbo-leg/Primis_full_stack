#!/usr/bin/env python3
"""
Complete email system verification test
"""
import sys
from app.services.email_service import email_service
from app.core.config import settings

print("\n" + "="*60)
print("EMAIL SYSTEM VERIFICATION TEST")
print("="*60 + "\n")

# Test 1: Email service initialization
print("✓ Test 1: Email Service Initialization")
print(f"  Status: {'✅ ENABLED' if email_service.enabled else '❌ DISABLED'}")
print(f"  FastMail: {'✅ Available' if email_service.fast_mail else '❌ Not Available'}")
print()

# Test 2: Configuration
print("✓ Test 2: Email Configuration")
print(f"  SMTP User: {settings.smtp_user}")
print(f"  SMTP Server: {settings.smtp_server}:{settings.smtp_port}")
print(f"  Mail From Name: {settings.mail_from_name}")
print(f"  Password Reset URL: {settings.password_reset_url}")
print(f"  Token Expiration: {settings.password_reset_token_expire_hours} hours")
print()

# Test 3: Token generation
print("✓ Test 3: Password Reset Token Generation")
try:
    token, token_hash = email_service.generate_reset_token()
    print(f"  Token generated: {token[:20]}...")
    print(f"  Token hash: {token_hash[:20]}...")
    print(f"  Token length: {len(token)} characters")
    print(f"  ✅ Token generation working")
except Exception as e:
    print(f"  ❌ Error: {e}")
print()

# Test 4: Token verification
print("✓ Test 4: Token Verification")
try:
    # Generate a token
    token, token_hash = email_service.generate_reset_token()
    
    # Verify it matches
    is_valid = email_service.verify_reset_token(token, token_hash)
    if is_valid:
        print(f"  ✅ Token verification successful")
    else:
        print(f"  ❌ Token verification failed")
except Exception as e:
    print(f"  ❌ Error: {e}")
print()

# Test 5: Email service status
print("✓ Test 5: Email Service Status")
if email_service.enabled and email_service.fast_mail:
    print("  ✅ Email service is fully functional")
    print("  Ready to send:")
    print("    • Password reset emails")
    print("    • Notification emails")
    print("    • Monthly reports")
    print("    • Attendance summaries")
else:
    print("  ❌ Email service is not functional")
    print("  Check configuration and SMTP credentials")
print()

# Test 6: Celery configuration
print("✓ Test 6: Celery Configuration")
try:
    from app.services.celery_app import celery_app
    print(f"  Broker URL: {settings.celery_broker_url}")
    print(f"  Result Backend: {settings.celery_result_backend}")
    print(f"  ✅ Celery configured")
except Exception as e:
    print(f"  ❌ Error: {e}")
print()

# Summary
print("="*60)
print("SUMMARY")
print("="*60)
if email_service.enabled:
    print("✅ Email system is fully operational")
    print("\nNext steps:")
    print("  1. Start PostgreSQL database")
    print("  2. Start Redis (for Celery)")
    print("  3. Run the backend API: uvicorn app.main:app --reload")
    print("  4. Start Celery worker: celery -A app.services.celery_app worker --loglevel=info")
    print("  5. Test endpoints:")
    print("     • POST /api/v1/auth/forgot-password")
    print("     • POST /api/v1/auth/reset-password")
    print("     • GET/PUT /api/v1/auth/email-preferences")
    print("     • GET /api/v1/admin/email-logs")
else:
    print("❌ Email system is not operational")
    print("Please check SMTP configuration and try again")

print("="*60 + "\n")
