"""Versioned API routes."""
from django.urls import include, path

urlpatterns = [
    path("v1/auth/", include("apps.users.urls", namespace="users")),
    path("v1/", include("apps.services.urls", namespace="services")),
    path("v1/", include("apps.scheduling.urls", namespace="scheduling")),
    path("v1/", include("apps.bookings.urls", namespace="bookings")),
]
