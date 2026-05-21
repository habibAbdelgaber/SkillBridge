"""Serializers for the marketplace catalog."""
from __future__ import annotations

from decimal import Decimal

from django.utils.text import slugify
from rest_framework import serializers

from apps.services.models import Review, Service, ServiceCategory
from apps.users.serializers import PublicProviderProfileSerializer


class ServiceCategorySerializer(serializers.ModelSerializer):
    """Category payload shown in public listings."""

    class Meta:
        model = ServiceCategory
        fields = ("id", "name", "slug", "description", "is_active")
        read_only_fields = fields


class ServiceCategoryAdminSerializer(serializers.ModelSerializer):
    """Admin category writes."""

    slug = serializers.SlugField(max_length=140, required=False, allow_blank=True)

    class Meta:
        model = ServiceCategory
        fields = ("id", "name", "slug", "description", "is_active", "created_at", "updated_at")
        read_only_fields = ("id", "created_at", "updated_at")

    def validate(self, attrs: dict) -> dict:
        if not attrs.get("slug") and attrs.get("name"):
            attrs["slug"] = slugify(attrs["name"])[:140]
        return attrs


class _ServiceBaseSerializer(serializers.ModelSerializer):
    """Shared service fields and validation."""

    category = ServiceCategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=ServiceCategory.objects.filter(is_active=True),
        source="category",
        write_only=True,
        help_text="UUID of an active ServiceCategory.",
    )
    provider = PublicProviderProfileSerializer(read_only=True)
    rating = serializers.SerializerMethodField()

    class Meta:
        model = Service
        fields = (
            "id",
            "provider",
            "category",
            "category_id",
            "title",
            "subtitle",
            "slug",
            "description",
            "price",
            "pricing_type",
            "duration_minutes",
            "location_type",
            "service_location_name",
            "service_address",
            "service_city",
            "service_country",
            "latitude",
            "longitude",
            "hero_image_url",
            "is_featured",
            "rating",
            "is_active",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "provider",
            "category",
            "rating",
            "created_at",
            "updated_at",
        )

    def get_rating(self, obj: Service) -> dict:
        return {
            "average": float(obj.rating_average),
            "count": obj.rating_count,
        }

    def validate_price(self, value: Decimal) -> Decimal:
        if value is None or value <= Decimal("0"):
            raise serializers.ValidationError("Price must be greater than zero.")
        return value

    def validate_duration_minutes(self, value: int) -> int:
        if value is None or value <= 0:
            raise serializers.ValidationError("Duration must be at least one minute.")
        return value


class ServicePublicSerializer(_ServiceBaseSerializer):
    """Public marketplace service payload."""

    class Meta(_ServiceBaseSerializer.Meta):
        fields = (
            "id",
            "provider",
            "category",
            "title",
            "subtitle",
            "slug",
            "description",
            "price",
            "pricing_type",
            "duration_minutes",
            "location_type",
            "service_location_name",
            "service_address",
            "service_city",
            "service_country",
            "latitude",
            "longitude",
            "hero_image_url",
            "is_featured",
            "rating",
            "created_at",
        )
        read_only_fields = fields


class ServiceMiniSerializer(serializers.ModelSerializer):
    """Compact service payload nested in provider detail."""

    category = ServiceCategorySerializer(read_only=True)
    rating = serializers.SerializerMethodField()

    class Meta:
        model = Service
        fields = (
            "id",
            "category",
            "title",
            "subtitle",
            "slug",
            "price",
            "pricing_type",
            "duration_minutes",
            "location_type",
            "service_location_name",
            "service_address",
            "service_city",
            "service_country",
            "latitude",
            "longitude",
            "hero_image_url",
            "is_featured",
            "rating",
        )
        read_only_fields = fields

    def get_rating(self, obj: Service) -> dict:
        return {
            "average": float(obj.rating_average),
            "count": obj.rating_count,
        }


class ServiceOwnerSerializer(_ServiceBaseSerializer):
    """Service payload for the owning provider."""


class ServiceWriteSerializer(_ServiceBaseSerializer):
    """Provider create/update payload."""

    slug = serializers.SlugField(max_length=200, required=False, allow_blank=True)

    class Meta(_ServiceBaseSerializer.Meta):
        fields = _ServiceBaseSerializer.Meta.fields
        read_only_fields = (
            "id",
            "provider",
            "category",
            "rating",
            "created_at",
            "updated_at",
        )

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

        # Keep slug errors field-specific instead of surfacing an IntegrityError.
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


class PublicReviewSerializer(serializers.ModelSerializer):
    """Public review payload for provider profiles."""

    author_name = serializers.SerializerMethodField()
    service_id = serializers.UUIDField(read_only=True)

    class Meta:
        model = Review
        fields = (
            "id",
            "service_id",
            "author_name",
            "rating",
            "body",
            "created_at",
        )
        read_only_fields = fields

    def get_author_name(self, obj: Review) -> str:
        if obj.reviewer is None:
            return "SkillBridge customer"
        return obj.reviewer.get_full_name() or "SkillBridge customer"


class PublicProviderDetailSerializer(PublicProviderProfileSerializer):
    """Provider profile payload with services, reviews, and availability."""

    services_offered = serializers.SerializerMethodField()
    reviews = serializers.SerializerMethodField()
    availability = serializers.SerializerMethodField()

    class Meta(PublicProviderProfileSerializer.Meta):
        fields = PublicProviderProfileSerializer.Meta.fields + (
            "services_offered",
            "reviews",
            "availability",
        )
        read_only_fields = fields

    def get_services_offered(self, obj) -> list[dict]:
        services = (
            obj.services
            .select_related("category")
            .filter(is_active=True, category__is_active=True)
            .order_by("-is_featured", "-created_at")
        )
        return ServiceMiniSerializer(services, many=True, context=self.context).data

    def get_reviews(self, obj, *, limit: int = 20) -> list[dict]:
        reviews = (
            Review.objects
            .select_related("reviewer", "service")
            .filter(
                service__provider=obj,
                is_published=True,
                service__is_active=True,
            )
            # Hide any historical self-reviews.
            .exclude(reviewer_id=obj.user_id)
            .order_by("-created_at")[:limit]
        )
        return PublicReviewSerializer(reviews, many=True, context=self.context).data

    def get_availability(self, obj) -> list[dict]:
        """Return the next 7 days of resolved availability."""
        from datetime import timedelta

        from django.utils import timezone

        from apps.scheduling.resolver import resolve_range

        start = timezone.localdate()
        end = start + timedelta(days=6)
        resolved = resolve_range(obj.id, start, end)
        return [
            {
                "date": day.isoformat(),
                "weekday": day.weekday(),
                "slots": [
                    {
                        "start_time": s.to_times()[0].isoformat(timespec="minutes"),
                        "end_time": s.to_times()[1].isoformat(timespec="minutes"),
                    }
                    for s in slots
                ],
            }
            for day, slots in resolved.items()
        ]
