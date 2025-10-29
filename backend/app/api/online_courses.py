from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel
import json
import uuid
import hashlib

from app.core.database import get_db
from app.models.models import (
    OnlineCourse, OnlineLesson, StudentCourseProgress, 
    StudentLessonProgress, SessionTracking, Course, Student, Enrollment
)
from app.api.auth import get_current_user, require_role


# Pydantic models for API

class OnlineLessonCreate(BaseModel):
    title: str
    description: Optional[str] = None
    lesson_order: int
    video_url: Optional[str] = None
    video_duration_minutes: Optional[int] = None
    content_type: str = "video"
    text_content: Optional[str] = None
    is_preview: bool = False
    requires_completion_of: Optional[int] = None
    quiz_questions: Optional[str] = None
    assignment_description: Optional[str] = None
    downloads: Optional[str] = None


class OnlineLessonResponse(BaseModel):
    lesson_id: int
    online_course_id: int
    title: str
    description: Optional[str]
    lesson_order: int
    video_url: Optional[str]
    video_duration_minutes: Optional[int]
    content_type: str
    text_content: Optional[str]
    is_preview: bool
    requires_completion_of: Optional[int]
    quiz_questions: Optional[str]
    assignment_description: Optional[str]
    downloads: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


class OnlineCourseCreate(BaseModel):
    course_id: int
    total_lessons: int = 0
    estimated_duration_hours: Optional[float] = None
    difficulty_level: str = "beginner"
    prerequisites: Optional[str] = None
    allow_downloads: bool = False
    watermark_text: Optional[str] = None
    copy_protection_enabled: bool = True
    access_duration_days: int = 365
    max_concurrent_sessions: int = 1
    completion_certificate: bool = True
    passing_score_percentage: int = 70


class OnlineCourseResponse(BaseModel):
    online_course_id: int
    course_id: int
    total_lessons: int
    estimated_duration_hours: Optional[float]
    difficulty_level: str
    prerequisites: Optional[str]
    allow_downloads: bool
    watermark_text: Optional[str]
    copy_protection_enabled: bool
    access_duration_days: int
    max_concurrent_sessions: int
    completion_certificate: bool
    passing_score_percentage: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class StudentProgressResponse(BaseModel):
    progress_id: int
    student_id: int
    online_course_id: int
    lessons_completed: int
    total_time_spent_minutes: int
    completion_percentage: float
    current_lesson_id: Optional[int]
    status: str
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    last_accessed_at: Optional[datetime]
    certificate_issued: bool
    final_score: Optional[float]
    
    class Config:
        from_attributes = True


class VideoSessionRequest(BaseModel):
    lesson_id: int
    device_fingerprint: str


class VideoSessionResponse(BaseModel):
    session_token: str
    video_url: str
    watermark_text: Optional[str]
    max_concurrent_sessions: int


class ProgressUpdateRequest(BaseModel):
    lesson_id: int
    progress_percentage: float
    time_spent_seconds: int
    last_position_seconds: int


router = APIRouter()


@router.get("/", response_model=List[OnlineCourseResponse])
async def get_online_courses(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Get all online courses"""
    # For students, return all available online courses
    # For teachers, return only their courses  
    # For admins, return all courses
    
    if current_user["role"] == "student":
        # Return all online courses for students
        online_courses = db.query(OnlineCourse).all()
    elif current_user["role"] == "teacher":
        # Return all online courses for now (teacher filtering will be added later)
        online_courses = db.query(OnlineCourse).all()
    else:  # admin
        # Return all online courses for admins
        online_courses = db.query(OnlineCourse).all()
    
    return online_courses


@router.post("/create", response_model=OnlineCourseResponse)
async def create_online_course(
    course_data: OnlineCourseCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["teacher", "admin"]))
):
    """Create a new online course"""
    # Verify the base course exists
    course = db.query(Course).filter(Course.course_id == course_data.course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Base course not found"
        )
    
    # Check if online course already exists
    existing = db.query(OnlineCourse).filter(OnlineCourse.course_id == course_data.course_id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Online course already exists for this course"
        )
    
    # Create online course
    online_course = OnlineCourse(**course_data.dict())
    db.add(online_course)
    db.commit()
    db.refresh(online_course)
    
    return online_course


@router.get("/{online_course_id}", response_model=OnlineCourseResponse)
async def get_online_course(
    online_course_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Get online course details"""
    online_course = db.query(OnlineCourse).filter(OnlineCourse.online_course_id == online_course_id).first()
    if not online_course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Online course not found"
        )
    
    return online_course


