"""URL configuration for the services app.

Three top-level resources, each on its own router so URL patterns never
collide:

- ``/categories/``    - public read; staff write
- ``/services/``      - public read of active services
- ``/me/services/``   - owner CRUD on the caller's own services

Mounted from ``config.api_urls`` under ``/api/v1/``.
"""
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

# Each router gets its own prefix to avoid pattern shadowing
# (e.g. ``services/me/`` would otherwise match ``services/<slug>/``).
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
