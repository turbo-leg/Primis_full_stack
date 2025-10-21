import os
from typing import List
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Simple configuration without Pydantic for now
class Settings:
    # Database
    database_url: str = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/college_prep")
    
    # Redis
    redis_url: str = os.getenv("REDIS_URL", "redis://localhost:6379")
    
    # Celery
    celery_broker_url: str = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
    celery_result_backend: str = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/0")
    
    # JWT
    secret_key: str = os.getenv("SECRET_KEY", "your-secret-key-change-this-in-production")
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # Email
    smtp_user: str = os.getenv("SMTP_USER", "")
    smtp_password: str = os.getenv("SMTP_PASSWORD", "")
    mail_from_name: str = os.getenv("MAIL_FROM_NAME", "College Prep Platform")
    smtp_port: int = int(os.getenv("SMTP_PORT", "587"))
    smtp_server: str = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    password_reset_url: str = os.getenv("PASSWORD_RESET_URL", "http://localhost:3000/reset-password")
    password_reset_token_expire_hours: int = int(os.getenv("PASSWORD_RESET_TOKEN_EXPIRE_HOURS", "24"))
    
    # File Upload
    upload_dir: str = "uploads"
    max_file_size: int = 10485760  # 10MB
    
    # QR Code
    qr_code_dir: str = "qr_codes"
    
    # Cloudinary
    cloudinary_cloud_name: str = os.getenv("CLOUDINARY_CLOUD_NAME", "")
    cloudinary_api_key: str = os.getenv("CLOUDINARY_API_KEY", "")
    cloudinary_api_secret: str = os.getenv("CLOUDINARY_API_SECRET", "")
    use_cloudinary: bool = os.getenv("USE_CLOUDINARY", "False").lower() == "true"
    
    # Development
    debug: bool = os.getenv("DEBUG", "True").lower() == "true"
    testing: bool = False
    
    # CORS
    allowed_origins: List[str] = [
        "https://yourdomain.com",
        "https://www.yourdomain.com",
    ]


settings = Settings()