"""Serializers for authentication and user/provider onboarding."""
from __future__ import annotations

from typing import Any

from dj_rest_auth.registration.serializers import RegisterSerializer
from dj_rest_auth.serializers import PasswordResetSerializer as BasePasswordResetSerializer
from django.conf import settings
from django.db import transaction
from rest_framework import serializers

from apps.users.forms import FrontendPasswordResetForm
from apps.users.models import ProviderProfile, User

# ---------------------------------------------------------------------------
# User / provider read serializers
# ---------------------------------------------------------------------------


class ProviderProfileSerializer(serializers.ModelSerializer):
    """Self-service representation: the provider editing their own profile.

    Exposes KYC-sensitive fields (``tax_id``, ``license_or_certification_number``,
    ``insurance_provider``) because the owner is the only consumer.
    """

    class Meta:
        model = ProviderProfile
        fields = (
            "id",
            "business_name",
            "business_type",
            "tax_id",
            "phone_number",
            "service_category",
            "years_of_experience",
            "service_area",
            "short_bio",
            "license_or_certification_number",
            "insurance_provider",
            "is_verified",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "is_verified", "created_at", "updated_at")


class PublicProviderProfileSerializer(serializers.ModelSerializer):
    """Marketplace-facing provider card.

    KYC fields (tax ID, license number, insurance provider) are deliberately
    omitted; ``is_verified`` is exposed as a trust signal but the underlying
    documentation never leaves the admin surface.

    The ``rating`` and ``verifications`` shape mirrors the SPA's
    ``ProviderSummary`` type so the client renders without remapping.
    Aggregates are denormalized on ``ProviderProfile`` and refreshed when
    reviews / bookings change.
    """

    user_id = serializers.UUIDField(source="user.id", read_only=True)
    full_name = serializers.SerializerMethodField()
    rating = serializers.SerializerMethodField()
    verifications = serializers.SerializerMethodField()

    class Meta:
        model = ProviderProfile
        fields = (
            "id",
            "user_id",
            "full_name",
            "business_name",
            "business_type",
            "headline",
            "service_category",
            "years_of_experience",
            "service_area",
            "short_bio",
            "response_time_minutes",
            "is_verified",
            "jobs_completed",
            "rating",
            "verifications",
            "created_at",
        )
        read_only_fields = fields

    def get_full_name(self, obj: ProviderProfile) -> str:
        return obj.user.get_full_name()

    def get_rating(self, obj: ProviderProfile) -> dict:
        # Cast to float so JSON consumers don't need to handle Decimal.
        return {
            "average": float(obj.rating_average),
            "count": obj.rating_count,
        }

    def get_verifications(self, obj: ProviderProfile) -> list[str]:
        return obj.verification_flags


class UserSerializer(serializers.ModelSerializer):
    """Serializer returned by ``GET /auth/user/`` and embedded in login responses."""

    provider_profile = ProviderProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "first_name",
            "last_name",
            "role",
            "is_active",
            "date_joined",
            "provider_profile",
        )
        read_only_fields = (
            "id",
            "email",
            "role",
            "is_active",
            "date_joined",
            "provider_profile",
        )


# ---------------------------------------------------------------------------
# Registration serializers
# ---------------------------------------------------------------------------


class BaseRegisterSerializer(RegisterSerializer):
    """Shared base for role-specific registration serializers.

    Drops the inherited ``username`` field (our user model uses email as
    the unique identifier) and threads ``first_name`` / ``last_name``
    through to the allauth adapter's ``save_user`` call.
    """

    username = None
    first_name = serializers.CharField(required=False, allow_blank=True, max_length=150)
    last_name = serializers.CharField(required=False, allow_blank=True, max_length=150)

    #: Subclasses override to stamp the role on newly-created users.
    role: str = User.Role.CUSTOMER

    def get_cleaned_data(self) -> dict[str, Any]:
        data = super().get_cleaned_data()
        data["first_name"] = self.validated_data.get("first_name", "")
        data["last_name"] = self.validated_data.get("last_name", "")
        return data

    def save(self, request):
        user = super().save(request)
        updates: list[str] = []
        if user.role != self.role:
            user.role = self.role
            updates.append("role")
        cleaned = self.get_cleaned_data()
        if cleaned["first_name"] and user.first_name != cleaned["first_name"]:
            user.first_name = cleaned["first_name"]
            updates.append("first_name")
        if cleaned["last_name"] and user.last_name != cleaned["last_name"]:
            user.last_name = cleaned["last_name"]
            updates.append("last_name")
        if updates:
            user.save(update_fields=updates)
        return user


