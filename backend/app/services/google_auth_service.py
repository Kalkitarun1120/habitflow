import logging
import httpx
from typing import Dict, Any
from fastapi import HTTPException, status

from app.core.config import settings

logger = logging.getLogger("habitflow.google_auth")


async def verify_google_id_token(credential: str) -> Dict[str, Any]:
    """
    Verifies Google OAuth2 / OpenID Connect ID token using Google's tokeninfo API.
    Extracts verified identity payload containing subject ID, email, name, and avatar.
    """
    if not credential or not credential.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google ID token credential is required."
        )

    url = f"https://oauth2.googleapis.com/tokeninfo?id_token={credential.strip()}"

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url)
            if response.status_code != 200:
                logger.warning(f"Google token verification failed ({response.status_code}): {response.text}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Google sign-in could not be verified. Invalid or expired Google token."
                )
            
            payload = response.json()

            # Verify Issuer
            iss = payload.get("iss", "")
            if iss not in ("accounts.google.com", "https://accounts.google.com"):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token issuer."
                )

            # Verify Audience if client ID is configured
            if settings.GOOGLE_CLIENT_ID:
                aud = payload.get("aud", "")
                if aud != settings.GOOGLE_CLIENT_ID:
                    logger.warning(f"Audience mismatch: expected {settings.GOOGLE_CLIENT_ID}, received {aud}")
                    # In dev/testing if not matching, we warn but allow if matching tokeninfo,
                    # but in production we enforce audience matching.
                    if not settings.OTP_DEV_MODE:
                        raise HTTPException(
                            status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Google Client ID audience mismatch."
                        )

            # Check email verification status
            email_verified_val = payload.get("email_verified")
            is_email_verified = email_verified_val is True or email_verified_val == "true"

            google_sub = payload.get("sub")
            if not google_sub:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Missing subject identifier in Google token."
                )

            return {
                "google_id": str(google_sub),
                "email": payload.get("email", "").lower().strip() if payload.get("email") else None,
                "name": payload.get("name") or payload.get("given_name") or "HabitFlow User",
                "avatar": payload.get("picture"),
                "is_email_verified": is_email_verified,
            }

    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Error while validating Google ID token: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to communicate with Google authentication services."
        )
