"""Create all tables

Revision ID: 0001_create_all_tables
Revises: 
Create Date: 2025-10-20 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '0001_create_all_tables'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create students table
    op.create_table(
        'students',
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('password', sa.String(255), nullable=False),
        sa.Column('qr_code', sa.String(500), nullable=True),
        sa.Column('phone', sa.String(20), nullable=True),
        sa.Column('date_of_birth', sa.DateTime(), nullable=True),
        sa.Column('address', sa.Text(), nullable=True),
        sa.Column('emergency_contact', sa.String(100), nullable=True),
        sa.Column('emergency_phone', sa.String(20), nullable=True),
        sa.Column('parent_email', sa.String(255), nullable=False),
        sa.Column('parent_phone', sa.String(20), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('student_id'),
        sa.UniqueConstraint('email')
    )
    op.create_index('ix_students_email', 'students', ['email'])

    # Create teachers table
    op.create_table(
        'teachers',
        sa.Column('teacher_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('password', sa.String(255), nullable=False),
        sa.Column('phone', sa.String(20), nullable=True),
        sa.Column('specialization', sa.String(100), nullable=True),
        sa.Column('bio', sa.Text(), nullable=True),
        sa.Column('hire_date', sa.DateTime(), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('teacher_id'),
        sa.UniqueConstraint('email')
    )
    op.create_index('ix_teachers_email', 'teachers', ['email'])

    # Create admins table
    op.create_table(
        'admins',
        sa.Column('admin_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('password', sa.String(255), nullable=False),
        sa.Column('phone', sa.String(20), nullable=True),
        sa.Column('role', sa.String(50), server_default='admin'),
        sa.Column('permissions', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('admin_id'),
        sa.UniqueConstraint('email')
    )
    op.create_index('ix_admins_email', 'admins', ['email'])

    # Create parents table
    op.create_table(
        'parents',
        sa.Column('parent_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('phone', sa.String(20), nullable=False),
        sa.Column('address', sa.Text(), nullable=True),
        sa.Column('relationship_to_student', sa.String(50), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('parent_id'),
        sa.UniqueConstraint('email')
    )

    # Create courses table
    op.create_table(
        'courses',
        sa.Column('course_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('admin_id', sa.Integer(), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('course_id'),
        sa.ForeignKeyConstraint(['admin_id'], ['admins.admin_id']),
    )

    # Create enrollments table
    op.create_table(
        'enrollments',
        sa.Column('enrollment_id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('course_id', sa.Integer(), nullable=False),
        sa.Column('enrolled_date', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('is_active', sa.Boolean(), server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('enrollment_id'),
        sa.ForeignKeyConstraint(['student_id'], ['students.student_id']),
        sa.ForeignKeyConstraint(['course_id'], ['courses.course_id']),
    )

    # Create attendance table
    op.create_table(
        'attendances',
        sa.Column('attendance_id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('course_id', sa.Integer(), nullable=False),
        sa.Column('date', sa.DateTime(), nullable=False),
        sa.Column('status', sa.String(20), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('attendance_id'),
        sa.ForeignKeyConstraint(['student_id'], ['students.student_id']),
        sa.ForeignKeyConstraint(['course_id'], ['courses.course_id']),
    )

    # Create assignments table
    op.create_table(
        'assignments',
        sa.Column('assignment_id', sa.Integer(), nullable=False),
        sa.Column('course_id', sa.Integer(), nullable=False),
        sa.Column('teacher_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('due_date', sa.DateTime(), nullable=False),
        sa.Column('max_points', sa.Float(), nullable=False),
        sa.Column('file_url', sa.String(500), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('assignment_id'),
        sa.ForeignKeyConstraint(['course_id'], ['courses.course_id']),
        sa.ForeignKeyConstraint(['teacher_id'], ['teachers.teacher_id']),
    )

    # Create assignment_submissions table
    op.create_table(
        'assignment_submissions',
        sa.Column('submission_id', sa.Integer(), nullable=False),
        sa.Column('assignment_id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('submission_text', sa.Text(), nullable=True),
        sa.Column('file_url', sa.String(500), nullable=True),
        sa.Column('submitted_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('grade', sa.Float(), nullable=True),
        sa.Column('feedback', sa.Text(), nullable=True),
        sa.Column('graded_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('graded_by', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('submission_id'),
        sa.ForeignKeyConstraint(['assignment_id'], ['assignments.assignment_id']),
        sa.ForeignKeyConstraint(['student_id'], ['students.student_id']),
        sa.ForeignKeyConstraint(['graded_by'], ['teachers.teacher_id']),
    )

    # Create materials table (course materials/resources)
    op.create_table(
        'materials',
        sa.Column('material_id', sa.Integer(), nullable=False),
        sa.Column('course_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('material_type', sa.String(50), nullable=False),  # document, video, image, link, etc
        sa.Column('file_url', sa.String(500), nullable=True),
        sa.Column('link_url', sa.String(500), nullable=True),
        sa.Column('uploaded_by', sa.Integer(), nullable=False),
        sa.Column('is_visible', sa.Boolean(), server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('material_id'),
        sa.ForeignKeyConstraint(['course_id'], ['courses.course_id']),
        sa.ForeignKeyConstraint(['uploaded_by'], ['teachers.teacher_id']),
    )

    # Create calendar_events table
    op.create_table(
        'calendar_events',
        sa.Column('event_id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=True),
        sa.Column('teacher_id', sa.Integer(), nullable=True),
        sa.Column('course_id', sa.Integer(), nullable=True),
        sa.Column('title', sa.String(200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('event_date', sa.DateTime(), nullable=False),
        sa.Column('event_type', sa.String(50), nullable=False),  # assignment, exam, event, etc
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('event_id'),
        sa.ForeignKeyConstraint(['student_id'], ['students.student_id']),
        sa.ForeignKeyConstraint(['teacher_id'], ['teachers.teacher_id']),
        sa.ForeignKeyConstraint(['course_id'], ['courses.course_id']),
    )

    # Create association table for parent-student relationships
    op.create_table(
        'parent_student',
        sa.Column('parent_id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint('parent_id', 'student_id'),
        sa.ForeignKeyConstraint(['parent_id'], ['parents.parent_id']),
        sa.ForeignKeyConstraint(['student_id'], ['students.student_id']),
    )

    # Create association table for teacher-course relationships
    op.create_table(
        'teacher_course',
        sa.Column('teacher_id', sa.Integer(), nullable=False),
        sa.Column('course_id', sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint('teacher_id', 'course_id'),
        sa.ForeignKeyConstraint(['teacher_id'], ['teachers.teacher_id']),
        sa.ForeignKeyConstraint(['course_id'], ['courses.course_id']),
    )


def downgrade() -> None:
    op.drop_table('teacher_course')
    op.drop_table('parent_student')
    op.drop_table('calendar_events')
    op.drop_table('materials')
    op.drop_table('assignment_submissions')
    op.drop_table('assignments')
    op.drop_table('attendance')
    op.drop_table('enrollments')
    op.drop_table('courses')
    op.drop_index('ix_parents_email', table_name='parents')
    op.drop_table('parents')
    op.drop_index('ix_admins_email', table_name='admins')
    op.drop_table('admins')
    op.drop_index('ix_teachers_email', table_name='teachers')
    op.drop_table('teachers')
    op.drop_index('ix_students_email', table_name='students')
    op.drop_table('students')
