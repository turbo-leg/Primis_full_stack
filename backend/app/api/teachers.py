from fastapi import APIRouter, Depends, HTTPException, status, Query, Form, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_, func
from typing import List, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel

from app.core.database import get_db
from app.api.auth import get_current_user, require_role
from app.models.models import (
    Teacher, Student, Course, Enrollment, Assignment, 
    AssignmentSubmission, Attendance
)
from app.services.notification_service import notify_assignment_created
from app.utils.cloudinary_helper import upload_file

router = APIRouter()


# Pydantic models for assignments
class AssignmentCreate(BaseModel):
    course_id: int
    title: str
    description: str
    due_date: datetime
    max_points: float = 100.0
    instructions: Optional[str] = None


class AssignmentResponse(BaseModel):
    assignment_id: int
    course_id: int
    title: str
    description: str
    due_date: datetime
    max_points: float
    instructions: Optional[str]
    created_by_id: int
    created_at: datetime
    course_title: str
    submissions_count: int = 0
    
    class Config:
        from_attributes = True


class AssignmentSubmissionResponse(BaseModel):
    submission_id: int
    assignment_id: int
    student_id: int
    submission_text: Optional[str]
    file_url: Optional[str]
    submitted_at: datetime
    grade: Optional[float]
    feedback: Optional[str]
    graded_at: Optional[datetime]
    graded_by_id: Optional[int]
    student_name: str
    assignment_title: str
    
    class Config:
        from_attributes = True


class GradeSubmissionRequest(BaseModel):
    grade: float
    feedback: Optional[str] = None


@router.get("/courses")
async def get_teacher_courses(
    current_user=Depends(require_role(["teacher"])),
    db: Session = Depends(get_db)
):
    """Get courses assigned to the current teacher"""
    try:
        teacher_id = int(current_user.get("sub"))
        
        courses = db.query(Course).filter(Course.admin_id == teacher_id).all()
        
        result = []
        for course in courses:
            # Count enrolled students
            enrolled_count = db.query(Enrollment).filter(
                Enrollment.course_id == course.course_id
            ).count()
            
            result.append({
                "course_id": course.course_id,
                "title": course.title,
                "description": course.description,
                "start_time": course.start_time.isoformat(),
                "end_time": course.end_time.isoformat(),
                "price": course.price,
                "max_students": course.max_students,
                "enrolled_count": enrolled_count,
                "is_online": course.is_online,
                "location": course.location,
                "status": course.status,
                "created_at": course.created_at.isoformat()
            })
        
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching teacher courses: {str(e)}"
        )


@router.get("/students")
async def get_teacher_students(
    current_user=Depends(require_role(["teacher"])),
    db: Session = Depends(get_db)
):
    """Get all students enrolled in the teacher's courses"""
    try:
        teacher_id = int(current_user.get("sub"))
        
        # Get all students from teacher's courses
        students = db.query(Student).join(
            Enrollment, Student.student_id == Enrollment.student_id
        ).join(
            Course, Enrollment.course_id == Course.course_id
        ).filter(Course.admin_id == teacher_id).distinct().all()
        
        result = []
        for student in students:
            # Calculate attendance rate for this student across teacher's courses
            total_classes = db.query(Attendance).join(
                Course, Attendance.course_id == Course.course_id
            ).filter(
                and_(
                    Attendance.student_id == student.student_id,
                    Course.admin_id == teacher_id
                )
            ).count()
            
            present_classes = db.query(Attendance).join(
                Course, Attendance.course_id == Course.course_id
            ).filter(
                and_(
                    Attendance.student_id == student.student_id,
                    Course.admin_id == teacher_id,
                    Attendance.status == 'present'
                )
            ).count()
            
            attendance_rate = (present_classes / total_classes * 100) if total_classes > 0 else 0
            
            result.append({
                "student_id": student.student_id,
                "name": student.name,
                "email": student.email,
                "phone": student.phone,
                "attendance_rate": round(attendance_rate, 1),
                "last_login": None  # TODO: Implement last login tracking
            })
        
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching teacher students: {str(e)}"
        )


