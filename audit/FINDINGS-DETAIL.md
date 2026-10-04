# Detailed Vulnerability Findings & Remediation Plan

---

### Finding SEC-001: Permissive Wildcard CORS Configuration

- **Severity**: Medium
- **Category**: CORS / Access Control
- **CWE**: CWE-942 (Permissive Cross-Origin Resource Sharing Policy)
- **File**: `backend/app/main.py:L41-L47`
- **CVSS v3.1 Score**: 5.3 (`CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N`)

#### Description & Impact
In `backend/app/main.py`, the CORS middleware is registered as:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```
While `settings.ALLOWED_ORIGINS` is properly configured in `config.py` with the trusted frontend URLs, `main.py` directly hardcodes `["*"]`. In production, allowing arbitrary origins could expose APIs to malicious web origins if tokens are shared or browser policies are loosened.

#### Remediation Patch
```python
# backend/app/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS if not settings.OTP_DEV_MODE else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

### Finding SEC-002: Hardcoded Fallback Secrets in Configuration

- **Severity**: Medium
- **Category**: Secrets Management / Key Security
- **CWE**: CWE-798 (Use of Hard-coded Credentials)
- **File**: `backend/app/core/config.py:L22-L25`
- **CVSS v3.1 Score**: 5.9 (`CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:H/I:N/A:N`)

#### Description & Impact
`JWT_SECRET_KEY` has a static default string:
```python
JWT_SECRET_KEY: str = "super-secret-key-habitflow-2026-change-in-production-!"
```
If an operator runs in production without supplying a `JWT_SECRET_KEY` environment variable, the application silently boots using the public default secret. Attackers could forge valid JWT tokens for any `user_id`.

#### Remediation Patch
```python
# backend/app/core/config.py
from pydantic import field_validator

class Settings(BaseSettings):
    ...
    JWT_SECRET_KEY: str = "super-secret-key-habitflow-2026-change-in-production-!"

    @field_validator("JWT_SECRET_KEY")
    @classmethod
    def validate_secret_key(cls, v: str) -> str:
        if os.getenv("ENVIRONMENT") == "production" and "change-in-production" in v:
            raise ValueError("Insecure default JWT_SECRET_KEY detected in production!")
        return v
```

---

### Finding SEC-003: Absence of Application-Level Rate Limiting on Login

- **Severity**: Low
- **Category**: Rate Limiting / Brute-Force Mitigation
- **CWE**: CWE-307 (Improper Restriction of Excessive Authentication Attempts)
- **File**: `backend/app/routers/auth.py:L266-L283`
- **CVSS v3.1 Score**: 3.7 (`CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:L/I:N/A:N`)

#### Description & Impact
The `/api/auth/phone/send-otp`, `/api/auth/phone/verify-otp`, and `/api/auth/forgot-password` routes have strict cooldowns and max attempt limits (5 attempts). However, `/api/auth/login` (email + password) does not currently have per-IP or per-account rate limiting within the FastAPI application code.

#### Remediation Patch
Integrate `slowapi` or configure reverse proxy (Nginx `limit_req_zone`) rate limiting:
```python
# Nginx / Reverse Proxy Config
limit_req_zone $binary_remote_addr zone=login_limit:10m rate=5r/m;

location /api/auth/login {
    limit_req zone=login_limit burst=5 nodelay;
    proxy_pass http://backend:8000;
}
```
