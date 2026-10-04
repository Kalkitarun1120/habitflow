from datetime import date, datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models import User, Habit, HabitCompletion
from app.schemas.schemas import (
    HabitCreate, HabitUpdate, HabitResponse, HabitStreak,
    CompletionCreate, CompletionResponse, HabitHistoryDetail, HabitHistoryDay
)
from app.services.streak_service import StreakService

router = APIRouter(prefix="/habits", tags=["Habits"])


def format_habit_response(habit: Habit, db: Session, target_date: date = None) -> HabitResponse:
    if target_date is None:
        target_date = date.today()

    all_records = (
        db.query(HabitCompletion)
        .filter(HabitCompletion.habit_id == habit.id)
        .all()
    )
    c_dates = [c.completion_date for c in all_records if c.completed]
    s_dates = [c.completion_date for c in all_records if not c.completed and c.notes == "skipped"]

    is_paused_val = bool(habit.is_paused or not habit.is_active)
    is_archived_val = bool(habit.is_archived)

    streak_data = StreakService.calculate_habit_streak(
        completion_dates=c_dates,
        created_at_date=habit.created_at.date() if habit.created_at else target_date,
        reference_date=target_date,
        frequency=habit.frequency or "daily",
        skipped_dates=s_dates,
        is_paused=is_paused_val
    )

    today_record = (
        db.query(HabitCompletion)
        .filter(
            HabitCompletion.habit_id == habit.id,
            HabitCompletion.completion_date == target_date
        )
        .first()
    )
    today_completed = bool(today_record and today_record.completed)
    today_skipped = bool(today_record and not today_record.completed and today_record.notes == "skipped")
    today_val = today_record.value if today_completed else 0.0
    is_sched = StreakService.is_scheduled_on_date(habit.frequency, target_date)

    streak_obj = HabitStreak(
        current_streak=streak_data["current_streak"],
        longest_streak=streak_data["longest_streak"],
        total_completions=streak_data["total_completions"],
        completion_rate=streak_data["completion_rate"],
        completed_today=today_completed,
        skipped_today=today_skipped,
        today_value=today_val,
        is_scheduled_today=is_sched,
        is_paused=is_paused_val
    )

    res = HabitResponse.model_validate(habit)
    res.is_paused = is_paused_val
    res.is_active = not is_paused_val and not is_archived_val
    res.is_archived = is_archived_val
    res.streak = streak_obj
    return res


@router.get("", response_model=List[HabitResponse])
def get_habits(
    category: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: Optional[str] = "created_at",
    status_filter: Optional[str] = "all",  # all, active, paused, completed_today, archived
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Habit).filter(Habit.user_id == current_user.id)

    if category and category.lower() != "all":
        query = query.filter(Habit.category == category)

    if search:
        query = query.filter(Habit.name.ilike(f"%{search}%"))

    habits = query.all()
    today = date.today()
    response_list = [format_habit_response(h, db, today) for h in habits]

    if status_filter == "active":
        response_list = [h for h in response_list if not h.is_paused and not h.is_archived]
    elif status_filter == "paused":
        response_list = [h for h in response_list if h.is_paused and not h.is_archived]
    elif status_filter == "archived":
        response_list = [h for h in response_list if h.is_archived]
    elif status_filter == "completed_today":
        response_list = [h for h in response_list if h.streak and h.streak.completed_today]

    if sort_by == "name":
        response_list.sort(key=lambda x: x.name.lower())
    elif sort_by == "streak":
        response_list.sort(key=lambda x: (x.streak.current_streak if x.streak else 0), reverse=True)
    elif sort_by == "completion_rate":
        response_list.sort(key=lambda x: (x.streak.completion_rate if x.streak else 0.0), reverse=True)
    elif sort_by == "oldest":
        response_list.sort(key=lambda x: x.created_at)
    else:  # created_at descending
        response_list.sort(key=lambda x: x.created_at, reverse=True)

    return response_list


