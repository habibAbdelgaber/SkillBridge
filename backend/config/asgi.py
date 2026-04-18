"""ASGI config for the SkillBridge project.

Production-oriented default: ASGI servers (uvicorn, daphne) pick the
prod settings unless DJANGO_SETTINGS_MODULE is explicitly set.
"""
import os

from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.prod")

application = get_asgi_application()