@router.post("/{online_course_id}/lessons", response_model=OnlineLessonResponse)
async def create_lesson(
    online_course_id: int,
    lesson_data: OnlineLessonCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["teacher", "admin"]))
):
    """Create a new lesson in an online course"""
    # Verify online course exists
    online_course = db.query(OnlineCourse).filter(OnlineCourse.online_course_id == online_course_id).first()
    if not online_course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Online course not found"
        )
    
    # Create lesson
    lesson = OnlineLesson(online_course_id=online_course_id, **lesson_data.dict())
    db.add(lesson)
    db.commit()
    db.refresh(lesson)
    
    # Update total lessons count
    lesson_count = db.query(OnlineLesson).filter(
        OnlineLesson.online_course_id == online_course_id
    ).count()
    
    # Use SQL update to avoid SQLAlchemy attribute assignment issues
    db.execute(
        OnlineCourse.__table__.update()
        .where(OnlineCourse.online_course_id == online_course_id)
        .values(total_lessons=lesson_count)
    )
    db.commit()
    
    return lesson


@router.get("/{online_course_id}/lessons", response_model=List[OnlineLessonResponse])
async def get_lessons(
    online_course_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Get all lessons for an online course"""
    # Check if user has access to this course
    if current_user["user_type"] == "student":
        enrollment = db.query(Enrollment).filter(
            and_(
                Enrollment.student_id == current_user["user"].student_id,
                Enrollment.course_id == db.query(OnlineCourse).filter(
                    OnlineCourse.online_course_id == online_course_id
                ).first().course_id if db.query(OnlineCourse).filter(
                    OnlineCourse.online_course_id == online_course_id
                ).first() else None
            )
        ).first()
        
        if not enrollment or not enrollment.paid:
            # Return only preview lessons for non-enrolled students
            lessons = db.query(OnlineLesson).filter(
                and_(
                    OnlineLesson.online_course_id == online_course_id,
                    OnlineLesson.is_preview == True
                )
            ).order_by(OnlineLesson.lesson_order).all()
        else:
            # Return all lessons for enrolled students
            lessons = db.query(OnlineLesson).filter(
                OnlineLesson.online_course_id == online_course_id
            ).order_by(OnlineLesson.lesson_order).all()
    else:
        # Teachers and admins can see all lessons
        lessons = db.query(OnlineLesson).filter(
            OnlineLesson.online_course_id == online_course_id
        ).order_by(OnlineLesson.lesson_order).all()
    
    return lessons


@router.post("/video-session", response_model=VideoSessionResponse)
async def create_video_session(
    session_request: VideoSessionRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["student"]))
):
    """Create a secure video viewing session with copy protection"""
    student_id = current_user["user"].student_id
    lesson_id = session_request.lesson_id
    
    # Get lesson and course info
    lesson = db.query(OnlineLesson).filter(OnlineLesson.lesson_id == lesson_id).first()
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found"
        )
    
    online_course = lesson.online_course
    
    # Check enrollment and payment
    enrollment = db.query(Enrollment).filter(
        and_(
            Enrollment.student_id == student_id,
            Enrollment.course_id == online_course.course_id
        )
    ).first()
    
    if not enrollment or not enrollment.paid:
        if not lesson.is_preview:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You must be enrolled and have paid to access this lesson"
            )
    
    # Check concurrent sessions limit
    active_sessions = db.query(SessionTracking).filter(
        and_(
            SessionTracking.student_id == student_id,
            SessionTracking.is_active == True,
            SessionTracking.last_heartbeat > datetime.utcnow() - timedelta(minutes=5)
        )
    ).count()
    
    if active_sessions >= online_course.max_concurrent_sessions:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Maximum {online_course.max_concurrent_sessions} concurrent session(s) allowed"
        )
    
    # Create session token
    session_token = str(uuid.uuid4())
    
    # Get client info
    ip_address = request.client.host
    user_agent = request.headers.get("user-agent", "")
    
    # Create session tracking
    session = SessionTracking(
        student_id=student_id,
        lesson_id=lesson_id,
        session_token=session_token,
        ip_address=ip_address,
        user_agent=user_agent,
        device_fingerprint=session_request.device_fingerprint
    )
    
    db.add(session)
    db.commit()
    
    # Create progress entry if doesn't exist
    progress = db.query(StudentLessonProgress).filter(
        and_(
            StudentLessonProgress.student_id == student_id,
            StudentLessonProgress.lesson_id == lesson_id
        )
    ).first()
    
    if not progress:
        progress = StudentLessonProgress(
            student_id=student_id,
            lesson_id=lesson_id,
            status="in_progress",
            started_at=datetime.utcnow()
        )
        db.add(progress)
        db.commit()
    
    # Update last accessed
    progress.last_accessed_at = datetime.utcnow()
    progress.play_count += 1
    db.commit()
    
    return VideoSessionResponse(
        session_token=session_token,
        video_url=lesson.video_url,
        watermark_text=online_course.watermark_text or f"Student: {current_user['user'].name}",
        max_concurrent_sessions=online_course.max_concurrent_sessions
    )


@router.post("/update-progress")
async def update_progress(
    progress_data: ProgressUpdateRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["student"]))
):
    """Update student's lesson progress"""
    student_id = current_user["user"].student_id
    
    # Get lesson progress
    progress = db.query(StudentLessonProgress).filter(
        and_(
            StudentLessonProgress.student_id == student_id,
            StudentLessonProgress.lesson_id == progress_data.lesson_id
        )
    ).first()
    
    if not progress:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson progress not found"
        )
    
    # Update progress
    progress.progress_percentage = progress_data.progress_percentage
    progress.time_spent_minutes += progress_data.time_spent_seconds // 60
    progress.last_position_seconds = progress_data.last_position_seconds
    progress.last_accessed_at = datetime.utcnow()
    
    # Mark as completed if 90% or more watched
    if progress_data.progress_percentage >= 90 and progress.status != "completed":
        progress.status = "completed"
        progress.completed_at = datetime.utcnow()
    
    db.commit()
    
    # Update course progress
    await update_course_progress(student_id, progress.lesson.online_course_id, db)
    
    return {"message": "Progress updated successfully"}


