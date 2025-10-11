from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.core.database import engine, Base
from app.core.security import verify_token
import os

# Import models to ensure they are registered with SQLAlchemy
from app.models import models

# Initialize settings (imported from config)

# Create upload directories
os.makedirs(settings.upload_dir, exist_ok=True)
os.makedirs(settings.qr_code_dir, exist_ok=True)

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="College Prep Platform API",
    description="A comprehensive college preparation platform API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Security
security = HTTPBearer()


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current authenticated user"""
    token = credentials.credentials
    payload = verify_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload


@app.get("/")
async def root():
    return {"message": "College Prep Platform API", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": "2024-01-01T00:00:00Z"}


# Import and include routers
from app.api import auth, courses, attendance, admin, students, teachers, parents, materials

app.include_router(auth.router, prefix="/api/v1/auth", tags=["authentication"])
app.include_router(courses.router, prefix="/api/v1/courses", tags=["courses"])
app.include_router(attendance.router, prefix="/api/v1/attendance", tags=["attendance"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["admin"])
app.include_router(students.router, prefix="/api/v1/students", tags=["students"])
app.include_router(teachers.router, prefix="/api/v1/teachers", tags=["teachers"])
app.include_router(parents.router, prefix="/api/v1/parents", tags=["parents"])
app.include_router(materials.router, prefix="/api/v1", tags=["materials"])

# Serve uploaded files
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")