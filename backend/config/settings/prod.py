"""Production settings."""
from __future__ import annotations

import os
from urllib.parse import urlparse

import dj_database_url
from django.core.exceptions import ImproperlyConfigured

from .base import *  # noqa: F401,F403
from .base import MIDDLEWARE, env_bool, env_list

DEBUG = False

SECRET_KEY = os.environ.get("SECRET_KEY", "")
if not SECRET_KEY or SECRET_KEY.startswith("django-insecure"):
    raise ImproperlyConfigured(
        "SECRET_KEY must be set to a strong, unique value in production."
    )

def _hostname(value: str) -> str:
    value = value.strip()
    if not value:
        return ""
    parsed = urlparse(value if "://" in value else f"//{value}")
    return (parsed.hostname or value).strip().rstrip("/")


ALLOWED_HOSTS = [_hostname(host) for host in env_list("ALLOWED_HOSTS", default="")]
ALLOWED_HOSTS = [host for host in ALLOWED_HOSTS if host]

# DigitalOcean App Platform injects the deployed hostname as APP_DOMAIN.
_app_domain = _hostname(os.environ.get("APP_DOMAIN", ""))
if _app_domain and _app_domain not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append(_app_domain)

if not ALLOWED_HOSTS:
    raise ImproperlyConfigured(
        "ALLOWED_HOSTS (or APP_DOMAIN) must be configured in production."
    )


# Prefer DATABASE_URL; keep DB_* as a deployment fallback.
#
# Some PaaS providers (DigitalOcean App Platform, Heroku) don't expose
# component-bound env vars during the BUILD phase. ``collectstatic`` and
# ``check`` don't touch the database, so we must let the settings module
# import cleanly even when DATABASE_URL is missing. We configure a
# deferred-failure sentinel (SQLite in-memory) that's never actually
# queried at runtime — by then the real DATABASE_URL is bound and a real
# Postgres connection is used.
_database_url = os.environ.get("DATABASE_URL", "").strip()

# Reject obvious non-URLs (e.g. an unresolved App Platform binding token
# like ``${db.DATABASE_URL}`` that fell through because the component
# name was wrong). dj_database_url would otherwise fail with an opaque
# "No support for ''" message; treating these as unset gives the boot
# guard below a chance to print something actionable.
if _database_url and "://" not in _database_url:
    import logging

    logging.getLogger(__name__).error(
        "DATABASE_URL is set but doesn't look like a URL (got %r). "
        "Treating as unset. On DigitalOcean App Platform make sure the "
        "binding token matches your database component name "
        "(e.g. DATABASE_URL=${db.DATABASE_URL} where 'db' is the "
        "component slug).",
        _database_url,
    )
    _database_url = ""

_has_db_fallback = all(
    os.environ.get(name, "").strip() for name in ("DB_NAME", "DB_USER", "DB_HOST")
)
DATABASE_CONFIGURED = bool(_database_url or _has_db_fallback)

if _database_url:
    DATABASES = {
        "default": dj_database_url.parse(
            _database_url,
            conn_max_age=int(os.environ.get("DB_CONN_MAX_AGE", "60")),
            ssl_require=env_bool("DB_SSL_REQUIRE", default=True),
        )
    }
elif _has_db_fallback:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": os.environ["DB_NAME"],
            "USER": os.environ["DB_USER"],
            "PASSWORD": os.environ.get("DB_PASSWORD", ""),
            "HOST": os.environ["DB_HOST"],
            "PORT": os.environ.get("DB_PORT", "5432") or "5432",
            "CONN_MAX_AGE": int(os.environ.get("DB_CONN_MAX_AGE", "60")),
            "OPTIONS": {
                "sslmode": os.environ.get("DB_SSLMODE", "require"),
            },
        }
    }
