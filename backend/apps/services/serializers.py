"""Serializers for ServiceCategory and Service.

Three shapes for Service so the public surface and the owner-write surface
can evolve independently:

- ``ServicePublicSerializer`` - flat read with embedded category + provider
  cards. What the marketplace consumes.
- ``ServiceWriteSerializer`` - what providers POST/PATCH. Strips read-only
  computed fields, validates business rules, slugifies the title when the
  client doesn't supply a slug.
- ``ServiceOwnerSerializer`` - what a provider sees in their own dashboard.
  Same data as the public serializer but unredacted (e.g. exposes
  ``is_active`` so toggling visibility is one-click).
"""
from __future__ import annotations

from decimal import Decimal

from django.utils.text import slugify
from rest_framework import serializers

from apps.services.models import Service, ServiceCategory
from apps.users.serializers import PublicProviderProfileSerializer


# ---------------------------------------------------------------------------
# Categories
# ---------------------------------------------------------------------------


class ServiceCategorySerializer(serializers.ModelSerializer):
    """Public read shape for a category."""

    class Meta:
        model = ServiceCategory
        fields = ("id", "name", "slug", "description", "is_active")
        read_only_fields = fields


class ServiceCategoryAdminSerializer(serializers.ModelSerializer):
    """Admin-only writes. Slug auto-fills from name when omitted."""

    slug = serializers.SlugField(max_length=140, required=False, allow_blank=True)

    class Meta:
        model = ServiceCategory
        fields = ("id", "name", "slug", "description", "is_active", "created_at", "updated_at")
        read_only_fields = ("id", "created_at", "updated_at")

    def validate(self, attrs: dict) -> dict:
        # Auto-derive a slug from name when the client doesn't supply one;
        # rely on the unique constraint to surface collisions cleanly.
        if not attrs.get("slug") and attrs.get("name"):
            attrs["slug"] = slugify(attrs["name"])[:140]
        return attrs


# ---------------------------------------------------------------------------
# Services
# ---------------------------------------------------------------------------


class _ServiceBaseSerializer(serializers.ModelSerializer):
    """Shared field declarations and validators for Service shapes."""

    category = ServiceCategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=ServiceCategory.objects.filter(is_active=True),
        source="category",
        write_only=True,
        help_text="UUID of an active ServiceCategory.",
    )
    provider = PublicProviderProfileSerializer(read_only=True)

    class Meta:
        model = Service
        fields = (
            "id",
            "provider",
            "category",
            "category_id",
            "title",
            "slug",
            "description",
            "price",
            "duration_minutes",
            "location_type",
            "is_active",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "provider", "category", "created_at", "updated_at")

    # ---- validators --------------------------------------------------------

    def validate_price(self, value: Decimal) -> Decimal:
        if value is None or value <= Decimal("0"):
            raise serializers.ValidationError("Price must be greater than zero.")
        return value

    def validate_duration_minutes(self, value: int) -> int:
        if value is None or value <= 0:
            raise serializers.ValidationError("Duration must be at least one minute.")
        return value


class ServicePublicSerializer(_ServiceBaseSerializer):
    """Public marketplace read shape. ``is_active`` redacted - only active
    services hit this serializer in the first place (queryset-filtered)."""

    class Meta(_ServiceBaseSerializer.Meta):
        fields = (
            "id",
            "provider",
            "category",
            "title",
            "slug",
            "description",
            "price",
            "duration_minutes",
            "location_type",
            "created_at",
        )
        read_only_fields = fields


class ServiceOwnerSerializer(_ServiceBaseSerializer):
    """What the owning provider sees in their own dashboard - includes
    ``is_active`` and ``updated_at`` for self-management."""


class ServiceWriteSerializer(_ServiceBaseSerializer):
    """Provider-side create/update.

    Slug rules
    ----------
    - On create: if the client doesn't supply a slug, derive from title.
      Per-provider uniqueness is enforced by a DB constraint; we surface
      a friendly error before letting it 500.
    - On update: slug is editable but defaults to keeping the existing one.
    """

    slug = serializers.SlugField(max_length=200, required=False, allow_blank=True)

    class Meta(_ServiceBaseSerializer.Meta):
        # Same fields as the base, but slug is now writable.
        fields = _ServiceBaseSerializer.Meta.fields
        read_only_fields = ("id", "provider", "category", "created_at", "updated_at")

    def _resolve_slug(self, attrs: dict, *, instance: Service | None) -> str:
        provided = attrs.get("slug")
        if provided:
            return provided
        if instance is not None:
            return instance.slug
        title = attrs.get("title", "")
        return slugify(title)[:200]

    def validate(self, attrs: dict) -> dict:
        request = self.context.get("request")
        provider = getattr(getattr(request, "user", None), "provider_profile", None)
        if provider is None:
            raise serializers.ValidationError(
                "Authenticated provider profile is required to publish services."
            )

        slug = self._resolve_slug(attrs, instance=self.instance)
        if not slug:
            raise serializers.ValidationError({"slug": "Could not derive a slug from the title."})
        attrs["slug"] = slug

        # Per-provider slug uniqueness. The DB constraint will catch this too,
        # but we intercept here so the client gets a clear field error instead
        # of an IntegrityError-derived 500.
        sibling_qs = Service.objects.filter(provider=provider, slug=slug)
        if self.instance is not None:
            sibling_qs = sibling_qs.exclude(pk=self.instance.pk)
        if sibling_qs.exists():
            raise serializers.ValidationError(
                {"slug": "You already have a service using this slug."}
            )
        return attrs

    def create(self, validated_data: dict) -> Service:
        request = self.context["request"]
        validated_data["provider"] = request.user.provider_profile
        return super().create(validated_data)
