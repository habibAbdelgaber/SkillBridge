"""Booking serializers."""
from __future__ import annotations

from rest_framework import serializers

from apps.bookings.models import Booking
from apps.services.models import Service


class _ServiceMiniSerializer(serializers.ModelSerializer):
    """Service fields embedded in booking reads."""

    class Meta:
        model = Service
        fields = (
            "id",
            "title",
            "subtitle",
            "price",
            "pricing_type",
            "duration_minutes",
            "location_type",
        )
        read_only_fields = fields


class _CustomerMiniSerializer(serializers.Serializer):
    id = serializers.UUIDField(read_only=True)
    email = serializers.EmailField(read_only=True)
    first_name = serializers.CharField(read_only=True)
    last_name = serializers.CharField(read_only=True)


class _ProviderMiniSerializer(serializers.Serializer):
    id = serializers.UUIDField(read_only=True)
    business_name = serializers.CharField(read_only=True)
    service_area = serializers.CharField(read_only=True)
    headline = serializers.CharField(read_only=True, allow_blank=True)


class BookingReadSerializer(serializers.ModelSerializer):
    """Booking read payload."""

    customer = _CustomerMiniSerializer(read_only=True)
    provider = _ProviderMiniSerializer(read_only=True)
    service = _ServiceMiniSerializer(read_only=True)

    class Meta:
        model = Booking
        fields = (
            "id",
            "customer",
            "provider",
            "service",
            "scheduled_date",
            "start_time",
            "end_time",
            "status",
            "total_price",
            "notes",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields


class BookingCreateSerializer(serializers.ModelSerializer):
    """Customer booking create payload."""

    service = serializers.PrimaryKeyRelatedField(
        queryset=Service.objects.filter(is_active=True),
    )

    class Meta:
        model = Booking
        fields = (
            "id",
            "service",
            "scheduled_date",
            "start_time",
            "end_time",
            "notes",
            "status",
            "total_price",
            "created_at",
        )
        read_only_fields = ("id", "status", "total_price", "created_at")

    def validate(self, attrs):
        request = self.context.get("request")
        customer = getattr(request, "user", None) if request else None
        service: Service = attrs["service"]

        # Booking.clean() owns availability and overlap checks.
        booking = Booking(
            customer=customer,
            provider=service.provider,
            service=service,
            scheduled_date=attrs.get("scheduled_date"),
            start_time=attrs.get("start_time"),
            end_time=attrs.get("end_time"),
            notes=attrs.get("notes", ""),
            status=Booking.Status.PENDING,
            # Filled with the derived price in create().
            total_price=0,
        )
        booking.clean()
        return attrs

    def create(self, validated_data):
        request = self.context["request"]
        service: Service = validated_data["service"]

        booking = Booking(
            customer=request.user,
            provider=service.provider,
            service=service,
            scheduled_date=validated_data["scheduled_date"],
            start_time=validated_data["start_time"],
            end_time=validated_data["end_time"],
            notes=validated_data.get("notes", ""),
            status=Booking.Status.PENDING,
            total_price=0,
        )
        booking.total_price = booking.derive_total_price()
        booking.save()
        return booking

    def to_representation(self, instance):
        return BookingReadSerializer(instance, context=self.context).data


class BookingStatusUpdateSerializer(serializers.ModelSerializer):
    """Customer cancellation payload."""

    class Meta:
        model = Booking
        fields = ("status", "notes")

    def validate_status(self, value: str) -> str:
        if value != Booking.Status.CANCELLED:
            raise serializers.ValidationError(
                "Customers can only cancel a booking through this endpoint.",
            )
        if self.instance and self.instance.status == Booking.Status.CANCELLED:
            raise serializers.ValidationError(
                "Booking is already cancelled.",
            )
        return value

    def to_representation(self, instance):
        return BookingReadSerializer(instance, context=self.context).data
