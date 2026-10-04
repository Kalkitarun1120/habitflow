import io
import os
import csv
import json
import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Response, UploadFile, File
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.core.dependencies import get_current_user
from app.models import User, Habit, HabitCompletion, Category, AuthIdentity, OTPVerification
from app.schemas.schemas import (
    UserRegister,
    RegisterRequestOTPRequest,
    RegisterVerifyOTPRequest,
    UserLogin,
    UserResponse,
    Token,
    PasswordChange,
    ProfileUpdate,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    ResetPasswordRequest,
    EmailChangeRequest,
    EmailChangeVerifyRequest,
    PhoneChangeRequest,
    PhoneChangeVerifyRequest,
    PhoneSendOTPRequest,
    PhoneSendOTPResponse,
    PhoneVerifyOTPRequest,
    PhoneAuthResponse,
    GoogleAuthRequest,
    LinkPhoneRequest,
    LinkGoogleRequest,
    AuthIdentityResponse,
)
from app.services.otp_service import (
    normalize_phone_number,
    normalize_email_address,
    send_otp_for_phone,
    verify_phone_otp,
    send_otp_for_email,
    verify_email_otp,
)
from app.services.google_auth_service import verify_google_id_token
from app.core.rate_limiter import (
    login_rate_limiter,
    register_rate_limiter,
    password_reset_rate_limiter,
    phone_otp_rate_limiter,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


def get_connected_providers(user: User) -> List[str]:
    """Returns list of connected authentication provider identifiers."""
    providers = set()
    if user.auth_identities:
        for ident in user.auth_identities:
            providers.add(ident.provider)
    if user.password_hash:
        providers.add("password")
        if user.email:
            providers.add("email")
    if user.google_id:
        providers.add("google")
    if user.phone_number and user.is_phone_verified:
        providers.add("phone")
    return sorted(list(providers))


def build_user_response(user: User) -> UserResponse:
    """Builds a rich UserResponse including connected auth providers."""
    providers = get_connected_providers(user)
    return UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        phone_number=user.phone_number,
        avatar=user.avatar,
        timezone=user.timezone or "UTC",
        google_id=user.google_id,
        is_email_verified=user.is_email_verified,
        is_phone_verified=user.is_phone_verified,
        auth_provider=user.auth_provider or "email",
        has_password=bool(user.password_hash),
        connected_providers=providers,
        created_at=user.created_at or datetime.now(timezone.utc).replace(tzinfo=None),
    )


# --- 1. Registration Flow (with Unified Account & Phone OTP) ---

@router.post("/register/request-otp", dependencies=[Depends(register_rate_limiter)])
async def register_request_otp(req: RegisterRequestOTPRequest, db: Session = Depends(get_db)):
    """
    Validates registration input (name, email, phone, password), checks uniqueness across
    both users and auth_identities, and dispatches a verification OTP to the phone number.
    """
    email_clean = normalize_email_address(req.email)
    normalized_phone = normalize_phone_number(req.phone_number)

    # 1. Check if email already exists
    existing_email_user = db.query(User).filter(User.email == email_clean).first()
    existing_email_ident = db.query(AuthIdentity).filter(
        AuthIdentity.provider == "email",
        AuthIdentity.provider_user_id == email_clean
    ).first()
    if existing_email_user or existing_email_ident:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists. Please log in."
        )

    # 2. Check if phone number already exists
    existing_phone_user = db.query(User).filter(User.phone_number == normalized_phone).first()
    existing_phone_ident = db.query(AuthIdentity).filter(
        AuthIdentity.provider == "phone",
        AuthIdentity.provider_user_id == normalized_phone
    ).first()
    if existing_phone_user or existing_phone_ident:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This phone number is already registered to another account. Please log in."
        )

    # 3. Dispatch Phone OTP via Twilio Verify (or dev OTP)
    expires_in = await send_otp_for_phone(
        phone_number=normalized_phone,
        db=db,
        purpose="signup",
    )
    return {
        "message": f"Verification code sent to {normalized_phone}",
        "expires_in": expires_in,
        "phone_number": normalized_phone,
    }


