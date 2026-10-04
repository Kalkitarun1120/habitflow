import pytest
from pydantic import ValidationError
from app.core.config import Settings
from app.core.rate_limiter import RateLimiter
from fastapi import Request, HTTPException
import asyncio


def test_jwt_secret_validation_in_production(monkeypatch):
    monkeypatch.setenv("ENVIRONMENT", "production")
    
    # Insecure default secret in production must fail validation
    with pytest.raises(ValidationError):
        Settings(JWT_SECRET_KEY="super-secret-key-habitflow-2026-change-in-production-!")

    # Strong custom secret in production must succeed
    valid_settings = Settings(
        JWT_SECRET_KEY="a-very-strong-and-secure-random-256-bit-key-for-prod-environment"
    )
    assert valid_settings.JWT_SECRET_KEY == "a-very-strong-and-secure-random-256-bit-key-for-prod-environment"


def test_jwt_secret_validation_in_development(monkeypatch):
    monkeypatch.setenv("ENVIRONMENT", "development")
    # In development, fallback secret is allowed for local dev ease
    dev_settings = Settings(JWT_SECRET_KEY="super-secret-key-habitflow-2026-change-in-production-!")
    assert dev_settings.JWT_SECRET_KEY == "super-secret-key-habitflow-2026-change-in-production-!"


@pytest.mark.asyncio
async def test_rate_limiter_enforcement():
    limiter = RateLimiter(max_requests=2, window_seconds=10, name="test_limiter")
    
    class DummyClient:
        host = "192.168.1.100"
        
    class DummyRequest:
        headers = {}
        client = DummyClient()

    req = DummyRequest()

    # First 2 requests should succeed
    await limiter(req)
    await limiter(req)

    # 3rd request should raise HTTPException with 429
    with pytest.raises(HTTPException) as exc_info:
        await limiter(req)
    assert exc_info.value.status_code == 429
    assert "Rate limit exceeded" in exc_info.value.detail
