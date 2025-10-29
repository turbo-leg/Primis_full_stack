from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, Text, ForeignKey, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

# Association table for parent-student relationship (many-to-many)
parent_student_association = Table(
    'parent_student',
    Base.metadata,
    Column('parent_id', Integer, ForeignKey('parents.parent_id')),
    Column('student_id', Integer, ForeignKey('students.student_id'))
)

# Association table for teacher-course relationship (many-to-many)
teacher_course_association = Table(
    'teacher_course',
    Base.metadata,
    Column('teacher_id', Integer, ForeignKey('teachers.teacher_id')),
    Column('course_id', Integer, ForeignKey('courses.course_id'))
)


class Student(Base):
    __tablename__ = "students"

    student_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)
    qr_code = Column(String(500), nullable=True)  # QR code string or image URL
    phone = Column(String(20), nullable=True)
    date_of_birth = Column(DateTime, nullable=True)
    address = Column(Text, nullable=True)
    emergency_contact = Column(String(100), nullable=True)
    emergency_phone = Column(String(20), nullable=True)
    parent_email = Column(String(255), nullable=False)
    parent_phone = Column(String(20), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    enrollments = relationship("Enrollment", back_populates="student")
    parents = relationship("Parent", secondary=parent_student_association, back_populates="students")
    attendances = relationship("Attendance", back_populates="student")
    submissions = relationship("AssignmentSubmission", back_populates="student")
    calendar_events = relationship("CalendarEvent", back_populates="student")


class Teacher(Base):
    __tablename__ = "teachers"

    teacher_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=True)
    specialization = Column(String(100), nullable=True)
    bio = Column(Text, nullable=True)
    hire_date = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    courses = relationship("Course", secondary=teacher_course_association, back_populates="teachers")
    calendar_events = relationship("CalendarEvent", back_populates="teacher")


class Admin(Base):
    __tablename__ = "admins"

    admin_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=True)
    role = Column(String(50), default="admin")  # admin, super_admin, etc.
    permissions = Column(Text, nullable=True)  # JSON string of permissions
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    managed_courses = relationship("Course", back_populates="admin")


class Parent(Base):
    __tablename__ = "parents"

    parent_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    phone = Column(String(20), nullable=False)
    address = Column(Text, nullable=True)
    relationship_to_student = Column(String(50), nullable=True)  # father, mother, guardian
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    students = relationship("Student", secondary=parent_student_association, back_populates="parents")


class Course(Base):
    __tablename__ = "courses"

    course_id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    price = Column(Float, nullable=False, default=0.0)
    max_students = Column(Integer, default=30)
    is_online = Column(Boolean, default=False)
    location = Column(String(200), nullable=True)
    status = Column(String(20), default="active")  # active, inactive, completed
    admin_id = Column(Integer, ForeignKey("admins.admin_id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    teachers = relationship("Teacher", secondary=teacher_course_association, back_populates="courses")
    admin = relationship("Admin", back_populates="managed_courses")
    enrollments = relationship("Enrollment", back_populates="course")
    materials = relationship("Material", back_populates="course")
    announcements = relationship("Announcement", back_populates="course")
    assignments = relationship("Assignment", back_populates="course")
    class_chat = relationship("ClassChat", back_populates="course", uselist=False)
    attendances = relationship("Attendance", back_populates="course")
    online_course = relationship("OnlineCourse", back_populates="course", uselist=False)


class Enrollment(Base):
    __tablename__ = "enrollments"

    enrollment_id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.student_id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.course_id"), nullable=False)
    paid = Column(Boolean, default=False)
    paid_date = Column(DateTime, nullable=True)
    payment_due = Column(DateTime, nullable=True)
    enrollment_date = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String(20), default="active")  # active, completed, dropped, suspended

    # Relationships
    student = relationship("Student", back_populates="enrollments")
    course = relationship("Course", back_populates="enrollments")
    payments = relationship("Payment", back_populates="enrollment")


class Material(Base):
    __tablename__ = "materials"

    material_id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.course_id"), nullable=False)
    title = Column(String(200), nullable=False)
    type = Column(String(50), nullable=False)  # pdf, video, link, document
    url = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=True)  # in bytes
    description = Column(Text, nullable=True)
    is_public = Column(Boolean, default=False)
    upload_date = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    course = relationship("Course", back_populates="materials")


