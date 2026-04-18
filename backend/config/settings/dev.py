"""Development settings for the SkillBridge project.

Zero-dependency local setup: clone the repo, create a venv, install
requirements, and ``python manage.py runserver`` just works against a
local SQLite database. No PostgreSQL, no container, no env vars required.
"""
from __future__ import annotations

from .base import *  # noqa: F401,F403
from .base import BASE_DIR, env_bool, env_list

# ---------------------------------------------------------------------------
# Core
# ---------------------------------------------------------------------------
DEBUG = env_bool("DEBUG", default=True)

ALLOWED_HOSTS = env_list(
    "ALLOWED_HOSTS",
    default="localhost,127.0.0.1,0.0.0.0",
)


# ---------------------------------------------------------------------------
# Database: SQLite, always. Keeps local dev free of external services.
# ---------------------------------------------------------------------------
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}


# ---------------------------------------------------------------------------
# CORS (frontend dev server by default)
# ---------------------------------------------------------------------------
CORS_ALLOWED_ORIGINS = env_list(
    "CORS_ALLOWED_ORIGINS",
    default="http://localhost:5173,http://127.0.0.1:5173",
)
CORS_ALLOW_CREDENTIALS = env_bool("CORS_ALLOW_CREDENTIALS", default=True)


# ---------------------------------------------------------------------------
# Email (console backend so dev flows never hit an SMTP server)
# ---------------------------------------------------------------------------
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"


# ---------------------------------------------------------------------------
# Logging: be more verbose locally
# ---------------------------------------------------------------------------
LOGGING["root"]["level"] = "DEBUG"  # noqa: F405
LOGGING["loggers"]["django"]["level"] = "INFO"  # noqa: F405
