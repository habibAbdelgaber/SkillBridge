"""Scheduling serializers."""
from __future__ import annotations

from datetime import date as date_cls

from rest_framework import serializers

from apps.scheduling.models import AvailabilityException, WeeklyAvailability


class WeeklyAvailabilitySerializer(serializers.ModelSerializer):
    """Provider recurring weekly slot."""

    class Meta:
        model = WeeklyAvailability
        fields = (
            "id",
            "weekday",
            "start_time",
            "end_time",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def validate(self, attrs):
        start = attrs.get("start_time", getattr(self.instance, "start_time", None))
        end = attrs.get("end_time", getattr(self.instance, "end_time", None))
        if start and end and start >= end:
            raise serializers.ValidationError(
                {"end_time": "End time must be after start time."},
            )
        return attrs


class AvailabilityExceptionSerializer(serializers.ModelSerializer):
    """One-day availability override."""

    class Meta:
        model = AvailabilityException
        fields = (
            "id",
            "date",
            "start_time",
            "end_time",
            "is_available",
            "reason",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def validate_date(self, value: date_cls) -> date_cls:
        # Past overrides do not affect future booking decisions.
        from django.utils import timezone

        if value < timezone.localdate():
            raise serializers.ValidationError(
                "Cannot create an availability exception in the past.",
            )
        return value

    def validate(self, attrs):
        start = attrs.get("start_time", getattr(self.instance, "start_time", None))
        end = attrs.get("end_time", getattr(self.instance, "end_time", None))
        if start and end and start >= end:
            raise serializers.ValidationError(
                {"end_time": "End time must be after start time."},
            )
        return attrs


class ResolvedSlotSerializer(serializers.Serializer):
    """Open interval on one date."""

    start_time = serializers.TimeField()
    end_time = serializers.TimeField()


class ResolvedAvailabilityDaySerializer(serializers.Serializer):
    """Resolved availability for one date."""

    date = serializers.DateField()
    weekday = serializers.IntegerField()
    slots = ResolvedSlotSerializer(many=True)
