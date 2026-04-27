"""Django admin registrations for the services app."""
from __future__ import annotations

from django.contrib import admin

from apps.services.models import Service, ServiceCategory


@admin.register(ServiceCategory)
class ServiceCategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "is_active", "created_at")
    list_filter = ("is_active",)
    search_fields = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}
    readonly_fields = ("created_at", "updated_at")
    ordering = ("name",)


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "provider",
        "category",
        "price",
        "duration_minutes",
        "location_type",
        "is_active",
        "created_at",
    )
    list_filter = ("is_active", "location_type", "category")
    search_fields = (
        "title",
        "slug",
        "description",
        "provider__business_name",
        "provider__user__email",
    )
    autocomplete_fields = ("provider", "category")
    readonly_fields = ("created_at", "updated_at")
    list_select_related = ("provider", "category")
    ordering = ("-created_at",)