class CustomerRegisterSerializer(BaseRegisterSerializer):
    """Customer signup: email + password + optional personal name."""

    role = User.Role.CUSTOMER


class ProviderRegisterSerializer(BaseRegisterSerializer):
    """Provider signup: customer fields plus business onboarding details."""

    role = User.Role.PROVIDER

    # Provider-specific fields. Validation rules mirror ProviderProfile.
    business_name = serializers.CharField(max_length=255)
    business_type = serializers.ChoiceField(choices=ProviderProfile.BusinessType.choices)
    tax_id = serializers.CharField(max_length=64, required=False, allow_blank=True)
    phone_number = serializers.CharField(max_length=32)
    service_category = serializers.CharField(max_length=128)
    years_of_experience = serializers.IntegerField(min_value=0, max_value=80)
    service_area = serializers.CharField(max_length=255)
    short_bio = serializers.CharField(required=False, allow_blank=True, max_length=2000)
    license_or_certification_number = serializers.CharField(
        required=False, allow_blank=True, max_length=128
    )
    insurance_provider = serializers.CharField(
        required=False, allow_blank=True, max_length=128
    )

    _PROVIDER_FIELDS = (
        "business_name",
        "business_type",
        "tax_id",
        "phone_number",
        "service_category",
        "years_of_experience",
        "service_area",
        "short_bio",
        "license_or_certification_number",
        "insurance_provider",
    )

    def validate_phone_number(self, value: str) -> str:
        cleaned = value.strip()
        if len(cleaned) < 7:
            raise serializers.ValidationError("Enter a valid phone number.")
        return cleaned

    def validate_business_name(self, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise serializers.ValidationError("Business name is required.")
        return cleaned

    @transaction.atomic
    def save(self, request):
        user = super().save(request)
        ProviderProfile.objects.create(
            user=user,
            **{field: self.validated_data.get(field, "") for field in self._PROVIDER_FIELDS},
        )
        return user


# ---------------------------------------------------------------------------
# Password reset - rewrite reset link to point at the frontend SPA route.
# ---------------------------------------------------------------------------


class FrontendPasswordResetSerializer(BasePasswordResetSerializer):
    """Direct password-reset emails at the frontend's confirm page.

    Two pieces work together:

    1. ``password_reset_form_class`` - a subclass of Django's
       ``PasswordResetForm`` that does NOT call ``reverse('password_reset_confirm')``.
       The SPA owns the confirm step, so that URL name is intentionally absent
       from this project's URL conf. The form builds the SPA URL itself.

    2. ``get_email_options`` - surfaces ``frontend_url`` to the email template
       in case the (HTML) template wants to use brand colors keyed off the host.

    The frontend receives ``uid`` and ``token`` as URL params on
    ``/reset-password/:uid/:token`` and POSTs them back to
    ``/api/v1/auth/password/reset/confirm/``.
    """

    @property
    def password_reset_form_class(self):  # type: ignore[override]
        return FrontendPasswordResetForm

    def get_email_options(self) -> dict[str, Any]:
        frontend_url = getattr(settings, "FRONTEND_URL", "").rstrip("/")
        return {
            "subject_template_name": "registration/password_reset_subject.txt",
            "email_template_name": "registration/password_reset_email.html",
            "extra_email_context": {
                "frontend_url": frontend_url,
            },
        }
