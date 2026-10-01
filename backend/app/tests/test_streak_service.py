from datetime import date, timedelta
from app.services.streak_service import StreakService


def test_zero_completions():
    today = date(2026, 9, 26)
    created_at = date(2026, 9, 1)
    res = StreakService.calculate_habit_streak([], created_at, today)
    assert res["current_streak"] == 0
    assert res["longest_streak"] == 0
    assert res["total_completions"] == 0
    assert res["completion_rate"] == 0.0
    assert res["completed_today"] is False


def test_one_completion_today():
    today = date(2026, 9, 26)
    created_at = date(2026, 9, 1)
    res = StreakService.calculate_habit_streak([today], created_at, today)
    assert res["current_streak"] == 1
    assert res["longest_streak"] == 1
    assert res["total_completions"] == 1
    assert res["completed_today"] is True


def test_consecutive_days_ending_today():
    today = date(2026, 9, 26)
    created_at = date(2026, 9, 1)
    dates = [today - timedelta(days=i) for i in range(5)]  # Today, yesterday, -2, -3, -4
    res = StreakService.calculate_habit_streak(dates, created_at, today)
    assert res["current_streak"] == 5
    assert res["longest_streak"] == 5
    assert res["total_completions"] == 5


def test_consecutive_days_ending_yesterday():
    today = date(2026, 9, 26)
    created_at = date(2026, 9, 1)
    dates = [today - timedelta(days=i) for i in range(1, 6)]  # Yesterday, -2, -3, -4, -5
    res = StreakService.calculate_habit_streak(dates, created_at, today)
    assert res["current_streak"] == 5
    assert res["longest_streak"] == 5
    assert res["completed_today"] is False


def test_missing_day_resets_current_streak():
    today = date(2026, 9, 26)
    created_at = date(2026, 9, 1)
    # Completed 5 days ago, missed 4 & 3 days ago, completed 2 days ago & yesterday, missed today
    dates = [
        today - timedelta(days=1),
        today - timedelta(days=2),
        today - timedelta(days=5),
    ]
    res = StreakService.calculate_habit_streak(dates, created_at, today)
    assert res["current_streak"] == 2
    assert res["longest_streak"] == 2
    assert res["total_completions"] == 3


def test_future_dates_ignored_for_streak():
    today = date(2026, 9, 26)
    created_at = date(2026, 9, 1)
    dates = [today, today + timedelta(days=2)]
    res = StreakService.calculate_habit_streak(dates, created_at, today)
    assert res["current_streak"] == 1
    assert res["longest_streak"] == 1
    assert res["total_completions"] == 1


def test_duplicate_dates_handled_gracefully():
    today = date(2026, 9, 26)
    created_at = date(2026, 9, 1)
    dates = [today, today, today - timedelta(days=1), today - timedelta(days=1)]
    res = StreakService.calculate_habit_streak(dates, created_at, today)
    assert res["current_streak"] == 2
    assert res["longest_streak"] == 2
    assert res["total_completions"] == 2
