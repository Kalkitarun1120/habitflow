from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models import User, Category
from app.schemas.schemas import CategoryCreate, CategoryResponse

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.get("", response_model=List[CategoryResponse])
def get_categories(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    categories = db.query(Category).filter(Category.user_id == current_user.id).all()
    # Default built-in categories if empty
    if not categories:
        default_cats = [
            Category(user_id=current_user.id, name="Health", color="#10B981", icon="heart"),
            Category(user_id=current_user.id, name="Mindset", color="#8B5CF6", icon="brain"),
            Category(user_id=current_user.id, name="Work", color="#6366F1", icon="briefcase"),
            Category(user_id=current_user.id, name="Fitness", color="#F43F5E", icon="activity"),
            Category(user_id=current_user.id, name="General", color="#06B6D4", icon="sparkles"),
        ]
        db.add_all(default_cats)
        db.commit()
        for cat in default_cats:
            db.refresh(cat)
        return [CategoryResponse.model_validate(c) for c in default_cats]

    return [CategoryResponse.model_validate(c) for c in categories]


@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(
    cat_in: CategoryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cat = Category(
        user_id=current_user.id,
        name=cat_in.name.strip(),
        color=cat_in.color or "#6366F1",
        icon=cat_in.icon or "folder"
    )
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return CategoryResponse.model_validate(cat)