@router.get("/attendance/recent")
async def get_teacher_recent_attendance(
    limit: int = Query(20, ge=1, le=100),
    current_user=Depends(require_role(["teacher"])),
    db: Session = Depends(get_db)
):
    """Get recent attendance records for teacher's courses"""
    try:
        teacher_id = int(current_user.get("sub"))
        
        attendance_records = db.query(Attendance).join(
            Course, Attendance.course_id == Course.course_id
        ).join(
            Student, Attendance.student_id == Student.student_id
        ).filter(Course.admin_id == teacher_id).order_by(
            desc(Attendance.attendance_date)
        ).limit(limit).all()
        
        result = []
        for record in attendance_records:
            result.append({
                "attendance_id": record.attendance_id,
                "student_id": record.student_id,
                "course_id": record.course_id,
                "attendance_date": record.attendance_date.isoformat(),
                "status": record.status,
                "student_name": record.student.name,
                "course_title": record.course.title
            })
        
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching recent attendance: {str(e)}"
        )


@router.get("/assignments")
async def get_teacher_assignments(
    current_user=Depends(require_role(["teacher"])),
    db: Session = Depends(get_db)
):
    """Get all assignments for teacher's courses"""
    try:
        teacher_id = int(current_user.get("sub"))
        
        assignments = db.query(Assignment).join(
            Course, Assignment.course_id == Course.course_id
        ).filter(Course.admin_id == teacher_id).order_by(
            desc(Assignment.due_date)
        ).all()
        
        result = []
        for assignment in assignments:
            # Count submissions
            submissions_count = db.query(AssignmentSubmission).filter(
                AssignmentSubmission.assignment_id == assignment.assignment_id
            ).count()
            
            result.append({
                "assignment_id": assignment.assignment_id,
                "course_id": assignment.course_id,
                "title": assignment.title,
                "description": assignment.description,
                "due_date": assignment.due_date.isoformat(),
                "max_points": assignment.max_points,
                "course_title": assignment.course.title,
                "submissions_count": submissions_count
            })
        
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching teacher assignments: {str(e)}"
        )


@router.post("/assignments", response_model=AssignmentResponse)
async def create_assignment(
    assignment_data: AssignmentCreate,
    current_user=Depends(require_role(["teacher"])),
    db: Session = Depends(get_db)
):
    """Create a new assignment for a course"""
    try:
        teacher_id = int(current_user.get("sub"))
        
        # Verify the course belongs to this teacher
        course = db.query(Course).filter(
            and_(
                Course.course_id == assignment_data.course_id,
                Course.admin_id == teacher_id
            )
        ).first()
        
        if not course:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only create assignments for your own courses"
            )
        
        # Create the assignment
        db_assignment = Assignment(
            course_id=assignment_data.course_id,
            title=assignment_data.title,
            description=assignment_data.description,
            due_date=assignment_data.due_date,
            max_points=assignment_data.max_points,
            instructions=assignment_data.instructions,
            created_by_id=teacher_id
        )
        
        db.add(db_assignment)
        db.commit()
        db.refresh(db_assignment)
        
        # Notify students about the new assignment
        try:
            notify_assignment_created(db, db_assignment.assignment_id, assignment_data.course_id)  # type: ignore
        except Exception as e:
            print(f"Failed to send assignment notification: {e}")
            # Don't fail the assignment creation if notification fails
        
        # Return formatted response
        submissions_count = db.query(AssignmentSubmission).filter(
            AssignmentSubmission.assignment_id == db_assignment.assignment_id
        ).count()
        
        return AssignmentResponse(
            assignment_id=db_assignment.assignment_id,  # type: ignore
            course_id=db_assignment.course_id,  # type: ignore
            title=db_assignment.title,  # type: ignore
            description=db_assignment.description,  # type: ignore
            due_date=db_assignment.due_date,  # type: ignore
            max_points=db_assignment.max_points,  # type: ignore
            instructions=db_assignment.instructions,  # type: ignore
            created_by_id=db_assignment.created_by_id,  # type: ignore
            created_at=db_assignment.created_at,  # type: ignore
            course_title=course.title,  # type: ignore
            submissions_count=submissions_count
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating assignment: {str(e)}"
        )


