import re
import secrets
import string
import hashlib
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.core.config import settings
from app.models.models import OTPVerification, User
from app.services.sms_service import send_twilio_verification, check_twilio_verification
from app.services.email_service import send_verification_email

logger = logging.getLogger("habitflow.otp")


def normalize_phone_number(raw_phone: str) -> str:
    """
    Normalizes phone number to E.164 format (+[country code][number]).
    Removes spaces, hyphens, and parentheses.
    """
    if not raw_phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number is required."
        )

    # Clean input
    cleaned = re.sub(r"[\s\-\(\)]", "", raw_phone.strip())

    # Ensure leading +
    if not cleaned.startswith("+"):
        if cleaned.startswith("00"):
            cleaned = "+" + cleaned[2:]
        elif len(cleaned) == 10:
            # Default to India (+91) if 10-digit number is given without prefix
            cleaned = "+91" + cleaned
        else:
            cleaned = "+" + cleaned

    # Validate E.164 regex (+ followed by 7 to 15 digits)
    if not re.match(r"^\+[1-9]\d{6,14}$", cleaned):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a valid international phone number in E.164 format (e.g. +919876543210)."
        )

    return cleaned


def normalize_email_address(raw_email: str) -> str:
    """Normalizes and validates email address format."""
    if not raw_email or not raw_email.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address is required."
        )
    cleaned = raw_email.lower().strip()
    if not re.match(r"^[^@]+@[^@]+\.[^@]+$", cleaned):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a valid email address."
        )
    return cleaned


def generate_otp_code(length: int = 6) -> str:
    """Generates a cryptographically secure numeric OTP."""
    digits = string.digits
    return "".join(secrets.choice(digits) for _ in range(length))


def hash_otp(otp_code: str, salt: Optional[str] = None) -> str:
    """Computes SHA-256 hash of OTP code with secret key salt."""
    key = salt or settings.JWT_SECRET_KEY
    return hashlib.sha256(f"{otp_code}:{key}".encode("utf-8")).hexdigest()


def verify_otp_hash(otp_code: str, stored_hash: str) -> bool:
    """Securely checks if entered OTP matches stored hash."""
    expected_hash = hash_otp(otp_code)
    return secrets.compare_digest(expected_hash, stored_hash)


async def send_otp_for_phone(
    phone_number: str,
    db: Session,
    purpose: str = "login",
    user_id: Optional[int] = None,
) -> int:
    """
    Validates cooldown and transmits OTP via Twilio Verify (or local console in dev mode).
    Returns expiration time in seconds.
    """
    normalized_phone = normalize_phone_number(phone_number)
    now = datetime.now(timezone.utc).replace(tzinfo=None)

    # 1. Enforce Resend Cooldown
    recent_otp = (
        db.query(OTPVerification)
        .filter(
            OTPVerification.phone_number == normalized_phone,
            OTPVerification.purpose == purpose,
        )
        .order_by(OTPVerification.created_at.desc())
        .first()
    )

    if recent_otp and recent_otp.created_at:
        elapsed_seconds = (now - recent_otp.created_at).total_seconds()
        if elapsed_seconds < settings.OTP_RESEND_COOLDOWN_SECONDS:
            remaining = int(settings.OTP_RESEND_COOLDOWN_SECONDS - elapsed_seconds)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Please wait {remaining} seconds before requesting a new OTP."
            )

    # 2. Invalidate any previous unverified OTP records for this phone and purpose
    db.query(OTPVerification).filter(
        OTPVerification.phone_number == normalized_phone,
        OTPVerification.purpose == purpose,
        OTPVerification.verified == False
    ).update({"used_at": now})

    expires_at = now + timedelta(seconds=settings.OTP_EXPIRY_SECONDS)

    # 3. Handle Production (Twilio Verify) vs Local Dev
    if settings.OTP_DEV_MODE:
        # Dev fallback: generate local code and log to console
        otp_code = generate_otp_code(6)
        hashed = hash_otp(otp_code)
        logger.info(f"[DEV ONLY] OTP generated for {normalized_phone}: {otp_code} (Purpose: {purpose})")
        print(f"\n==================== [DEV SMS SERVICE] ====================")
        print(f"To: {normalized_phone}")
        print(f"Message: Your HabitFlow verification code is: {otp_code}")
        print(f"===========================================================\n")
    else:
        # Production: Twilio Verify generates and delivers the SMS
        send_twilio_verification(to_phone=normalized_phone)
        hashed = "twilio_verify"
        logger.info(f"OTP verification SMS requested successfully for {normalized_phone[:6]}****")

    # 4. Save verification tracking record
    verification = OTPVerification(
        user_id=user_id,
        phone_number=normalized_phone,
        otp_hash=hashed,
        purpose=purpose,
        expires_at=expires_at,
        attempts=0,
        verified=False,
        created_at=now,
    )
    db.add(verification)
    db.commit()

    return settings.OTP_EXPIRY_SECONDS