@router.post("/register/verify-otp", dependencies=[Depends(register_rate_limiter)], response_model=Token, status_code=status.HTTP_201_CREATED)
def register_verify_otp(req: RegisterVerifyOTPRequest, db: Session = Depends(get_db)):
    """
    Verifies phone OTP code, creates single unified user with email and phone,
    registers auth_identities, and returns authentication token.
    """
    email_clean = normalize_email_address(req.email)
    normalized_phone = normalize_phone_number(req.phone_number)

    # 1. Verify OTP code
    verify_phone_otp(
        phone_number=normalized_phone,
        otp_code=req.otp,
        db=db,
        purpose="signup",
    )

    # 2. Re-verify uniqueness
    if db.query(User).filter(User.email == email_clean).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists."
        )
    if db.query(User).filter(User.phone_number == normalized_phone).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This phone number is already registered to another account."
        )

    # 3. Create unified User record
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    user = User(
        name=req.name.strip(),
        email=email_clean,
        phone_number=normalized_phone,
        password_hash=hash_password(req.password),
        auth_provider="email",
        timezone=req.timezone or "UTC",
        is_email_verified=True,
        is_phone_verified=True,
        last_login_at=now,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # 4. Register unified auth_identities (both email and phone linked to same user_id)
    email_identity = AuthIdentity(
        user_id=user.id,
        provider="email",
        provider_user_id=email_clean,
        provider_email=email_clean,
    )
    phone_identity = AuthIdentity(
        user_id=user.id,
        provider="phone",
        provider_user_id=normalized_phone,
    )
    db.add(email_identity)
    db.add(phone_identity)
    db.commit()
    db.refresh(user)

    token = create_access_token(subject=user.id)
    return Token(access_token=token, token_type="bearer", user=build_user_response(user))


@router.post("/register", dependencies=[Depends(register_rate_limiter)], response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    """Standard direct registration with optional phone number."""
    email_clean = normalize_email_address(user_in.email)
    existing_user = db.query(User).filter(User.email == email_clean).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists."
        )

    normalized_phone = None
    if user_in.phone_number and user_in.phone_number.strip():
        normalized_phone = normalize_phone_number(user_in.phone_number)
        if db.query(User).filter(User.phone_number == normalized_phone).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This phone number is already registered."
            )

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    user = User(
        name=user_in.name.strip(),
        email=email_clean,
        phone_number=normalized_phone,
        password_hash=hash_password(user_in.password),
        auth_provider="email",
        timezone=user_in.timezone or "UTC",
        is_email_verified=True,
        is_phone_verified=bool(normalized_phone),
        last_login_at=now,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    email_ident = AuthIdentity(
        user_id=user.id,
        provider="email",
        provider_user_id=email_clean,
        provider_email=email_clean,
    )
    db.add(email_ident)

    if normalized_phone:
        phone_ident = AuthIdentity(
            user_id=user.id,
            provider="phone",
            provider_user_id=normalized_phone,
        )
        db.add(phone_ident)

    db.commit()
    db.refresh(user)

    token = create_access_token(subject=user.id)
    return Token(access_token=token, token_type="bearer", user=build_user_response(user))


# --- 2. Normal Login (NO OTP FOR NORMAL LOGIN) ---

@router.post("/login", dependencies=[Depends(login_rate_limiter)], response_model=Token)
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    """Authenticates user with email and password without forcing OTP."""
    email_clean = user_in.email.lower().strip()
    user = db.query(User).filter(User.email == email_clean).first()
    if not user or not user.password_hash or not verify_password(user_in.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )

    user.last_login_at = datetime.now(timezone.utc).replace(tzinfo=None)
    db.commit()
    db.refresh(user)

    token = create_access_token(subject=user.id)
    return Token(access_token=token, token_type="bearer", user=build_user_response(user))


# --- 3. Forgot & Reset Password Flow ---

@router.post("/forgot-password", dependencies=[Depends(password_reset_rate_limiter)], response_model=ForgotPasswordResponse)
async def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Sends a secure password reset code to the provided email if registered.
    Always returns a generic message to prevent account enumeration.
    """
    try:
        email_clean = normalize_email_address(req.email)
        user = db.query(User).filter(User.email == email_clean).first()
        if user:
            await send_otp_for_email(
                email=email_clean,
                db=db,
                purpose="forgot_password",
                user_id=user.id,
            )
    except Exception:
        # Ignore errors during email delivery to prevent information leakage
        pass

    return ForgotPasswordResponse(
        message="If an account exists for this email, password recovery instructions have been sent."
    )


@router.post("/reset-password", dependencies=[Depends(password_reset_rate_limiter)])
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Verifies recovery code and sets a new secure password hash."""
    email_clean = normalize_email_address(req.email)

    # 1. Verify OTP code for forgot_password purpose
    verify_email_otp(
        email=email_clean,
        otp_code=req.otp,
        db=db,
        purpose="forgot_password",
    )

    # 2. Find user
    user = db.query(User).filter(User.email == email_clean).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )

    # 3. Update password hash
    user.password_hash = hash_password(req.new_password)
    user.is_email_verified = True

    # Ensure email auth identity exists
    ident = db.query(AuthIdentity).filter(
        AuthIdentity.user_id == user.id,
        AuthIdentity.provider == "email",
    ).first()
    if not ident:
        ident = AuthIdentity(
            user_id=user.id,
            provider="email",
            provider_user_id=email_clean,
            provider_email=email_clean,
        )
        db.add(ident)

    db.commit()
    return {"message": "Password reset successfully. You can now log in with your new password."}



