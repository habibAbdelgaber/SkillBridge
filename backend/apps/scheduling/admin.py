"""Scheduling admin."""
from __future__ import annotations

from django.contrib import admin

from apps.scheduling.models import AvailabilityException, WeeklyAvailability


@admin.register(WeeklyAvailability)
class WeeklyAvailabilityAdmin(admin.ModelAdmin):
    list_display = ("provider", "weekday", "start_time", "end_time")
    list_filter = ("weekday",)
    search_fields = ("provider__business_name", "provider__user__email")
    ordering = ("provider", "weekday", "start_time")
    autocomplete_fields = ("provider",)


@admin.register(AvailabilityException)
class AvailabilityExceptionAdmin(admin.ModelAdmin):
    list_display = (
        "provider",
        "date",
        "start_time",
        "end_time",
        "is_available",
        "reason",
    )
    list_filter = ("is_available", "date")
    search_fields = ("provider__business_name", "provider__user__email", "reason")
    ordering = ("-date", "start_time")
    autocomplete_fields = ("provider",)
    date_hierarchy = "date"
