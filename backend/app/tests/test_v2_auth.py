import pytest
from datetime import datetime, timedelta, timezone
from unittest.mock import patch
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.core.database import Base, get_db
from app.models.models import User, AuthIdentity, OTPVerification
from app.services.otp_service import hash_otp

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_v2_auth.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


client = TestClient(app)


from app.core.config import settings

@pytest.fixture(autouse=True)
def setup_db():
    prev_mode = settings.OTP_DEV_MODE
    settings.OTP_DEV_MODE = True
    Base.metadata.create_all(bind=engine)
    app.dependency_overrides[get_db] = override_get_db
    yield
    settings.OTP_DEV_MODE = prev_mode
    Base.metadata.drop_all(bind=engine)
    app.dependency_overrides.pop(get_db, None)


def test_phone_otp_flow_new_and_existing_user():
    phone = "+919876543210"

    # 1. Send OTP
    send_resp = client.post("/api/auth/phone/send-otp", json={"phone_number": phone})
    assert send_resp.status_code == 200
    assert send_resp.json()["expires_in"] == 300

    # 2. Resend Cooldown should trigger 429
    resend_resp = client.post("/api/auth/phone/send-otp", json={"phone_number": phone})
    assert resend_resp.status_code == 429
    assert "Please wait" in resend_resp.json()["detail"]

    # 3. Inspect DB to get OTP hash for testing
    db = TestingSessionLocal()
    otp_record = db.query(OTPVerification).filter(OTPVerification.phone_number == phone).first()
    assert otp_record is not None
    assert otp_record.attempts == 0
    assert otp_record.verified is False

    # 4. Wrong OTP should fail
    verify_fail = client.post(
        "/api/auth/phone/verify-otp",
        json={"phone_number": phone, "otp": "000000"}
    )
    assert verify_fail.status_code == 400
    assert "Invalid" in verify_fail.json()["detail"]

    # 5. Set known OTP hash in record for testing correct flow
    test_otp = "654321"
    otp_record.otp_hash = hash_otp(test_otp)
    db.commit()
    db.close()

    # 6. Verify correct OTP without credentials -> returns needs_registration=True
    verify_partial = client.post(
        "/api/auth/phone/verify-otp",
        json={"phone_number": phone, "otp": test_otp}
    )
    assert verify_partial.status_code == 200
    assert verify_partial.json()["needs_registration"] is True

    # 7. Complete registration with name, email, password -> creates unified account
    verify_success = client.post(
        "/api/auth/phone/verify-otp",
        json={
            "phone_number": phone,
            "otp": test_otp,
            "name": "Kalki",
            "email": "kalki@example.com",
            "password": "SecurePassword123!"
        }
    )
    assert verify_success.status_code == 200
    res_data = verify_success.json()
    assert "access_token" in res_data
    assert res_data["user"]["name"] == "Kalki"
    assert res_data["user"]["email"] == "kalki@example.com"
    assert res_data["user"]["phone_number"] == phone
    assert res_data["user"]["is_phone_verified"] is True
    assert "phone" in res_data["user"]["connected_providers"]
    token = res_data["access_token"]

    # 8. Authenticated request using phone token
    me_resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    assert me_resp.json()["phone_number"] == phone
    assert me_resp.json()["email"] == "kalki@example.com"

    # 9. Create Habit using phone-authenticated account
    habit_resp = client.post(
        "/api/habits",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": "Drink Water", "category": "Health", "target_value": 8, "target_unit": "glasses"}
    )
    assert habit_resp.status_code == 201
    assert habit_resp.json()["name"] == "Drink Water"


def test_otp_expiry_and_max_attempts():
    phone = "+919876543211"
    now = datetime.now(timezone.utc).replace(tzinfo=None)

    db = TestingSessionLocal()
    # Expired OTP
    expired_otp = OTPVerification(
        phone_number=phone,
        otp_hash=hash_otp("111111"),
        purpose="login",
        expires_at=now - timedelta(seconds=10),
        attempts=0,
        verified=False,
    )
    db.add(expired_otp)
    db.commit()
    db.close()

    resp = client.post(
        "/api/auth/phone/verify-otp",
        json={"phone_number": phone, "otp": "111111"}
    )
    assert resp.status_code == 400
    assert "expired" in resp.json()["detail"].lower()