async def update_course_progress(student_id: int, online_course_id: int, db: Session):
    """Update overall course progress for a student"""
    # Get or create course progress
    course_progress = db.query(StudentCourseProgress).filter(
        and_(
            StudentCourseProgress.student_id == student_id,
            StudentCourseProgress.online_course_id == online_course_id
        )
    ).first()
    
    if not course_progress:
        course_progress = StudentCourseProgress(
            student_id=student_id,
            online_course_id=online_course_id,
            started_at=datetime.utcnow()
        )
        db.add(course_progress)
    
    # Count completed lessons
    completed_lessons = db.query(StudentLessonProgress).filter(
        and_(
            StudentLessonProgress.student_id == student_id,
            StudentLessonProgress.lesson_id.in_(
                db.query(OnlineLesson.lesson_id).filter(
                    OnlineLesson.online_course_id == online_course_id
                )
            ),
            StudentLessonProgress.status == "completed"
        )
    ).count()
    
    # Get total lessons
    total_lessons = db.query(OnlineLesson).filter(
        OnlineLesson.online_course_id == online_course_id
    ).count()
    
    # Update progress
    course_progress.lessons_completed = completed_lessons
    course_progress.completion_percentage = (completed_lessons / total_lessons * 100) if total_lessons > 0 else 0
    course_progress.last_accessed_at = datetime.utcnow()
    
    # Mark course as completed if all lessons done
    if completed_lessons == total_lessons and total_lessons > 0:
        course_progress.status = "completed"
        course_progress.completed_at = datetime.utcnow()
    
    db.commit()


@router.get("/student/{student_id}/progress/{online_course_id}", response_model=StudentProgressResponse)
async def get_student_progress(
    student_id: int,
    online_course_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Get student's progress in an online course"""
    # Students can only view their own progress
    if current_user["user_type"] == "student" and current_user["user"].student_id != student_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Can only view your own progress"
        )
    
    progress = db.query(StudentCourseProgress).filter(
        and_(
            StudentCourseProgress.student_id == student_id,
            StudentCourseProgress.online_course_id == online_course_id
        )
    ).first()
    
    if not progress:
        # Create initial progress entry
        progress = StudentCourseProgress(
            student_id=student_id,
            online_course_id=online_course_id
        )
        db.add(progress)
        db.commit()
        db.refresh(progress)
    
    return progress