else:
    # Build-phase fallback. Never queried at runtime — by then App
    # Platform has bound DATABASE_URL and the real config is loaded.
    # Any management command that actually needs a DB (migrate, runserver,
    # tests, shell, etc.) is checked at startup below.
    import logging

    logging.getLogger(__name__).warning(
        "DATABASE_URL is not set; using SQLite in-memory sentinel. "
        "Bind a Postgres component before serving traffic."
    )
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": ":memory:",
        }
    }


# At application boot (when gunicorn/manage.py is the entrypoint, NOT
# during a non-DB build command), require real database configuration.
# This gives us the same "fail fast on misconfiguration" guarantee
# without breaking build-time collectstatic.
import sys as _sys  # noqa: E402

_NON_DB_COMMANDS = {"collectstatic", "compress", "compilemessages", "makemessages"}
_running_db_command = not any(arg in _NON_DB_COMMANDS for arg in _sys.argv)
if _running_db_command and not DATABASE_CONFIGURED:
    raise ImproperlyConfigured(
        "Production database is not configured. Set DATABASE_URL "
        "(preferred) or DB_NAME / DB_USER / DB_HOST. App Platform users: "
        "bind the Postgres component and set DATABASE_URL=${db.DATABASE_URL} "
        "in the backend component's env vars."
    )


CORS_ALLOWED_ORIGINS = env_list("CORS_ALLOWED_ORIGINS", default="")
if not CORS_ALLOWED_ORIGINS:
    raise ImproperlyConfigured(
        "CORS_ALLOWED_ORIGINS must list at least one origin in production."
    )
CORS_ALLOW_CREDENTIALS = env_bool("CORS_ALLOW_CREDENTIALS", default=True)


CSRF_TRUSTED_ORIGINS = env_list("CSRF_TRUSTED_ORIGINS", default="")
if _app_domain:
    _app_origin = f"https://{_app_domain}"
    if _app_origin not in CSRF_TRUSTED_ORIGINS:
        CSRF_TRUSTED_ORIGINS.append(_app_origin)


# App Platform terminates TLS at its edge; trust the forwarded scheme.
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_SSL_REDIRECT = env_bool("SECURE_SSL_REDIRECT", default=True)

SECURE_HSTS_SECONDS = int(os.environ.get("SECURE_HSTS_SECONDS", "31536000"))
SECURE_HSTS_INCLUDE_SUBDOMAINS = env_bool("SECURE_HSTS_INCLUDE_SUBDOMAINS", default=True)
SECURE_HSTS_PRELOAD = env_bool("SECURE_HSTS_PRELOAD", default=True)

SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "same-origin"
X_FRAME_OPTIONS = "DENY"

SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = os.environ.get("SESSION_COOKIE_SAMESITE", "Lax")
CSRF_COOKIE_SAMESITE = os.environ.get("CSRF_COOKIE_SAMESITE", "Lax")


MIDDLEWARE = list(MIDDLEWARE)
_security_idx = MIDDLEWARE.index("django.middleware.security.SecurityMiddleware")
MIDDLEWARE.insert(_security_idx + 1, "whitenoise.middleware.WhiteNoiseMiddleware")

STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}


EMAIL_BACKEND = os.environ.get(
    "EMAIL_BACKEND",
    "django.core.mail.backends.smtp.EmailBackend",
)
EMAIL_HOST = os.environ.get("EMAIL_HOST", "")
EMAIL_PORT = int(os.environ.get("EMAIL_PORT", "587"))
EMAIL_HOST_USER = os.environ.get("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.environ.get("EMAIL_HOST_PASSWORD", "")
EMAIL_USE_TLS = env_bool("EMAIL_USE_TLS", default=True)
DEFAULT_FROM_EMAIL = os.environ.get("DEFAULT_FROM_EMAIL", "no-reply@skillbridge.local")


LOGGING["root"]["level"] = os.environ.get("LOG_LEVEL", "INFO")  # noqa: F405
LOGGING["loggers"]["django"]["level"] = os.environ.get("DJANGO_LOG_LEVEL", "WARNING")  # noqa: F405
