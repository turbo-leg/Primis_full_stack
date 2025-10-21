from fastapi import APIRouter, Depends, HTTPException, status, Query, Form, File, UploadFile
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_
from typing import List, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel

from app.core.database import get_db
from app.api.auth import get_current_user, require_role
from app.models.models import (
    Student, Teacher, Course, Enrollment, Assignment, 
    AssignmentSubmission, Material, Announcement
)
from app.utils.cloudinary_helper import upload_file


# Pydantic models
class SubmitAssignmentRequest(BaseModel):
    assignment_id: int
    submission_text: Optional[str] = None
    
    class Config:
        from_attributes = True


class SubmissionResponse(BaseModel):
    submission_id: int
    assignment_id: int
    student_id: int
    submission_text: Optional[str]
    file_url: Optional[str]
    submitted_at: str
    grade: Optional[float]
    feedback: Optional[str]
    graded_at: Optional[str]
    assignment_title: str
    
    class Config:
        from_attributes = True

router = APIRouter()


@router.get("/{student_id}/enrollments")
async def get_student_enrollments(
    student_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get student's course enrollments"""
    try:
        # Check if current user can access this student's data
        user_type = current_user.get("user_type")
        current_user_id = current_user.get("sub")
        
        if user_type == "student" and str(student_id) != current_user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot access other student's data"
            )
        
        enrollments = db.query(Enrollment).join(
            Course, Enrollment.course_id == Course.course_id
        ).filter(Enrollment.student_id == student_id).all()
        
        result = []
        for enrollment in enrollments:
            # Get teacher info
            teacher = db.query(Teacher).filter(Teacher.teacher_id == enrollment.course.admin_id).first()
            
            result.append({
                "enrollment_id": enrollment.enrollment_id,
                "course": {
                    "course_id": enrollment.course.course_id,
                    "title": enrollment.course.title,
                    "description": enrollment.course.description,
                    "start_time": enrollment.course.start_time.isoformat(),
                    "end_time": enrollment.course.end_time.isoformat(),
                    "is_online": enrollment.course.is_online,
                    "location": enrollment.course.location,
                    "status": enrollment.course.status,
                    "teacher_name": teacher.name if teacher else "Not assigned"
                },
                "paid": enrollment.paid,
                "payment_due": enrollment.payment_due.isoformat() if enrollment.payment_due is not None else None,
                "status": enrollment.status,
                "amount": float(enrollment.course.price)
            })
        
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching student enrollments: {str(e)}"
        )


@router.get("/{student_id}/assignments")
async def get_student_assignments(
    student_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get student's assignments across all courses"""
    try:
        # Check permissions
        user_type = current_user.get("user_type")
        current_user_id = current_user.get("sub")
        
        if user_type == "student" and str(student_id) != current_user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot access other student's data"
            )
        
        # Get student's enrolled courses
        enrolled_course_ids = [e.course_id for e in db.query(Enrollment.course_id).filter(
            Enrollment.student_id == student_id
        ).all()]
        
        # Get assignments for those courses
        assignments = db.query(Assignment).join(
            Course, Assignment.course_id == Course.course_id
        ).filter(Assignment.course_id.in_(enrolled_course_ids)).order_by(
            desc(Assignment.due_date)
        ).all()
        
        result = []
        for assignment in assignments:
            # Get submission status
            submission = db.query(AssignmentSubmission).filter(
                and_(
                    AssignmentSubmission.assignment_id == assignment.assignment_id,
                    AssignmentSubmission.student_id == student_id
                )
            ).first()
            
            submission_status = "pending"
            grade = None
            if submission:
                submission_status = "submitted"
                grade = submission.grade
            else:
                # Check if assignment is overdue
                now = datetime.now()
                due_date = getattr(assignment, 'due_date', None)
                if due_date is not None and due_date < now:
                    submission_status = "overdue"
            
            result.append({
                "assignment_id": assignment.assignment_id,
                "course_id": assignment.course_id,
                "title": assignment.title,
                "description": assignment.description,
                "due_date": assignment.due_date.isoformat(),
                "max_points": assignment.max_points,
                "course_title": assignment.course.title,
                "submission_status": submission_status,
                "grade": grade
            })
        
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching student assignments: {str(e)}"
        )


