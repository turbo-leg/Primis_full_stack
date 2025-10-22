"""Add email system tables

Revision ID: a1b2c3d4e5f6
Revises: e65cd20c446e
Create Date: 2025-01-20 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = 'e65cd20c446e'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create PasswordResetToken table
    op.create_table(
        'password_reset_tokens',
        sa.Column('token_id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('user_type', sa.String(length=20), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('token_hash', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('used_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('is_used', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('user_agent', sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint('token_id')
    )
    op.create_index(op.f('ix_password_reset_tokens_email'), 'password_reset_tokens', ['email'], unique=False)
    op.create_index(op.f('ix_password_reset_tokens_expires_at'), 'password_reset_tokens', ['expires_at'], unique=False)
    op.create_index(op.f('ix_password_reset_tokens_is_used'), 'password_reset_tokens', ['is_used'], unique=False)
    op.create_index(op.f('ix_password_reset_tokens_token_hash'), 'password_reset_tokens', ['token_hash'], unique=True)

    # Create EmailLog table
    op.create_table(
        'email_logs',
        sa.Column('log_id', sa.Integer(), nullable=False),
        sa.Column('recipient_email', sa.String(length=255), nullable=False),
        sa.Column('recipient_name', sa.String(length=100), nullable=True),
        sa.Column('recipient_type', sa.String(length=20), nullable=True),
        sa.Column('recipient_id', sa.Integer(), nullable=True),
        sa.Column('subject', sa.String(length=255), nullable=False),
        sa.Column('email_type', sa.String(length=50), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='pending'),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('sent_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('attempted_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column('retry_count', sa.Integer(), nullable=False, server_default=sa.literal(0)),
        sa.Column('max_retries', sa.Integer(), nullable=False, server_default=sa.literal(3)),
        sa.Column('next_retry_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('course_id', sa.Integer(), nullable=True),
        sa.Column('assignment_id', sa.Integer(), nullable=True),
        sa.Column('notification_id', sa.Integer(), nullable=True),
        sa.Column('content_hash', sa.String(length=64), nullable=True),
        sa.Column('opened_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('clicked_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('unsubscribed_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['assignment_id'], ['assignments.assignment_id'], ),
        sa.ForeignKeyConstraint(['course_id'], ['courses.course_id'], ),
        sa.ForeignKeyConstraint(['notification_id'], ['notifications.notification_id'], ),
        sa.PrimaryKeyConstraint('log_id')
    )
    op.create_index(op.f('ix_email_logs_attempted_at'), 'email_logs', ['attempted_at'], unique=False)
    op.create_index(op.f('ix_email_logs_email_type'), 'email_logs', ['email_type'], unique=False)
    op.create_index(op.f('ix_email_logs_recipient_email'), 'email_logs', ['recipient_email'], unique=False)
    op.create_index(op.f('ix_email_logs_recipient_id'), 'email_logs', ['recipient_id'], unique=False)
    op.create_index(op.f('ix_email_logs_status'), 'email_logs', ['status'], unique=False)

    # Create MonthlyReport table
    op.create_table(
        'monthly_reports',
        sa.Column('report_id', sa.Integer(), nullable=False),
        sa.Column('month', sa.Integer(), nullable=False),
        sa.Column('year', sa.Integer(), nullable=False),
        sa.Column('report_type', sa.String(length=20), nullable=False),
        sa.Column('recipient_id', sa.Integer(), nullable=False),
        sa.Column('recipient_type', sa.String(length=20), nullable=False),
        sa.Column('recipient_email', sa.String(length=255), nullable=False),
        sa.Column('total_classes', sa.Integer(), nullable=True),
        sa.Column('classes_attended', sa.Integer(), nullable=True),
        sa.Column('classes_absent', sa.Integer(), nullable=True),
        sa.Column('attendance_percentage', sa.Float(), nullable=True),
        sa.Column('assignments_completed', sa.Integer(), nullable=True),
        sa.Column('average_grade', sa.Float(), nullable=True),
        sa.Column('outstanding_assignments', sa.Integer(), nullable=True),
        sa.Column('students_count', sa.Integer(), nullable=True),
        sa.Column('assignments_graded', sa.Integer(), nullable=True),
        sa.Column('pending_assignments', sa.Integer(), nullable=True),
        sa.Column('total_students', sa.Integer(), nullable=True),
        sa.Column('total_teachers', sa.Integer(), nullable=True),
        sa.Column('total_courses', sa.Integer(), nullable=True),
        sa.Column('total_enrollments', sa.Integer(), nullable=True),
        sa.Column('total_revenue', sa.Float(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='pending'),
        sa.Column('generated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('sent_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.PrimaryKeyConstraint('report_id')
    )
    op.create_index(op.f('ix_monthly_reports_recipient_id'), 'monthly_reports', ['recipient_id'], unique=False)

    # Create EmailPreference table
    op.create_table(
        'email_preferences',
        sa.Column('preference_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('user_type', sa.String(length=20), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('email_notifications_enabled', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('assignment_notifications', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('grade_notifications', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('attendance_notifications', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('course_announcements', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('digest_frequency', sa.String(length=20), nullable=False, server_default='daily'),
        sa.Column('monthly_report_enabled', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('unsubscribed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('subscribed_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now(), nullable=True),
        sa.PrimaryKeyConstraint('preference_id'),
        sa.UniqueConstraint('email', name='uq_email_preferences_email')
    )
    op.create_index(op.f('ix_email_preferences_email'), 'email_preferences', ['email'], unique=False)
    op.create_index(op.f('ix_email_preferences_user_id'), 'email_preferences', ['user_id'], unique=False)

    # Create EmailTemplate table
    op.create_table(
        'email_templates',
        sa.Column('template_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('template_type', sa.String(length=50), nullable=False),
        sa.Column('subject', sa.String(length=255), nullable=False),
        sa.Column('html_content', sa.Text(), nullable=False),
        sa.Column('plain_text_content', sa.Text(), nullable=True),
        sa.Column('variables', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now(), nullable=True),
        sa.PrimaryKeyConstraint('template_id'),
        sa.UniqueConstraint('name', name='uq_email_templates_name')
    )


def downgrade() -> None:
    op.drop_table('email_templates')
    op.drop_table('email_preferences')
    op.drop_table('monthly_reports')
    op.drop_index(op.f('ix_email_logs_status'), table_name='email_logs')
    op.drop_index(op.f('ix_email_logs_recipient_id'), table_name='email_logs')
    op.drop_index(op.f('ix_email_logs_recipient_email'), table_name='email_logs')
    op.drop_index(op.f('ix_email_logs_email_type'), table_name='email_logs')
    op.drop_index(op.f('ix_email_logs_attempted_at'), table_name='email_logs')
    op.drop_table('email_logs')
    op.drop_index(op.f('ix_password_reset_tokens_token_hash'), table_name='password_reset_tokens')
    op.drop_index(op.f('ix_password_reset_tokens_is_used'), table_name='password_reset_tokens')
    op.drop_index(op.f('ix_password_reset_tokens_expires_at'), table_name='password_reset_tokens')
    op.drop_index(op.f('ix_password_reset_tokens_email'), table_name='password_reset_tokens')
    op.drop_table('password_reset_tokens')
