"""Service admin."""
from __future__ import annotations

from django.contrib import admin

from apps.services.models import Review, Service, ServiceCategory


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
        "pricing_type",
        "duration_minutes",
        "location_type",
        "service_city",
        "service_country",
        "is_featured",
        "is_active",
        "rating_average",
        "rating_count",
        "created_at",
    )
    list_filter = (
        "is_active",
        "is_featured",
        "pricing_type",
        "location_type",
        "category",
    )
    search_fields = (
        "title",
        "subtitle",
        "slug",
        "description",
        "provider__business_name",
        "provider__user__email",
        "service_location_name",
        "service_address",
        "service_city",
        "service_country",
    )
    autocomplete_fields = ("provider", "category")
    # The model still enforces per-provider slug uniqueness.
    prepopulated_fields = {"slug": ("title",)}
    readonly_fields = ("created_at", "updated_at", "rating_average", "rating_count")
    list_select_related = ("provider", "category")
    ordering = ("-is_featured", "-created_at")


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = (
        "service",
        "reviewer",
        "rating",
        "is_published",
        "created_at",
    )
    list_filter = ("is_published", "rating")
    search_fields = (
        "service__title",
        "reviewer__email",
        "body",
    )
    autocomplete_fields = ("service", "reviewer")
    readonly_fields = ("created_at", "updated_at")
    ordering = ("-created_at",)
