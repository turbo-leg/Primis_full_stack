from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.models.models import Course, Enrollment, Teacher, Student
from app.api.auth import get_current_user, require_role
from pydantic import BaseModel


class CourseBase(BaseModel):
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    price: float
    max_students: int = 30
    is_online: bool = False
    location: Optional[str] = None


class CourseCreate(CourseBase):
    teacher_ids: List[int] = []  # List of teacher IDs to assign to this course


class CourseResponse(CourseBase):
    course_id: int
    status: str
    admin_id: int
    created_at: datetime
    teacher_ids: List[int] = []
    enrolled_count: int = 0
    
    class Config:
        from_attributes = True
        
    @classmethod
    def from_orm(cls, obj):
        # Extract teacher IDs from the relationship
        teacher_ids = [teacher.teacher_id for teacher in obj.teachers] if hasattr(obj, 'teachers') else []
        # Count active enrollments
        enrolled_count = len([e for e in obj.enrollments if e.status == 'active']) if hasattr(obj, 'enrollments') else 0
        data = {
            **{k: getattr(obj, k) for k in cls.__fields__ if k not in ['teacher_ids', 'enrolled_count'] and hasattr(obj, k)},
            'teacher_ids': teacher_ids,
            'enrolled_count': enrolled_count
        }
        return cls(**data)


class EnrollmentResponse(BaseModel):
    enrollment_id: int
    student_id: int
    course_id: int
    paid: bool
    paid_date: Optional[datetime] = None
    payment_due: Optional[datetime] = None
    enrollment_date: datetime
    status: str
    
    class Config:
        from_attributes = True


class EnrollmentWithCourseResponse(BaseModel):
    enrollment_id: int
    course: CourseResponse
    paid: bool
    paid_date: Optional[datetime] = None
    payment_due: Optional[datetime] = None
    enrollment_date: datetime
    status: str
    
    class Config:
        from_attributes = True


class TeacherResponse(BaseModel):
    teacher_id: int
    name: str
    email: str
    specialization: Optional[str] = None
    
    class Config:
        from_attributes = True


class StudentResponse(BaseModel):
    student_id: int
    name: str
    email: str
    phone: Optional[str] = None
    
    class Config:
        from_attributes = True


class EnrollmentWithStudentResponse(BaseModel):
    enrollment_id: int
    student: StudentResponse
    paid: bool
    enrollment_date: datetime
    status: str
    
    class Config:
        from_attributes = True


router = APIRouter()


@router.get("/", response_model=List[CourseResponse])
async def get_courses(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    is_online: Optional[bool] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get list of courses with optional filters"""
    query = db.query(Course)
    
    if is_online is not None:
        query = query.filter(Course.is_online == is_online)
    
    if status:
        query = query.filter(Course.status == status)
    
    courses = query.offset(skip).limit(limit).all()
    return [CourseResponse.from_orm(course) for course in courses]


@router.get("/my-courses", response_model=List[CourseResponse])
async def get_my_courses(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Get courses for current user based on their role"""
    user_type = current_user["user_type"]
    user = current_user["user"]
    
    if user_type == "student":
        # Get enrolled courses
        enrollments = db.query(Enrollment).filter(
            Enrollment.student_id == user.student_id,
            Enrollment.status == "active"
        ).all()
        course_ids = [e.course_id for e in enrollments]
        courses = db.query(Course).filter(Course.course_id.in_(course_ids)).all()
    
    elif user_type == "teacher":
        # Get assigned courses
        courses = user.courses
    
    elif user_type == "admin":
        # Get all courses managed by admin
        courses = db.query(Course).filter(Course.admin_id == user.admin_id).all()
    
    else:
        courses = []
    
    return [CourseResponse.from_orm(course) for course in courses]


@router.get("/my-enrollments")
async def get_my_enrollments(
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["student"]))
):
    """Get enrollments with course details for current student"""
    try:
        student_id = current_user["user"].student_id
        
        enrollments = db.query(Enrollment).filter(
            Enrollment.student_id == student_id,
            Enrollment.status == "active"
        ).all()
        
        result = []
        for enrollment in enrollments:
            course = db.query(Course).filter(Course.course_id == enrollment.course_id).first()
            if course:
                result.append({
                    "enrollment_id": enrollment.enrollment_id,
                    "course": {
                        "course_id": course.course_id,
                        "title": course.title,
                        "description": course.description,
                        "start_time": course.start_time.isoformat() if course.start_time else None,
                        "end_time": course.end_time.isoformat() if course.end_time else None,
                        "price": float(course.price) if course.price else 0.0,
                        "max_students": course.max_students,
                        "is_online": course.is_online,
                        "location": course.location,
                        "status": course.status,
                    },
                    "paid": enrollment.paid,
                    "paid_date": enrollment.paid_date.isoformat() if enrollment.paid_date else None,
                    "payment_due": enrollment.payment_due.isoformat() if enrollment.payment_due else None,
                    "enrollment_date": enrollment.enrollment_date.isoformat() if enrollment.enrollment_date else None,
                    "status": enrollment.status
                })
        
        return result
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error in my-enrollments: {str(e)}", exc_info=True)
        raise