@router.get("/assignments/upcoming")
async def get_upcoming_assignments(
    current_user=Depends(require_role(["student"])),
    db: Session = Depends(get_db)
):
    """Get upcoming assignments for the current student"""
    try:
        student_id = int(current_user.get("sub"))
        
        # Get student's enrolled courses
        enrolled_course_ids = [e.course_id for e in db.query(Enrollment.course_id).filter(
            Enrollment.student_id == student_id
        ).all()]
        
        # Get upcoming assignments (next 30 days)
        upcoming_date = datetime.now() + timedelta(days=30)
        assignments = db.query(Assignment).join(
            Course, Assignment.course_id == Course.course_id
        ).filter(
            and_(
                Assignment.course_id.in_(enrolled_course_ids),
                Assignment.due_date >= datetime.now(),
                Assignment.due_date <= upcoming_date
            )
        ).order_by(Assignment.due_date).all()
        
        result = []
        for assignment in assignments:
            # Check if already submitted
            submission = db.query(AssignmentSubmission).filter(
                and_(
                    AssignmentSubmission.assignment_id == assignment.assignment_id,
                    AssignmentSubmission.student_id == student_id
                )
            ).first()
            
            if not submission:  # Only include if not submitted
                result.append({
                    "assignment_id": assignment.assignment_id,
                    "course_id": assignment.course_id,
                    "title": assignment.title,
                    "description": assignment.description,
                    "due_date": assignment.due_date.isoformat(),
                    "max_points": assignment.max_points,
                    "course_title": assignment.course.title
                })
        
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching upcoming assignments: {str(e)}"
        )


@router.get("/materials/recent")
async def get_recent_materials(
    limit: int = Query(10, ge=1, le=50),
    current_user=Depends(require_role(["student"])),
    db: Session = Depends(get_db)
):
    """Get recent materials for the current student"""
    try:
        student_id = int(current_user.get("sub"))
        
        # Get student's enrolled courses
        enrolled_course_ids = [e.course_id for e in db.query(Enrollment.course_id).filter(
            Enrollment.student_id == student_id
        ).all()]
        
        # Get recent materials from enrolled courses
        materials = db.query(Material).join(
            Course, Material.course_id == Course.course_id
        ).filter(
            and_(
                Material.course_id.in_(enrolled_course_ids),
                Material.is_public == True
            )
        ).order_by(desc(Material.upload_date)).limit(limit).all()
        
        result = []
        for material in materials:
            result.append({
                "material_id": material.material_id,
                "course_id": material.course_id,
                "title": material.title,
                "type": material.type,
                "url": material.url,
                "description": material.description,
                "upload_date": material.upload_date.isoformat(),
                "course_title": material.course.title
            })
        
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching recent materials: {str(e)}"
        )


