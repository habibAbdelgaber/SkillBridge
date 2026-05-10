"""Scheduling endpoints."""
from __future__ import annotations

from datetime import date as date_cls, timedelta

from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import permissions, viewsets
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.scheduling.models import AvailabilityException, WeeklyAvailability
from apps.scheduling.permissions import IsProviderUser
from apps.scheduling.resolver import resolve_range
from apps.scheduling.serializers import (
    AvailabilityExceptionSerializer,
    ResolvedAvailabilityDaySerializer,
    WeeklyAvailabilitySerializer,
)
from apps.users.models import ProviderProfile


class _ProviderScopedViewSet(viewsets.ModelViewSet):
    """Scope provider schedule rows to the current user."""

    permission_classes = (permissions.IsAuthenticated, IsProviderUser)
    pagination_class = None

    def _provider(self) -> ProviderProfile:
        return self.request.user.provider_profile

    def get_queryset(self):
        return super().get_queryset().filter(provider=self._provider())

    def perform_create(self, serializer):
        serializer.save(provider=self._provider())


class MyWeeklyAvailabilityViewSet(_ProviderScopedViewSet):
    queryset = WeeklyAvailability.objects.all()
    serializer_class = WeeklyAvailabilitySerializer


class MyAvailabilityExceptionViewSet(_ProviderScopedViewSet):
    queryset = AvailabilityException.objects.all()
    serializer_class = AvailabilityExceptionSerializer


class PublicProviderAvailabilityView(APIView):
    """Resolved provider availability for the booking flow."""

    permission_classes = (permissions.AllowAny,)
    authentication_classes: tuple = ()

    MAX_DAYS = 31

    def get(self, request, provider_id):
        # Keep inactive providers indistinguishable from missing providers.
        get_object_or_404(
            ProviderProfile.objects.filter(user__is_active=True),
            pk=provider_id,
        )

        start = self._parse_date(request, "from", default=timezone.localdate())
        default_end = start + timedelta(days=6)
        end = self._parse_date(request, "to", default=default_end)
        if end < start:
            raise DRFValidationError({"to": "'to' must be on or after 'from'."})
        if (end - start).days >= self.MAX_DAYS:
            raise DRFValidationError(
                {
                    "to": (
                        f"Date range cannot exceed {self.MAX_DAYS} days. "
                        "Narrow the window and retry."
                    ),
                }
            )

        resolved = resolve_range(provider_id, start, end)
        payload = []
        for day, slots in resolved.items():
            payload.append(
                {
                    "date": day,
                    "weekday": day.weekday(),
                    "slots": [
                        {"start_time": s.to_times()[0], "end_time": s.to_times()[1]}
                        for s in slots
                    ],
                },
            )
        return Response(
            ResolvedAvailabilityDaySerializer(payload, many=True).data,
        )

    def _parse_date(self, request, key: str, *, default: date_cls) -> date_cls:
        raw = request.query_params.get(key)
        if not raw:
            return default
        try:
            return date_cls.fromisoformat(raw)
        except ValueError as exc:
            raise DRFValidationError(
                {key: f"Invalid date '{raw}'. Use YYYY-MM-DD."},
            ) from exc
