from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import List, Optional
from datetime import datetime, date
from pydantic import BaseModel

from app.core.database import get_db
from app.models.models import Attendance, Student, Course
from app.api.auth import get_current_user, require_role
from app.utils.qr_generator import verify_qr_code, generate_attendance_qr


class AttendanceCreate(BaseModel):
    student_id: int
    course_id: int
    attendance_date: datetime
    status: str = "present"
    notes: Optional[str] = None


class AttendanceQRScan(BaseModel):
    qr_data: str
    course_id: int
    attendance_date: date


class AttendanceResponse(BaseModel):
    attendance_id: int
    student_id: int
    course_id: int
    attendance_date: datetime
    status: str
    scanned_at: Optional[datetime] = None
    notes: Optional[str] = None
    marked_by_id: Optional[int] = None
    
    class Config:
        from_attributes = True


class AttendanceStats(BaseModel):
    total_classes: int
    present_count: int
    absent_count: int
    late_count: int
    excused_count: int
    attendance_percentage: float


router = APIRouter()


@router.post("/scan-qr")
async def scan_qr_attendance(
    scan_data: AttendanceQRScan,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["teacher", "admin"]))
):
    """Scan student QR code for attendance"""
    # Verify QR code format
    qr_result = verify_qr_code(scan_data.qr_data, "student_")
    
    if not qr_result["valid"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid QR code: {qr_result.get('error', 'Unknown error')}"
        )
    
    student_id = int(qr_result["identifier"])
    
    # Verify student exists
    student = db.query(Student).filter(Student.student_id == student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    # Verify course exists
    course = db.query(Course).filter(Course.course_id == scan_data.course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    # Check if attendance already marked for this date
    existing_attendance = db.query(Attendance).filter(
        Attendance.student_id == student_id,
        Attendance.course_id == scan_data.course_id,
        Attendance.attendance_date == scan_data.attendance_date
    ).first()
    
    if existing_attendance:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Attendance already marked for this student today"
        )
    
    # Create attendance record
    attendance = Attendance(
        student_id=student_id,
        course_id=scan_data.course_id,
        attendance_date=scan_data.attendance_date,
        status="present",
        scanned_at=datetime.utcnow(),
        marked_by_id=current_user["user"].teacher_id if current_user["user_type"] == "teacher" else current_user["user"].admin_id
    )
    
    db.add(attendance)
    db.commit()
    db.refresh(attendance)
    
    return {
        "message": f"Attendance marked for {student.name}",
        "student_name": student.name,
        "attendance": attendance
    }


@router.post("/mark", response_model=AttendanceResponse)
async def mark_attendance(
    attendance_data: AttendanceCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["teacher", "admin"]))
):
    """Manually mark attendance for a student"""
    # Verify student exists
    student = db.query(Student).filter(Student.student_id == attendance_data.student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    # Verify course exists
    course = db.query(Course).filter(Course.course_id == attendance_data.course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    # If user is a teacher, verify they are assigned to this course
    if current_user["user_type"] == "teacher":
        teacher_id = current_user["user"].teacher_id
        is_assigned = any(teacher.teacher_id == teacher_id for teacher in course.teachers)
        if not is_assigned:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not assigned to this course"
            )
    
    # Check if attendance already marked
    existing_attendance = db.query(Attendance).filter(
        Attendance.student_id == attendance_data.student_id,
        Attendance.course_id == attendance_data.course_id,
        Attendance.attendance_date == attendance_data.attendance_date
    ).first()
    
    if existing_attendance:
        # Update existing attendance
        existing_attendance.status = attendance_data.status
        existing_attendance.notes = attendance_data.notes
        existing_attendance.marked_by_id = current_user["user"].teacher_id if current_user["user_type"] == "teacher" else current_user["user"].admin_id
        
        db.commit()
        db.refresh(existing_attendance)
        return existing_attendance
    
    # Create new attendance record
    attendance = Attendance(
        student_id=attendance_data.student_id,
        course_id=attendance_data.course_id,
        attendance_date=attendance_data.attendance_date,
        status=attendance_data.status,
        notes=attendance_data.notes,
        marked_by_id=current_user["user"].teacher_id if current_user["user_type"] == "teacher" else current_user["user"].admin_id
    )
    
    db.add(attendance)
    db.commit()
    db.refresh(attendance)
    
    # Send notification to student about attendance marking (if absent)
    if attendance_data.status == "absent":
        try:
            from app.services.notification_service import NotificationService
            from app.models.notification_models import NotificationType, NotificationPriority
            
            notification_service = NotificationService(db)
            notification_service.create_notification(
                user_id=attendance_data.student_id,
                user_type="student",
                notification_type=NotificationType.ATTENDANCE_MARKED,
                title=f"Attendance Marked: Absent",
                message=f"You were marked absent in {course.title} on {attendance_data.attendance_date.strftime('%Y-%m-%d')}",
                priority=NotificationPriority.HIGH,
                action_url=f"/dashboard/student/attendance",
                action_text="View Attendance",
                related_course_id=attendance_data.course_id
            )
        except Exception as e:
            print(f"Failed to send attendance notification: {e}")
            # Don't fail the attendance marking if notification fails
    
    return attendance


@router.get("/course/{course_id}", response_model=List[AttendanceResponse])
async def get_course_attendance(
    course_id: int,
    attendance_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["teacher", "admin"]))
):
    """Get attendance records for a course"""
    query = db.query(Attendance).filter(Attendance.course_id == course_id)
    
    if attendance_date:
        query = query.filter(Attendance.attendance_date == attendance_date)
    
    attendances = query.all()
    return attendances


