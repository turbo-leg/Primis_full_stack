"""
Email Service - Handles sending emails for notifications, password reset, and reports

Note: This service requires fastapi-mail to be installed.
Install with: pip install fastapi-mail
"""

from typing import List, Optional
from datetime import datetime
import secrets
import hashlib

# Try to import fastapi_mail, but gracefully handle if not installed
try:
    from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
    FASTMAIL_AVAILABLE = True
except ImportError:
    FASTMAIL_AVAILABLE = False

from app.core.config import settings


class EmailService:
    """Service for managing email notifications"""

    def __init__(self):
        self.enabled = FASTMAIL_AVAILABLE and settings.smtp_user and settings.smtp_password
        
        if self.enabled:
            try:
                self.conf = ConnectionConfig(  # type: ignore
                    MAIL_FROM=settings.smtp_user,
                    MAIL_FROM_NAME=settings.mail_from_name,
                    MAIL_STARTTLS=True,
                    MAIL_PORT=settings.smtp_port,
                    MAIL_SERVER=settings.smtp_server,
                    MAIL_USERNAME=settings.smtp_user,
                    MAIL_PASSWORD=settings.smtp_password,
                    USE_CREDENTIALS=True,
                    VALIDATE_CERTS=True
                )
                self.fast_mail = FastMail(self.conf)  # type: ignore
            except Exception as e:
                print(f"Warning: Could not initialize email service: {e}")
                self.enabled = False
                self.fast_mail = None
        else:
            self.fast_mail = None
            if not FASTMAIL_AVAILABLE:
                print("Warning: fastapi-mail is not installed. Email notifications disabled.")
            if not settings.smtp_user or not settings.smtp_password:
                print("Warning: SMTP credentials not configured. Email notifications disabled.")

    async def _send_email(self, recipient: str, subject: str, html: str) -> bool:
        """Internal method to send email"""
        if not self.enabled or not self.fast_mail:
            return False

        try:
            message = MessageSchema(  # type: ignore
                subject=subject,
                recipients=[recipient],
                html=html,
                subtype="html"
            )
            await self.fast_mail.send_message(message)  # type: ignore
            return True
        except Exception as e:
            print(f"Error sending email to {recipient}: {str(e)}")
            return False

    # ==================== Authentication Emails ====================

    async def send_password_reset_email(
        self,
        email: str,
        name: str,
        reset_token: str,
        reset_url: Optional[str] = None
    ) -> bool:
        """Send password reset email with secure token"""
        
        if not reset_url:
            reset_url = f"{settings.password_reset_url}?token={reset_token}"
        
        html_content = f"""
        <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background-color: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0; }}
                    .content {{ background-color: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }}
                    .button {{ background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }}
                    .footer {{ color: #6b7280; font-size: 12px; margin-top: 20px; border-top: 1px solid #e5e7eb; padding-top: 20px; }}
                    .warning {{ background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 10px; margin: 15px 0; }}
                    .token-box {{ background-color: #f3f4f6; padding: 10px; border-radius: 5px; font-family: monospace; word-break: break-all; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🔒 Password Reset Request</h1>
                    </div>
                    <div class="content">
                        <p>Hello {name},</p>
                        <p>You requested to reset your password for College Prep Platform. Click the button below to create a new password:</p>
                        <a href="{reset_url}" class="button">Reset Your Password</a>
                        <p><strong>Link expires in 24 hours.</strong></p>
                        <div class="warning">
                            <strong>⚠️ Security Notice:</strong> If you didn't request this, please ignore this email. Your account is secure.
                        </div>
                        <p><strong>Alternative Method:</strong></p>
                        <p>Copy and paste this token in your reset form:</p>
                        <div class="token-box">{reset_token}</div>
                        <p style="color: #6b7280; font-size: 12px;">This link is unique to you. Never share it with anyone.</p>
                    </div>
                    <div class="footer">
                        <p>© 2025 College Prep Platform. All rights reserved.</p>
                        <p>Questions? Contact support@collegeprep.com</p>
                    </div>
                </div>
            </body>
        </html>
        """
        
        return await self._send_email(email, "Reset Your Password - College Prep Platform", html_content)

    async def send_welcome_email(
        self,
        email: str,
        name: str,
        user_type: str,
        login_url: str
    ) -> bool:
        """Send welcome email to new user"""
        
        html_content = f"""
        <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background-color: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; }}
                    .content {{ background-color: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }}
                    .button {{ background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }}
                    .footer {{ color: #6b7280; font-size: 12px; margin-top: 20px; border-top: 1px solid #e5e7eb; padding-top: 20px; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Welcome to College Prep Platform! 🎓</h1>
                    </div>
                    <div class="content">
                        <p>Hello {name},</p>
                        <p>Your account has been successfully created as a <strong>{user_type}</strong>.</p>
                        <p>You can now log in and access all features of the College Prep Platform.</p>
                        <a href="{login_url}" class="button">Login to Your Account</a>
                        <p><strong>Account Details:</strong></p>
                        <ul>
                            <li><strong>Email:</strong> {email}</li>
                            <li><strong>User Type:</strong> {user_type}</li>
                            <li><strong>Join Date:</strong> {datetime.now().strftime('%B %d, %Y')}</li>
                        </ul>
                        <p>If you didn't create this account, please contact our support team immediately.</p>
                    </div>
                    <div class="footer">
                        <p>© 2025 College Prep Platform. All rights reserved.</p>
                    </div>
                </div>
            </body>
        </html>
        """
        
        return await self._send_email(email, "Welcome to College Prep Platform", html_content)

    # ==================== Assignment & Grade Emails ====================

    async def send_assignment_notification(
        self,
        student_emails: List[str],
        assignment_title: str,
        course_title: str,
        due_date: str,
        course_url: str
    ) -> bool:
        """Send notification to students about new assignment"""
        
        if not student_emails:
            return False
        
        html_content = f"""
        <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background-color: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; }}
                    .content {{ background-color: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }}
                    .button {{ background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>📝 New Assignment Posted</h1>
                    </div>
                    <div class="content">
                        <p>A new assignment has been posted in <strong>{course_title}</strong>:</p>
                        <h3>{assignment_title}</h3>
                        <p><strong>Due Date:</strong> {due_date}</p>
                        <a href="{course_url}" class="button">View Assignment</a>
                    </div>
                </div>
            </body>
        </html>
        """
        
        # Send to all students
        success_count = 0
        for email in student_emails:
            if await self._send_email(email, f"New Assignment: {assignment_title}", html_content):
                success_count += 1
        
        return success_count == len(student_emails)

    async def send_grade_notification(
        self,
        student_email: str,
        student_name: str,
        assignment_title: str,
        grade: float,
        max_points: float,
        feedback: Optional[str] = None
    ) -> bool:
        """Send grade notification to student"""
        
        percentage = (grade / max_points) * 100
        grade_letter = self._get_grade_letter(percentage)
        
        feedback_html = ""
        if feedback:
            feedback_html = f"<p><strong>Teacher Feedback:</strong> {feedback}</p>"
        
        html_content = f"""
        <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background-color: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; }}
                    .content {{ background-color: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }}
                    .grade {{ font-size: 32px; font-weight: bold; color: #2563eb; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>✅ Your Assignment Has Been Graded</h1>
                    </div>
                    <div class="content">
                        <p>Hello {student_name},</p>
                        <p>Your assignment <strong>"{assignment_title}"</strong> has been graded:</p>
                        <p class="grade">{grade}/{max_points} ({percentage:.1f}%) - Grade: {grade_letter}</p>
                        {feedback_html}
                    </div>
                </div>
            </body>
        </html>
        """
        
        return await self._send_email(student_email, f"Grade Posted: {assignment_title}", html_content)

    # ==================== Attendance Emails ====================

    async def send_attendance_summary_email(
        self,
        student_email: str,
        student_name: str,
        course_title: str,
        total_classes: int,
        attended_classes: int,
        attendance_percentage: float
    ) -> bool:
        """Send attendance summary email"""
        
        html_content = f"""
        <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background-color: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; }}
                    .content {{ background-color: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }}
                    .stats {{ display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin: 20px 0; }}
                    .stat-box {{ background-color: white; padding: 15px; border-radius: 5px; border-left: 4px solid #2563eb; text-align: center; }}
                    .stat-value {{ font-size: 24px; font-weight: bold; color: #2563eb; }}
                    .stat-label {{ font-size: 12px; color: #6b7280; margin-top: 5px; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>📊 Attendance Summary - {course_title}</h1>
                    </div>
                    <div class="content">
                        <p>Hello {student_name},</p>
                        <p>Here's your attendance summary for <strong>{course_title}</strong>:</p>
                        <div class="stats">
                            <div class="stat-box">
                                <div class="stat-value">{total_classes}</div>
                                <div class="stat-label">Total Classes</div>
                            </div>
                            <div class="stat-box">
                                <div class="stat-value">{attended_classes}</div>
                                <div class="stat-label">Attended</div>
                            </div>
                            <div class="stat-box">
                                <div class="stat-value">{attendance_percentage:.1f}%</div>
                                <div class="stat-label">Attendance Rate</div>
                            </div>
                        </div>
                        <p style="color: #6b7280;">Keep up your attendance to stay on track with your courses!</p>
                    </div>
                </div>
            </body>
        </html>
        """
        
        return await self._send_email(student_email, f"Attendance Summary: {course_title}", html_content)

    # ==================== Monthly Report Emails ====================

    async def send_monthly_student_report(
        self,
        student_email: str,
        student_name: str,
        month: str,
        year: str,
        total_classes: int,
        attended_classes: int,
        attendance_percentage: float,
        assignments_completed: int,
        average_grade: float,
        outstanding_assignments: int,
        top_course: Optional[str] = None
    ) -> bool:
        """Send monthly report to student"""
        
        top_course_html = f"<p><strong>Top Course:</strong> {top_course}</p>" if top_course else ""
        
        html_content = f"""
        <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background-color: #1e40af; color: white; padding: 20px; border-radius: 8px 8px 0 0; }}
                    .content {{ background-color: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }}
                    .section {{ margin: 20px 0; padding-bottom: 20px; border-bottom: 1px solid #e5e7eb; }}
                    .section:last-child {{ border-bottom: none; }}
                    .stat-row {{ display: flex; justify-content: space-between; padding: 8px 0; }}
                    .stat-label {{ color: #6b7280; }}
                    .stat-value {{ font-weight: bold; color: #1e40af; }}
                    .footer {{ color: #6b7280; font-size: 12px; margin-top: 20px; border-top: 1px solid #e5e7eb; padding-top: 20px; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>📈 Your Monthly Report - {month} {year}</h1>
                    </div>
                    <div class="content">
                        <p>Hello {student_name},</p>
                        <p>Here's your performance summary for {month} {year}:</p>
                        
                        <div class="section">
                            <h3>Attendance</h3>
                            <div class="stat-row">
                                <span class="stat-label">Total Classes:</span>
                                <span class="stat-value">{total_classes}</span>
                            </div>
                            <div class="stat-row">
                                <span class="stat-label">Classes Attended:</span>
                                <span class="stat-value">{attended_classes}</span>
                            </div>
                            <div class="stat-row">
                                <span class="stat-label">Attendance Rate:</span>
                                <span class="stat-value">{attendance_percentage:.1f}%</span>
                            </div>
                        </div>
                        
                        <div class="section">
                            <h3>Academic Performance</h3>
                            <div class="stat-row">
                                <span class="stat-label">Assignments Completed:</span>
                                <span class="stat-value">{assignments_completed}</span>
                            </div>
                            <div class="stat-row">
                                <span class="stat-label">Average Grade:</span>
                                <span class="stat-value">{average_grade:.2f}%</span>
                            </div>
                            <div class="stat-row">
                                <span class="stat-label">Outstanding Assignments:</span>
                                <span class="stat-value">{outstanding_assignments}</span>
                            </div>
                            {top_course_html}
                        </div>
                        
                        <p>Keep working hard to maintain your excellent performance!</p>
                    </div>
                    <div class="footer">
                        <p>© 2025 College Prep Platform. All rights reserved.</p>
                    </div>
                </div>
            </body>
        </html>
        """
        
        return await self._send_email(student_email, f"Your Monthly Report - {month} {year}", html_content)

    async def send_monthly_teacher_report(
        self,
        teacher_email: str,
        teacher_name: str,
        month: str,
        year: str,
        students_taught: int,
        assignments_posted: int,
        assignments_graded: int,
        pending_assignments: int,
        average_class_grade: float,
        course_summary: Optional[str] = None
    ) -> bool:
        """Send monthly report to teacher"""
        
        course_summary_html = f"<p><strong>Course Summary:</strong> {course_summary}</p>" if course_summary else ""
        
        html_content = f"""
        <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background-color: #7c3aed; color: white; padding: 20px; border-radius: 8px 8px 0 0; }}
                    .content {{ background-color: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }}
                    .section {{ margin: 20px 0; padding-bottom: 20px; border-bottom: 1px solid #e5e7eb; }}
                    .stat-row {{ display: flex; justify-content: space-between; padding: 8px 0; }}
                    .stat-label {{ color: #6b7280; }}
                    .stat-value {{ font-weight: bold; color: #7c3aed; }}
                    .footer {{ color: #6b7280; font-size: 12px; margin-top: 20px; border-top: 1px solid #e5e7eb; padding-top: 20px; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>👨‍🏫 Your Monthly Report - {month} {year}</h1>
                    </div>
                    <div class="content">
                        <p>Hello {teacher_name},</p>
                        <p>Here's your teaching summary for {month} {year}:</p>
                        
                        <div class="section">
                            <h3>Class Statistics</h3>
                            <div class="stat-row">
                                <span class="stat-label">Students Taught:</span>
                                <span class="stat-value">{students_taught}</span>
                            </div>
                            <div class="stat-row">
                                <span class="stat-label">Average Class Grade:</span>
                                <span class="stat-value">{average_class_grade:.2f}%</span>
                            </div>
                        </div>
                        
                        <div class="section">
                            <h3>Assignment Management</h3>
                            <div class="stat-row">
                                <span class="stat-label">Assignments Posted:</span>
                                <span class="stat-value">{assignments_posted}</span>
                            </div>
                            <div class="stat-row">
                                <span class="stat-label">Assignments Graded:</span>
                                <span class="stat-value">{assignments_graded}</span>
                            </div>
                            <div class="stat-row">
                                <span class="stat-label">Pending Assignments:</span>
                                <span class="stat-value">{pending_assignments}</span>
                            </div>
                            {course_summary_html}
                        </div>
                        
                        <p>Great work this month! Keep up the excellent teaching.</p>
                    </div>
                    <div class="footer">
                        <p>© 2025 College Prep Platform. All rights reserved.</p>
                    </div>
                </div>
            </body>
        </html>
        """
        
        return await self._send_email(teacher_email, f"Your Monthly Report - {month} {year}", html_content)

    async def send_monthly_admin_report(
        self,
        admin_email: str,
        admin_name: str,
        month: str,
        year: str,
        total_students: int,
        total_teachers: int,
        total_courses: int,
        total_enrollments: int,
        total_revenue: float,
        active_users: int,
        new_enrollments: int
    ) -> bool:
        """Send monthly platform report to admin"""
        
        html_content = f"""
        <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background-color: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0; }}
                    .content {{ background-color: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }}
                    .section {{ margin: 20px 0; padding-bottom: 20px; border-bottom: 1px solid #e5e7eb; }}
                    .stat-row {{ display: flex; justify-content: space-between; padding: 8px 0; }}
                    .stat-label {{ color: #6b7280; }}
                    .stat-value {{ font-weight: bold; color: #dc2626; }}
                    .footer {{ color: #6b7280; font-size: 12px; margin-top: 20px; border-top: 1px solid #e5e7eb; padding-top: 20px; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>📊 Platform Monthly Report - {month} {year}</h1>
                    </div>
                    <div class="content">
                        <p>Hello {admin_name},</p>
                        <p>Here's the platform performance summary for {month} {year}:</p>
                        
                        <div class="section">
                            <h3>User Statistics</h3>
                            <div class="stat-row">
                                <span class="stat-label">Total Students:</span>
                                <span class="stat-value">{total_students}</span>
                            </div>
                            <div class="stat-row">
                                <span class="stat-label">Total Teachers:</span>
                                <span class="stat-value">{total_teachers}</span>
                            </div>
                            <div class="stat-row">
                                <span class="stat-label">Active Users:</span>
                                <span class="stat-value">{active_users}</span>
                            </div>
                        </div>
                        
                        <div class="section">
                            <h3>Course & Enrollment Data</h3>
                            <div class="stat-row">
                                <span class="stat-label">Total Courses:</span>
                                <span class="stat-value">{total_courses}</span>
                            </div>
                            <div class="stat-row">
                                <span class="stat-label">Total Enrollments:</span>
                                <span class="stat-value">{total_enrollments}</span>
                            </div>
                            <div class="stat-row">
                                <span class="stat-label">New Enrollments:</span>
                                <span class="stat-value">{new_enrollments}</span>
                            </div>
                        </div>
                        
                        <div class="section">
                            <h3>Financial Summary</h3>
                            <div class="stat-row">
                                <span class="stat-label">Total Revenue:</span>
                                <span class="stat-value">${total_revenue:,.2f}</span>
                            </div>
                        </div>
                        
                        <p>For detailed analytics, please log in to your admin dashboard.</p>
                    </div>
                    <div class="footer">
                        <p>© 2025 College Prep Platform. All rights reserved.</p>
                    </div>
                </div>
            </body>
        </html>
        """
        
        return await self._send_email(admin_email, f"Platform Monthly Report - {month} {year}", html_content)

    # ==================== Utility Methods ====================

    @staticmethod
    def _get_grade_letter(percentage: float) -> str:
        """Convert percentage to letter grade"""
        if percentage >= 90:
            return "A"
        elif percentage >= 80:
            return "B"
        elif percentage >= 70:
            return "C"
        elif percentage >= 60:
            return "D"
        else:
            return "F"

    @staticmethod
    def generate_reset_token() -> tuple[str, str]:
        """
        Generate a secure reset token and its hash
        Returns: (plain_token, hash_of_token)
        """
        # Generate a secure random token
        plain_token = secrets.token_urlsafe(32)
        
        # Hash the token for storage
        token_hash = hashlib.sha256(plain_token.encode()).hexdigest()
        
        return plain_token, token_hash

    @staticmethod
    def verify_reset_token(plain_token: str, stored_hash: str) -> bool:
        """Verify if a plain token matches the stored hash"""
        computed_hash = hashlib.sha256(plain_token.encode()).hexdigest()
        return computed_hash == stored_hash


# Global email service instance
email_service = EmailService()
