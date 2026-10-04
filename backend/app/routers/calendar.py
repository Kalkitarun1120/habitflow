import calendar
from datetime import date, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models import User, Habit, HabitCompletion
from app.schemas.schemas import (
    CalendarDayData, CalendarDayDetail, CalendarDayHabitStatus, YearCalendarResponse,
    WeekCalendarResponse, HabitWeekStatus, HabitWeekDayStatus
)
from app.services.streak_service import StreakService

router = APIRouter(prefix="/calendar", tags=["Calendar"])


@router.get("/week", response_model=WeekCalendarResponse)
def get_week_calendar_data(
    target_date: Optional[date] = Query(None, description="Any date within the target week"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    today = date.today()
    ref_date = target_date or today

    # Sunday start
    day_idx = (ref_date.weekday() + 1) % 7
    week_start = ref_date - timedelta(days=day_idx)
    week_end = week_start + timedelta(days=6)
    week_dates = [week_start + timedelta(days=i) for i in range(7)]
    day_labels = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"]

    habits = (
        db.query(Habit)
        .filter(Habit.user_id == current_user.id)
        .order_by(Habit.created_at.asc())
        .all()
    )

    completions = (
        db.query(HabitCompletion)
        .filter(
            HabitCompletion.user_id == current_user.id,
            HabitCompletion.completion_date >= week_start,
            HabitCompletion.completion_date <= week_end
        )
        .all()
    )

    # Key: (habit_id, date_str)
    comp_map = {}
    for c in completions:
        d_str = c.completion_date.strftime("%Y-%m-%d")
        comp_map[(c.habit_id, d_str)] = c

    # Also fetch all historical completions per habit for accurate streaks
    all_habit_completions = (
        db.query(HabitCompletion)
        .filter(HabitCompletion.user_id == current_user.id)
        .all()
    )
    habit_all_c_dates = {}
    habit_all_s_dates = {}
    for c in all_habit_completions:
        if c.completed:
            habit_all_c_dates.setdefault(c.habit_id, []).append(c.completion_date)
        elif c.notes == "skipped":
            habit_all_s_dates.setdefault(c.habit_id, []).append(c.completion_date)

    habit_statuses: List[HabitWeekStatus] = []
    for h in habits:
        c_dates = habit_all_c_dates.get(h.id, [])
        s_dates = habit_all_s_dates.get(h.id, [])
        is_paused_val = bool(h.is_paused or not h.is_active)
        streak_calc = StreakService.calculate_habit_streak(
            completion_dates=c_dates,
            created_at_date=h.created_at.date() if h.created_at else today,
            reference_date=today,
            frequency=h.frequency or "daily",
            skipped_dates=s_dates,
            is_paused=is_paused_val
        )

        today_rec = comp_map.get((h.id, today.strftime("%Y-%m-%d")))
        completed_today = bool(today_rec and today_rec.completed)
        skipped_today = bool(today_rec and not today_rec.completed and today_rec.notes == "skipped")
        is_sched_today = StreakService.is_scheduled_on_date(h.frequency, today)

        days_status: List[HabitWeekDayStatus] = []
        for i, d in enumerate(week_dates):
            d_str = d.strftime("%Y-%m-%d")
            rec = comp_map.get((h.id, d_str))
            is_sched = StreakService.is_scheduled_on_date(h.frequency, d)
            c_val = rec.value if (rec and rec.completed) else 0.0

            days_status.append(
                HabitWeekDayStatus(
                    date=d_str,
                    day_name=day_labels[i],
                    day_number=d.day,
                    is_today=(d == today),
                    is_future=(d > today),
                    is_scheduled=is_sched,
                    completed=bool(rec and rec.completed),
                    skipped=bool(rec and not rec.completed and rec.notes == "skipped"),
                    value=c_val
                )
            )

        habit_statuses.append(
            HabitWeekStatus(
                habit_id=h.id,
                name=h.name,
                category=h.category or "General",
                color=h.color or "#10B981",
                icon=h.icon or "sparkles",
                frequency=h.frequency or "daily",
                current_streak=streak_calc["current_streak"],
                longest_streak=streak_calc["longest_streak"],
                completion_rate=streak_calc["completion_rate"],
                is_paused=is_paused_val,
                is_scheduled_today=is_sched_today,
                completed_today=completed_today,
                skipped_today=skipped_today,
                days=days_status
            )
        )

    return WeekCalendarResponse(
        start_date=week_start.strftime("%Y-%m-%d"),
        end_date=week_end.strftime("%Y-%m-%d"),
        habits=habit_statuses
    )


@router.get("/year", response_model=YearCalendarResponse)
def get_year_calendar_data(
    year: Optional[int] = Query(None, description="Calendar year or 0 for past 1 year"),
    habit_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    today = date.today()
    if year is None or year == 0 or year == today.year:
        req_year = today.year
        # If year == 0, past 365 days
        if year == 0:
            start_date = today - timedelta(days=364)
            end_date = today
        else:
            start_date = date(req_year, 1, 1)
            end_date = date(req_year, 12, 31)
    else:
        req_year = year
        start_date = date(req_year, 1, 1)
        end_date = date(req_year, 12, 31)

    query = db.query(HabitCompletion).filter(
        HabitCompletion.user_id == current_user.id,
        HabitCompletion.completion_date >= start_date,
        HabitCompletion.completion_date <= end_date,
        HabitCompletion.completed == True
    )

    if habit_id is not None:
        query = query.filter(HabitCompletion.habit_id == habit_id)

    completions = query.all()

    daily_counts = {}
    for c in completions:
        d_str = c.completion_date.strftime("%Y-%m-%d")
        daily_counts[d_str] = daily_counts.get(d_str, 0) + 1

    unique_dates = sorted(list(set(c.completion_date for c in completions)))
    total_active_days = len(unique_dates)

    max_streak = 0
    current_s = 0
    for i in range(len(unique_dates)):
        if i == 0:
            current_s = 1
        elif (unique_dates[i] - unique_dates[i-1]).days == 1:
            current_s += 1
        else:
            current_s = 1
        if current_s > max_streak:
            max_streak = current_s

    return YearCalendarResponse(
        year=req_year,
        total_checkins=len(completions),
        total_active_days=total_active_days,
        max_streak=max_streak,
        daily_counts=daily_counts
    )


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
