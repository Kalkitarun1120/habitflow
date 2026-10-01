from datetime import date, datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models import User, Habit, HabitCompletion
from app.schemas.schemas import DashboardOverview
from app.routers.habits import format_habit_response
from app.services.streak_service import StreakService

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("", response_model=DashboardOverview)
@router.get("/overview", response_model=DashboardOverview)
def get_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    today = date.today()

    # Time-based personalized greeting
    hour = datetime.now().hour
    if hour < 12:
        greeting = f"Good morning, {current_user.name}"
    elif hour < 18:
        greeting = f"Good afternoon, {current_user.name}"
    else:
        greeting = f"Good evening, {current_user.name}"

    # Active habits
    active_habits = (
        db.query(Habit)
        .filter(Habit.user_id == current_user.id, Habit.is_active == True)
        .all()
    )
    total_habits_count = len(active_habits)

    formatted_habits = [format_habit_response(h, db, today) for h in active_habits]
    
    # Calculate scheduled today and completed today
    scheduled_today = [h for h in formatted_habits if h.streak and h.streak.is_scheduled_today]
    completed_today_count = sum(1 for h in scheduled_today if h.streak and h.streak.completed_today)
    total_scheduled_count = len(scheduled_today) if scheduled_today else total_habits_count
    remaining_today = max(0, total_scheduled_count - completed_today_count)

    progress_percent = (
        round((completed_today_count / total_scheduled_count) * 100.0, 1)
        if total_scheduled_count > 0
        else 0.0
    )

    # All user completions for global streak calculation
    all_completions = (
        db.query(HabitCompletion)
        .filter(HabitCompletion.user_id == current_user.id, HabitCompletion.completed == True)
        .all()
    )
    all_dates = [c.completion_date for c in all_completions]
    streaks = StreakService.calculate_overall_user_streaks(all_dates, today)

    # Overall completion rate last 30 days
    thirty_days_ago = today - timedelta(days=29)
    recent_completions = [c for c in all_completions if c.completion_date >= thirty_days_ago]
    total_expected = total_habits_count * 30
    overall_rate = (
        round((len(recent_completions) / total_expected) * 100.0, 1)
        if total_expected > 0
        else 0.0
    )

    return DashboardOverview(
        greeting=greeting,
        total_habits=total_habits_count,
        completed_today=completed_today_count,
        today_progress_percent=progress_percent,
        current_streak=streaks["current_streak"],
        longest_streak=streaks["longest_streak"],
        overall_completion_rate=overall_rate,
        remaining_today=remaining_today,
        habits_today=formatted_habits,
    )
