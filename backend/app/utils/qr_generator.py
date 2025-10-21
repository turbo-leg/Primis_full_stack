import qrcode
import os
from io import BytesIO
from PIL import Image
from app.core.config import settings
from app.utils.cloudinary_helper import upload_file


def generate_qr_code(data: str, filename: str = None) -> str:
    """
    Generate QR code for given data and save it to Cloudinary or local storage
    Returns the file path/URL of the generated QR code
    """
    # Create QR code instance
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    
    # Add data to QR code
    qr.add_data(data)
    qr.make(fit=True)
    
    # Create QR code image
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Generate filename if not provided
    if filename is None:
        filename = f"qr_{data.replace('_', '')}.png"
    
    # Upload to Cloudinary if enabled
    if settings.use_cloudinary:
        # Convert PIL Image to bytes
        buffer = BytesIO()
        img.save(buffer, format='PNG')
        buffer.seek(0)
        
        # Upload to Cloudinary
        result = upload_file(
            file_content=buffer.getvalue(),
            folder="qr_codes",
            public_id=filename.replace('.png', ''),
            resource_type="image"
        )
        
        return result['secure_url']
    else:
        # Save to local filesystem (fallback for development)
        os.makedirs(settings.qr_code_dir, exist_ok=True)
        file_path = os.path.join(settings.qr_code_dir, filename)
        img.save(file_path)
        
        # Return relative path
        return f"/{settings.qr_code_dir}/{filename}"


def verify_qr_code(qr_data: str, expected_pattern: str = "student_") -> dict:
    """
    Verify QR code data and extract information
    Returns dict with verification status and extracted data
    """
    try:
        if qr_data.startswith(expected_pattern):
            # Extract student ID or other identifier
            identifier = qr_data.replace(expected_pattern, "")
            return {
                "valid": True,
                "type": expected_pattern.rstrip("_"),
                "identifier": identifier
            }
        else:
            return {
                "valid": False,
                "error": "Invalid QR code format"
            }
    except Exception as e:
        return {
            "valid": False,
            "error": str(e)
        }


def generate_attendance_qr(course_id: int, class_date: str) -> str:
    """
    Generate QR code for attendance checking
    Format: attendance_courseId_date
    """
    data = f"attendance_{course_id}_{class_date}"
    filename = f"attendance_{course_id}_{class_date.replace('-', '')}.png"
    return generate_qr_code(data, filename)