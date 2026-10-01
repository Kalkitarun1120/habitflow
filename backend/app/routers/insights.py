from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models import User
from app.schemas.schemas import InsightItem
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/insights", tags=["Insights"])


@router.get("", response_model=List[InsightItem])
def get_insights(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return AnalyticsService.generate_smart_insights(db, current_user.id)
