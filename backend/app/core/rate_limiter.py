import time
import threading
from typing import Dict, List
from fastapi import Request, HTTPException, status
from app.core.config import settings


class RateLimiter:
    """
    Thread-safe in-memory sliding-window rate limiter for FastAPI endpoints.
    Tracks requests per client IP and enforces window limits with auto-cleanup.
    """

    def __init__(self, max_requests: int = 10, window_seconds: int = 60, name: str = "default", enabled: bool = True):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.name = name
        self.enabled = enabled
        self.records: Dict[str, List[float]] = {}
        self.lock = threading.Lock()
        self.last_cleanup = time.time()

    def reset(self) -> None:
        """Clears rate limit records (useful for test suites)."""
        with self.lock:
            self.records.clear()

    def _get_client_ip(self, request: Request) -> str:
        """Extracts client IP address considering proxy headers."""
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            # X-Forwarded-For: client, proxy1, proxy2
            return forwarded.split(",")[0].strip()
        if request.client and request.client.host:
            return request.client.host
        return "127.0.0.1"

    def _cleanup_expired(self, current_time: float) -> None:
        """Removes expired entries periodically to prevent memory growth."""
        if current_time - self.last_cleanup > 300:  # Cleanup every 5 minutes
            cutoff = current_time - self.window_seconds
            expired_keys = [
                key for key, timestamps in self.records.items()
                if not timestamps or timestamps[-1] < cutoff
            ]
            for key in expired_keys:
                del self.records[key]
            self.last_cleanup = current_time

    async def __call__(self, request: Request) -> None:
        """FastAPI dependency handler."""
        if not self.enabled or not getattr(settings, "RATE_LIMIT_ENABLED", True):
            return

        client_ip = self._get_client_ip(request)
        if client_ip == "testclient" and not getattr(settings, "RATE_LIMIT_TESTING", False):
            return

        current_time = time.time()
        key = f"{self.name}:{client_ip}"
        cutoff = current_time - self.window_seconds

        with self.lock:
            self._cleanup_expired(current_time)

            timestamps = self.records.get(key, [])
            # Filter timestamps within current window
            valid_timestamps = [t for t in timestamps if t > cutoff]

            if len(valid_timestamps) >= self.max_requests:
                oldest_valid = valid_timestamps[0]
                retry_after = int(self.window_seconds - (current_time - oldest_valid)) + 1
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Rate limit exceeded. Too many requests. Please try again in {retry_after} seconds.",
                    headers={"Retry-After": str(max(1, retry_after))},
                )

            valid_timestamps.append(current_time)
            self.records[key] = valid_timestamps


# Standard rate limiter instances
login_rate_limiter = RateLimiter(max_requests=10, window_seconds=60, name="login")
register_rate_limiter = RateLimiter(max_requests=10, window_seconds=60, name="register")
password_reset_rate_limiter = RateLimiter(max_requests=5, window_seconds=60, name="password_reset")
phone_otp_rate_limiter = RateLimiter(max_requests=5, window_seconds=60, name="phone_otp")