@router.post("", response_model=HabitResponse, status_code=status.HTTP_201_CREATED)
def create_habit(
    habit_in: HabitCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    habit = Habit(
        user_id=current_user.id,
        name=habit_in.name.strip(),
        description=habit_in.description.strip() if habit_in.description else None,
        category=habit_in.category or "General",
        icon=habit_in.icon or "sparkles",
        color=habit_in.color or "#10B981",
        frequency=habit_in.frequency or "daily",
        target_value=habit_in.target_value,
        target_unit=habit_in.target_unit or "times",
        reminder_time=habit_in.reminder_time,
        is_active=habit_in.is_active if not habit_in.is_paused else False,
        is_paused=habit_in.is_paused,
        is_archived=habit_in.is_archived
    )
    db.add(habit)
    db.commit()
    db.refresh(habit)
    return format_habit_response(habit, db)


@router.get("/{habit_id}", response_model=HabitResponse)
def get_habit(
    habit_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    habit = db.query(Habit).filter(Habit.id == habit_id, Habit.user_id == current_user.id).first()
    if not habit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Habit not found")
    return format_habit_response(habit, db)


@router.put("/{habit_id}", response_model=HabitResponse)
def update_habit(
    habit_id: int,
    habit_in: HabitUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    habit = db.query(Habit).filter(Habit.id == habit_id, Habit.user_id == current_user.id).first()
    if not habit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Habit not found")

    update_data = habit_in.model_dump(exclude_unset=True)
    if "is_paused" in update_data:
        habit.is_paused = bool(update_data["is_paused"])
        if "is_active" not in update_data:
            habit.is_active = not habit.is_paused
    if "is_active" in update_data:
        habit.is_active = bool(update_data["is_active"])
        if "is_paused" not in update_data:
            habit.is_paused = not habit.is_active

    for field, val in update_data.items():
        if field not in ("is_paused", "is_active"):
            setattr(habit, field, val)

    db.commit()
    db.refresh(habit)
    return format_habit_response(habit, db)


@router.post("/{habit_id}/pause", response_model=HabitResponse)
def pause_habit(
    habit_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    habit = db.query(Habit).filter(Habit.id == habit_id, Habit.user_id == current_user.id).first()
    if not habit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Habit not found")
    habit.is_paused = True
    habit.is_active = False
    db.commit()
    db.refresh(habit)
    return format_habit_response(habit, db)


@router.post("/{habit_id}/resume", response_model=HabitResponse)
def resume_habit(
    habit_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    habit = db.query(Habit).filter(Habit.id == habit_id, Habit.user_id == current_user.id).first()
    if not habit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Habit not found")
    habit.is_paused = False
    habit.is_active = True
    db.commit()
    db.refresh(habit)
    return format_habit_response(habit, db)


@router.post("/{habit_id}/duplicate", response_model=HabitResponse)
def duplicate_habit(
    habit_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    habit = db.query(Habit).filter(Habit.id == habit_id, Habit.user_id == current_user.id).first()
    if not habit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Habit not found")

    new_habit = Habit(
        user_id=current_user.id,
        name=f"{habit.name} (Copy)",
        description=habit.description,
        category=habit.category,
        icon=habit.icon,
        color=habit.color,
        frequency=habit.frequency,
        target_value=habit.target_value,
        target_unit=habit.target_unit,
        reminder_time=habit.reminder_time,
        is_active=True
    )
    db.add(new_habit)
    db.commit()
    db.refresh(new_habit)
    return format_habit_response(new_habit, db)


@router.delete("/{habit_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_habit(
    habit_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    habit = db.query(Habit).filter(Habit.id == habit_id, Habit.user_id == current_user.id).first()
    if not habit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Habit not found")

    db.delete(habit)
    db.commit()
    return None


@router.post("/{habit_id}/complete", response_model=CompletionResponse)
def complete_habit(
    habit_id: int,
    completion_in: CompletionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    habit = db.query(Habit).filter(Habit.id == habit_id, Habit.user_id == current_user.id).first()
    if not habit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Habit not found")

    target_date = completion_in.completion_date

    existing = db.query(HabitCompletion).filter(
        HabitCompletion.habit_id == habit_id,
        HabitCompletion.completion_date == target_date
    ).first()

    if existing:
        existing.completed = completion_in.completed
        existing.value = completion_in.value
        existing.notes = completion_in.notes
        db.commit()
        db.refresh(existing)
        return CompletionResponse.model_validate(existing)

    completion = HabitCompletion(
        habit_id=habit_id,
        user_id=current_user.id,
        completion_date=target_date,
        completed=completion_in.completed,
        value=completion_in.value,
        notes=completion_in.notes
    )
    db.add(completion)
    db.commit()
    db.refresh(completion)
    return CompletionResponse.model_validate(completion)


@router.post("/{habit_id}/skip", response_model=CompletionResponse)
def skip_habit(
    habit_id: int,
    skip_date: Optional[date] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    habit = db.query(Habit).filter(Habit.id == habit_id, Habit.user_id == current_user.id).first()
    if not habit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Habit not found")

    target_date = skip_date or date.today()

    existing = db.query(HabitCompletion).filter(
        HabitCompletion.habit_id == habit_id,
        HabitCompletion.completion_date == target_date
    ).first()

    if existing:
        existing.completed = False
        existing.value = 0.0
        existing.notes = "skipped"
        db.commit()
        db.refresh(existing)
        return CompletionResponse.model_validate(existing)

    completion = HabitCompletion(
        habit_id=habit_id,
        user_id=current_user.id,
        completion_date=target_date,
        completed=False,
        value=0.0,
        notes="skipped"
    )
    db.add(completion)
    db.commit()
    db.refresh(completion)
    return CompletionResponse.model_validate(completion)


@router.delete("/{habit_id}/complete")
def uncomplete_habit(
    habit_id: int,
    completion_date: Optional[date] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    habit = db.query(Habit).filter(Habit.id == habit_id, Habit.user_id == current_user.id).first()
    if not habit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Habit not found")

    target_date = completion_date or date.today()

    existing = db.query(HabitCompletion).filter(
        HabitCompletion.habit_id == habit_id,
        HabitCompletion.completion_date == target_date
    ).first()

    if existing:
        db.delete(existing)
        db.commit()

    return {"message": "Completion record removed", "date": target_date.strftime("%Y-%m-%d")}


@router.get("/{habit_id}/history", response_model=HabitHistoryDetail)
def get_habit_history_detail(
    habit_id: int,
    days: Optional[int] = Query(30, description="Range in days: 7, 30, 90, or 365"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    habit = db.query(Habit).filter(Habit.id == habit_id, Habit.user_id == current_user.id).first()
    if not habit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Habit not found")

    today = date.today()
    cutoff_date = today - timedelta(days=days) if days and days > 0 else date(2000, 1, 1)

    completions = (
        db.query(HabitCompletion)
        .filter(
            HabitCompletion.habit_id == habit_id,
            HabitCompletion.completion_date >= cutoff_date
        )
        .order_by(HabitCompletion.completion_date.desc())
        .all()
    )

    formatted_habit = format_habit_response(habit, db, today)
    c_list = [CompletionResponse.model_validate(c) for c in completions]
    completion_map = {c.completion_date: c for c in completions}

    # Generate day-by-day list for heatmap/matrix
    num_days = days or 30
    days_list: List[HabitHistoryDay] = []
    for i in range(num_days - 1, -1, -1):
        d = today - timedelta(days=i)
        is_sched = StreakService.is_scheduled_on_date(habit.frequency, d)
        rec = completion_map.get(d)
        is_completed = bool(rec and rec.completed)
        is_skipped = bool(rec and (rec.notes == "skipped" or getattr(rec, 'skipped', False)))
        val = float(rec.value) if rec and rec.value else (1.0 if is_completed else 0.0)
        notes = rec.notes if rec else None

        days_list.append(
            HabitHistoryDay(
                date=d.strftime("%Y-%m-%d"),
                is_scheduled=is_sched,
                completed=is_completed,
                skipped=is_skipped,
                value=val,
                notes=notes
            )
        )

    return HabitHistoryDetail(
        habit=formatted_habit,
        habit_id=habit.id,
        habit_name=habit.name,
        frequency=habit.frequency,
        total_completions=len([c for c in c_list if c.completed]),
        current_streak=formatted_habit.streak.current_streak if formatted_habit.streak else 0,
        longest_streak=formatted_habit.streak.longest_streak if formatted_habit.streak else 0,
        completion_rate=formatted_habit.streak.completion_rate if formatted_habit.streak else 0.0,
        created_at=habit.created_at.strftime("%Y-%m-%d") if habit.created_at else today.strftime("%Y-%m-%d"),
        completions=c_list,
        days=days_list,
        range_days=num_days
    )