@router.get("/student/{student_id}", response_model=List[AttendanceResponse])
async def get_student_attendance(
    student_id: int,
    course_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Get attendance records for a student"""
    # Students can only view their own attendance
    if current_user["user_type"] == "student" and current_user["user"].student_id != student_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Can only view your own attendance"
        )
    
    query = db.query(Attendance).filter(Attendance.student_id == student_id)
    
    if course_id:
        query = query.filter(Attendance.course_id == course_id)
    
    attendances = query.all()
    return attendances


@router.get("/student/{student_id}/stats", response_model=AttendanceStats)
async def get_student_attendance_stats(
    student_id: int,
    course_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Get attendance statistics for a student"""
    # Students can only view their own stats
    if current_user["user_type"] == "student" and current_user["user"].student_id != student_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Can only view your own attendance statistics"
        )
    
    query = db.query(Attendance).filter(Attendance.student_id == student_id)
    
    if course_id:
        query = query.filter(Attendance.course_id == course_id)
    
    attendances = query.all()
    
    total_classes = len(attendances)
    present_count = len([a for a in attendances if a.status == "present"])
    absent_count = len([a for a in attendances if a.status == "absent"])
    late_count = len([a for a in attendances if a.status == "late"])
    excused_count = len([a for a in attendances if a.status == "excused"])
    
    attendance_percentage = (present_count / total_classes * 100) if total_classes > 0 else 0
    
    return AttendanceStats(
        total_classes=total_classes,
        present_count=present_count,
        absent_count=absent_count,
        late_count=late_count,
        excused_count=excused_count,
        attendance_percentage=round(attendance_percentage, 2)
    )


@router.get("/generate-qr/{course_id}")
async def generate_course_attendance_qr(
    course_id: int,
    class_date: str,  # Format: YYYY-MM-DD
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["teacher", "admin"]))
):
    """Generate QR code for course attendance"""
    # Verify course exists
    course = db.query(Course).filter(Course.course_id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    # Generate attendance QR code
    qr_url = generate_attendance_qr(course_id, class_date)
    
    return {
        "message": "Attendance QR code generated",
        "qr_code_url": qr_url,
        "course_title": course.title,
        "class_date": class_date
    }


@router.get("/student/{student_id}/monthly-report")
async def get_monthly_attendance_report(
    student_id: int,
    year: Optional[int] = None,
    month: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Get monthly attendance report for a student"""
    # Authorization: students can only view own, teachers/admins can view any
    if current_user["user_type"] == "student" and current_user["user"].student_id != student_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Can only view your own attendance report"
        )
    
    # Use current year/month if not specified
    if not year or not month:
        now = datetime.now()
        year = year or now.year
        month = month or now.month
    
    # Verify student exists
    student = db.query(Student).filter(Student.student_id == student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    # Get attendance records for the month
    attendances = db.query(Attendance).filter(
        Attendance.student_id == student_id,
        extract('year', Attendance.attendance_date) == year,
        extract('month', Attendance.attendance_date) == month
    ).all()
    
    # Group by course
    course_reports = {}
    for attendance in attendances:
        course = db.query(Course).filter(Course.course_id == attendance.course_id).first()
        if not course:
            continue
            
        if attendance.course_id not in course_reports:
            course_reports[attendance.course_id] = {
                "course_id": course.course_id,
                "course_title": course.title,
                "total_classes": 0,
                "present": 0,
                "absent": 0,
                "late": 0,
                "excused": 0,
                "attendance_percentage": 0.0,
                "records": []
            }
        
        course_reports[attendance.course_id]["total_classes"] += 1
        if attendance.status == "present":
            course_reports[attendance.course_id]["present"] += 1
        elif attendance.status == "absent":
            course_reports[attendance.course_id]["absent"] += 1
        elif attendance.status == "late":
            course_reports[attendance.course_id]["late"] += 1
        elif attendance.status == "excused":
            course_reports[attendance.course_id]["excused"] += 1
        
        course_reports[attendance.course_id]["records"].append({
            "date": attendance.attendance_date.isoformat(),
            "status": attendance.status,
            "notes": attendance.notes
        })
    
    # Calculate percentages
    for course_id in course_reports:
        total = course_reports[course_id]["total_classes"]
        present = course_reports[course_id]["present"]
        if total > 0:
            course_reports[course_id]["attendance_percentage"] = round((present / total) * 100, 2)
    
    # Overall stats
    total_classes = len(attendances)
    total_present = len([a for a in attendances if a.status == "present"])
    overall_percentage = round((total_present / total_classes) * 100, 2) if total_classes > 0 else 0
    
    return {
        "student_id": student_id,
        "student_name": student.name,
        "parent_email": student.parent_email,
        "parent_phone": student.parent_phone,
        "year": year,
        "month": month,
        "overall_stats": {
            "total_classes": total_classes,
            "present": total_present,
            "absent": len([a for a in attendances if a.status == "absent"]),
            "late": len([a for a in attendances if a.status == "late"]),
            "excused": len([a for a in attendances if a.status == "excused"]),
            "attendance_percentage": overall_percentage
        },
        "by_course": list(course_reports.values())
    }