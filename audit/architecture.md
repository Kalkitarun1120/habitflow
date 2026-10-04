# HabitFlow Architecture & Security Overview

## 1. System Topology & Component Model

HabitFlow is a modern, unified habit tracking and behavioral analytics platform.

```
+-------------------------------------------------------------------------+
|                              CLIENT TIER                                |
|   React 19 + TypeScript + Tailwind CSS (Vite SPA)                      |
|   - State & Context: AuthContext, ThemeContext                          |
|   - Routing: React Router v7 with ProtectedRoute Guards                |
|   - API Client: Axios with Bearer Interceptor & 401 Auto-Logout         |
+------------------------------------+------------------------------------+
                                     | HTTPS / REST API
                                     v
+-------------------------------------------------------------------------+
|                             API GATEWAY / APP                           |
|   FastAPI 0.110+ (Uvicorn ASGI Server)                                  |
|   - CORS Middleware & Static File Mounts (/uploads)                     |
|   - Global Exception Sanitizer & HTTPBearer Authentication Scheme       |
+---------+--------------------------+--------------------------+---------+
          |                          |                          |
          v                          v                          v
+-------------------+      +-------------------+      +-------------------+
|   ROUTER LAYER    |      |   SERVICE LAYER   |      |  EXTERNAL AUTH &  |
| - /api/auth       |      | - OTP Service     |      |  DELIVERY         |
| - /api/habits     |      | - Google Service  |      | - Google OAuth    |
| - /api/dashboard  | <--> | - Analytics Engine| <--> |   (Tokeninfo API) |
| - /api/statistics |      | - Streak Engine   |      | - Twilio Verify   |
| - /api/calendar   |      | - SMS Service     |      |   (SMS Gateway)   |
| - /api/categories |      | - Email Service   |      |                   |
| - /api/insights   |      +-------------------+      +-------------------+
+---------+---------+
          |
          v
+-------------------------------------------------------------------------+
|                                DATA TIER                                |
|   SQLAlchemy 2.0 ORM + MySQL 8.0 (or SQLite in testing)                 |
|   - Models: User, AuthIdentity, OTPVerification, Habit,                 |
|             HabitCompletion, Category                                   |
|   - Migrations: Alembic                                                 |
+-------------------------------------------------------------------------+
```

---

## 2. Authentication & Identity Data Flow

HabitFlow implements a **Unified Account Architecture** supporting multiple authentication providers per identity:

1. **Email / Password**:
   - Passwords hashed with bcrypt (salted).
   - Stored in `users.password_hash` and linked via `auth_identities`.
2. **Phone Number + OTP**:
   - Numbers validated and normalized to E.164.
   - OTP codes (6 digits, CSPRNG) hashed with SHA-256 and salted.
   - Production delivery via Twilio Verify V2 API; local dev mode console fallback.
   - Cooldown (60s) and attempt throttling (max 5) enforced.
3. **Google OAuth 2.0**:
   - Google ID Tokens verified server-side via Google's tokeninfo API.
   - Verified Google email automatically linked to unified user accounts.
4. **JWT Session Token**:
   - Signed with HMAC-SHA256 (`HS256`) using `JWT_SECRET_KEY`.
   - Transmitted via `Authorization: Bearer <token>` header.

---

## 3. Data Access & Isolation Model

- **Multi-Tenant Isolation**: All habit, completion, category, and statistics database queries strictly scope records by `user_id == current_user.id`.
- **Foreign Key Constraints**: All child entities (`habits`, `habit_completions`, `categories`, `auth_identities`, `otp_verifications`) cascade on delete of `users.id`.
- **Parameterization**: 100% of database queries execute through SQLAlchemy ORM parameter binding; no dynamic SQL concatenation.
