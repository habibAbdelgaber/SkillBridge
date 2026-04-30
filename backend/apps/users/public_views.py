"""Public, marketplace-facing read views for provider profiles.

Kept separate from ``views.py`` (which is auth/registration heavy) so the
boundary between "identity + onboarding" and "browse the directory" stays
clear in the URL conf.
"""
from __future__ import annotations

from rest_framework import filters, mixins, permissions, viewsets

from apps.users.models import ProviderProfile
from apps.users.serializers import PublicProviderProfileSerializer


class PublicProviderViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    """Read-only browse of provider profiles for the public marketplace.

    - Always public (``AllowAny``); inbound auth headers are ignored so a
      stale JWT in the SPA doesn't 401 a browse request.
    - Restricted to active provider users to avoid surfacing soft-deleted
      accounts; ``is_verified`` is exposed as a trust badge but is *not*
      a filter (unverified providers should still be discoverable).
    - Search across business name, headline, and service category for the
      listing page; ordering by ``business_name`` for deterministic
      pagination.
    - The retrieve action upgrades to ``PublicProviderDetailSerializer``
      so the profile page receives services + reviews in one round-trip.
    """

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
        # Local import keeps the users app from importing services at module
        # load time (services already imports users.serializers).
        if self.action == "retrieve":
            from apps.services.serializers import PublicProviderDetailSerializer

            return PublicProviderDetailSerializer
        return PublicProviderProfileSerializer
