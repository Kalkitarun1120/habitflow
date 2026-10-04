from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models import User
from app.schemas.schemas import StatisticsResponse
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/statistics", tags=["Statistics"])


@router.get("", response_model=StatisticsResponse)
def get_statistics(
    range: str = Query("30d", description="Time range: 7d, 30d, 90d, all"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    range_map = {"7d": 7, "30d": 30, "90d": 90, "all": 0}
    days = range_map.get(range.lower().strip(), 30)
    return AnalyticsService.get_user_statistics(db, current_user.id, range_days=days)

