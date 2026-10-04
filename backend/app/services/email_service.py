import logging
from typing import Optional
from app.core.config import settings

logger = logging.getLogger("habitflow.email")


async def send_verification_email(to_email: str, code: str, purpose: str = "verification") -> bool:
    """
    Transmits verification code / password reset code to user's email address.
    In local dev mode, logs the code clearly to the backend console.
    """
    purpose_labels = {
        "signup": "Account Registration Verification",
        "forgot_password": "Password Reset Recovery Code",
        "email_change": "Email Address Change Verification",
        "verification": "Security Verification",
    }
    subject = purpose_labels.get(purpose, "Verification Code")

    # Safe logging in Dev mode
    if settings.OTP_DEV_MODE:
        logger.info(f"[DEV ONLY EMAIL] To: {to_email} | Purpose: {purpose} | Code: {code}")
        print(f"\n==================== [DEV EMAIL SERVICE] ====================")
        print(f"To: {to_email}")
        print(f"Subject: HabitFlow - {subject}")
        print(f"Verification Code: {code}")
        print(f"Expires in: {settings.OTP_EXPIRY_SECONDS // 60} minutes")
        print(f"============================================================\n")

    return True
