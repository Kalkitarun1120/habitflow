import os
from typing import List, Optional
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "HabitFlow API"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api"

    # MySQL Database Config
    MYSQL_HOST: str = "localhost"
    MYSQL_PORT: int = 3306
    MYSQL_USER: str = "root"
    MYSQL_PASSWORD: str = "password"
    MYSQL_DATABASE: str = "habitflow"

    # Database URL override or computed
    DATABASE_URL: Optional[str] = None

    # Environment & Security Config
    ENVIRONMENT: str = "development"
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_TESTING: bool = False

    # JWT Config
    JWT_SECRET_KEY: str = "super-secret-key-habitflow-2026-change-in-production-!"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days token

    # CORS
    FRONTEND_URL: str = "http://localhost:5173"
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:4173",
    ]

    # Google OAuth 2.0 / OpenID Connect Config
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None

    # SMS / OTP Provider Config (Twilio Verify)
    SMS_PROVIDER: str = "twilio"  # "twilio" or "console"
    TWILIO_ACCOUNT_SID: Optional[str] = None
    TWILIO_AUTH_TOKEN: Optional[str] = None
    TWILIO_PHONE_NUMBER: Optional[str] = None
    TWILIO_VERIFY_SERVICE_SID: Optional[str] = None

    # OTP Security Config
    OTP_EXPIRY_SECONDS: int = 300  # 5 minutes
    OTP_MAX_ATTEMPTS: int = 5
    OTP_RESEND_COOLDOWN_SECONDS: int = 60
    OTP_DEV_MODE: bool = False  # Set to True for local testing without Twilio SMS delivery

    @field_validator("JWT_SECRET_KEY")
    @classmethod
    def validate_jwt_secret_key(cls, v: str) -> str:
        env = os.getenv("ENVIRONMENT", "development").lower()
        if env == "production" and ("change-in-production" in v or len(v) < 32):
            raise ValueError(
                "CRITICAL SECURITY CONFIGURATION ERROR: Insecure or default JWT_SECRET_KEY detected in production environment! "
                "Please set a strong, random 256-bit secret key in your environment variables."
            )
        return v

    model_config = SettingsConfigDict(
        env_file=(".env", "backend/.env", "../.env", os.path.join(os.path.dirname(__file__), "..", "..", ".env")),
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    def get_database_url(self) -> str:
        if self.DATABASE_URL:
            return self.DATABASE_URL
        import urllib.parse
        encoded_pwd = urllib.parse.quote_plus(self.MYSQL_PASSWORD)
        return f"mysql+pymysql://{self.MYSQL_USER}:{encoded_pwd}@{self.MYSQL_HOST}:{self.MYSQL_PORT}/{self.MYSQL_DATABASE}?charset=utf8mb4"


settings = Settings()
