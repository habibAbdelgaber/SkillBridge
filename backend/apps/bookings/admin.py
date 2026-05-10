"""Booking admin."""
from __future__ import annotations

from django.contrib import admin

from apps.bookings.models import Booking


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "customer",
        "provider",
        "service",
        "scheduled_date",
        "start_time",
        "end_time",
        "status",
        "total_price",
        "created_at",
    )
    list_filter = ("status", "scheduled_date", "service__category")
    search_fields = (
        "customer__email",
        "customer__first_name",
        "customer__last_name",
        "provider__business_name",
        "service__title",
    )
    ordering = ("-scheduled_date", "-start_time")
    autocomplete_fields = ("customer", "provider", "service")
    readonly_fields = ("id", "created_at", "updated_at")
    date_hierarchy = "scheduled_date"
