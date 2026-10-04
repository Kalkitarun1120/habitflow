import logging
from typing import Optional
from fastapi import HTTPException, status
from app.core.config import settings

logger = logging.getLogger("habitflow.sms")


def validate_twilio_verify_config() -> None:
    """Validates that all required Twilio Verify credentials are configured."""
    if not settings.OTP_DEV_MODE:
        missing = []
        if not settings.TWILIO_ACCOUNT_SID:
            missing.append("TWILIO_ACCOUNT_SID")
        if not settings.TWILIO_AUTH_TOKEN:
            missing.append("TWILIO_AUTH_TOKEN")
        if not settings.TWILIO_VERIFY_SERVICE_SID:
            missing.append("TWILIO_VERIFY_SERVICE_SID")

        if missing:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Twilio Verify is not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_VERIFY_SERVICE_SID.",
            )


def send_twilio_verification(to_phone: str) -> str:
    """
    Triggers an SMS verification code dispatch via Twilio Verify V2 API.
    Returns the verification status ('pending', etc.).
    """
    validate_twilio_verify_config()

    from twilio.rest import Client
    from twilio.base.exceptions import TwilioRestException

    try:
        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        verification = client.verify.v2.services(
            settings.TWILIO_VERIFY_SERVICE_SID
        ).verifications.create(to=to_phone, channel="sms")

        logger.info(
            f"OTP verification SMS requested successfully for {to_phone[:6]}**** (SID: {verification.sid}, Status: {verification.status})"
        )
        return verification.status
    except TwilioRestException as exc:
        logger.error(f"Twilio Verify dispatch error [Code {exc.code}]: {exc.msg}")
        if exc.code == 21608 or "unverified" in str(exc.msg).lower():
            # Twilio Trial accounts require verifying destination numbers in Twilio console
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Twilio Trial Restriction: The phone number {to_phone} is not a verified caller ID in your Twilio account.",
            )
        elif exc.code == 60200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid phone number format for SMS delivery.",
            )
        elif exc.code == 60203:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Max verification attempts reached for this phone number. Please try again later.",
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to dispatch SMS verification code: {exc.msg}",
            )
    except Exception as exc:
        logger.error(f"Unexpected error communicating with Twilio Verify: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while requesting verification code.",
        )


def check_twilio_verification(to_phone: str, code: str) -> bool:
    """
    Checks an entered OTP against Twilio Verify V2 API.
    Returns True if approved, False otherwise.
    """
    validate_twilio_verify_config()

    from twilio.rest import Client
    from twilio.base.exceptions import TwilioRestException

    try:
        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        verification_check = client.verify.v2.services(
            settings.TWILIO_VERIFY_SERVICE_SID
        ).verification_checks.create(to=to_phone, code=code.strip())

        logger.info(
            f"Twilio verification check response for {to_phone[:6]}****: status={verification_check.status}"
        )
        return verification_check.status == "approved"
    except TwilioRestException as exc:
        logger.error(f"Twilio Verify check error [Code {exc.code}]: {exc.msg}")
        if exc.code == 20404 or exc.code == 60200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Verification code has expired or was not found. Please request a new code.",
            )
        elif exc.code == 60202:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many incorrect OTP attempts. Please request a new verification code.",
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid verification code.",
            )
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Unexpected error checking Twilio Verify OTP: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while verifying the code.",
        )