@router.get("/assignments/{assignment_id}/submissions")
async def get_assignment_submissions(
    assignment_id: int,
    current_user=Depends(require_role(["teacher"])),
    db: Session = Depends(get_db)
):
    """Get all submissions for a specific assignment"""
    try:
        teacher_id = int(current_user.get("sub"))
        
        # Verify the assignment belongs to this teacher's course
        assignment = db.query(Assignment).join(
            Course, Assignment.course_id == Course.course_id
        ).filter(
            and_(
                Assignment.assignment_id == assignment_id,
                Course.admin_id == teacher_id
            )
        ).first()
        
        if not assignment:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view submissions for your own assignments"
            )
        
        # Get all submissions for this assignment
        submissions = db.query(AssignmentSubmission).join(
            Student, AssignmentSubmission.student_id == Student.student_id
        ).filter(
            AssignmentSubmission.assignment_id == assignment_id
        ).order_by(desc(AssignmentSubmission.submitted_at)).all()
        
        result = []
        for submission in submissions:
            result.append({
                "submission_id": submission.submission_id,
                "assignment_id": submission.assignment_id,
                "student_id": submission.student_id,
                "submission_text": submission.submission_text,
                "file_url": submission.file_url,
                "submitted_at": submission.submitted_at.isoformat(),
                "grade": submission.grade,
                "feedback": submission.feedback,
                "graded_at": submission.graded_at.isoformat() if submission.graded_at else None,  # type: ignore
                "graded_by_id": submission.graded_by_id,
                "student_name": submission.student.name,
                "assignment_title": assignment.title
            })
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching assignment submissions: {str(e)}"
        )


@router.put("/assignments/{assignment_id}/submissions/{submission_id}/grade")
async def grade_assignment_submission(
    assignment_id: int,
    submission_id: int,
    grade_data: GradeSubmissionRequest,
    current_user=Depends(require_role(["teacher"])),
    db: Session = Depends(get_db)
):
    """Grade a student's assignment submission"""
    try:
        teacher_id = int(current_user.get("sub"))
        
        # Verify the assignment belongs to this teacher
        assignment = db.query(Assignment).join(
            Course, Assignment.course_id == Course.course_id
        ).filter(
            and_(
                Assignment.assignment_id == assignment_id,
                Course.admin_id == teacher_id
            )
        ).first()
        
        if not assignment:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only grade submissions for your own assignments"
            )
        
        # Get the submission
        submission = db.query(AssignmentSubmission).filter(
            and_(
                AssignmentSubmission.submission_id == submission_id,
                AssignmentSubmission.assignment_id == assignment_id
            )
        ).first()
        
        if not submission:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Submission not found"
            )
        
        # Validate grade
        if grade_data.grade < 0 or grade_data.grade > assignment.max_points:  # type: ignore
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Grade must be between 0 and {assignment.max_points}"  # type: ignore
            )
        
        # Update the submission
        submission.grade = grade_data.grade  # type: ignore
        submission.feedback = grade_data.feedback  # type: ignore
        submission.graded_at = datetime.now()  # type: ignore
        submission.graded_by_id = teacher_id  # type: ignore
        
        db.commit()
        db.refresh(submission)
        
        # Send notification to student about grading
        try:
            from app.services.notification_service import NotificationService
            from app.models.notification_models import NotificationType, NotificationPriority
            
            notification_service = NotificationService(db)
            notification_service.create_notification(
                user_id=submission.student_id,  # type: ignore
                user_type="student",
                notification_type=NotificationType.ASSIGNMENT_GRADED,
                title=f"Assignment Graded: {assignment.title}",  # type: ignore
                message=f"Your submission has been graded. Score: {grade_data.grade}/{assignment.max_points}",  # type: ignore
                priority=NotificationPriority.MEDIUM,
                action_url=f"/dashboard/student/assignments/{assignment_id}",
                action_text="View Grade",
                related_assignment_id=assignment_id
            )
        except Exception as e:
            print(f"Failed to send grading notification: {e}")
            # Don't fail the grading if notification fails
        
        return {
            "message": "Assignment graded successfully",
            "submission_id": submission.submission_id,
            "grade": submission.grade,
            "feedback": submission.feedback,
            "graded_at": submission.graded_at.isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error grading submission: {str(e)}"
        )