def verify_phone_otp(
    phone_number: str,
    otp_code: str,
    db: Session,
    purpose: Optional[str] = None
) -> Tuple[bool, Optional[OTPVerification]]:
    """
    Validates provided OTP against Twilio Verify in production,
    or against local hashed records in dev mode.
    Supports multi-step registration where phone was already verified.
    """
    normalized_phone = normalize_phone_number(phone_number)
    now = datetime.now(timezone.utc).replace(tzinfo=None)

    # 1. Check if there is an active record verified within the last 15 minutes that has not been consumed
    recent_verified = db.query(OTPVerification).filter(
        OTPVerification.phone_number == normalized_phone,
        OTPVerification.verified == True,
        OTPVerification.used_at == None,
        OTPVerification.created_at >= now - timedelta(minutes=15),
    ).order_by(OTPVerification.created_at.desc()).first()

    if recent_verified:
        return True, recent_verified

    query = db.query(OTPVerification).filter(
        OTPVerification.phone_number == normalized_phone,
        OTPVerification.verified == False,
        OTPVerification.used_at == None,
    )
    if purpose:
        query = query.filter(OTPVerification.purpose == purpose)

    verification = query.order_by(OTPVerification.created_at.desc()).first()

    if not settings.OTP_DEV_MODE:
        # Production: Twilio Verify Check
        is_approved = check_twilio_verification(to_phone=normalized_phone, code=otp_code)
        if not is_approved:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired verification code. Please check the code and try again."
            )

        if verification:
            verification.verified = True
            db.commit()
        else:
            verification = OTPVerification(
                phone_number=normalized_phone,
                otp_hash="twilio_verify",
                purpose=purpose or "login",
                expires_at=now + timedelta(seconds=settings.OTP_EXPIRY_SECONDS),
                attempts=1,
                verified=True,
                created_at=now,
            )
            db.add(verification)
            db.commit()

        return True, verification

    # Local Dev Mode Verification:
    if not verification:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active verification code found for this phone number. Please request a new code."
        )

    # Check expiration
    if verification.expires_at < now:
        verification.used_at = now
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This code has expired. Please request a new verification code."
        )

    # Check max attempts limit
    if verification.attempts >= settings.OTP_MAX_ATTEMPTS:
        verification.used_at = now
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many incorrect attempts. Please request a new code."
        )

    # Verify Hash
    verification.attempts += 1
    if not verify_otp_hash(otp_code.strip(), verification.otp_hash):
        db.commit()
        attempts_left = max(0, settings.OTP_MAX_ATTEMPTS - verification.attempts)
        if attempts_left > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid verification code. {attempts_left} attempt(s) remaining."
            )
        else:
            verification.used_at = now
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many incorrect attempts. Please request a new verification code."
            )

    # Success: Mark verified
    verification.verified = True
    db.commit()

    return True, verification


async def send_otp_for_email(
    email: str,
    db: Session,
    purpose: str = "signup",
    user_id: Optional[int] = None,
) -> int:
    """
    Validates cooldown, generates secure OTP, stores hashed verification record,
    and sends verification email.
    """
    normalized_email = normalize_email_address(email)
    now = datetime.now(timezone.utc).replace(tzinfo=None)

    # 1. Enforce Resend Cooldown
    recent_otp = (
        db.query(OTPVerification)
        .filter(
            OTPVerification.email == normalized_email,
            OTPVerification.purpose == purpose,
        )
        .order_by(OTPVerification.created_at.desc())
        .first()
    )

    if recent_otp and recent_otp.created_at:
        elapsed_seconds = (now - recent_otp.created_at).total_seconds()
        if elapsed_seconds < settings.OTP_RESEND_COOLDOWN_SECONDS:
            remaining = int(settings.OTP_RESEND_COOLDOWN_SECONDS - elapsed_seconds)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Please wait {remaining} seconds before requesting a new code."
            )

    # 2. Invalidate previous unverified OTPs for this email and purpose
    db.query(OTPVerification).filter(
        OTPVerification.email == normalized_email,
        OTPVerification.purpose == purpose,
        OTPVerification.verified == False
    ).update({"used_at": now})

    # 3. Generate 6-digit OTP and store hash
    otp_code = generate_otp_code(6)
    hashed = hash_otp(otp_code)
    # Password reset or signup expiry: 15 minutes (900 seconds)
    expiry_seconds = 900 if purpose == "forgot_password" else settings.OTP_EXPIRY_SECONDS
    expires_at = now + timedelta(seconds=expiry_seconds)

    verification = OTPVerification(
        user_id=user_id,
        email=normalized_email,
        otp_hash=hashed,
        purpose=purpose,
        expires_at=expires_at,
        attempts=0,
        verified=False,
        created_at=now,
    )
    db.add(verification)
    db.commit()

    # 4. Dispatch email
    await send_verification_email(to_email=normalized_email, code=otp_code, purpose=purpose)

    return expiry_seconds


def verify_email_otp(
    email: str,
    otp_code: str,
    db: Session,
    purpose: Optional[str] = None
) -> Tuple[bool, OTPVerification]:
    """
    Validates provided OTP against active verification records for email.
    """
    normalized_email = normalize_email_address(email)
    now = datetime.now(timezone.utc).replace(tzinfo=None)

    query = db.query(OTPVerification).filter(
        OTPVerification.email == normalized_email,
        OTPVerification.verified == False,
        OTPVerification.used_at == None,
    )
    if purpose:
        query = query.filter(OTPVerification.purpose == purpose)

    verification = query.order_by(OTPVerification.created_at.desc()).first()

    if not verification:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active verification code found for this email. Please request a new code."
        )

    # Check expiration
    if verification.expires_at < now:
        verification.used_at = now
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This verification code has expired. Please request a new code."
        )

    # Check max attempts limit
    if verification.attempts >= settings.OTP_MAX_ATTEMPTS:
        verification.used_at = now
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many incorrect attempts. Please request a new verification code."
        )

    # Verify Hash
    verification.attempts += 1
    if not verify_otp_hash(otp_code.strip(), verification.otp_hash):
        db.commit()
        attempts_left = max(0, settings.OTP_MAX_ATTEMPTS - verification.attempts)
        if attempts_left > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid verification code. {attempts_left} attempt(s) remaining."
            )
        else:
            verification.used_at = now
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many incorrect attempts. Please request a new code."
            )

    # Success: Mark verified and used
    verification.verified = True
    verification.used_at = now
    db.commit()

    return True, verification
