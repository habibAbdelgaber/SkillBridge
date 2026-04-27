"""Viewsets for ServiceCategory and Service.

Three viewsets, one per concern:

- ``ServiceCategoryViewSet``    -> ``/categories/`` (read for everyone,
                                    write for staff)
- ``PublicServiceViewSet``      -> ``/services/`` (read-only, only active
                                    services from active providers)
- ``MyServicesViewSet``         -> ``/me/services/`` (full CRUD scoped to
                                    the requester's own provider profile)

Splitting public read from owner write keeps each surface focused: the
public viewset can pre-filter aggressively without complicating owner
lookups, and the owner viewset can expose ``is_active`` toggles without
those leaking into the public serializer.
"""
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


# ---------------------------------------------------------------------------
# Categories
# ---------------------------------------------------------------------------


class ServiceCategoryViewSet(viewsets.ModelViewSet):
    """Public read; staff-only writes.

    A single ModelViewSet keeps the surface minimal but the permission class
    enforces the read/write asymmetry. We swap the serializer based on the
    action so admins see audit fields (``created_at``/``updated_at``) and the
    public sees only the marketplace card.
    """

    permission_classes = (IsAdminOrReadOnly,)
    lookup_field = "slug"
    filter_backends = (filters.SearchFilter, filters.OrderingFilter)
    search_fields = ("name", "slug")
    ordering_fields = ("name", "created_at")
    ordering = ("name",)

    def get_queryset(self):
        qs = ServiceCategory.objects.all()
        # Hide inactive categories from non-staff browsers; admins see them
        # so they can flip ``is_active`` from the API.
        user = self.request.user
        if not (user and user.is_authenticated and user.is_staff):
            qs = qs.filter(is_active=True)
        return qs

    def get_serializer_class(self):
        user = self.request.user
        if user and user.is_authenticated and user.is_staff:
            return ServiceCategoryAdminSerializer
        return ServiceCategorySerializer


# ---------------------------------------------------------------------------
# Services - public read
# ---------------------------------------------------------------------------


class PublicServiceViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    """Marketplace browse: only active services from active providers.

    Filters supported via query params:
    - ``?category=<slug>``           - by category slug
    - ``?provider=<provider_uuid>``  - by provider profile id
    - ``?location_type=remote``      - by location type
    - ``?search=<term>``             - title / description / business_name
    """

    serializer_class = ServicePublicSerializer
    permission_classes = (permissions.AllowAny,)
    authentication_classes: tuple = ()
    filter_backends = (filters.SearchFilter, filters.OrderingFilter)
    search_fields = ("title", "description", "provider__business_name")
    ordering_fields = ("created_at", "price", "duration_minutes")
    ordering = ("-created_at",)

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


# ---------------------------------------------------------------------------
# Services - owner CRUD
# ---------------------------------------------------------------------------


class MyServicesViewSet(viewsets.ModelViewSet):
    """Provider-scoped CRUD over the requester's own services.

    - ``list`` and ``retrieve`` return both active and inactive entries so
      the owner can manage visibility.
    - ``destroy`` performs a hard delete; providers wanting a reversible
      "hide it" flow toggle ``is_active=False`` instead.
    - ``IsServiceOwner`` is technically redundant given ``get_queryset``
      filters by owner already; keeping it is a belt-and-braces guard
      against future refactors that broaden the queryset.
    """

    permission_classes = (permissions.IsAuthenticated, IsProvider, IsServiceOwner)
    filter_backends = (filters.OrderingFilter,)
    ordering_fields = ("created_at", "title", "price")
    ordering = ("-created_at",)

    def get_queryset(self):
        user = self.request.user
        # Anonymous schema generation (drf-spectacular etc.) hits get_queryset
        # before permissions; bail out cleanly.
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
