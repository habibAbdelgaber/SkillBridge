"""Common views shared across the SkillBridge project."""
from __future__ import annotations

from django.conf import settings
from django.db import connection
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response


@api_view(["GET"])
@permission_classes([AllowAny])
def health_check(_: Request) -> Response:
    """Lightweight liveness/readiness probe.

    Returns the service status and a database-reachability flag so that
    container orchestrators and uptime monitors can distinguish a live
    process from one that cannot reach its dependencies.
    """
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        db_ok = True
    except Exception:  # noqa: BLE001 - surface as structured payload
        db_ok = False

    payload = {
        "status": "ok" if db_ok else "degraded",
        "service": "skillbridge-backend",
        "debug": settings.DEBUG,
        "timestamp": timezone.now().isoformat(),
        "database": "ok" if db_ok else "unreachable",
    }
    return Response(payload, status=200 if db_ok else 503)
