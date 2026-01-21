"""Firebase Admin SDK initialization and utilities."""

import base64
import json
import logging
import os
import tempfile
from functools import lru_cache

import firebase_admin
from firebase_admin import auth, credentials

from app.core.config import get_settings

logger = logging.getLogger(__name__)


def _setup_credentials_from_base64(base64_content: str) -> str:
    """
    Decode base64 service account JSON and write to a temp file.
    Returns the path to the temp file.
    
    This is useful for cloud platforms (Railway, Render, Fly.io) that store
    secrets as environment variables rather than mounted files.
    """
    try:
        json_content = base64.b64decode(base64_content).decode("utf-8")
        # Validate it's valid JSON
        json.loads(json_content)
        
        # Write to a temp file that persists for the lifetime of the process
        temp_file = tempfile.NamedTemporaryFile(
            mode="w",
            suffix=".json",
            delete=False,
            prefix="firebase-sa-"
        )
        temp_file.write(json_content)
        temp_file.close()
        
        logger.debug(f"Created temporary service account file: {temp_file.name}")
        return temp_file.name
    except Exception as e:
        logger.error(f"Failed to decode base64 service account: {e}")
        raise ValueError(f"Invalid FIREBASE_SERVICE_ACCOUNT_BASE64: {e}")


@lru_cache()
def initialize_firebase() -> firebase_admin.App:
    """
    Initialize Firebase Admin SDK.
    
    Credentials are loaded in this priority order:
    1. GOOGLE_APPLICATION_CREDENTIALS env var (file path)
    2. FIREBASE_SERVICE_ACCOUNT_BASE64 env var (base64-encoded JSON)
    3. Application Default Credentials (automatic on Google Cloud)
    4. Fallback: project ID only (won't work for token verification)
    
    Returns:
        The initialized Firebase app instance.
    """
    settings = get_settings()
    
    if not settings.firebase_project_id:
        raise ValueError("FIREBASE_PROJECT_ID must be set in environment variables")
    
    # Priority 1: GOOGLE_APPLICATION_CREDENTIALS from settings
    if settings.google_application_credentials and not os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"):
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = settings.google_application_credentials
        logger.debug(f"Using credentials from: {settings.google_application_credentials}")
    
    # Priority 2: Base64-encoded service account (for cloud platforms)
    if settings.firebase_service_account_base64 and not os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"):
        temp_path = _setup_credentials_from_base64(settings.firebase_service_account_base64)
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = temp_path
        logger.debug("Using base64-encoded service account credentials")
    
    logger.debug(f"Initializing Firebase with project ID: {settings.firebase_project_id}")
    
    # Check if already initialized
    if firebase_admin._apps:
        return firebase_admin.get_app()
    
    # Try to initialize with default credentials first
    try:
        cred = credentials.ApplicationDefault()
        app = firebase_admin.initialize_app(cred, {
            'projectId': settings.firebase_project_id,
        })
        logger.info(f"Firebase Admin SDK initialized (project: {settings.firebase_project_id})")
        return app
    except Exception as e:
        logger.warning(f"Could not use Application Default Credentials: {e}")
        # Fallback: Initialize without credentials (limited functionality)
        app = firebase_admin.initialize_app(options={
            'projectId': settings.firebase_project_id,
        })
        logger.warning("Firebase initialized WITHOUT credentials - token verification will fail!")
        return app


def get_firebase_app() -> firebase_admin.App:
    """Get the initialized Firebase app."""
    return initialize_firebase()


def verify_firebase_token(id_token: str) -> dict:
    """
    Verify a Firebase ID token and return the decoded token.
    
    Args:
        id_token: The Firebase ID token from the client.
        
    Returns:
        The decoded token containing user information (uid, email, etc.).
        
    Raises:
        firebase_admin.auth.InvalidIdTokenError: If the token is invalid.
        firebase_admin.auth.ExpiredIdTokenError: If the token has expired.
    """
    initialize_firebase()
    try:
        decoded_token = auth.verify_id_token(id_token)
        logger.debug(f"Token verified for user: {decoded_token.get('uid')}")
        return decoded_token
    except auth.InvalidIdTokenError as e:
        logger.warning(f"Invalid ID token: {e}")
        raise
    except auth.ExpiredIdTokenError as e:
        logger.warning(f"Expired ID token: {e}")
        raise
    except Exception as e:
        logger.error(f"Token verification failed: {type(e).__name__}: {e}")
        raise

