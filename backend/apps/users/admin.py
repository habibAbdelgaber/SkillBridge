"""User admin."""
from __future__ import annotations

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from django.utils.translation import gettext_lazy as _

from apps.users.models import ProviderProfile, User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    ordering = ("-date_joined",)
    list_display = ("email", "role", "first_name", "last_name", "is_staff", "is_active")
    list_filter = ("role", "is_staff", "is_active")
    search_fields = ("email", "first_name", "last_name")

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        (_("Personal info"), {"fields": ("first_name", "last_name", "role")}),
        (
            _("Permissions"),
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        (_("Important dates"), {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "email",
                    "password1",
                    "password2",
                    "role",
                    "is_staff",
                    "is_active",
                ),
            },
        ),
    )


@admin.register(ProviderProfile)
class ProviderProfileAdmin(admin.ModelAdmin):
    """Provider profile admin."""

    list_display = (
        "business_name",
        "user",
        "business_type",
        "service_category",
        "service_area",
        "is_verified",
        "rating_average",
        "rating_count",
        "jobs_completed",
    )
    list_filter = (
        "business_type",
        "is_verified",
        "id_verified",
        "is_insured",
        "background_check_completed",
        "service_category",
    )
    search_fields = ("business_name", "user__email", "service_category", "service_area")
    raw_id_fields = ("user",)
    readonly_fields = (
        "created_at",
        "updated_at",
        "rating_average",
        "rating_count",
        "jobs_completed",
    )

    fieldsets = (
        (None, {"fields": ("user", "business_name", "business_type")}),
        (
            _("Onboarding"),
            {
                "fields": (
                    "tax_id",
                    "phone_number",
                    "service_category",
                    "years_of_experience",
                    "service_area",
                    "license_or_certification_number",
                    "insurance_provider",
                )
            },
        ),
        (
            _("Marketplace presentation"),
            {
                "fields": (
                    "headline",
                    "short_bio",
                    "response_time_minutes",
                )
            },
        ),
        (
            _("Trust & safety"),
            {
                "fields": (
                    "is_verified",
                    "id_verified",
                    "is_insured",
                    "background_check_completed",
                )
            },
        ),
        (
            _("Aggregates"),
            {
                "fields": ("rating_average", "rating_count", "jobs_completed"),
                "description": _(
                    "Maintained by signal handlers; read-only in admin."
                ),
            },
        ),
        (_("Timestamps"), {"fields": ("created_at", "updated_at")}),
    )