@router.post("/assignments/{assignment_id}/submit")
async def submit_assignment(
    assignment_id: int,
    submission_text: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    current_user=Depends(require_role(["student"])),
    db: Session = Depends(get_db)
):
    """Submit an assignment with optional text and file attachment"""
    try:
        student_id = int(current_user.get("sub"))
        
        # Get the assignment
        assignment = db.query(Assignment).filter(
            Assignment.assignment_id == assignment_id
        ).first()
        
        if not assignment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assignment not found"
            )
        
        # Verify student is enrolled in the course
        enrollment = db.query(Enrollment).filter(
            and_(
                Enrollment.student_id == student_id,
                Enrollment.course_id == assignment.course_id
            )
        ).first()
        
        if not enrollment:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not enrolled in this course"
            )
        
        # Check if already submitted
        existing_submission = db.query(AssignmentSubmission).filter(
            and_(
                AssignmentSubmission.assignment_id == assignment_id,
                AssignmentSubmission.student_id == student_id
            )
        ).first()
        
        if existing_submission:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You have already submitted this assignment. Please contact your teacher to resubmit."
            )
        
        # Validate that at least one submission method is used
        if not submission_text and not file:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Please provide either submission text or a file"
            )
        
        # Upload file if provided
        file_url = None
        if file:
            try:
                # Read file content
                content = await file.read()
                
                # Upload to Cloudinary
                result = upload_file(
                    file_content=content,
                    folder="assignment_submissions",
                    resource_type="auto"
                )
                file_url = result.get("secure_url")
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Error uploading file: {str(e)}"
                )
        
        # Create submission record
        submission = AssignmentSubmission(
            assignment_id=assignment_id,
            student_id=student_id,
            submission_text=submission_text,
            file_url=file_url,
            submitted_at=datetime.now()
        )
        
        db.add(submission)
        db.commit()
        db.refresh(submission)
        
        # Send notification to teacher about new submission
        try:
            from app.services.notification_service import NotificationService
            from app.models.notification_models import NotificationType, NotificationPriority
            from app.models.models import Course
            
            # Get the course and teacher
            course = db.query(Course).filter(Course.course_id == assignment.course_id).first()  # type: ignore
            if course and course.admin_id:  # type: ignore
                notification_service = NotificationService(db)
                
                # Get student name
                student = db.query(Student).filter(Student.student_id == student_id).first()
                student_name = f"{student.first_name} {student.last_name}" if student else "A student"  # type: ignore
                
                notification_service.create_notification(
                    user_id=course.admin_id,  # type: ignore
                    user_type="teacher",
                    notification_type=NotificationType.ASSIGNMENT_CREATED,  # Using this for submission notification
                    title=f"New Submission: {assignment.title}",  # type: ignore
                    message=f"{student_name} submitted {assignment.title} in {course.title}",  # type: ignore
                    priority=NotificationPriority.MEDIUM,
                    action_url=f"/dashboard/teacher/assignments/{assignment_id}/submissions",
                    action_text="View Submissions",
                    related_assignment_id=assignment_id,
                    related_course_id=assignment.course_id  # type: ignore
                )
        except Exception as e:
            print(f"Failed to send submission notification: {e}")
            # Don't fail the submission if notification fails
        
        return {
            "message": "Assignment submitted successfully",
            "submission_id": submission.submission_id,  # type: ignore
            "submitted_at": submission.submitted_at.isoformat()  # type: ignore
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error submitting assignment: {str(e)}"
        )


@router.get("/assignments/{assignment_id}/submission")
async def get_assignment_submission(
    assignment_id: int,
    current_user=Depends(require_role(["student"])),
    db: Session = Depends(get_db)
):
    """Get student's submission for a specific assignment"""
    try:
        student_id = int(current_user.get("sub"))
        
        # Get the submission
        submission = db.query(AssignmentSubmission).join(
            Assignment, AssignmentSubmission.assignment_id == Assignment.assignment_id
        ).filter(
            and_(
                AssignmentSubmission.assignment_id == assignment_id,
                AssignmentSubmission.student_id == student_id
            )
        ).first()
        
        if not submission:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No submission found for this assignment"
            )
        
        return {
            "submission_id": submission.submission_id,  # type: ignore
            "assignment_id": submission.assignment_id,  # type: ignore
            "student_id": submission.student_id,  # type: ignore
            "submission_text": submission.submission_text,  # type: ignore
            "file_url": submission.file_url,  # type: ignore
            "submitted_at": submission.submitted_at.isoformat(),  # type: ignore
            "grade": submission.grade,  # type: ignore
            "feedback": submission.feedback,  # type: ignore
            "graded_at": submission.graded_at.isoformat() if submission.graded_at else None,  # type: ignore
            "assignment_title": submission.assignment.title  # type: ignore
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching submission: {str(e)}"
        )