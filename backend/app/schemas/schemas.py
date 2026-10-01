from datetime import date, datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field, ConfigDict


# --- Auth & User Schemas ---
class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)
    timezone: Optional[str] = "UTC"


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6)


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    timezone: Optional[str] = None
    avatar: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    avatar: Optional[str] = None
    timezone: str = "UTC"
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# --- Category Schemas ---
class CategoryCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    color: str = "#10B981"
    icon: str = "folder"


class CategoryResponse(BaseModel):
    id: int
    user_id: int
    name: str
    color: str
    icon: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Habit Schemas ---
class HabitCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    description: Optional[str] = None
    category: str = "General"
    icon: str = "sparkles"
    color: str = "#10B981"
    frequency: str = "daily"
    target_value: float = Field(1.0, gt=0)
    target_unit: str = "times"
    reminder_time: Optional[str] = None
    is_active: bool = True


class HabitUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    frequency: Optional[str] = None
    target_value: Optional[float] = None
    target_unit: Optional[str] = None
    reminder_time: Optional[str] = None
    is_active: Optional[bool] = None


class HabitStreak(BaseModel):
    current_streak: int = 0
    longest_streak: int = 0
    total_completions: int = 0
    completion_rate: float = 0.0
    completed_today: bool = False
    skipped_today: bool = False
    today_value: float = 0.0
    is_scheduled_today: bool = True
    is_paused: bool = False


class HabitResponse(BaseModel):
    id: int
    user_id: int
    name: str
    description: Optional[str] = None
    category: str
    icon: str
    color: str
    frequency: str
    target_value: float
    target_unit: str
    reminder_time: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    streak: Optional[HabitStreak] = None

    model_config = ConfigDict(from_attributes=True)


# --- Completion Schemas ---
class CompletionCreate(BaseModel):
    completion_date: date
    completed: bool = True
    value: float = 1.0
    notes: Optional[str] = None


class CompletionUpdate(BaseModel):
    completed: Optional[bool] = None
    value: Optional[float] = None
    notes: Optional[str] = None


class CompletionResponse(BaseModel):
    id: int
    habit_id: int
    user_id: int
    completion_date: date
    completed: bool
    value: float
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class HabitHistoryDay(BaseModel):
    date: str
    is_scheduled: bool
    completed: bool
    skipped: bool
    value: float = 1.0
    notes: Optional[str] = None


class HabitHistoryDetail(BaseModel):
    habit: Optional[HabitResponse] = None
    habit_id: int
    habit_name: str
    frequency: str
    total_completions: int
    current_streak: int
    longest_streak: int
    completion_rate: float
    created_at: str
    completions: List[CompletionResponse] = []
    days: List[HabitHistoryDay] = []
    range_days: int


# --- Dashboard & Statistics Schemas ---
class DashboardOverview(BaseModel):
    greeting: str
    total_habits: int
    completed_today: int
    today_progress_percent: float
    current_streak: int
    longest_streak: int
    overall_completion_rate: float
    remaining_today: int
    habits_today: List[HabitResponse]


class DailyCompletionCount(BaseModel):
    date: str
    day_name: str
    completed_count: int
    total_habits: int
    rate: float


class CategoryPerformance(BaseModel):
    category: str
    habit_count: int
    completion_rate: float
    color: str


class DayOfWeekPerformance(BaseModel):
    day_name: str
    completion_rate: float
    total_completions: int


class HabitRiskItem(BaseModel):
    habit_id: int
    habit_name: str
    category: str
    missed_recent: int
    total_recent_scheduled: int
    risk_level: str  # "high", "medium", "low"
    message: str


class WeeklyReport(BaseModel):
    period_label: str
    completion_rate: float
    prev_week_rate: float
    diff_percent: float
    best_habit: Optional[str] = None
    best_habit_rate: float = 0.0
    needs_attention_habit: Optional[str] = None
    needs_attention_rate: float = 0.0
    current_streak: int
    best_day: str
    total_completions_week: int


class StatisticsResponse(BaseModel):
    total_habits: int
    active_habits: int
    total_completions: int
    current_streak: int
    longest_streak: int
    completion_rate: float
    most_consistent_habit: Optional[str] = None
    most_consistent_habit_rate: Optional[float] = None
    needs_attention_habit: Optional[str] = None
    needs_attention_rate: Optional[float] = None
    most_consistent_day: Optional[str] = None
    best_time_of_day: Optional[str] = None
    weekly_chart: List[DailyCompletionCount]
    monthly_chart: List[Dict[str, Any]]
    category_performance: List[CategoryPerformance]
    day_of_week_performance: List[DayOfWeekPerformance]
    habit_risks: List[HabitRiskItem]
    weekly_report: Optional[WeeklyReport] = None


class InsightItem(BaseModel):
    id: str
    title: str
    description: str
    type: str  # positive, warning, tip, achievement
    icon: str


class CalendarDayHabitStatus(BaseModel):
    habit_id: int
    habit_name: str
    name: Optional[str] = None
    category: str = "General"
    icon: str = "sparkles"
    color: str = "#10B981"
    is_scheduled: bool = True
    completed: bool = False
    skipped: bool = False
    value: float = 1.0
    target_value: float = 1.0
    target_unit: str = "times"
    status: str = "incomplete"  # "completed", "skipped", "incomplete"


class CalendarDayDetail(BaseModel):
    date: str
    completed_count: int
    total_scheduled: int
    skipped_count: int = 0
    completion_rate: float
    habits: List[CalendarDayHabitStatus]


class CalendarDayData(BaseModel):
    date: str
    is_current_month: bool
    is_today: bool
    is_future: bool
    completed_count: int
    total_habits: int
    completion_rate: float
    status: str  # none, partial, complete, missed


class NotificationResponse(BaseModel):
    id: int
    user_id: int
    habit_id: Optional[int] = None
    title: str
    message: str
    scheduled_time: Optional[datetime] = None
    is_read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
