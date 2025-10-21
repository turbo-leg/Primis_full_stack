from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class UserBase(BaseModel):
    name: str
    email: EmailStr


class UserCreate(UserBase):
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(UserBase):
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class StudentCreate(UserCreate):
    phone: Optional[str] = None
    date_of_birth: Optional[datetime] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    emergency_phone: Optional[str] = None
    parent_email: EmailStr
    parent_phone: str


class StudentResponse(UserResponse):
    student_id: int
    qr_code: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[datetime] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    emergency_phone: Optional[str] = None
    parent_email: str
    parent_phone: str


class TeacherCreate(UserCreate):
    phone: Optional[str] = None
    specialization: Optional[str] = None
    bio: Optional[str] = None
    hire_date: Optional[datetime] = None


class TeacherResponse(UserResponse):
    teacher_id: int
    phone: Optional[str] = None
    specialization: Optional[str] = None
    bio: Optional[str] = None
    hire_date: Optional[datetime] = None


class AdminCreate(UserCreate):
    phone: Optional[str] = None
    role: str = "admin"
    permissions: Optional[str] = None


class AdminResponse(UserResponse):
    admin_id: int
    phone: Optional[str] = None
    role: str
    permissions: Optional[str] = None


class ParentCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str
    address: Optional[str] = None
    relationship_to_student: Optional[str] = None


class ParentResponse(BaseModel):
    parent_id: int
    name: str
    email: EmailStr
    phone: str
    address: Optional[str] = None
    relationship_to_student: Optional[str] = None
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str
    user_type: str
    user_id: int
    name: str
    email: str


class TokenData(BaseModel):
    user_id: Optional[int] = None
    user_type: Optional[str] = None
    email: Optional[str] = None


class ChangePassword(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str


class Message(BaseModel):
    """Generic message response"""
    message: str
    success: bool = True