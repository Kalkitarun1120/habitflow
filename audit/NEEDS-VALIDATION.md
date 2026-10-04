# Audit Candidate Findings & Validation Analysis (NEEDS-VALIDATION.md)

This document tracks all candidate security hypotheses investigated during the audit, detailing the test methodology and code verification that proved each hypothesis safe or debunked theoretical concerns.

---

### Candidate 1: Insecure Direct Object Reference (IDOR) on Habit Operations
- **Hypothesis**: Could an attacker access or manipulate another user's habits by changing `habit_id` in URL paths?
- **Validation Steps**:
  1. Inspected `backend/app/routers/habits.py`.
  2. Verified every query:
     - `get_habit`: `db.query(Habit).filter(Habit.id == habit_id, Habit.user_id == current_user.id).first()`
     - `update_habit`: `db.query(Habit).filter(Habit.id == habit_id, Habit.user_id == current_user.id).first()`
     - `delete_habit`: `db.query(Habit).filter(Habit.id == habit_id, Habit.user_id == current_user.id).first()`
     - `complete_habit`: `db.query(Habit).filter(Habit.id == habit_id, Habit.user_id == current_user.id).first()`
     - `skip_habit`: `db.query(Habit).filter(Habit.id == habit_id, Habit.user_id == current_user.id).first()`
     - `pause_habit` & `resume_habit`: `filter(Habit.id == habit_id, Habit.user_id == current_user.id)`
  3. Tested in `test_api.py`.
- **Verdict**: **SAFE (NO VULNERABILITY)**. Every operation strictly enforces tenant ownership.

---

### Candidate 2: Account Takeover via Unauthenticated Google OAuth Linking
- **Hypothesis**: Could an attacker link an arbitrary Google account and take over another user's account?
- **Validation Steps**:
  1. Inspected `google_auth_service.py` and `backend/app/routers/auth.py`.
  2. Traced `verify_google_id_token`: verifies cryptographic signature with Google tokeninfo endpoint, asserts issuer, audience, and `email_verified == True`.
  3. Traced `link_google_account`: Requires active JWT Bearer authentication (`current_user = Depends(get_current_user)`). Checks collisions across all users before updating.
- **Verdict**: **SAFE (NO VULNERABILITY)**. Only cryptographically verified and email-verified Google identities are linked, and only when authenticated.

---

### Candidate 3: Arbitrary File Upload / Path Traversal on Profile Picture Endpoint
- **Hypothesis**: Could an attacker upload an executable script (e.g. `.php`, `.py`, `.sh`) or use `../../` to overwrite system files?
- **Validation Steps**:
  1. Inspected `upload_avatar` in `backend/app/routers/auth.py`.
  2. Verified MIME type check: rejects all types outside `{"image/jpeg", "image/png", "image/webp", "image/gif"}`.
  3. Verified file size check: rejects files `> 5MB`.
  4. Verified filename generation: Ignores user-supplied filenames and generates a random name: `f"avatar_{current_user.id}_{uuid.uuid4().hex[:8]}{ext}"`.
  5. Tested path traversal payloads (`../../filename.png`): Safely stripped and ignored.
- **Verdict**: **SAFE (NO VULNERABILITY)**. Filename generation is fully controlled by the server.

---

### Candidate 4: SQL Injection via Analytics or Statistics Aggregation
- **Hypothesis**: Could user input in search queries or date filters trigger SQL injection?
- **Validation Steps**:
  1. Inspected `backend/app/services/analytics_service.py` and all routers.
  2. Verified that all queries utilize SQLAlchemy 2.0 ORM expressions (`.filter(Habit.name.ilike(f"%{search}%"))`).
  3. SQLAlchemy automatically binds parameters to prevent SQL injection.
- **Verdict**: **SAFE (NO VULNERABILITY)**. No dynamic raw SQL string interpolation exists.

---

### Candidate 5: Phone OTP Replay or Race Condition Exploitation
- **Hypothesis**: Could an attacker reuse a verified OTP code multiple times or verify after expiry?
- **Validation Steps**:
  1. Inspected `otp_service.py`.
  2. Traced `verify_phone_otp` and `verify_email_otp`:
     - Sets `used_at = now` immediately upon verification or attempt exhaustion.
     - Re-verifies expiration against server UTC timestamp.
     - Rejects any OTP with `attempts >= 5`.
- **Verdict**: **SAFE (NO VULNERABILITY)**. Replays and expired tokens are strictly rejected.
