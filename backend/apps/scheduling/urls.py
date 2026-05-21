"""Scheduling routes."""
from __future__ import annotations

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.scheduling.views import (
    MyAvailabilityExceptionViewSet,
    MyWeeklyAvailabilityViewSet,
    PublicProviderAvailabilityView,
)

app_name = "scheduling"

me_router = DefaultRouter()
me_router.register(
    r"weekly",
    MyWeeklyAvailabilityViewSet,
    basename="my-weekly-availability",
)
me_router.register(
    r"exceptions",
    MyAvailabilityExceptionViewSet,
    basename="my-availability-exception",
)

urlpatterns = [
    path("me/availability/", include(me_router.urls)),
    path(
        "providers/<uuid:provider_id>/availability/",
        PublicProviderAvailabilityView.as_view(),
        name="public-provider-availability",
    ),
]
