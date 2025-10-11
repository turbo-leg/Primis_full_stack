from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import Union

from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token, verify_token
from app.core.config import settings
from app.models.models import Student, Teacher, Admin, Parent
from app.api.schemas import (
    UserLogin, Token, StudentCreate, TeacherCreate, AdminCreate, ParentCreate,
    StudentResponse, TeacherResponse, AdminResponse, ParentResponse
)
from app.utils.qr_generator import generate_qr_code

router = APIRouter()
security = HTTPBearer()


def authenticate_user(db: Session, email: str, password: str, user_type: str) -> Union[Student, Teacher, Admin, None]:
    """Authenticate user based on email, password and user type"""
    user = None
    
    if user_type == "student":
        user = db.query(Student).filter(Student.email == email).first()
    elif user_type == "teacher":
        user = db.query(Teacher).filter(Teacher.email == email).first()
    elif user_type == "admin":
        user = db.query(Admin).filter(Admin.email == email).first()
    
    if not user:
        return None
    if not verify_password(password, str(user.password)):
        return None
    return user


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Get current authenticated user"""
    token = credentials.credentials
    payload = verify_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("sub")
    user_type = payload.get("user_type")
    
    if user_id is None or user_type is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )
    
    # Get user from database based on type
    user = None
    if user_type == "student":
        user = db.query(Student).filter(Student.student_id == user_id).first()
    elif user_type == "teacher":
        user = db.query(Teacher).filter(Teacher.teacher_id == user_id).first()
    elif user_type == "admin":
        user = db.query(Admin).filter(Admin.admin_id == user_id).first()
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    return {"user": user, "user_type": user_type}


def require_role(allowed_roles: list):
    """Decorator to require specific roles"""
    def role_checker(current_user=Depends(get_current_user)):
        if current_user["user_type"] not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
        return current_user
    return role_checker


@router.post("/login", response_model=Token)
async def login(user_credentials: UserLogin, db: Session = Depends(get_db)):
    """Login endpoint for all user types"""
    # Try to authenticate as different user types
    for user_type in ["student", "teacher", "admin"]:
        user = authenticate_user(db, user_credentials.email, user_credentials.password, user_type)
        if user:
            # Create access token
            access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
            
            # Get user ID based on type
            user_id = getattr(user, f"{user_type}_id")
            
            access_token = create_access_token(
                data={"sub": str(user_id), "user_type": user_type, "email": user.email},
                expires_delta=access_token_expires
            )
            
            return {
                "access_token": access_token,
                "token_type": "bearer",
                "user_type": user_type,
                "user_id": user_id,
                "name": user.name,
                "email": user.email
            }
    
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Incorrect email or password",
        headers={"WWW-Authenticate": "Bearer"},
    )


@router.post("/register/student", response_model=StudentResponse)
async def register_student(student_data: StudentCreate, db: Session = Depends(get_db)):
    """Register a new student"""
    try:
        print(f"Received registration data: {student_data.dict()}")
    except Exception as e:
        print(f"Error parsing student data: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid data format: {str(e)}"
        )
    
    # Check if email already exists
    existing_user = db.query(Student).filter(Student.email == student_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new student
    hashed_password = get_password_hash(student_data.password)
    db_student = Student(
        name=student_data.name,
        email=student_data.email,
        password=hashed_password,
        phone=student_data.phone,
        date_of_birth=student_data.date_of_birth,
        address=student_data.address,
        emergency_contact=student_data.emergency_contact,
        emergency_phone=student_data.emergency_phone,
        parent_email=student_data.parent_email,
        parent_phone=student_data.parent_phone
    )
    
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    
    # Generate QR code for the student
    qr_code_url = generate_qr_code(f"student_{db_student.student_id}")
    setattr(db_student, 'qr_code', qr_code_url)
    db.commit()
    db.refresh(db_student)
    
    return db_student


@router.post("/register/teacher", response_model=TeacherResponse)
async def register_teacher(
    teacher_data: TeacherCreate, 
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["admin"]))
):
    """Register a new teacher (admin only)"""
    # Check if email already exists
    existing_user = db.query(Teacher).filter(Teacher.email == teacher_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new teacher
    hashed_password = get_password_hash(teacher_data.password)
    db_teacher = Teacher(
        name=teacher_data.name,
        email=teacher_data.email,
        password=hashed_password,
        phone=teacher_data.phone,
        specialization=teacher_data.specialization,
        bio=teacher_data.bio,
        hire_date=teacher_data.hire_date
    )
    
    db.add(db_teacher)
    db.commit()
    db.refresh(db_teacher)
    
    return db_teacher


@router.post("/register/admin", response_model=AdminResponse)
async def register_admin(
    admin_data: AdminCreate, 
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["admin"]))
):
    """Register a new admin (admin only)"""
    # Check if email already exists
    existing_user = db.query(Admin).filter(Admin.email == admin_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new admin
    hashed_password = get_password_hash(admin_data.password)
    db_admin = Admin(
        name=admin_data.name,
        email=admin_data.email,
        password=hashed_password,
        phone=admin_data.phone,
        role=admin_data.role,
        permissions=admin_data.permissions
    )
    
    db.add(db_admin)
    db.commit()
    db.refresh(db_admin)
    
    return db_admin


@router.post("/register/parent", response_model=ParentResponse)
async def register_parent(
    parent_data: ParentCreate, 
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["admin", "teacher"]))
):
    """Register a new parent (admin/teacher only)"""
    # Check if email already exists
    existing_parent = db.query(Parent).filter(Parent.email == parent_data.email).first()
    if existing_parent:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new parent
    db_parent = Parent(
        name=parent_data.name,
        email=parent_data.email,
        phone=parent_data.phone,
        address=parent_data.address,
        relationship_to_student=parent_data.relationship_to_student
    )
    
    db.add(db_parent)
    db.commit()
    db.refresh(db_parent)
    
    return db_parent


@router.get("/me")
async def get_current_user_info(current_user=Depends(get_current_user)):
    """Get current user information"""
    user = current_user["user"]
    user_type = current_user["user_type"]
    
    return {
        "user_type": user_type,
        "user": user
    }


@router.post("/logout")
async def logout():
    """Logout endpoint (client should discard token)"""
    return {"message": "Successfully logged out"}