from typing import Dict, Any, List, Optional
from datetime import date


class HabitPredictor:
    """
    Clean interface for future Machine Learning models:
    - Completion prediction
    - Optimal reminder-time prediction
    - Habit failure risk prediction
    - Personalized recommendations
    """

    def predict_completion_probability(
        self, habit_id: int, user_history: List[Dict[str, Any]], target_date: date
    ) -> Dict[str, Any]:
        """Predicts probability (0.0 to 1.0) of habit completion on target_date."""
        # Interface placeholder for ML model inference pipeline
        return {
            "habit_id": habit_id,
            "target_date": target_date.strftime("%Y-%m-%d"),
            "predicted_probability": 0.85,
            "status": "interface_ready"
        }

    def predict_optimal_reminder_time(
        self, habit_id: int, completion_timestamps: List[str]
    ) -> Optional[str]:
        """Predicts optimal reminder time (e.g. '08:30') based on past user completion timestamps."""
        return "08:00"

    def predict_failure_risk(
        self, user_id: int, recent_streaks: List[int]
    ) -> Dict[str, Any]:
        """Predicts risk of breaking current active streaks."""
        return {
            "user_id": user_id,
            "risk_level": "low",
            "risk_score": 0.15,
            "recommended_action": "Keep up morning routines!"
        }

    def get_personalized_recommendations(
        self, user_category_preferences: List[str]
    ) -> List[Dict[str, str]]:
        """Generates smart habit recommendations based on user profile and habits."""
        return [
            {"name": "Morning Walk", "category": "Health", "reason": "Pairs well with your morning routine"},
            {"name": "10-Min Reading", "category": "Mindset", "reason": "High success rate among similar users"}
        ]
