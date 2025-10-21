#!/usr/bin/env python
"""Test email service configuration"""

import sys
print("Python version:", sys.version)
print("Python executable:", sys.executable)

try:
    from dotenv import load_dotenv
    print("✅ dotenv imported successfully")
except ImportError as e:
    print(f"❌ Failed to import dotenv: {e}")
    sys.exit(1)

try:
    from app.core.config import settings
    print("✅ Settings imported successfully")
    print(f"\nSMTP Configuration:")
    print(f"   User: {settings.smtp_user}")
    print(f"   Server: {settings.smtp_server}")
    print(f"   Port: {settings.smtp_port}")
    print(f"   Password configured: {bool(settings.smtp_password)}")
except Exception as e:
    print(f"❌ Failed to import settings: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

try:
    from app.services.email_service import email_service
    print(f"\n✅ Email service loaded")
    print(f"   Email service enabled: {email_service.enabled}")
    print(f"   FastMail instance created: {email_service.fast_mail is not None}")
except Exception as e:
    print(f"❌ Failed to load email service: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("\n✅ All systems ready!")