class ClassChat(Base):
    __tablename__ = "class_chats"

    chat_id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.course_id"), nullable=False, unique=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    course = relationship("Course", back_populates="class_chat")
    messages = relationship("ChatMessage", back_populates="chat")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    message_id = Column(Integer, primary_key=True, index=True)
    chat_id = Column(Integer, ForeignKey("class_chats.chat_id"), nullable=False)
    sender_id = Column(Integer, nullable=False)  # Can be student_id, teacher_id, or admin_id
    sender_type = Column(String(20), nullable=False)  # student, teacher, admin
    message = Column(Text, nullable=False)
    message_type = Column(String(20), default="text")  # text, image, file
    file_url = Column(String(500), nullable=True)
    sent_at = Column(DateTime(timezone=True), server_default=func.now())
    is_edited = Column(Boolean, default=False)
    edited_at = Column(DateTime, nullable=True)

    # Relationships
    chat = relationship("ClassChat", back_populates="messages")


class Announcement(Base):
    __tablename__ = "announcements"

    announcement_id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.course_id"), nullable=False)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    posted_on = Column(DateTime(timezone=True), server_default=func.now())
    is_important = Column(Boolean, default=False)
    posted_by_id = Column(Integer, nullable=False)  # teacher_id or admin_id
    posted_by_type = Column(String(20), nullable=False)  # teacher, admin

    # Relationships
    course = relationship("Course", back_populates="announcements")


class Assignment(Base):
    __tablename__ = "assignments"

    assignment_id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.course_id"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    due_date = Column(DateTime, nullable=False)
    max_points = Column(Float, default=100.0)
    instructions = Column(Text, nullable=True)
    created_by_id = Column(Integer, nullable=False)  # teacher_id
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    course = relationship("Course", back_populates="assignments")
    submissions = relationship("AssignmentSubmission", back_populates="assignment")


class AssignmentSubmission(Base):
    __tablename__ = "assignment_submissions"

    submission_id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("assignments.assignment_id"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.student_id"), nullable=False)
    submission_text = Column(Text, nullable=True)
    file_url = Column(String(500), nullable=True)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())
    grade = Column(Float, nullable=True)
    feedback = Column(Text, nullable=True)
    graded_at = Column(DateTime, nullable=True)
    graded_by_id = Column(Integer, nullable=True)  # teacher_id

    # Relationships
    assignment = relationship("Assignment", back_populates="submissions")
    student = relationship("Student", back_populates="submissions")


class Attendance(Base):
    __tablename__ = "attendances"

    attendance_id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.student_id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.course_id"), nullable=False)
    attendance_date = Column(DateTime, nullable=False)
    status = Column(String(20), default="present")  # present, absent, late, excused
    scanned_at = Column(DateTime, nullable=True)  # When QR was scanned
    notes = Column(Text, nullable=True)
    marked_by_id = Column(Integer, nullable=True)  # teacher_id or admin_id who marked

    # Relationships
    student = relationship("Student", back_populates="attendances")
    course = relationship("Course", back_populates="attendances")


class Payment(Base):
    __tablename__ = "payments"

    payment_id = Column(Integer, primary_key=True, index=True)
    enrollment_id = Column(Integer, ForeignKey("enrollments.enrollment_id"), nullable=False)
    amount = Column(Float, nullable=False)
    payment_method = Column(String(50), nullable=False)  # cash, card, bank_transfer, online
    payment_status = Column(String(20), default="pending")  # pending, completed, failed, refunded
    transaction_id = Column(String(100), nullable=True)  # External payment system transaction ID
    payment_date = Column(DateTime(timezone=True), server_default=func.now())
    notes = Column(Text, nullable=True)
    processed_by_id = Column(Integer, nullable=True)  # admin_id who processed

    # Relationships
    enrollment = relationship("Enrollment", back_populates="payments")


class CalendarEvent(Base):
    __tablename__ = "calendar_events"

    event_id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    event_type = Column(String(50), nullable=False)  # class, exam, meeting, holiday
    location = Column(String(200), nullable=True)
    is_recurring = Column(Boolean, default=False)
    recurrence_pattern = Column(String(100), nullable=True)  # daily, weekly, monthly
    created_by_id = Column(Integer, nullable=False)
    created_by_type = Column(String(20), nullable=False)  # student, teacher, admin
    student_id = Column(Integer, ForeignKey("students.student_id"), nullable=True)
    teacher_id = Column(Integer, ForeignKey("teachers.teacher_id"), nullable=True)
    course_id = Column(Integer, nullable=True)  # Optional reference to course
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    student = relationship("Student", back_populates="calendar_events")
    teacher = relationship("Teacher", back_populates="calendar_events")


# Online Course System Models

