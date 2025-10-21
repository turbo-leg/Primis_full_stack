"""
Cloudinary integration helper
Handles file uploads to Cloudinary cloud storage
"""

import cloudinary
import cloudinary.uploader
import cloudinary.api
from app.core.config import settings
from typing import Optional, BinaryIO
import os
from io import BytesIO


def init_cloudinary():
    """Initialize Cloudinary configuration"""
    if settings.use_cloudinary:
        cloudinary.config(
            cloud_name=settings.cloudinary_cloud_name,
            api_key=settings.cloudinary_api_key,
            api_secret=settings.cloudinary_api_secret,
            secure=True
        )


def upload_file(
    file_content: bytes | BinaryIO,
    folder: str,
    public_id: Optional[str] = None,
    resource_type: str = "auto"
) -> dict:
    """
    Upload a file to Cloudinary
    
    Args:
        file_content: File content as bytes or file-like object
        folder: Cloudinary folder path (e.g., 'qr_codes', 'course_materials')
        public_id: Optional custom public ID for the file
        resource_type: Type of resource ('image', 'video', 'raw', 'auto')
    
    Returns:
        dict: Cloudinary response with 'secure_url', 'public_id', etc.
    """
    init_cloudinary()
    
    upload_params = {
        "folder": folder,
        "resource_type": resource_type,
        "use_filename": True,
        "unique_filename": True,
    }
    
    if public_id:
        upload_params["public_id"] = public_id
    
    result = cloudinary.uploader.upload(
        file_content,
        **upload_params
    )
    
    return result


def delete_file(public_id: str, resource_type: str = "image") -> dict:
    """
    Delete a file from Cloudinary
    
    Args:
        public_id: The public ID of the file to delete
        resource_type: Type of resource ('image', 'video', 'raw')
    
    Returns:
        dict: Cloudinary response
    """
    init_cloudinary()
    
    result = cloudinary.uploader.destroy(
        public_id,
        resource_type=resource_type
    )
    
    return result


def get_file_info(public_id: str, resource_type: str = "image") -> dict:
    """
    Get information about a file from Cloudinary
    
    Args:
        public_id: The public ID of the file
        resource_type: Type of resource ('image', 'video', 'raw')
    
    Returns:
        dict: File information
    """
    init_cloudinary()
    
    result = cloudinary.api.resource(
        public_id,
        resource_type=resource_type
    )
    
    return result


def generate_upload_url(
    folder: str,
    allowed_formats: Optional[list] = None,
    max_file_size: Optional[int] = None
) -> dict:
    """
    Generate a signed upload URL for direct client-side uploads
    
    Args:
        folder: Cloudinary folder path
        allowed_formats: List of allowed file formats (e.g., ['jpg', 'png', 'pdf'])
        max_file_size: Maximum file size in bytes
    
    Returns:
        dict: Upload credentials and URL
    """
    init_cloudinary()
    
    upload_params = {
        "folder": folder,
        "use_filename": True,
        "unique_filename": True,
    }
    
    if allowed_formats:
        upload_params["allowed_formats"] = allowed_formats
    
    if max_file_size:
        upload_params["max_file_size"] = max_file_size
    
    # Generate signature for secure uploads
    timestamp = cloudinary.utils.now()
    signature = cloudinary.utils.api_sign_request(upload_params, settings.cloudinary_api_secret)
    
    return {
        "timestamp": timestamp,
        "signature": signature,
        "api_key": settings.cloudinary_api_key,
        "cloud_name": settings.cloudinary_cloud_name,
        "upload_url": f"https://api.cloudinary.com/v1_1/{settings.cloudinary_cloud_name}/auto/upload",
        **upload_params
    }
