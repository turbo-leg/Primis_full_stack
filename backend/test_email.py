#!/usr/bin/env python3
"""
Test script to send an email using SMTP configuration from .env
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# SMTP Configuration
SMTP_SERVER = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
SMTP_PORT = int(os.getenv('SMTP_PORT', 587))
SMTP_USER = os.getenv('SMTP_USER', 'tubulol12345@gmail.com')
SMTP_PASSWORD = os.getenv('SMTP_PASSWORD', 'ftldbknzkbgngzqn')
MAIL_FROM = os.getenv('MAIL_FROM', 'tubulol12345@gmail.com')
MAIL_FROM_NAME = os.getenv('MAIL_FROM_NAME', 'College Prep Platform')

def send_test_email(recipient_email: str):
    """
    Send a test email to verify SMTP configuration
    """
    try:
        print(f"📧 Attempting to send test email...")
        print(f"   From: {MAIL_FROM} ({MAIL_FROM_NAME})")
        print(f"   To: {recipient_email}")
        print(f"   SMTP Server: {SMTP_SERVER}:{SMTP_PORT}")
        print()

        # Create message
        message = MIMEMultipart("alternative")
        message["Subject"] = "College Prep Platform - Test Email"
        message["From"] = f"{MAIL_FROM_NAME} <{MAIL_FROM}>"
        message["To"] = recipient_email

        # Create email body
        text = """\
        Hi!

        This is a test email from the College Prep Platform.

        If you received this email, it means the SMTP configuration is working correctly!

        Best regards,
        College Prep Platform Team
        """

        html = """\
        <html>
            <body>
                <h2>College Prep Platform - Test Email</h2>
                <p>Hi!</p>
                <p>This is a test email from the <strong>College Prep Platform</strong>.</p>
                <p>If you received this email, it means the SMTP configuration is working correctly!</p>
                <br>
                <p>Best regards,<br><strong>College Prep Platform Team</strong></p>
            </body>
        </html>
        """

        # Attach both plain text and HTML versions
        part1 = MIMEText(text, "plain")
        part2 = MIMEText(html, "html")
        message.attach(part1)
        message.attach(part2)

        # Send email
        print("🔐 Connecting to SMTP server...")
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            print("✓ Connected to SMTP server")
            
            print("🔒 Starting TLS...")
            server.starttls()
            print("✓ TLS started")
            
            print("👤 Authenticating...")
            server.login(SMTP_USER, SMTP_PASSWORD)
            print("✓ Authentication successful")
            
            print("📤 Sending email...")
            server.sendmail(MAIL_FROM, recipient_email, message.as_string())
            print("✓ Email sent successfully!")

        print()
        print("✅ TEST PASSED - Email sent successfully to " + recipient_email)
        return True

    except smtplib.SMTPAuthenticationError:
        print("❌ AUTHENTICATION FAILED")
        print("   Check your SMTP_USER and SMTP_PASSWORD")
        return False
    except smtplib.SMTPException as e:
        print(f"❌ SMTP ERROR: {e}")
        return False
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False


if __name__ == "__main__":
    recipient = "tubuubut@gmail.com"
    success = send_test_email(recipient)
    exit(0 if success else 1)