@router.get("/teachers/all", response_model=List[TeacherResponse])
async def get_all_teachers(
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["admin"]))
):
    """Get all teachers (admin only) - for assigning to courses"""
    teachers = db.query(Teacher).filter(Teacher.is_active == True).all()
    return teachers


@router.get("/{course_id}", response_model=CourseResponse)
async def get_course(course_id: int, db: Session = Depends(get_db)):
    """Get specific course by ID"""
    course = db.query(Course).filter(Course.course_id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    return CourseResponse.from_orm(course)


@router.post("/", response_model=CourseResponse)
async def create_course(
    course_data: CourseCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["admin"]))
):
    """Create a new course (admin only)"""
    admin_id = current_user["user"].admin_id
    
    # Verify that all teacher IDs exist
    if course_data.teacher_ids:
        teachers = db.query(Teacher).filter(Teacher.teacher_id.in_(course_data.teacher_ids)).all()
        if len(teachers) != len(course_data.teacher_ids):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="One or more teacher IDs are invalid"
            )
    
    db_course = Course(
        title=course_data.title,
        description=course_data.description,
        start_time=course_data.start_time,
        end_time=course_data.end_time,
        price=course_data.price,
        max_students=course_data.max_students,
        is_online=course_data.is_online,
        location=course_data.location,
        admin_id=admin_id
    )
    
    db.add(db_course)
    db.commit()
    db.refresh(db_course)
    
    # Assign teachers to the course
    if course_data.teacher_ids:
        teachers = db.query(Teacher).filter(Teacher.teacher_id.in_(course_data.teacher_ids)).all()
        db_course.teachers = teachers
        db.commit()
        db.refresh(db_course)
    
    return CourseResponse.from_orm(db_course)


