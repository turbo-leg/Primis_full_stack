from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.auth import require_role

router = APIRouter()


@router.get("/payments")
async def get_payments(
    current_user=Depends(require_role(["admin", "teacher"])),
    db: Session = Depends(get_db)
):
    """Get payments - placeholder endpoint"""
    return {"message": "Payments endpoint - To be implemented"}
