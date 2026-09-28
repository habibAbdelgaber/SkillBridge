"""Booking serializers."""
from __future__ import annotations

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from rest_framework import serializers

from apps.bookings.models import Booking
from apps.services.models import Service
from apps.users.models import ProviderProfile


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

    @transaction.atomic
    def create(self, validated_data):
        request = self.context["request"]
        service: Service = validated_data["service"]

        # Every booking for this provider locks the same existing row. PostgreSQL
        # holds the lock through validation and insert, including when there are
        # no prior bookings for the requested day.
        ProviderProfile.objects.select_for_update().get(pk=service.provider_id)
        service.refresh_from_db()

        booking = Booking(
            customer=request.user,
            provider_id=service.provider_id,
            service=service,
            scheduled_date=validated_data["scheduled_date"],
            start_time=validated_data["start_time"],
            end_time=validated_data["end_time"],
            notes=validated_data.get("notes", ""),
            status=Booking.Status.PENDING,
            total_price=0,
        )
        try:
            booking.full_clean()
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.message_dict) from exc

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