@router.put("/{course_id}", response_model=CourseResponse)
async def update_course(
    course_id: int,
    course_data: CourseCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["admin"]))
):
    """Update a course (admin only)"""
    course = db.query(Course).filter(Course.course_id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    # Update course fields
    for field, value in course_data.dict().items():
        setattr(course, field, value)
    
    db.commit()
    db.refresh(course)
    
    return course


@router.delete("/{course_id}")
async def delete_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["admin"]))
):
    """Delete a course (admin only)"""
    course = db.query(Course).filter(Course.course_id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    db.delete(course)
    db.commit()
    
    return {"message": "Course deleted successfully"}


@router.post("/{course_id}/enroll")
async def enroll_in_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["student"]))
):
    """Enroll current student in a course"""
    student_id = current_user["user"].student_id
    
    # Check if course exists
    course = db.query(Course).filter(Course.course_id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    # Check if already enrolled
    existing_enrollment = db.query(Enrollment).filter(
        Enrollment.student_id == student_id,
        Enrollment.course_id == course_id
    ).first()
    
    if existing_enrollment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already enrolled in this course"
        )
    
    # Check course capacity
    current_enrollments = db.query(Enrollment).filter(
        Enrollment.course_id == course_id,
        Enrollment.status == "active"
    ).count()
    
    max_students = getattr(course, 'max_students', None)
    if max_students is not None and current_enrollments >= max_students:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Course is full"
        )
    
    # Create enrollment
    enrollment = Enrollment(
        student_id=student_id,
        course_id=course_id,
        paid=False,
        payment_due=course.start_time  # Set payment due to course start time
    )
    
    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)
    
    # Send enrollment confirmation notification to student
    try:
        from app.services.notification_service import NotificationService
        from app.models.notification_models import NotificationType, NotificationPriority
        
        notification_service = NotificationService(db)
        notification_service.create_notification(
            user_id=student_id,
            user_type="student",
            notification_type=NotificationType.ENROLLMENT_APPROVED,
            title=f"Enrolled in {course.title}",
            message=f"You have successfully enrolled in {course.title}. Payment is due by {course.start_time.strftime('%Y-%m-%d') if course.start_time else 'TBD'}.",
            priority=NotificationPriority.HIGH,
            action_url=f"/dashboard/student/courses/{course_id}",
            action_text="View Course",
            related_course_id=course_id
        )
    except Exception as e:
        print(f"Failed to send enrollment notification: {e}")
        # Don't fail the enrollment if notification fails
    
    return {"message": "Successfully enrolled in course", "enrollment_id": enrollment.enrollment_id}


@router.get("/{course_id}/enrollments")
async def get_course_enrollments(
    course_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["admin", "teacher"]))
):
    """Get all enrollments for a course (admin/teacher only) with student details"""
    course = db.query(Course).filter(Course.course_id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    enrollments = db.query(Enrollment).filter(Enrollment.course_id == course_id).all()
    
    # Return enrollments with student details
    result = []
    for enrollment in enrollments:
        result.append({
            "enrollment_id": enrollment.enrollment_id,
            "student_id": enrollment.student_id,
            "course_id": enrollment.course_id,
            "paid": enrollment.paid,
            "enrollment_date": enrollment.enrollment_date.isoformat() if enrollment.enrollment_date else None,
            "status": enrollment.status,
            "student": {
                "student_id": enrollment.student.student_id,
                "name": enrollment.student.name,
                "email": enrollment.student.email,
                "phone": enrollment.student.phone,
                "qr_code": enrollment.student.qr_code
            }
        })
    
    return result


@router.get("/{course_id}/people")
async def get_course_people(
    course_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Get all people (teachers and students) in a course"""
    course = db.query(Course).filter(Course.course_id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    # Get teachers for this course
    teachers = db.query(Teacher).join(
        Teacher.courses
    ).filter(Course.course_id == course_id).all()
    
    teachers_data = [
        {
            "teacher_id": t.teacher_id,
            "name": t.name,
            "email": t.email,
            "specialization": t.specialization,
            "role": "Teacher"
        }
        for t in teachers
    ]
    
    # Get students enrolled in this course
    enrollments = db.query(Enrollment).filter(
        Enrollment.course_id == course_id
    ).join(Student).all()
    
    students_data = [
        {
            "student_id": e.student.student_id,
            "name": e.student.name,
            "email": e.student.email,
            "phone": e.student.phone,
            "role": "Student",
            "enrollment_date": e.enrollment_date.isoformat() if e.enrollment_date else None,
            "paid": e.paid
        }
        for e in enrollments
    ]
    
    return {
        "teachers": teachers_data,
        "students": students_data,
        "total_teachers": len(teachers_data),
        "total_students": len(students_data)
    }
