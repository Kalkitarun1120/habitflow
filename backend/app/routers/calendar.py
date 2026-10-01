import calendar
from datetime import date, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models import User, Habit, HabitCompletion
from app.schemas.schemas import CalendarDayData, CalendarDayDetail, CalendarDayHabitStatus
from app.services.streak_service import StreakService

router = APIRouter(prefix="/calendar", tags=["Calendar"])


@router.get("", response_model=List[CalendarDayData])
def get_calendar_data(
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    today = date.today()
    req_year = year or today.year
    req_month = month or today.month

    # Calculate month date range including padded days from previous/next month for full 7xN grid
    cal = calendar.Calendar(firstweekday=0)  # Monday start
    month_days = cal.monthdatescalendar(req_year, req_month)

    active_habits = (
        db.query(Habit)
        .filter(Habit.user_id == current_user.id, Habit.is_active == True)
        .all()
    )
    active_habits_count = len(active_habits)

    # Fetch all completions for the user for the full grid date range
    start_date = month_days[0][0]
    end_date = month_days[-1][-1]

    completions = (
        db.query(HabitCompletion)
        .filter(
            HabitCompletion.user_id == current_user.id,
            HabitCompletion.completion_date >= start_date,
            HabitCompletion.completion_date <= end_date
        )
        .all()
    )

    date_completions_map = {}
    for c in completions:
        d_str = c.completion_date.strftime("%Y-%m-%d")
        if d_str not in date_completions_map:
            date_completions_map[d_str] = {"completed": 0, "skipped": 0}
        if c.completed:
            date_completions_map[d_str]["completed"] += 1
        elif c.notes == "skipped":
            date_completions_map[d_str]["skipped"] += 1

    result: List[CalendarDayData] = []
    for week in month_days:
        for d in week:
            d_str = d.strftime("%Y-%m-%d")
            record = date_completions_map.get(d_str, {"completed": 0, "skipped": 0})
            completed_count = record["completed"]
            skipped_count = record["skipped"]

            is_current_m = (d.year == req_year and d.month == req_month)
            is_tod = (d == today)
            is_fut = (d > today)

            # Check how many habits were actually scheduled on day d
            scheduled_count = sum(1 for h in active_habits if StreakService.is_scheduled_on_date(h.frequency, d))
            effective_total = scheduled_count if scheduled_count > 0 else active_habits_count

            rate = (
                round((completed_count / effective_total) * 100.0, 1)
                if effective_total > 0
                else 0.0
            )

            # Determine status
            if is_fut:
                status_str = "none"
            elif effective_total == 0:
                status_str = "none"
            elif completed_count >= effective_total:
                status_str = "complete"
            elif completed_count > 0 or skipped_count > 0:
                status_str = "partial"
            else:
                status_str = "missed"

            result.append(
                CalendarDayData(
                    date=d_str,
                    is_current_month=is_current_m,
                    is_today=is_tod,
                    is_future=is_fut,
                    completed_count=completed_count,
                    total_habits=effective_total,
                    completion_rate=rate,
                    status=status_str
                )
            )

    return result


@router.get("/day", response_model=CalendarDayDetail)
def get_calendar_day_detail(
    date_str: str = Query(..., alias="date", description="Date formatted as YYYY-MM-DD"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        target_date = date.fromisoformat(date_str)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid date format. Use YYYY-MM-DD.")

    habits = (
        db.query(Habit)
        .filter(Habit.user_id == current_user.id)
        .all()
    )

    completions = (
        db.query(HabitCompletion)
        .filter(
            HabitCompletion.user_id == current_user.id,
            HabitCompletion.completion_date == target_date
        )
        .all()
    )
    completion_by_habit = {c.habit_id: c for c in completions}

    habit_statuses: List[CalendarDayHabitStatus] = []
    completed_count = 0
    skipped_count = 0
    total_scheduled = 0

    for h in habits:
        is_sched = StreakService.is_scheduled_on_date(h.frequency, target_date)
        if is_sched:
            total_scheduled += 1

        c = completion_by_habit.get(h.id)
        is_completed = bool(c and c.completed)
        is_skipped = bool(c and (c.notes == "skipped" or getattr(c, 'skipped', False)))

        if is_completed:
            c_status = "completed"
            completed_count += 1
        elif is_skipped:
            c_status = "skipped"
            skipped_count += 1
        else:
            c_status = "incomplete"

        habit_statuses.append(
            CalendarDayHabitStatus(
                habit_id=h.id,
                habit_name=h.name,
                name=h.name,
                category=h.category or "General",
                icon=h.icon or "sparkles",
                color=h.color or "#10B981",
                is_scheduled=is_sched,
                completed=is_completed,
                skipped=is_skipped,
                value=float(c.value) if c and c.value else 0.0,
                target_value=float(h.target_value) if h.target_value else 1.0,
                target_unit=h.target_unit or "times",
                status=c_status
            )
        )

    rate = round((completed_count / total_scheduled * 100.0), 1) if total_scheduled > 0 else 0.0

    return CalendarDayDetail(
        date=date_str,
        completed_count=completed_count,
        total_scheduled=total_scheduled,
        skipped_count=skipped_count,
        completion_rate=rate,
        habits=habit_statuses
    )
