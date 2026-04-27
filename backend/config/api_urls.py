"""Versioned API URL configuration.

Individual apps mount their routers here as they come online.
"""
from django.urls import include, path

urlpatterns = [
    path("v1/auth/", include("apps.users.urls", namespace="users")),
    path("v1/", include("apps.services.urls", namespace="services")),
    # Stage-3+ app routers will be mounted here, e.g.:
    #   path("v1/bookings/", include("apps.bookings.urls")),
]