@router.post("/heartbeat/{session_token}")
async def session_heartbeat(
    session_token: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["student"]))
):
    """Keep session alive with heartbeat"""
    session = db.query(SessionTracking).filter(
        and_(
            SessionTracking.session_token == session_token,
            SessionTracking.student_id == current_user["user"].student_id,
            SessionTracking.is_active == True
        )
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or expired"
        )
    
    # Update heartbeat
    session.last_heartbeat = datetime.utcnow()
    db.commit()
    
    return {"message": "Heartbeat updated"}


@router.delete("/session/{session_token}")
async def end_session(
    session_token: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["student"]))
):
    """End a video viewing session"""
    session = db.query(SessionTracking).filter(
        and_(
            SessionTracking.session_token == session_token,
            SessionTracking.student_id == current_user["user"].student_id
        )
    ).first()
    
    if session:
        session.is_active = False
        session.ended_at = datetime.utcnow()
        db.commit()
    
    return {"message": "Session ended"}


@router.delete("/{online_course_id}")
async def delete_online_course(
    online_course_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["admin", "teacher"]))
):
    """Delete an online course (admin/teacher only)"""
    # Get the online course
    online_course = db.query(OnlineCourse).filter(
        OnlineCourse.online_course_id == online_course_id
    ).first()
    
    if not online_course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Online course not found"
        )
    
    # Check if teacher owns the course (for teacher role)
    if current_user["role"] == "teacher":
        course = db.query(Course).filter(Course.course_id == online_course.course_id).first()
        if not course or course.teacher_id != current_user["user"].teacher_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only delete your own courses"
            )
    
    # Delete related sessions
    db.query(SessionTracking).filter(
        SessionTracking.online_course_id == online_course_id
    ).delete()
    
    # Delete student progress records
    db.query(StudentLessonProgress).filter(
        StudentLessonProgress.lesson_id.in_(
            db.query(OnlineLesson.lesson_id).filter(
                OnlineLesson.online_course_id == online_course_id
            )
        )
    ).delete(synchronize_session=False)
    
    db.query(StudentCourseProgress).filter(
        StudentCourseProgress.online_course_id == online_course_id
    ).delete()
    
    # Delete lessons
    db.query(OnlineLesson).filter(
        OnlineLesson.online_course_id == online_course_id
    ).delete()
    
    # Delete the online course
    db.delete(online_course)
    db.commit()
    
    return {"message": "Online course deleted successfully"}


@router.put("/{online_course_id}/archive")
async def archive_online_course(
    online_course_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["admin", "teacher"]))
):
    """Archive an online course (soft delete)"""
    # Get the online course
    online_course = db.query(OnlineCourse).filter(
        OnlineCourse.online_course_id == online_course_id
    ).first()
    
    if not online_course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Online course not found"
        )
    
    # Check if teacher owns the course (for teacher role)
    if current_user["role"] == "teacher":
        course = db.query(Course).filter(Course.course_id == online_course.course_id).first()
        if not course or course.teacher_id != current_user["user"].teacher_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only archive your own courses"
            )
    
    # Add archived status to the course
    course = db.query(Course).filter(Course.course_id == online_course.course_id).first()
    if course:
        # Update status using setattr to avoid type checking issues
        setattr(course, 'status', 'archived')
        db.commit()
    
    return {"message": "Online course archived successfully"}


@router.delete("/lesson/{lesson_id}")
async def delete_lesson(
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["admin", "teacher"]))
):
    """Delete a lesson from an online course"""
    # Get the lesson
    lesson = db.query(OnlineLesson).filter(
        OnlineLesson.lesson_id == lesson_id
    ).first()
    
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found"
        )
    
    # Check if teacher owns the course (for teacher role)
    if current_user["role"] == "teacher":
        online_course = db.query(OnlineCourse).filter(
            OnlineCourse.online_course_id == lesson.online_course_id
        ).first()
        if online_course:
            course = db.query(Course).filter(Course.course_id == online_course.course_id).first()
            if not course or course.teacher_id != current_user["user"].teacher_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You can only delete lessons from your own courses"
                )
    
    # Delete student progress for this lesson
    db.query(StudentLessonProgress).filter(
        StudentLessonProgress.lesson_id == lesson_id
    ).delete()
    
    # Delete the lesson
    db.delete(lesson)
    db.commit()
    
    return {"message": "Lesson deleted successfully"}