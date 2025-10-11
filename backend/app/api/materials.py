from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.core.database import get_db
from app.api.auth import get_current_user, require_role
from app.models.models import Material, Course, Teacher, Announcement
from pydantic import BaseModel
import os
import uuid

router = APIRouter()

# Schemas
class MaterialResponse(BaseModel):
    material_id: int
    course_id: int
    title: str
    type: str
    url: str
    file_size: Optional[int]
    description: Optional[str]
    is_public: bool
    upload_date: datetime
    
    class Config:
        from_attributes = True


class AnnouncementCreate(BaseModel):
    title: str
    content: str
    is_important: bool = False


class AnnouncementUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    is_important: Optional[bool] = None


class AnnouncementResponse(BaseModel):
    announcement_id: int
    course_id: int
    title: str
    content: str
    posted_on: datetime
    is_important: bool
    posted_by_id: int
    posted_by_type: str
    
    class Config:
        from_attributes = True


# Material endpoints
@router.post("/courses/{course_id}/materials", response_model=MaterialResponse)
async def upload_material(
    course_id: int,
    title: str = Form(...),
    description: Optional[str] = Form(None),
    is_public: bool = Form(False),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["teacher", "admin"]))
):
    """Upload a material/file to a course (teachers and admins only)"""
    
    # Verify course exists
    course = db.query(Course).filter(Course.course_id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    # If teacher, verify they are assigned to this course
    user_type = current_user["user_type"]
    if user_type == "teacher":
        teacher = current_user["user"]
        if course not in teacher.courses:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not assigned to this course"
            )
    
    # Create uploads directory if it doesn't exist
    upload_dir = "uploads/materials"
    os.makedirs(upload_dir, exist_ok=True)
    
    # Generate unique filename
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(upload_dir, unique_filename)
    
    # Save file
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
    
    # Determine file type
    file_type = "document"
    if file_extension.lower() in [".pdf"]:
        file_type = "pdf"
    elif file_extension.lower() in [".mp4", ".avi", ".mov", ".mkv"]:
        file_type = "video"
    elif file_extension.lower() in [".doc", ".docx", ".txt"]:
        file_type = "document"
    elif file_extension.lower() in [".ppt", ".pptx"]:
        file_type = "presentation"
    elif file_extension.lower() in [".zip", ".rar"]:
        file_type = "archive"
    
    # Create material record
    material = Material(
        course_id=course_id,
        title=title,
        type=file_type,
        url=f"/uploads/materials/{unique_filename}",
        file_size=len(content),
        description=description,
        is_public=is_public
    )
    
    db.add(material)
    db.commit()
    db.refresh(material)
    
    return material


@router.get("/courses/{course_id}/materials", response_model=List[MaterialResponse])
async def get_course_materials(
    course_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Get all materials for a course"""
    
    # Verify course exists
    course = db.query(Course).filter(Course.course_id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    # Get materials
    materials = db.query(Material).filter(
        Material.course_id == course_id
    ).order_by(Material.upload_date.desc()).all()
    
    return materials


@router.delete("/materials/{material_id}")
async def delete_material(
    material_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["teacher", "admin"]))
):
    """Delete a material (teachers and admins only)"""
    
    material = db.query(Material).filter(Material.material_id == material_id).first()
    if not material:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Material not found"
        )
    
    # If teacher, verify they are assigned to the course
    user_type = current_user["user_type"]
    if user_type == "teacher":
        teacher = current_user["user"]
        course = db.query(Course).filter(Course.course_id == material.course_id).first()
        if course not in teacher.courses:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not assigned to this course"
            )
    
    # Delete file from filesystem
    file_path = material.url.lstrip("/")
    if os.path.exists(file_path):
        os.remove(file_path)
    
    # Delete from database
    db.delete(material)
    db.commit()
    
    return {"message": "Material deleted successfully"}


# Announcement endpoints
@router.post("/courses/{course_id}/announcements", response_model=AnnouncementResponse)
async def create_announcement(
    course_id: int,
    announcement: AnnouncementCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["teacher", "admin"]))
):
    """Create an announcement for a course (teachers and admins only)"""
    
    # Verify course exists
    course = db.query(Course).filter(Course.course_id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    # If teacher, verify they are assigned to this course
    user_type = current_user["user_type"]
    user = current_user["user"]
    
    if user_type == "teacher":
        if course not in user.courses:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not assigned to this course"
            )
        posted_by_id = user.teacher_id
    else:  # admin
        posted_by_id = user.admin_id
    
    # Create announcement
    new_announcement = Announcement(
        course_id=course_id,
        title=announcement.title,
        content=announcement.content,
        is_important=announcement.is_important,
        posted_by_id=posted_by_id,
        posted_by_type=user_type
    )
    
    db.add(new_announcement)
    db.commit()
    db.refresh(new_announcement)
    
    return new_announcement


@router.get("/courses/{course_id}/announcements", response_model=List[AnnouncementResponse])
async def get_course_announcements(
    course_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Get all announcements for a course"""
    
    # Verify course exists
    course = db.query(Course).filter(Course.course_id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    # Get announcements
    announcements = db.query(Announcement).filter(
        Announcement.course_id == course_id
    ).order_by(Announcement.posted_on.desc()).all()
    
    return announcements


@router.put("/announcements/{announcement_id}", response_model=AnnouncementResponse)
async def update_announcement(
    announcement_id: int,
    announcement_update: AnnouncementUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["teacher", "admin"]))
):
    """Update an announcement (only by the creator or admin)"""
    
    announcement = db.query(Announcement).filter(
        Announcement.announcement_id == announcement_id
    ).first()
    
    if not announcement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Announcement not found"
        )
    
    # Verify user can edit (creator or admin)
    user_type = current_user["user_type"]
    user = current_user["user"]
    
    if user_type == "teacher":
        if announcement.posted_by_id != user.teacher_id or announcement.posted_by_type != "teacher":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only edit your own announcements"
            )
    
    # Update fields
    if announcement_update.title is not None:
        announcement.title = announcement_update.title
    if announcement_update.content is not None:
        announcement.content = announcement_update.content
    if announcement_update.is_important is not None:
        announcement.is_important = announcement_update.is_important
    
    db.commit()
    db.refresh(announcement)
    
    return announcement


@router.delete("/announcements/{announcement_id}")
async def delete_announcement(
    announcement_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["teacher", "admin"]))
):
    """Delete an announcement (only by the creator or admin)"""
    
    announcement = db.query(Announcement).filter(
        Announcement.announcement_id == announcement_id
    ).first()
    
    if not announcement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Announcement not found"
        )
    
    # Verify user can delete (creator or admin)
    user_type = current_user["user_type"]
    user = current_user["user"]
    
    if user_type == "teacher":
        if announcement.posted_by_id != user.teacher_id or announcement.posted_by_type != "teacher":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only delete your own announcements"
            )
    
    db.delete(announcement)
    db.commit()
    
    return {"message": "Announcement deleted successfully"}
