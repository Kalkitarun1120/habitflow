import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.core.database import Base, get_db

# Use an in-memory SQLite DB for fast test execution
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_temp.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    app.dependency_overrides[get_db] = override_get_db
    yield
    Base.metadata.drop_all(bind=engine)
    app.dependency_overrides.pop(get_db, None)


def test_register_and_login():
    # Register
    reg_resp = client.post(
        "/api/auth/register",
        json={
            "name": "Test User",
            "email": "test@example.com",
            "password": "Password123!"
        }
    )
    assert reg_resp.status_code == 201
    reg_data = reg_resp.json()
    assert "access_token" in reg_data
    assert reg_data["user"]["email"] == "test@example.com"

    # Duplicate Register should fail
    dup_resp = client.post(
        "/api/auth/register",
        json={
            "name": "Test User",
            "email": "test@example.com",
            "password": "Password123!"
        }
    )
    assert dup_resp.status_code == 400

    # Login
    login_resp = client.post(
        "/api/auth/login",
        json={
            "email": "test@example.com",
            "password": "Password123!"
        }
    )
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]

    # Get me
    me_resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == "test@example.com"


def test_habit_crud_and_completions():
    # Register user
    reg = client.post(
        "/api/auth/register",
        json={"name": "Habit User", "email": "habit@example.com", "password": "Password123!"}
    ).json()
    headers = {"Authorization": f"Bearer {reg['access_token']}"}

    # Create Habit
    h_resp = client.post(
        "/api/habits",
        headers=headers,
        json={
            "name": "Morning Run",
            "category": "Fitness",
            "target_value": 5,
            "target_unit": "km"
        }
    )
    assert h_resp.status_code == 201
    habit_data = h_resp.json()
    habit_id = habit_data["id"]
    assert habit_data["name"] == "Morning Run"

    # Get Habits
    list_resp = client.get("/api/habits", headers=headers)
    assert list_resp.status_code == 200
    assert len(list_resp.json()) == 1

    from datetime import date
    today_str = date.today().isoformat()

    # Complete Habit
    comp_resp = client.post(
        f"/api/habits/{habit_id}/complete",
        headers=headers,
        json={
            "completion_date": today_str,
            "completed": True,
            "value": 5.0,
            "notes": "Ran 5km in park!"
        }
    )
    assert comp_resp.status_code == 200
    assert comp_resp.json()["completed"] is True

    # Duplicate Complete (upsert)
    comp_dup = client.post(
        f"/api/habits/{habit_id}/complete",
        headers=headers,
        json={
            "completion_date": today_str,
            "completed": True,
            "value": 5.0,
            "notes": "Updated note"
        }
    )
    assert comp_dup.status_code == 200
    assert comp_dup.json()["notes"] == "Updated note"

    # Check Dashboard
    dash_resp = client.get("/api/dashboard", headers=headers)
    assert dash_resp.status_code == 200
    dash_data = dash_resp.json()
    assert dash_data["total_habits"] == 1
    assert dash_data["completed_today"] == 1
