"""Service and marketplace routes."""
from __future__ import annotations

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.services.views import (
    MyServicesViewSet,
    PublicServiceViewSet,
    ServiceCategoryViewSet,
)
from apps.users.public_views import PublicProviderViewSet

app_name = "services"

# Separate routers avoid public and owner route collisions.
public_router = DefaultRouter()
public_router.register(r"categories", ServiceCategoryViewSet, basename="category")
public_router.register(r"services", PublicServiceViewSet, basename="service")
public_router.register(r"providers", PublicProviderViewSet, basename="provider")

owner_router = DefaultRouter()
owner_router.register(r"services", MyServicesViewSet, basename="my-service")

urlpatterns = [
    path("", include(public_router.urls)),
    path("me/", include(owner_router.urls)),
]