def test_signup_otp_and_normal_login_no_otp():
    email = "newuser@example.com"
    phone = "+919876543212"
    pwd = "SecurePassword123!"

    # 1. Request signup OTP with phone number
    req_resp = client.post("/api/auth/register/request-otp", json={
        "name": "New User",
        "email": email,
        "phone_number": phone,
        "password": pwd
    })
    assert req_resp.status_code == 200

    # 2. Plant OTP
    test_otp = "889900"
    db = TestingSessionLocal()
    rec = db.query(OTPVerification).filter(OTPVerification.phone_number == phone, OTPVerification.purpose == "signup").first()
    assert rec is not None
    rec.otp_hash = hash_otp(test_otp)
    db.commit()
    db.close()

    # 3. Verify OTP and complete registration
    verify_resp = client.post("/api/auth/register/verify-otp", json={
        "name": "New User",
        "email": email,
        "phone_number": phone,
        "password": pwd,
        "otp": test_otp
    })
    assert verify_resp.status_code == 201
    assert verify_resp.json()["user"]["is_email_verified"] is True
    assert verify_resp.json()["user"]["is_phone_verified"] is True
    assert "email" in verify_resp.json()["user"]["connected_providers"]
    assert "phone" in verify_resp.json()["user"]["connected_providers"]

    # 4. NORMAL LOGIN - NO OTP REQUIRED!
    login_resp = client.post("/api/auth/login", json={
        "email": email,
        "password": pwd
    })
    assert login_resp.status_code == 200
    assert "access_token" in login_resp.json()
    assert login_resp.json()["user"]["email"] == email


def test_forgot_password_and_reset_flow():
    email = "recover@example.com"
    old_pwd = "OldPassword123!"
    new_pwd = "NewSecurePassword456!"

    # Register user
    reg_resp = client.post("/api/auth/register", json={
        "name": "Recovery User",
        "email": email,
        "password": old_pwd
    })
    assert reg_resp.status_code == 201

    # Forgot password request (generic message returned)
    fp_resp = client.post("/api/auth/forgot-password", json={"email": email})
    assert fp_resp.status_code == 200
    assert "recovery instructions have been sent" in fp_resp.json()["message"]

    # Plant recovery OTP
    recovery_otp = "554433"
    db = TestingSessionLocal()
    rec = db.query(OTPVerification).filter(OTPVerification.email == email, OTPVerification.purpose == "forgot_password").first()
    assert rec is not None
    rec.otp_hash = hash_otp(recovery_otp)
    db.commit()
    db.close()

    # Reset password with OTP
    reset_resp = client.post("/api/auth/reset-password", json={
        "email": email,
        "otp": recovery_otp,
        "new_password": new_pwd
    })
    assert reset_resp.status_code == 200

    # Old password fails
    fail_login = client.post("/api/auth/login", json={"email": email, "password": old_pwd})
    assert fail_login.status_code == 401

    # New password succeeds directly (NO OTP)
    success_login = client.post("/api/auth/login", json={"email": email, "password": new_pwd})
    assert success_login.status_code == 200
    assert "access_token" in success_login.json()


def test_profile_email_and_phone_change():
    email = "profuser@example.com"
    pwd = "Password123!"
    reg_resp = client.post("/api/auth/register", json={"name": "Prof User", "email": email, "password": pwd})
    token = reg_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Update Name and Timezone
    up_resp = client.put("/api/auth/profile", headers=headers, json={"name": "Updated Name", "timezone": "Asia/Kolkata"})
    assert up_resp.status_code == 200
    assert up_resp.json()["name"] == "Updated Name"
    assert up_resp.json()["timezone"] == "Asia/Kolkata"

    # 2. Email Change Request & Verify
    new_email = "new_prof@example.com"
    req_e = client.post("/api/auth/profile/request-email-change", headers=headers, json={"new_email": new_email})
    assert req_e.status_code == 200

    db = TestingSessionLocal()
    e_rec = db.query(OTPVerification).filter(OTPVerification.email == new_email, OTPVerification.purpose == "email_change").first()
    assert e_rec is not None
    e_rec.otp_hash = hash_otp("123123")
    db.commit()
    db.close()

    ver_e = client.post("/api/auth/profile/verify-email-change", headers=headers, json={"new_email": new_email, "otp": "123123"})
    assert ver_e.status_code == 200
    assert ver_e.json()["email"] == new_email

    # 3. Phone Change Request & Verify
    new_phone = "+919123456780"
    req_p = client.post("/api/auth/profile/request-phone-change", headers=headers, json={"new_phone": new_phone})
    assert req_p.status_code == 200

    db = TestingSessionLocal()
    p_rec = db.query(OTPVerification).filter(OTPVerification.phone_number == new_phone, OTPVerification.purpose == "phone_change").first()
    assert p_rec is not None
    p_rec.otp_hash = hash_otp("456456")
    db.commit()
    db.close()

    ver_p = client.post("/api/auth/profile/verify-phone-change", headers=headers, json={"new_phone": new_phone, "otp": "456456"})
    assert ver_p.status_code == 200
    assert ver_p.json()["phone_number"] == new_phone
    assert ver_p.json()["is_phone_verified"] is True


