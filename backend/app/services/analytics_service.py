from datetime import date, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models import Habit, HabitCompletion
from app.services.streak_service import StreakService
from app.schemas.schemas import (
    InsightItem, StatisticsResponse, DailyCompletionCount,
    CategoryPerformance, DayOfWeekPerformance, HabitRiskItem, WeeklyReport,
    HabitPerformanceItem
)


class AnalyticsService:
    DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

    @classmethod
    def get_user_statistics(
        cls,
        db: Session,
        user_id: int,
        range_days: int = 30
    ) -> StatisticsResponse:
        today = date.today()
        habits = db.query(Habit).filter(Habit.user_id == user_id).all()
        active_habits = [h for h in habits if h.is_active]
        total_habits_count = len(habits)
        active_habits_count = len(active_habits)

        # Get all completed records
        all_completions = (
            db.query(HabitCompletion)
            .filter(HabitCompletion.user_id == user_id, HabitCompletion.completed == True)
            .all()
        )
        total_completions = len(all_completions)

        # Filter by selected range
        start_date = today - timedelta(days=range_days - 1) if range_days > 0 else (habits[0].created_at.date() if habits and habits[0].created_at else today)
        range_completions = [c for c in all_completions if c.completion_date >= start_date]

        # User global streak
        all_completion_dates = [c.completion_date for c in all_completions]
        global_streaks = StreakService.calculate_overall_user_streaks(all_completion_dates, today)

        # Calculate habit streaks and rates
        habit_rates: Dict[int, Dict[str, Any]] = {}
        for habit in active_habits:
            h_dates = [c.completion_date for c in all_completions if c.habit_id == habit.id]
            st = StreakService.calculate_habit_streak(
                completion_dates=h_dates,
                created_at_date=habit.created_at.date() if habit.created_at else today,
                reference_date=today,
                frequency=habit.frequency or "daily"
            )
            habit_rates[habit.id] = {
                "name": habit.name,
                "streak": st["current_streak"],
                "rate": st["completion_rate"],
                "category": habit.category or "General",
                "color": habit.color or "#10B981"
            }

        # Most consistent habit
        best_habit_name: Optional[str] = None
        best_habit_rate: Optional[float] = None
        needs_attention_habit: Optional[str] = None
        needs_attention_rate: Optional[float] = None

        if habit_rates:
            sorted_by_rate = sorted(habit_rates.values(), key=lambda x: x["rate"], reverse=True)
            if sorted_by_rate[0]["rate"] > 0:
                best_habit_name = sorted_by_rate[0]["name"]
                best_habit_rate = sorted_by_rate[0]["rate"]
            
            lowest = sorted_by_rate[-1]
            if lowest["rate"] < 70 and len(all_completions) > 5:
                needs_attention_habit = lowest["name"]
                needs_attention_rate = lowest["rate"]

        # Day of week performance
        day_completions = {i: 0 for i in range(7)}
        day_scheduled_total = {i: 0 for i in range(7)}
        
        # Count scheduled and completed days over range
        eval_d = start_date
        while eval_d <= today:
            wd = eval_d.weekday()
            for h in active_habits:
                if StreakService.is_scheduled_on_date(h.frequency, eval_d):
                    day_scheduled_total[wd] += 1
            eval_d += timedelta(days=1)

        for c in range_completions:
            day_completions[c.completion_date.weekday()] += 1

        day_performance_list: List[DayOfWeekPerformance] = []
        for i, day_name in enumerate(cls.DAY_NAMES):
            sched = day_scheduled_total[i]
            comp = day_completions[i]
            d_rate = round((comp / sched * 100.0), 1) if sched > 0 else 0.0
            day_performance_list.append(
                DayOfWeekPerformance(
                    day_name=day_name[:3],
                    completion_rate=d_rate,
                    total_completions=comp
                )
            )

        best_day_index = max(day_completions, key=day_completions.get) if range_completions else 0
        most_consistent_day = cls.DAY_NAMES[best_day_index] if len(range_completions) > 0 else "N/A"

        # Best time of day based on reminder time of completed habits
        time_counts = {"Morning (6am - 12pm)": 0, "Afternoon (12pm - 6pm)": 0, "Evening (6pm - 11pm)": 0}
        for h in active_habits:
            if h.reminder_time:
                try:
                    hour = int(h.reminder_time.split(":")[0])
                    if 6 <= hour < 12:
                        time_counts["Morning (6am - 12pm)"] += habit_rates.get(h.id, {}).get("rate", 0)
                    elif 12 <= hour < 18:
                        time_counts["Afternoon (12pm - 6pm)"] += habit_rates.get(h.id, {}).get("rate", 0)
                    else:
                        time_counts["Evening (6pm - 11pm)"] += habit_rates.get(h.id, {}).get("rate", 0)
                except ValueError:
                    pass

        best_time = max(time_counts, key=time_counts.get) if any(time_counts.values()) else "Morning (6am - 12pm)"

        # Overall completion rate in range
        scheduled_in_range = sum(day_scheduled_total.values())
        overall_rate = round((len(range_completions) / scheduled_in_range * 100.0), 1) if scheduled_in_range > 0 else 0.0

        # Weekly completion chart (last 7 days)
        weekly_chart: List[DailyCompletionCount] = []
        for i in range(6, -1, -1):
            d = today - timedelta(days=i)
            day_comp_count = sum(1 for c in all_completions if c.completion_date == d)
            sched_today = sum(1 for h in active_habits if StreakService.is_scheduled_on_date(h.frequency, d))
            w_rate = round((day_comp_count / sched_today * 100.0), 1) if sched_today > 0 else 0.0
            weekly_chart.append(
                DailyCompletionCount(
                    date=d.strftime("%Y-%m-%d"),
                    day_name=d.strftime("%a"),
                    completed_count=day_comp_count,
                    total_habits=sched_today or active_habits_count,
                    rate=w_rate,
                )
            )

        # Monthly completion trend (5 intervals)
        intervals = 5
        interval_days = max(1, range_days // intervals) if range_days > 0 else 7
        monthly_chart: List[Dict[str, Any]] = []
        
        for idx in range(intervals - 1, -1, -1):
            w_start = today - timedelta(days=(idx * interval_days + interval_days - 1))
            w_end = today - timedelta(days=(idx * interval_days))
            w_completions = sum(1 for c in all_completions if w_start <= c.completion_date <= w_end)
            
            # calculate scheduled in interval
            sched_in_int = 0
            cur_int = w_start
            while cur_int <= w_end:
                sched_in_int += sum(1 for h in active_habits if StreakService.is_scheduled_on_date(h.frequency, cur_int))
                cur_int += timedelta(days=1)
                
            w_rate = round((w_completions / sched_in_int * 100.0), 1) if sched_in_int > 0 else 0.0
            monthly_chart.append({
                "label": f"{w_start.strftime('%b %d')} - {w_end.strftime('%b %d')}",
                "completed": w_completions,
                "expected": sched_in_int,
                "rate": w_rate
            })

        # Category performance
        category_map: Dict[str, Dict[str, Any]] = {}
        for h in active_habits:
            cat = h.category or "General"
            if cat not in category_map:
                category_map[cat] = {"count": 0, "color": h.color or "#10B981", "completions": 0, "scheduled": 0}
            category_map[cat]["count"] += 1

        for c in range_completions:
            h = next((h for h in active_habits if h.id == c.habit_id), None)
            if h:
                cat = h.category or "General"
                if cat in category_map:
                    category_map[cat]["completions"] += 1

        cat_performance: List[CategoryPerformance] = []
        for cat, data in category_map.items():
            cat_sched = data["count"] * range_days
            c_rate = round((data["completions"] / cat_sched * 100.0), 1) if cat_sched > 0 else 0.0
            cat_performance.append(
                CategoryPerformance(
                    category=cat,
                    habit_count=data["count"],
                    completion_rate=c_rate,
                    color=data["color"]
                )
            )

        # Habit Risk Analysis (e.g. missed 3 of last 5 scheduled sessions)
        habit_risks: List[HabitRiskItem] = []
        for h in active_habits:
            # find last 5 scheduled dates for habit
            recent_scheduled = []
            test_d = today
            while len(recent_scheduled) < 5 and test_d >= h.created_at.date():
                if StreakService.is_scheduled_on_date(h.frequency, test_d):
                    recent_scheduled.append(test_d)
                test_d -= timedelta(days=1)

            if len(recent_scheduled) >= 3:
                h_comp_dates = {c.completion_date for c in all_completions if c.habit_id == h.id}
                misses = sum(1 for sd in recent_scheduled if sd not in h_comp_dates)
                if misses >= 2:
                    risk_level = "high" if misses >= 3 else "medium"
                    habit_risks.append(
                        HabitRiskItem(
                            habit_id=h.id,
                            habit_name=h.name,
                            category=h.category or "General",
                            missed_recent=misses,
                            total_recent_scheduled=len(recent_scheduled),
                            risk_level=risk_level,
                            message=f"You missed {misses} of your last {len(recent_scheduled)} scheduled sessions."
                        )
                    )

        # Weekly Report
        last_7_start = today - timedelta(days=6)
        prev_7_start = today - timedelta(days=13)
        prev_7_end = today - timedelta(days=7)

        week_completions = [c for c in all_completions if c.completion_date >= last_7_start]
        prev_week_completions = [c for c in all_completions if prev_7_start <= c.completion_date <= prev_7_end]

        sched_week = sum(1 for i in range(7) for h in active_habits if StreakService.is_scheduled_on_date(h.frequency, today - timedelta(days=i)))
        sched_prev_week = sum(1 for i in range(7, 14) for h in active_habits if StreakService.is_scheduled_on_date(h.frequency, today - timedelta(days=i)))

        cur_week_rate = round((len(week_completions) / sched_week * 100.0), 1) if sched_week > 0 else 0.0
        prev_week_rate = round((len(prev_week_completions) / sched_prev_week * 100.0), 1) if sched_prev_week > 0 else 0.0
        diff_pct = round(cur_week_rate - prev_week_rate, 1)

        weekly_report = WeeklyReport(
            period_label=f"{last_7_start.strftime('%b %d')} – {today.strftime('%b %d')}",
            completion_rate=cur_week_rate,
            prev_week_rate=prev_week_rate,
            diff_percent=diff_pct,
            best_habit=best_habit_name,
            best_habit_rate=best_habit_rate or 0.0,
            needs_attention_habit=needs_attention_habit,
            needs_attention_rate=needs_attention_rate or 0.0,
            current_streak=global_streaks["current_streak"],
            best_day=most_consistent_day,
            total_completions_week=len(week_completions)
        )

        # Habit Performance comparison for selected range
        habit_perf_list: List[HabitPerformanceItem] = []
        for h in habits:
            h_all_dates = [c.completion_date for c in all_completions if c.habit_id == h.id]
            h_range_comps = [c for c in range_completions if c.habit_id == h.id]
            st = StreakService.calculate_habit_streak(
                completion_dates=h_all_dates,
                created_at_date=h.created_at.date() if h.created_at else today,
                reference_date=today,
                frequency=h.frequency or "daily"
            )

            # Count scheduled in range for this habit
            h_sched_in_range = 0
            eval_d = start_date
            while eval_d <= today:
                if StreakService.is_scheduled_on_date(h.frequency, eval_d):
                    h_sched_in_range += 1
                eval_d += timedelta(days=1)

            h_comp_count = len(h_range_comps)
            h_rate = round((h_comp_count / h_sched_in_range * 100.0), 1) if h_sched_in_range > 0 else (100.0 if h_comp_count > 0 else 0.0)
            last_comp_date = max(h_all_dates).strftime("%Y-%m-%d") if h_all_dates else None

            habit_perf_list.append(
                HabitPerformanceItem(
                    habit_id=h.id,
                    name=h.name,
                    category=h.category or "General",
                    color=h.color or "#10B981",
                    icon=h.icon or "sparkles",
                    completions_count=h_comp_count,
                    total_scheduled=h_sched_in_range,
                    completion_rate=h_rate,
                    current_streak=st["current_streak"],
                    longest_streak=st["longest_streak"],
                    last_completed=last_comp_date
                )
            )

        habit_perf_list.sort(key=lambda x: x.completions_count, reverse=True)

        return StatisticsResponse(
            total_habits=total_habits_count,
            active_habits=active_habits_count,
            total_completions=total_completions,
            current_streak=global_streaks["current_streak"],
            longest_streak=global_streaks["longest_streak"],
            completion_rate=overall_rate,
            most_consistent_habit=best_habit_name,
            most_consistent_habit_rate=best_habit_rate,
            needs_attention_habit=needs_attention_habit,
            needs_attention_rate=needs_attention_rate,
            most_consistent_day=most_consistent_day,
            best_time_of_day=best_time,
            weekly_chart=weekly_chart,
            monthly_chart=monthly_chart,
            category_performance=cat_performance,
            day_of_week_performance=day_performance_list,
            habit_risks=habit_risks,
            habit_performance=habit_perf_list,
            weekly_report=weekly_report
        )

    @classmethod
    def generate_smart_insights(cls, db: Session, user_id: int) -> List[InsightItem]:
        today = date.today()
        insights: List[InsightItem] = []

        habits = db.query(Habit).filter(Habit.user_id == user_id, Habit.is_active == True).all()
        completions = (
            db.query(HabitCompletion)
            .filter(HabitCompletion.user_id == user_id, HabitCompletion.completed == True)
            .all()
        )

        if not habits or len(completions) < 3:
            insights.append(
                InsightItem(
                    id="welcome",
                    title="Unlock Behavioral Insights",
                    description="Complete more habits to unlock personalized behavioral patterns, timing recommendations, and trend insights.",
                    type="tip",
                    icon="sparkles"
                )
            )
            return insights

        # 1. Best Day Insight
        day_counts = {i: 0 for i in range(7)}
        for c in completions:
            day_counts[c.completion_date.weekday()] += 1
        
        if sum(day_counts.values()) >= 5:
            best_day_idx = max(day_counts, key=day_counts.get)
            best_day_name = cls.DAY_NAMES[best_day_idx]
            best_day_pct = round(day_counts[best_day_idx] / len(completions) * 100)
            insights.append(
                InsightItem(
                    id="best_day",
                    title="Peak Day Performance",
                    description=f"{best_day_pct}% of your completions happen on {best_day_name}s.",
                    type="positive",
                    icon="calendar"
                )
            )

        # 2. Strongest Habit
        habit_counts = {}
        for c in completions:
            habit_counts[c.habit_id] = habit_counts.get(c.habit_id, 0) + 1

        if habit_counts:
            top_h_id = max(habit_counts, key=habit_counts.get)
            top_h = next((h for h in habits if h.id == top_h_id), None)
            if top_h:
                insights.append(
                    InsightItem(
                        id="strongest_habit",
                        title="Core Anchor Habit",
                        description=f"Your most consistent habit is {top_h.name} with {habit_counts[top_h_id]} recorded completions.",
                        type="achievement",
                        icon="award"
                    )
                )

        # 3. Weekly Trend Comparison
        last_7_start = today - timedelta(days=6)
        prev_7_start = today - timedelta(days=13)
        prev_7_end = today - timedelta(days=7)

        last_7_count = sum(1 for c in completions if c.completion_date >= last_7_start)
        prev_7_count = sum(1 for c in completions if prev_7_start <= c.completion_date <= prev_7_end)

        if prev_7_count > 0:
            diff = last_7_count - prev_7_count
            if diff > 0:
                insights.append(
                    InsightItem(
                        id="positive_trend",
                        title="Positive Momentum",
                        description=f"You completed {diff} more habits this week compared to last week (+{round(diff/prev_7_count*100)}%).",
                        type="positive",
                        icon="trending-up"
                    )
                )
            elif diff < 0:
                insights.append(
                    InsightItem(
                        id="warning_trend",
                        title="Activity Attention",
                        description=f"Your completions dropped by {abs(diff)} this week compared to last week. Take on 1 habit today to rebuild momentum.",
                        type="warning",
                        icon="alert-circle"
                    )
                )

        return insights