class OnlineCourse(Base):
    __tablename__ = "online_courses"

    online_course_id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.course_id"), nullable=False)
    
    # Course structure
    total_lessons = Column(Integer, default=0)
    estimated_duration_hours = Column(Float, nullable=True)  # Total course duration
    difficulty_level = Column(String(20), default="beginner")  # beginner, intermediate, advanced
    prerequisites = Column(Text, nullable=True)  # JSON array of prerequisite courses
    
    # Content settings
    allow_downloads = Column(Boolean, default=False)
    watermark_text = Column(String(200), nullable=True)  # Custom watermark
    copy_protection_enabled = Column(Boolean, default=True)
    
    # Access control
    access_duration_days = Column(Integer, default=365)  # How long students have access
    max_concurrent_sessions = Column(Integer, default=1)  # Prevent account sharing
    
    # Progress tracking
    completion_certificate = Column(Boolean, default=True)
    passing_score_percentage = Column(Integer, default=70)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    course = relationship("Course", back_populates="online_course")
    lessons = relationship("OnlineLesson", back_populates="online_course", cascade="all, delete-orphan")
    student_progress = relationship("StudentCourseProgress", back_populates="online_course", cascade="all, delete-orphan")


class OnlineLesson(Base):
    __tablename__ = "online_lessons"

    lesson_id = Column(Integer, primary_key=True, index=True)
    online_course_id = Column(Integer, ForeignKey("online_courses.online_course_id"), nullable=False)
    
    # Lesson details
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    lesson_order = Column(Integer, nullable=False)  # Order within the course
    
    # Content
    video_url = Column(String(500), nullable=True)  # Google Drive or other cloud video URL
    video_duration_minutes = Column(Integer, nullable=True)
    content_type = Column(String(50), default="video")  # video, text, quiz, assignment
    text_content = Column(Text, nullable=True)  # Rich text content
    
    # Access control
    is_preview = Column(Boolean, default=False)  # Can be viewed without enrollment
    requires_completion_of = Column(Integer, ForeignKey("online_lessons.lesson_id"), nullable=True)  # Prerequisite lesson
    
    # Engagement
    quiz_questions = Column(Text, nullable=True)  # JSON array of quiz questions
    assignment_description = Column(Text, nullable=True)
    downloads = Column(Text, nullable=True)  # JSON array of downloadable resources
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    online_course = relationship("OnlineCourse", back_populates="lessons")
    prerequisite_lesson = relationship("OnlineLesson", remote_side=[lesson_id])
    lesson_progress = relationship("StudentLessonProgress", back_populates="lesson", cascade="all, delete-orphan")


class StudentCourseProgress(Base):
    __tablename__ = "student_course_progress"

    progress_id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.student_id"), nullable=False)
    online_course_id = Column(Integer, ForeignKey("online_courses.online_course_id"), nullable=False)
    
    # Progress tracking
    lessons_completed = Column(Integer, default=0)
    total_time_spent_minutes = Column(Integer, default=0)
    completion_percentage = Column(Float, default=0.0)
    current_lesson_id = Column(Integer, ForeignKey("online_lessons.lesson_id"), nullable=True)
    
    # Status
    status = Column(String(20), default="in_progress")  # not_started, in_progress, completed, paused
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    last_accessed_at = Column(DateTime, nullable=True)
    
    # Achievements
    certificate_issued = Column(Boolean, default=False)
    final_score = Column(Float, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    student = relationship("Student")
    online_course = relationship("OnlineCourse", back_populates="student_progress")
    current_lesson = relationship("OnlineLesson")


class StudentLessonProgress(Base):
    __tablename__ = "student_lesson_progress"

    lesson_progress_id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.student_id"), nullable=False)
    lesson_id = Column(Integer, ForeignKey("online_lessons.lesson_id"), nullable=False)
    
    # Progress tracking
    status = Column(String(20), default="not_started")  # not_started, in_progress, completed
    time_spent_minutes = Column(Integer, default=0)
    progress_percentage = Column(Float, default=0.0)  # Video watch percentage
    
    # Engagement tracking
    play_count = Column(Integer, default=0)
    last_position_seconds = Column(Integer, default=0)  # Resume position
    
    # Quiz/Assignment results
    quiz_score = Column(Float, nullable=True)
    quiz_attempts = Column(Integer, default=0)
    assignment_submitted = Column(Boolean, default=False)
    assignment_score = Column(Float, nullable=True)
    
    # Timestamps
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    last_accessed_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    student = relationship("Student")
    lesson = relationship("OnlineLesson", back_populates="lesson_progress")


class SessionTracking(Base):
    __tablename__ = "session_tracking"

    session_id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.student_id"), nullable=False)
    lesson_id = Column(Integer, ForeignKey("online_lessons.lesson_id"), nullable=False)
    
    # Session details
    session_token = Column(String(255), nullable=False, unique=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    device_fingerprint = Column(String(255), nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True)
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    last_heartbeat = Column(DateTime(timezone=True), server_default=func.now())
    ended_at = Column(DateTime, nullable=True)

    # Relationships
    student = relationship("Student")
    lesson = relationship("OnlineLesson")