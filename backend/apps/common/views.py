"""Common views shared across the SkillBridge project."""
from __future__ import annotations

from django.conf import settings
from django.db import connection
from django.utils import timezone
from rest_framework.decorators import (
    api_view,
    authentication_classes,
    permission_classes,
)
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response


@api_view(["GET"])
@authentication_classes([])  # probe must ignore stale/invalid tokens.
@permission_classes([AllowAny])
def health_check(_: Request) -> Response:
    """Liveness probe with a database check."""
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
