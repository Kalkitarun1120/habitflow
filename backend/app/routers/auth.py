import io
import csv
import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query, Response
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.core.dependencies import get_current_user
from app.models import User, Habit, HabitCompletion, Category
from app.schemas.schemas import (
    UserRegister, UserLogin, UserResponse, Token,
    PasswordChange, ProfileUpdate
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    email_clean = user_in.email.lower().strip()
    existing_user = db.query(User).filter(User.email == email_clean).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists."
        )

    user = User(
        name=user_in.name.strip(),
        email=email_clean,
        password_hash=hash_password(user_in.password),
        timezone=user_in.timezone or "UTC"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(subject=user.id)
    return Token(access_token=token, token_type="bearer", user=UserResponse.model_validate(user))


@router.post("/login", response_model=Token)
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    email_clean = user_in.email.lower().strip()
    user = db.query(User).filter(User.email == email_clean).first()
    if not user or not verify_password(user_in.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )

    token = create_access_token(subject=user.id)
    return Token(access_token=token, token_type="bearer", user=UserResponse.model_validate(user))


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/profile", response_model=UserResponse)
def update_profile(
    profile_in: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if profile_in.name is not None:
        current_user.name = profile_in.name.strip()
    if profile_in.timezone is not None:
        current_user.timezone = profile_in.timezone.strip()
    if profile_in.avatar is not None:
        current_user.avatar = profile_in.avatar.strip()
    
    db.commit()
    db.refresh(current_user)
    return current_user


@router.put("/password")
def change_password(
    pwd_in: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not verify_password(pwd_in.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect."
        )

    current_user.password_hash = hash_password(pwd_in.new_password)
    db.commit()
    return {"message": "Password changed successfully"}


@router.get("/export")
def export_user_data(
    format_type: str = Query("json", alias="format", regex="^(json|csv)$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    habits = db.query(Habit).filter(Habit.user_id == current_user.id).all()
    completions = db.query(HabitCompletion).filter(HabitCompletion.user_id == current_user.id).all()
    categories = db.query(Category).filter(Category.user_id == current_user.id).all()

    if format_type == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Record Type", "Habit Name", "Category", "Date", "Status", "Target Value", "Target Unit", "Notes"])
        
        for h in habits:
            writer.writerow(["Habit", h.name, h.category, h.created_at.strftime("%Y-%m-%d"), "Active" if h.is_active else "Paused", h.target_value, h.target_unit, h.description or ""])

        for c in completions:
            h = next((h for h in habits if h.id == c.habit_id), None)
            h_name = h.name if h else f"Habit #{c.habit_id}"
            cat_name = h.category if h else ""
            status_label = "Completed" if c.completed else ("Skipped" if c.notes == "skipped" else "Incomplete")
            writer.writerow(["Completion", h_name, cat_name, c.completion_date.strftime("%Y-%m-%d"), status_label, c.value, h.target_unit if h else "", c.notes or ""])

        return Response(
            content=output.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=habitflow_export_{datetime.now().strftime('%Y%m%d')}.csv"}
        )

    # JSON export
    data = {
        "user": {
            "name": current_user.name,
            "email": current_user.email,
            "timezone": current_user.timezone,
            "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
        },
        "categories": [
            {"name": cat.name, "color": cat.color, "icon": cat.icon}
            for cat in categories
        ],
        "habits": [
            {
                "id": h.id,
                "name": h.name,
                "description": h.description,
                "category": h.category,
                "icon": h.icon,
                "color": h.color,
                "frequency": h.frequency,
                "target_value": h.target_value,
                "target_unit": h.target_unit,
                "reminder_time": h.reminder_time,
                "is_active": h.is_active,
                "created_at": h.created_at.isoformat() if h.created_at else None
            }
            for h in habits
        ],
        "completions": [
            {
                "habit_id": c.habit_id,
                "completion_date": c.completion_date.isoformat(),
                "completed": c.completed,
                "value": c.value,
                "notes": c.notes
            }
            for c in completions
        ]
    }

    return Response(
        content=json.dumps(data, indent=2),
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename=habitflow_export_{datetime.now().strftime('%Y%m%d')}.json"}
    )


@router.delete("/account", status_code=status.HTTP_204_NO_CONTENT)
def delete_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db.delete(current_user)
    db.commit()
    return None


@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    return {"message": "Successfully logged out"}