@patch("app.routers.auth.verify_google_id_token")
def test_google_auth_flow_and_linking(mock_verify_google):
    mock_verify_google.return_value = {
        "google_id": "google_123456789",
        "email": "googleuser@example.com",
        "name": "Google User",
        "avatar": "https://lh3.googleusercontent.com/a/photo.jpg",
        "is_email_verified": True,
    }

    # 1. Google Login (new user)
    g_resp = client.post("/api/auth/google", json={"credential": "mock_google_token"})
    assert g_resp.status_code == 200
    g_data = g_resp.json()
    assert "access_token" in g_data
    assert g_data["user"]["email"] == "googleuser@example.com"
    assert g_data["user"]["google_id"] == "google_123456789"
    assert "google" in g_data["user"]["connected_providers"]
    token = g_data["access_token"]

    # 2. Link Phone Number to this Google Account
    db = TestingSessionLocal()
    link_phone = "+919988776655"
    test_otp = "123456"
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    otp_rec = OTPVerification(
        phone_number=link_phone,
        otp_hash=hash_otp(test_otp),
        purpose="login",
        expires_at=now + timedelta(minutes=5),
        attempts=0,
        verified=False,
    )
    db.add(otp_rec)
    db.commit()
    db.close()

    link_resp = client.post(
        "/api/auth/link/phone",
        headers={"Authorization": f"Bearer {token}"},
        json={"phone_number": link_phone, "otp": test_otp}
    )
    assert link_resp.status_code == 200
    assert link_resp.json()["phone_number"] == link_phone
    assert "phone" in link_resp.json()["connected_providers"]
    assert "google" in link_resp.json()["connected_providers"]

    # 3. Unlink Google: Should succeed because Phone remains
    unlink_g = client.delete(
        "/api/auth/identities/google",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert unlink_g.status_code == 200

    # 4. Unlink Phone: Should FAIL because it's now the only remaining login method!
    unlink_phone = client.delete(
        "/api/auth/identities/phone",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert unlink_phone.status_code == 400
    assert "Cannot unlink your only authentication method" in unlink_phone.json()["detail"]


@patch("app.services.otp_service.send_twilio_verification")
@patch("app.services.otp_service.check_twilio_verification")
def test_twilio_verify_production_flow_mocked(mock_check, mock_send):
    mock_send.return_value = "pending"
    mock_check.return_value = True

    settings.OTP_DEV_MODE = False
    phone = "+919876543299"

    # 1. Send OTP in production mode -> triggers send_twilio_verification
    send_resp = client.post("/api/auth/phone/send-otp", json={"phone_number": phone})
    assert send_resp.status_code == 200
    mock_send.assert_called_once_with(to_phone=phone)

    # 2. Verify OTP with correct code -> triggers check_twilio_verification
    verify_resp = client.post(
        "/api/auth/phone/verify-otp",
        json={
            "phone_number": phone,
            "otp": "778899",
            "name": "Twilio User",
            "email": "twilio@example.com",
            "password": "Password123!"
        }
    )
    assert verify_resp.status_code == 200
    assert verify_resp.json()["user"]["phone_number"] == phone
    assert verify_resp.json()["user"]["email"] == "twilio@example.com"
    mock_check.assert_called_once_with(to_phone=phone, code="778899")

    # 3. Verify OTP rejection when check fails
    mock_check.return_value = False
    fail_resp = client.post("/api/auth/phone/verify-otp", json={"phone_number": phone, "otp": "000000"})
    assert fail_resp.status_code == 400
    assert "Invalid" in fail_resp.json()["detail"]


@patch("app.routers.auth.verify_google_id_token")
def test_unified_account_multi_method_resolution(mock_google):
    """
    MASTER TEST CASE: Validates that Email+Password, Phone+OTP, and Google OAuth
    all resolve to the EXACT SAME users.id with unified auth_identities.
    """
    email = "tarun.unified@example.com"
    phone = "+919876543200"
    pwd = "UnifiedSecretPassword123!"
    otp_code = "456789"
    google_id = "goog_tarun_unified_999"

    # Mock Google verify return
    mock_google.return_value = {
        "google_id": google_id,
        "email": email,
        "name": "Tarun Unified",
        "avatar": "https://example.com/avatar.jpg",
        "is_email_verified": True,
    }

    # 1. Test 1: Register Account (Name, Email, Phone, Password)
    req_resp = client.post("/api/auth/register/request-otp", json={
        "name": "Tarun Unified",
        "email": email,
        "phone_number": phone,
        "password": pwd
    })
    assert req_resp.status_code == 200

    # Plant Phone OTP
    db = TestingSessionLocal()
    rec = db.query(OTPVerification).filter(OTPVerification.phone_number == phone, OTPVerification.purpose == "signup").first()
    assert rec is not None
    rec.otp_hash = hash_otp(otp_code)
    db.commit()
    db.close()

    # Verify Phone OTP and create unified account
    verify_resp = client.post("/api/auth/register/verify-otp", json={
        "name": "Tarun Unified",
        "email": email,
        "phone_number": phone,
        "password": pwd,
        "otp": otp_code
    })
    assert verify_resp.status_code == 201
    user_data = verify_resp.json()["user"]
    primary_user_id = user_data["id"]
    assert user_data["email"] == email
    assert user_data["phone_number"] == phone
    assert user_data["is_email_verified"] is True
    assert user_data["is_phone_verified"] is True

    # 2. Test 2: Login with Email/Password -> resolves to SAME user_id, NO OTP required
    email_login_resp = client.post("/api/auth/login", json={"email": email, "password": pwd})
    assert email_login_resp.status_code == 200
    assert email_login_resp.json()["user"]["id"] == primary_user_id

    # 3. Test 3: Login using Phone OTP -> resolves to SAME user_id
    # Send Phone OTP for login
    client.post("/api/auth/phone/send-otp", json={"phone_number": phone})
    db = TestingSessionLocal()
    login_otp_rec = db.query(OTPVerification).filter(OTPVerification.phone_number == phone, OTPVerification.purpose == "login").first()
    assert login_otp_rec is not None
    login_otp = "112233"
    login_otp_rec.otp_hash = hash_otp(login_otp)
    db.commit()
    db.close()

    phone_login_resp = client.post("/api/auth/phone/verify-otp", json={"phone_number": phone, "otp": login_otp})
    assert phone_login_resp.status_code == 200
    assert phone_login_resp.json()["user"]["id"] == primary_user_id
    assert phone_login_resp.json()["needs_registration"] is False

    # 4. Test 4 & 5: Google Login with matching email -> resolves to SAME user_id without OTP
    google_login_resp = client.post("/api/auth/google", json={"credential": "valid_mocked_google_token"})
    assert google_login_resp.status_code == 200
    assert google_login_resp.json()["user"]["id"] == primary_user_id
    assert "google" in google_login_resp.json()["user"]["connected_providers"]
    assert "email" in google_login_resp.json()["user"]["connected_providers"]
    assert "phone" in google_login_resp.json()["user"]["connected_providers"]

    # 5. Test 6: Verify Profile Endpoint
    user_token = google_login_resp.json()["access_token"]
    me_resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {user_token}"})
    assert me_resp.status_code == 200
    me_data = me_resp.json()
    assert me_data["id"] == primary_user_id
    assert me_data["email"] == email
    assert me_data["phone_number"] == phone
    assert me_data["is_email_verified"] is True
    assert me_data["is_phone_verified"] is True

    # 6. Test 10: Duplicate Email Prevention -> Must fail
    dup_email_resp = client.post("/api/auth/register/request-otp", json={
        "name": "Another Person",
        "email": email,
        "phone_number": "+919876543999",
        "password": "Password123!"
    })
    assert dup_email_resp.status_code == 400
    assert "email already exists" in dup_email_resp.json()["detail"].lower()

    # 7. Test 11: Duplicate Phone Prevention -> Must fail
    dup_phone_resp = client.post("/api/auth/register/request-otp", json={
        "name": "Another Person",
        "email": "anotherperson@example.com",
        "phone_number": phone,
        "password": "Password123!"
    })
    assert dup_phone_resp.status_code == 400
    assert "phone number is already registered" in dup_phone_resp.json()["detail"].lower()

    # 8. Test Avatar Upload and Removal
    # Upload avatar image
    avatar_content = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
    upload_resp = client.post(
        "/api/auth/profile/avatar",
        headers={"Authorization": f"Bearer {user_token}"},
        files={"file": ("test_avatar.png", avatar_content, "image/png")}
    )
    assert upload_resp.status_code == 200
    uploaded_avatar = upload_resp.json()["avatar"]
    assert uploaded_avatar.startswith("/uploads/avatars/")

    # Delete avatar
    delete_avatar_resp = client.delete(
        "/api/auth/profile/avatar",
        headers={"Authorization": f"Bearer {user_token}"}
    )
    assert delete_avatar_resp.status_code == 200
    assert delete_avatar_resp.json()["avatar"] is None