# --- 2. Phone Number + OTP Authentication (V2 Feature) ---

@router.post("/phone/send-otp", dependencies=[Depends(phone_otp_rate_limiter)], response_model=PhoneSendOTPResponse)
async def phone_send_otp(req: PhoneSendOTPRequest, db: Session = Depends(get_db)):
    """Generates and transmits OTP to the requested phone number."""
    normalized_phone = normalize_phone_number(req.phone_number)
    expires_in = await send_otp_for_phone(
        phone_number=normalized_phone,
        db=db,
        purpose="login",
    )
    return PhoneSendOTPResponse(
        message="OTP verification code sent successfully.",
        expires_in=expires_in,
    )


@router.post("/phone/verify-otp", dependencies=[Depends(phone_otp_rate_limiter)], response_model=PhoneAuthResponse)
def phone_verify_otp(req: PhoneVerifyOTPRequest, db: Session = Depends(get_db)):
    """
    Verifies phone OTP and logs into the existing unified account.
    If the phone number is new and registration details (email, password) are provided,
    it creates the full unified account.
    If the phone number is new and details are not yet provided, returns needs_registration=True
    so the user is prompted to complete Name, Email, and Password without creating a dummy user.
    """
    normalized_phone = normalize_phone_number(req.phone_number)
    
    # 1. Verify OTP with Twilio Verify / OTP service
    verify_phone_otp(
        phone_number=normalized_phone,
        otp_code=req.otp,
        db=db,
        purpose="login",
    )

    # 2. Check if user exists with this phone number
    user = db.query(User).filter(User.phone_number == normalized_phone).first()

    # If not found directly, check via AuthIdentity
    if not user:
        identity = db.query(AuthIdentity).filter(
            AuthIdentity.provider == "phone",
            AuthIdentity.provider_user_id == normalized_phone,
        ).first()
        if identity:
            user = db.query(User).filter(User.id == identity.user_id).first()

    now = datetime.now(timezone.utc).replace(tzinfo=None)

    if not user:
        # If user does not exist, check if registration data was provided
        if req.email and req.password:
            email_clean = normalize_email_address(req.email)
            
            # Check if email is already taken
            existing_email_user = db.query(User).filter(User.email == email_clean).first()
            existing_email_ident = db.query(AuthIdentity).filter(
                AuthIdentity.provider == "email",
                AuthIdentity.provider_user_id == email_clean
            ).first()
            if existing_email_user or existing_email_ident:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="An account with this email already exists. Please log in or use a different email."
                )

            user_name = req.name.strip() if req.name and req.name.strip() else f"User {normalized_phone[-4:]}"
            user = User(
                name=user_name,
                email=email_clean,
                phone_number=normalized_phone,
                password_hash=hash_password(req.password),
                is_email_verified=True,
                is_phone_verified=True,
                auth_provider="phone",
                timezone=req.timezone or "UTC",
                last_login_at=now,
            )
            db.add(user)
            db.commit()
            db.refresh(user)

            # Create both email and phone identities for the unified account
            email_ident = AuthIdentity(
                user_id=user.id,
                provider="email",
                provider_user_id=email_clean,
                provider_email=email_clean,
            )
            phone_ident = AuthIdentity(
                user_id=user.id,
                provider="phone",
                provider_user_id=normalized_phone,
            )
            db.add(email_ident)
            db.add(phone_ident)
            db.query(OTPVerification).filter(
                OTPVerification.phone_number == normalized_phone,
                OTPVerification.verified == True,
                OTPVerification.used_at == None,
            ).update({"used_at": now})
            db.commit()

            token = create_access_token(subject=user.id)
            return PhoneAuthResponse(
                access_token=token,
                token_type="bearer",
                user=build_user_response(user),
                needs_registration=False,
                phone_number=normalized_phone,
                message="Account successfully created and authenticated.",
            )
        else:
            # DO NOT create an incomplete account! Return needs_registration=True
            return PhoneAuthResponse(
                needs_registration=True,
                phone_number=normalized_phone,
                message="Phone verified. Please complete your registration details.",
            )
    else:
        # Existing user: update verification & login timestamp
        user.is_phone_verified = True
        user.last_login_at = now
        
        # Ensure identity exists
        existing_ident = db.query(AuthIdentity).filter(
            AuthIdentity.user_id == user.id,
            AuthIdentity.provider == "phone",
        ).first()
        if not existing_ident:
            ident = AuthIdentity(
                user_id=user.id,
                provider="phone",
                provider_user_id=normalized_phone,
            )
            db.add(ident)
        
        db.query(OTPVerification).filter(
            OTPVerification.phone_number == normalized_phone,
            OTPVerification.verified == True,
            OTPVerification.used_at == None,
        ).update({"used_at": now})
        db.commit()
        db.refresh(user)

        token = create_access_token(subject=user.id)
        return PhoneAuthResponse(
            access_token=token,
            token_type="bearer",
            user=build_user_response(user),
            needs_registration=False,
            phone_number=normalized_phone,
            message="Login successful.",
        )


