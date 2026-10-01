from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models import User
from app.schemas.schemas import StatisticsResponse
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/statistics", tags=["Statistics"])


@router.get("", response_model=StatisticsResponse)
def get_statistics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return AnalyticsService.get_user_statistics(db, current_user.id)
