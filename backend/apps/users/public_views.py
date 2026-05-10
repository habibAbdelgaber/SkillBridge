"""Public provider profile views."""
from __future__ import annotations

from rest_framework import filters, mixins, permissions, viewsets

from apps.users.models import ProviderProfile
from apps.users.serializers import PublicProviderProfileSerializer


class PublicProviderViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    """Read-only provider browse for the marketplace."""

    permission_classes = (permissions.AllowAny,)
    authentication_classes: tuple = ()
    filter_backends = (filters.SearchFilter, filters.OrderingFilter)
    search_fields = (
        "business_name",
        "headline",
        "service_category",
        "service_area",
    )
    ordering_fields = (
        "business_name",
        "created_at",
        "years_of_experience",
        "rating_average",
    )
    ordering = ("business_name",)

    queryset = (
        ProviderProfile.objects
        .select_related("user")
        .filter(user__is_active=True)
    )

    def get_serializer_class(self):
        # Avoid importing services serializers while this module loads.
        if self.action == "retrieve":
            from apps.services.serializers import PublicProviderDetailSerializer

            return PublicProviderDetailSerializer
        return PublicProviderProfileSerializer
