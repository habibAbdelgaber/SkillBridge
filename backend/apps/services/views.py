"""Marketplace catalog viewsets."""
from __future__ import annotations

from rest_framework import filters, mixins, permissions, viewsets

from apps.services.models import Service, ServiceCategory
from apps.services.permissions import (
    IsAdminOrReadOnly,
    IsProvider,
    IsServiceOwner,
)
from apps.services.serializers import (
    ServiceCategoryAdminSerializer,
    ServiceCategorySerializer,
    ServiceOwnerSerializer,
    ServicePublicSerializer,
    ServiceWriteSerializer,
)


class ServiceCategoryViewSet(viewsets.ModelViewSet):
    """Public category reads; staff-only writes."""

    permission_classes = (IsAdminOrReadOnly,)
    lookup_field = "slug"
    filter_backends = (filters.SearchFilter, filters.OrderingFilter)
    search_fields = ("name", "slug")
    ordering_fields = ("name", "created_at")
    ordering = ("name",)

    def get_queryset(self):
        qs = ServiceCategory.objects.all()
        user = self.request.user
        if not (user and user.is_authenticated and user.is_staff):
            qs = qs.filter(is_active=True)
        return qs

    def get_serializer_class(self):
        user = self.request.user
        if user and user.is_authenticated and user.is_staff:
            return ServiceCategoryAdminSerializer
        return ServiceCategorySerializer


class PublicServiceViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    """Public service browse and detail."""

    serializer_class = ServicePublicSerializer
    permission_classes = (permissions.AllowAny,)
    authentication_classes: tuple = ()
    filter_backends = (filters.SearchFilter, filters.OrderingFilter)
    search_fields = ("title", "description", "provider__business_name")
    ordering_fields = ("created_at", "price", "duration_minutes", "is_featured")
    ordering = ("-is_featured", "-created_at")

    def get_queryset(self):
        qs = (
            Service.objects
            .select_related("category", "provider", "provider__user")
            .filter(
                is_active=True,
                category__is_active=True,
                provider__user__is_active=True,
            )
        )
        params = self.request.query_params
        if (cat_slug := params.get("category")):
            qs = qs.filter(category__slug=cat_slug)
        if (provider_id := params.get("provider")):
            qs = qs.filter(provider_id=provider_id)
        if (location := params.get("location_type")):
            qs = qs.filter(location_type=location)
        return qs


class MyServicesViewSet(viewsets.ModelViewSet):
    """Provider-scoped CRUD for the requester's services."""

    permission_classes = (permissions.IsAuthenticated, IsProvider, IsServiceOwner)
    filter_backends = (filters.OrderingFilter,)
    ordering_fields = ("created_at", "title", "price")
    ordering = ("-created_at",)

    def get_queryset(self):
        user = self.request.user
        provider = getattr(user, "provider_profile", None)
        if provider is None:
            return Service.objects.none()
        return (
            Service.objects
            .select_related("category", "provider", "provider__user")
            .filter(provider=provider)
        )

    def get_serializer_class(self):
        if self.action in {"create", "update", "partial_update"}:
            return ServiceWriteSerializer
        return ServiceOwnerSerializer
