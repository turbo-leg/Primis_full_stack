import os
from typing import List

# Simple configuration without Pydantic for now
class Settings:
    # Database
    database_url: str = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/college_prep")
    
    # Redis
    redis_url: str = os.getenv("REDIS_URL", "redis://localhost:6379")
    
    # JWT
    secret_key: str = os.getenv("SECRET_KEY", "your-secret-key-change-this-in-production")
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # Email
    mail_username: str = os.getenv("MAIL_USERNAME", "")
    mail_password: str = os.getenv("MAIL_PASSWORD", "")
    mail_from: str = os.getenv("MAIL_FROM", "")
    mail_port: int = int(os.getenv("MAIL_PORT", "587"))
    mail_server: str = os.getenv("MAIL_SERVER", "smtp.gmail.com")
    mail_starttls: bool = True
    mail_ssl_tls: bool = False
    
    # File Upload
    upload_dir: str = "uploads"
    max_file_size: int = 10485760  # 10MB
    
    # QR Code
    qr_code_dir: str = "qr_codes"
    
    # Development
    debug: bool = os.getenv("DEBUG", "True").lower() == "true"
    testing: bool = False
    
    # CORS
    allowed_origins: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://frontend:3000",
    ]


settings = Settings()