# --- 3. Google OAuth 2.0 / OpenID Connect (V2 Feature) ---

@router.post("/google", response_model=Token)
async def google_auth(req: GoogleAuthRequest, db: Session = Depends(get_db)):
    """Verifies Google ID token and logs in or creates user account."""
    google_data = await verify_google_id_token(req.credential)
    google_id = google_data["google_id"]
    google_email = google_data.get("email")
    now = datetime.now(timezone.utc).replace(tzinfo=None)

    # 1. Search by Google ID
    user = db.query(User).filter(User.google_id == google_id).first()

    # 2. Search by AuthIdentity
    if not user:
        identity = db.query(AuthIdentity).filter(
            AuthIdentity.provider == "google",
            AuthIdentity.provider_user_id == google_id,
        ).first()
        if identity:
            user = db.query(User).filter(User.id == identity.user_id).first()

    # 3. Search by verified email for safe automatic account linking
    if not user and google_email and google_data.get("is_email_verified"):
        user = db.query(User).filter(User.email == google_email).first()

    if user:
        # Existing user: link Google ID and update profile if needed
        if not user.google_id:
            user.google_id = google_id
        if google_data.get("avatar") and not user.avatar:
            user.avatar = google_data["avatar"]
        if google_data.get("is_email_verified"):
            user.is_email_verified = True
        user.last_login_at = now

        # Ensure Google identity record exists
        existing_ident = db.query(AuthIdentity).filter(
            AuthIdentity.user_id == user.id,
            AuthIdentity.provider == "google",
        ).first()
        if not existing_ident:
            ident = AuthIdentity(
                user_id=user.id,
                provider="google",
                provider_user_id=google_id,
                provider_email=google_email,
            )
            db.add(ident)
        db.commit()
    else:
        # Create new Google User
        user = User(
            name=google_data.get("name") or "HabitFlow User",
            email=google_email,
            avatar=google_data.get("avatar"),
            google_id=google_id,
            is_email_verified=google_data.get("is_email_verified", False),
            auth_provider="google",
            timezone=req.timezone or "UTC",
            last_login_at=now,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        # Register Google identity
        ident = AuthIdentity(
            user_id=user.id,
            provider="google",
            provider_user_id=google_id,
            provider_email=google_email,
        )
        db.add(ident)
        db.commit()

    db.refresh(user)
    token = create_access_token(subject=user.id)
    return Token(access_token=token, token_type="bearer", user=build_user_response(user))


# --- 4. Account Linking Endpoints ---

@router.post("/link/google", response_model=UserResponse)
async def link_google_account(
    req: LinkGoogleRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Links Google identity to the currently authenticated account."""
    google_data = await verify_google_id_token(req.credential)
    google_id = google_data["google_id"]

    # Check if this Google ID is already linked to another user
    existing_user = db.query(User).filter(User.google_id == google_id, User.id != current_user.id).first()
    existing_ident = db.query(AuthIdentity).filter(
        AuthIdentity.provider == "google",
        AuthIdentity.provider_user_id == google_id,
        AuthIdentity.user_id != current_user.id,
    ).first()

    if existing_user or existing_ident:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This Google account is already linked to another HabitFlow user."
        )

    current_user.google_id = google_id
    if google_data.get("avatar") and not current_user.avatar:
        current_user.avatar = google_data["avatar"]
    if google_data.get("email") and not current_user.email:
        current_user.email = google_data["email"]
        current_user.is_email_verified = google_data.get("is_email_verified", False)

    ident = db.query(AuthIdentity).filter(
        AuthIdentity.user_id == current_user.id,
        AuthIdentity.provider == "google",
    ).first()
    if not ident:
        ident = AuthIdentity(
            user_id=current_user.id,
            provider="google",
            provider_user_id=google_id,
            provider_email=google_data.get("email"),
        )
        db.add(ident)

    db.commit()
    db.refresh(current_user)
    return build_user_response(current_user)


@router.post("/link/phone", response_model=UserResponse)
def link_phone_account(
    req: LinkPhoneRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Links phone number to currently authenticated account after OTP verification."""
    normalized_phone = normalize_phone_number(req.phone_number)

    # 1. Verify OTP
    verify_phone_otp(
        phone_number=normalized_phone,
        otp_code=req.otp,
        db=db,
    )

    # 2. Check if phone is linked to another user
    existing_user = db.query(User).filter(
        User.phone_number == normalized_phone,
        User.id != current_user.id
    ).first()
    existing_ident = db.query(AuthIdentity).filter(
        AuthIdentity.provider == "phone",
        AuthIdentity.provider_user_id == normalized_phone,
        AuthIdentity.user_id != current_user.id
    ).first()

    if existing_user or existing_ident:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This phone number is already linked to another HabitFlow account."
        )

    current_user.phone_number = normalized_phone
    current_user.is_phone_verified = True

    ident = db.query(AuthIdentity).filter(
        AuthIdentity.user_id == current_user.id,
        AuthIdentity.provider == "phone",
    ).first()
    if not ident:
        ident = AuthIdentity(
            user_id=current_user.id,
            provider="phone",
            provider_user_id=normalized_phone,
        )
        db.add(ident)

    db.commit()
    db.refresh(current_user)
    return build_user_response(current_user)


@router.delete("/identities/{provider}")
def unlink_auth_identity(
    provider: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Safely unlinks an auth provider ensuring at least one valid login method remains."""
    provider = provider.lower().strip()
    available_providers = get_connected_providers(current_user)

    if provider not in available_providers:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{provider.capitalize()} is not linked to your account."
        )

    # Check if removing this provider would leave the user with zero login methods
    if len(available_providers) <= 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot unlink your only authentication method. Please add another login method first."
        )

    if provider == "google":
        current_user.google_id = None
    elif provider == "phone":
        current_user.phone_number = None
        current_user.is_phone_verified = False
    elif provider in ("password", "email"):
        current_user.password_hash = None

    # Remove AuthIdentity row
    db.query(AuthIdentity).filter(
        AuthIdentity.user_id == current_user.id,
        AuthIdentity.provider == provider,
    ).delete()

    db.commit()
    db.refresh(current_user)
    return {"message": f"{provider.capitalize()} unlinked successfully", "user": build_user_response(current_user)}


# --- 5. User Profile & Account Management ---

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return build_user_response(current_user)


@router.put("/profile", response_model=UserResponse)
@router.patch("/profile", response_model=UserResponse)
def update_profile(
    profile_in: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Updates user display name, timezone, or avatar URL."""
    if profile_in.name is not None:
        current_user.name = profile_in.name.strip()
    if profile_in.timezone is not None:
        current_user.timezone = profile_in.timezone.strip()
    if profile_in.avatar is not None:
        stripped_avatar = profile_in.avatar.strip()
        if not stripped_avatar or stripped_avatar.lower() in ("none", "null", "remove"):
            if current_user.avatar and current_user.avatar.startswith("/uploads/avatars/"):
                old_file = os.path.join(os.getcwd(), current_user.avatar.lstrip("/"))
                if os.path.exists(old_file):
                    try:
                        os.remove(old_file)
                    except Exception:
                        pass
            current_user.avatar = None
        else:
            current_user.avatar = stripped_avatar

    db.commit()
    db.refresh(current_user)
    return build_user_response(current_user)


@router.post("/profile/avatar", response_model=UserResponse)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Uploads and saves a user avatar image securely."""
    allowed_types = {"image/jpeg", "image/png", "image/webp", "image/gif"}
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image type. Only JPEG, PNG, WEBP, and GIF are supported."
        )

    # Read and validate size (< 5MB)
    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Image size exceeds the 5MB maximum limit."
        )

    # Safe unique filename
    ext = os.path.splitext(file.filename or "")[1].lower()
    if not ext or ext not in (".jpg", ".jpeg", ".png", ".webp", ".gif"):
        ext = ".png" if file.content_type == "image/png" else ".jpg"

    filename = f"avatar_{current_user.id}_{uuid.uuid4().hex[:8]}{ext}"
    upload_dir = os.path.join(os.getcwd(), "uploads", "avatars")
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, filename)

    # Clean up previous local avatar file if exists
    if current_user.avatar and current_user.avatar.startswith("/uploads/avatars/"):
        old_file = os.path.join(os.getcwd(), current_user.avatar.lstrip("/"))
        if os.path.exists(old_file):
            try:
                os.remove(old_file)
            except Exception:
                pass

    with open(file_path, "wb") as f:
        f.write(contents)

    current_user.avatar = f"/uploads/avatars/{filename}"
    db.commit()
    db.refresh(current_user)
    return build_user_response(current_user)


@router.delete("/profile/avatar", response_model=UserResponse)
def delete_avatar(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Deletes current user's profile avatar and resets it to default initials."""
    if current_user.avatar and current_user.avatar.startswith("/uploads/avatars/"):
        old_file = os.path.join(os.getcwd(), current_user.avatar.lstrip("/"))
        if os.path.exists(old_file):
            try:
                os.remove(old_file)
            except Exception:
                pass

    current_user.avatar = None
    db.commit()
    db.refresh(current_user)
    return build_user_response(current_user)


@router.post("/profile/request-email-change")
async def request_email_change(
    req: EmailChangeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Sends verification OTP to the requested new email address."""
    new_email_clean = normalize_email_address(req.new_email)
    if current_user.email and current_user.email.lower() == new_email_clean:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This is already your current email address."
        )

    existing_user = db.query(User).filter(User.email == new_email_clean, User.id != current_user.id).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This email address is already registered to another account."
        )

    expires_in = await send_otp_for_email(
        email=new_email_clean,
        db=db,
        purpose="email_change",
        user_id=current_user.id,
    )
    return {
        "message": f"Verification code sent to {new_email_clean}",
        "expires_in": expires_in,
    }


@router.post("/profile/verify-email-change", response_model=UserResponse)
def verify_email_change(
    req: EmailChangeVerifyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Verifies OTP and updates user's primary verified email address."""
    new_email_clean = normalize_email_address(req.new_email)

    # 1. Verify OTP code
    verify_email_otp(
        email=new_email_clean,
        otp_code=req.otp,
        db=db,
        purpose="email_change",
    )

    # 2. Check collisions
    existing_user = db.query(User).filter(User.email == new_email_clean, User.id != current_user.id).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This email address is already registered to another account."
        )

    old_email = current_user.email
    current_user.email = new_email_clean
    current_user.is_email_verified = True

    # Update AuthIdentity if existing
    ident = db.query(AuthIdentity).filter(
        AuthIdentity.user_id == current_user.id,
        AuthIdentity.provider == "email",
    ).first()
    if ident:
        ident.provider_user_id = new_email_clean
        ident.provider_email = new_email_clean
    else:
        ident = AuthIdentity(
            user_id=current_user.id,
            provider="email",
            provider_user_id=new_email_clean,
            provider_email=new_email_clean,
        )
        db.add(ident)

    db.commit()
    db.refresh(current_user)
    return build_user_response(current_user)


@router.post("/profile/request-phone-change")
async def request_phone_change(
    req: PhoneChangeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Sends OTP to the requested new phone number."""
    new_phone_clean = normalize_phone_number(req.new_phone)
    if current_user.phone_number == new_phone_clean:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This is already your current phone number."
        )

    existing_user = db.query(User).filter(User.phone_number == new_phone_clean, User.id != current_user.id).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This phone number is already registered to another account."
        )

    expires_in = await send_otp_for_phone(
        phone_number=new_phone_clean,
        db=db,
        purpose="phone_change",
        user_id=current_user.id,
    )
    return {
        "message": f"Verification code sent to {new_phone_clean}",
        "expires_in": expires_in,
    }


@router.post("/profile/verify-phone-change", response_model=UserResponse)
def verify_phone_change(
    req: PhoneChangeVerifyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Verifies OTP and updates user's primary verified phone number."""
    new_phone_clean = normalize_phone_number(req.new_phone)

    # 1. Verify OTP
    verify_phone_otp(
        phone_number=new_phone_clean,
        otp_code=req.otp,
        db=db,
        purpose="phone_change",
    )

    # 2. Check collision
    existing_user = db.query(User).filter(User.phone_number == new_phone_clean, User.id != current_user.id).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This phone number is already registered to another account."
        )

    current_user.phone_number = new_phone_clean
    current_user.is_phone_verified = True

    # Update AuthIdentity
    ident = db.query(AuthIdentity).filter(
        AuthIdentity.user_id == current_user.id,
        AuthIdentity.provider == "phone",
    ).first()
    if ident:
        ident.provider_user_id = new_phone_clean
    else:
        ident = AuthIdentity(
            user_id=current_user.id,
            provider="phone",
            provider_user_id=new_phone_clean,
        )
        db.add(ident)

    db.commit()
    db.refresh(current_user)
    return build_user_response(current_user)


@router.put("/password")
@router.post("/change-password")
def change_password(
    pwd_in: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # If user already has a password, verify current password
    if current_user.password_hash:
        if not verify_password(pwd_in.current_password, current_user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect."
            )

    current_user.password_hash = hash_password(pwd_in.new_password)
    
    # Ensure email/password identity exists
    if current_user.email:
        ident = db.query(AuthIdentity).filter(
            AuthIdentity.user_id == current_user.id,
            AuthIdentity.provider == "email",
        ).first()
        if not ident:
            ident = AuthIdentity(
                user_id=current_user.id,
                provider="email",
                provider_user_id=current_user.email,
                provider_email=current_user.email,
            )
            db.add(ident)

    db.commit()
    return {"message": "Password updated successfully"}


@router.get("/export")
def export_user_data(
    format_type: str = Query("json", alias="format", pattern="^(json|csv)$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    habits = db.query(Habit).filter(Habit.user_id == current_user.id).all()
    completions = db.query(HabitCompletion).filter(HabitCompletion.user_id == current_user.id).all()
    categories = db.query(Category).filter(Category.user_id == current_user.id).all()

    if format_type == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Record Type", "Habit Name", "Category", "Date", "Status", "Target Value", "Target Unit", "Notes"])

        for h in habits:
            writer.writerow(["Habit", h.name, h.category, h.created_at.strftime("%Y-%m-%d"), "Active" if h.is_active else "Paused", h.target_value, h.target_unit, h.description or ""])

        for c in completions:
            h = next((h for h in habits if h.id == c.habit_id), None)
            h_name = h.name if h else f"Habit #{c.habit_id}"
            cat_name = h.category if h else ""
            status_label = "Completed" if c.completed else ("Skipped" if c.notes == "skipped" else "Incomplete")
            writer.writerow(["Completion", h_name, cat_name, c.completion_date.strftime("%Y-%m-%d"), status_label, c.value, h.target_unit if h else "", c.notes or ""])

        return Response(
            content=output.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=habitflow_export_{datetime.now().strftime('%Y%m%d')}.csv"}
        )

    # JSON export
    data = {
        "user": {
            "name": current_user.name,
            "email": current_user.email,
            "phone_number": current_user.phone_number,
            "timezone": current_user.timezone,
            "connected_providers": get_connected_providers(current_user),
            "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
        },
        "categories": [
            {"name": cat.name, "color": cat.color, "icon": cat.icon}
            for cat in categories
        ],
        "habits": [
            {
                "id": h.id,
                "name": h.name,
                "description": h.description,
                "category": h.category,
                "icon": h.icon,
                "color": h.color,
                "frequency": h.frequency,
                "target_value": h.target_value,
                "target_unit": h.target_unit,
                "reminder_time": h.reminder_time,
                "is_active": h.is_active,
                "created_at": h.created_at.isoformat() if h.created_at else None
            }
            for h in habits
        ],
        "completions": [
            {
                "habit_id": c.habit_id,
                "completion_date": c.completion_date.isoformat(),
                "completed": c.completed,
                "value": c.value,
                "notes": c.notes
            }
            for c in completions
        ]
    }

    return Response(
        content=json.dumps(data, indent=2),
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename=habitflow_export_{datetime.now().strftime('%Y%m%d')}.json"}
    )


@router.delete("/account", status_code=status.HTTP_204_NO_CONTENT)
def delete_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db.delete(current_user)
    db.commit()
    return None


@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    return {"message": "Successfully logged out"}
