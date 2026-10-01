from datetime import date, timedelta
from typing import List, Dict, Any, Set, Optional


class StreakService:
    @staticmethod
    def is_scheduled_on_date(frequency: Optional[str], target_date: date) -> bool:
        """
        Determines if a habit is scheduled on a given day based on its frequency setting.
        """
        if not frequency:
            return True
        
        freq = frequency.lower().strip()
        weekday = target_date.weekday()  # 0: Mon, 1: Tue, ..., 6: Sun

        if freq in ("daily", "every day", "everyday", "all"):
            return True
        elif freq in ("weekdays", "weekday"):
            return weekday < 5  # Mon - Fri
        elif freq in ("weekends", "weekend"):
            return weekday >= 5  # Sat - Sun
        elif "," in freq or freq in ("mon", "tue", "wed", "thu", "fri", "sat", "sun",
                                     "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"):
            day_map = {
                "mon": 0, "monday": 0,
                "tue": 1, "tuesday": 1,
                "wed": 2, "wednesday": 2,
                "thu": 3, "thursday": 3,
                "fri": 4, "friday": 4,
                "sat": 5, "saturday": 5,
                "sun": 6, "sunday": 6
            }
            parts = [p.strip() for p in freq.split(",")]
            scheduled_days = {day_map[p] for p in parts if p in day_map}
            if scheduled_days:
                return weekday in scheduled_days
            return True
        return True

    @classmethod
    def calculate_habit_streak(
        cls,
        completion_dates: List[date],
        created_at_date: date,
        reference_date: date = None,
        frequency: str = "daily",
        skipped_dates: List[date] = None,
        is_paused: bool = False
    ) -> Dict[str, Any]:
        """
        Calculates current streak, longest streak, total completions, and completion rate
        for a habit with schedule-awareness and explicit skip handling.
        """
        if reference_date is None:
            reference_date = date.today()

        valid_completed: Set[date] = {
            d for d in set(completion_dates) if d <= reference_date
        }
        valid_skipped: Set[date] = {
            d for d in set(skipped_dates or []) if d <= reference_date
        }

        total_completions = len(valid_completed)
        completed_today = reference_date in valid_completed
        skipped_today = reference_date in valid_skipped

        if not valid_completed and not valid_skipped:
            return {
                "current_streak": 0,
                "longest_streak": 0,
                "total_completions": 0,
                "completion_rate": 0.0,
                "completed_today": completed_today,
                "skipped_today": skipped_today,
                "is_paused": is_paused
            }

        # Calculate Schedule-Aware Current Streak
        # Walk backward from reference_date
        current_streak = 0
        curr = reference_date

        # Check today first
        is_today_scheduled = cls.is_scheduled_on_date(frequency, curr)
        
        if completed_today:
            current_streak = 1
            curr -= timedelta(days=1)
        elif skipped_today or not is_today_scheduled:
            # If today was not completed because it's skipped or not scheduled, start check from yesterday
            curr -= timedelta(days=1)
        else:
            # Today was scheduled but not yet completed
            # Check if yesterday had a streak
            curr -= timedelta(days=1)

        # Walk backwards
        while curr >= created_at_date:
            scheduled = cls.is_scheduled_on_date(frequency, curr)
            if not scheduled:
                curr -= timedelta(days=1)
                continue
            
            if curr in valid_completed:
                current_streak += 1
                curr -= timedelta(days=1)
            elif curr in valid_skipped:
                # Skipped preserves streak without adding count
                curr -= timedelta(days=1)
            else:
                # Scheduled day missed
                break

        # Calculate Longest Streak historically
        longest_streak = 0
        current_run = 0
        
        start_eval = created_at_date
        eval_date = start_eval
        
        while eval_date <= reference_date:
            scheduled = cls.is_scheduled_on_date(frequency, eval_date)
            if not scheduled:
                eval_date += timedelta(days=1)
                continue
            
            if eval_date in valid_completed:
                current_run += 1
                if current_run > longest_streak:
                    longest_streak = current_run
            elif eval_date in valid_skipped:
                pass  # skip preserves run
            else:
                current_run = 0
            
            eval_date += timedelta(days=1)

        longest_streak = max(longest_streak, current_streak)

        # Calculate Schedule-Aware Completion Rate (last 30 days)
        start_30d = max(created_at_date, reference_date - timedelta(days=29))
        scheduled_days_30d = 0
        completions_30d = 0
        
        iter_d = start_30d
        while iter_d <= reference_date:
            if cls.is_scheduled_on_date(frequency, iter_d):
                scheduled_days_30d += 1
                if iter_d in valid_completed:
                    completions_30d += 1
            iter_d += timedelta(days=1)

        completion_rate = round((completions_30d / scheduled_days_30d * 100.0), 1) if scheduled_days_30d > 0 else 0.0

        return {
            "current_streak": current_streak,
            "longest_streak": longest_streak,
            "total_completions": total_completions,
            "completion_rate": completion_rate,
            "completed_today": completed_today,
            "skipped_today": skipped_today,
            "is_paused": is_paused
        }

    @staticmethod
    def calculate_overall_user_streaks(
        all_completion_dates: List[date],
        reference_date: date = None
    ) -> Dict[str, Any]:
        """
        Calculates global user streak (days where at least one habit was completed).
        """
        if reference_date is None:
            reference_date = date.today()

        valid_dates = {d for d in set(all_completion_dates) if d <= reference_date}
        sorted_dates = sorted(valid_dates)

        if not sorted_dates:
            return {"current_streak": 0, "longest_streak": 0, "total_active_days": 0}

        completed_today = reference_date in valid_dates
        yesterday = reference_date - timedelta(days=1)
        completed_yesterday = yesterday in valid_dates

        current_streak = 0
        if completed_today:
            current_streak = 1
            check_date = yesterday
            while check_date in valid_dates:
                current_streak += 1
                check_date -= timedelta(days=1)
        elif completed_yesterday:
            current_streak = 1
            check_date = yesterday - timedelta(days=1)
            while check_date in valid_dates:
                current_streak += 1
                check_date -= timedelta(days=1)

        longest_streak = 0
        current_run = 0
        prev_date = None

        for d in sorted_dates:
            if prev_date is None:
                current_run = 1
            elif d == prev_date + timedelta(days=1):
                current_run += 1
            else:
                current_run = 1
            if current_run > longest_streak:
                longest_streak = current_run
            prev_date = d

        longest_streak = max(longest_streak, current_streak)

        return {
            "current_streak": current_streak,
            "longest_streak": longest_streak,
            "total_active_days": len(sorted_dates)
        }
