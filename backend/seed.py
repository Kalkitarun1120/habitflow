import sys
import os
from datetime import date, timedelta
import random

# Add parent directory to sys.path so app modules can be imported
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.core.database import SessionLocal, Base, engine
from app.core.security import hash_password
from app.models import User, Category, Habit, HabitCompletion
from app.services.streak_service import StreakService


def seed_database():
    print("Recreating database tables...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        demo_email = "demo@example.com"

        # Create demo user
        demo_user = User(
            name="Alex Morgan",
            email=demo_email,
            password_hash=hash_password("DemoPassword123!"),
            avatar="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80",
            timezone="UTC"
        )
        db.add(demo_user)
        db.commit()
        db.refresh(demo_user)
        print(f"Created demo user: {demo_user.email} (ID: {demo_user.id})")

        # Create categories
        categories_data = [
            {"name": "Health", "color": "#10B981", "icon": "heart"},
            {"name": "Mindset", "color": "#8B5CF6", "icon": "brain"},
            {"name": "Work", "color": "#6366F1", "icon": "briefcase"},
            {"name": "Fitness", "color": "#F43F5E", "icon": "activity"},
            {"name": "General", "color": "#06B6D4", "icon": "sparkles"},
        ]
        for cat_info in categories_data:
            c = Category(
                user_id=demo_user.id,
                name=cat_info["name"],
                color=cat_info["color"],
                icon=cat_info["icon"]
            )
            db.add(c)
        db.commit()

        today = date.today()
        habits_data = [
            {
                "name": "Exercise",
                "description": "30 minutes of cardio or strength training",
                "category": "Fitness",
                "icon": "activity",
                "color": "#F43F5E",
                "frequency": "mon,wed,fri",
                "target_value": 30.0,
                "target_unit": "minutes",
                "reminder_time": "07:30",
                "completion_prob": 0.88,
                "is_active": True,
                "is_paused": False,
                "is_archived": False,
            },
            {
                "name": "Reading",
                "description": "Read at least 20 pages of non-fiction book",
                "category": "Mindset",
                "icon": "book-open",
                "color": "#8B5CF6",
                "frequency": "daily",
                "target_value": 20.0,
                "target_unit": "pages",
                "reminder_time": "21:00",
                "completion_prob": 0.65,
                "is_active": True,
                "is_paused": False,
                "is_archived": False,
                "simulate_recent_slump": True,  # Missed 3 of last 5 days
            },
            {
                "name": "Drink Water",
                "description": "Stay hydrated throughout the day (8 glasses)",
                "category": "Health",
                "icon": "droplet",
                "color": "#06B6D4",
                "frequency": "daily",
                "target_value": 8.0,
                "target_unit": "glasses",
                "reminder_time": "09:00",
                "completion_prob": 0.94,
                "is_active": True,
                "is_paused": False,
                "is_archived": False,
            },
            {
                "name": "Coding",
                "description": "Focus time building side projects or solving problems",
                "category": "Work",
                "icon": "code",
                "color": "#6366F1",
                "frequency": "weekdays",
                "target_value": 2.0,
                "target_unit": "hours",
                "reminder_time": "14:00",
                "completion_prob": 0.85,
                "is_active": True,
                "is_paused": False,
                "is_archived": False,
            },
            {
                "name": "Meditation",
                "description": "Mindfulness & deep breathing exercises",
                "category": "Mindset",
                "icon": "smile",
                "color": "#10B981",
                "frequency": "daily",
                "target_value": 15.0,
                "target_unit": "minutes",
                "reminder_time": "08:00",
                "completion_prob": 0.78,
                "is_active": True,
                "is_paused": False,
                "is_archived": False,
                "has_skips": True,
            },
            {
                "name": "Weekly Planning",
                "description": "Review priorities and set schedule for the week",
                "category": "Work",
                "icon": "briefcase",
                "color": "#3B82F6",
                "frequency": "weekly",
                "target_value": 1.0,
                "target_unit": "session",
                "reminder_time": "18:00",
                "completion_prob": 0.90,
                "is_active": True,
                "is_paused": True,  # Paused habit example
                "is_archived": False,
            }
        ]

        total_completions_added = 0
        random.seed(42)

        for h_info in habits_data:
            habit = Habit(
                user_id=demo_user.id,
                name=h_info["name"],
                description=h_info["description"],
                category=h_info["category"],
                icon=h_info["icon"],
                color=h_info["color"],
                frequency=h_info["frequency"],
                target_value=h_info["target_value"],
                target_unit=h_info["target_unit"],
                reminder_time=h_info["reminder_time"],
                is_active=h_info["is_active"],
                is_paused=h_info["is_paused"],
                is_archived=h_info["is_archived"],
                start_date=today - timedelta(days=90)
            )
            db.add(habit)
            db.commit()
            db.refresh(habit)

            prob = h_info["completion_prob"]
            simulate_slump = h_info.get("simulate_recent_slump", False)
            has_skips = h_info.get("has_skips", False)

            # Seed 90 days of history
            for i in range(89, -1, -1):
                d = today - timedelta(days=i)
                if not StreakService.is_scheduled_on_date(habit.frequency, d):
                    continue

                if simulate_slump and i in [1, 2, 4]:
                    # Explicitly missed in recent 5 days to trigger risk
                    continue

                if has_skips and i in [6, 19]:
                    # Marked as skipped
                    comp = HabitCompletion(
                        habit_id=habit.id,
                        user_id=demo_user.id,
                        completion_date=d,
                        completed=False,
                        skipped=True,
                        notes="Rest day / Traveling"
                    )
                    db.add(comp)
                    total_completions_added += 1
                    continue

                # Ensure today has realistic completions (some done, some pending)
                if i == 0:
                    completed = h_info["name"] in ["Drink Water", "Meditation", "Coding"]
                else:
                    completed = (random.random() <= prob)

                if completed:
                    comp = HabitCompletion(
                        habit_id=habit.id,
                        user_id=demo_user.id,
                        completion_date=d,
                        completed=True,
                        skipped=False,
                        value=h_info["target_value"],
                        notes="Great session completed on time." if i % 7 == 0 else None
                    )
                    db.add(comp)
                    total_completions_added += 1

        db.commit()
        print(f"Successfully seeded realistic 90-day habits and {total_completions_added} records.")
        print("Demo Account Credentials: demo@example.com / DemoPassword123!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()

