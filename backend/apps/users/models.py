"""User and provider profile models."""
from __future__ import annotations

import uuid
from decimal import Decimal

from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from apps.common.models import TimeStampedModel
from apps.users.managers import UserManager


class User(AbstractBaseUser, PermissionsMixin, TimeStampedModel):
    """Email-based application user."""

    class Role(models.TextChoices):
        CUSTOMER = "customer", _("Customer")
        PROVIDER = "provider", _("Provider")
        ADMIN = "admin", _("Admin")

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(_("email address"), unique=True)
    first_name = models.CharField(_("first name"), max_length=150, blank=True)
    last_name = models.CharField(_("last name"), max_length=150, blank=True)
    role = models.CharField(
        _("role"),
        max_length=20,
        choices=Role.choices,
        default=Role.CUSTOMER,
        db_index=True,
    )

    is_active = models.BooleanField(_("active"), default=True)
    is_staff = models.BooleanField(_("staff status"), default=False)
    date_joined = models.DateTimeField(_("date joined"), default=timezone.now)

    objects = UserManager()

    USERNAME_FIELD = "email"
    EMAIL_FIELD = "email"
    REQUIRED_FIELDS: list[str] = []

    class Meta:
        verbose_name = _("user")
        verbose_name_plural = _("users")
        ordering = ("-date_joined",)

    def __str__(self) -> str:
        return self.email

    def get_full_name(self) -> str:
        full = f"{self.first_name.capitalize()} {self.last_name.capitalize()}".strip()
        return full or self.email

    def get_short_name(self) -> str:
        return self.first_name or self.email

    @property
    def is_customer(self) -> bool:
        return self.role == self.Role.CUSTOMER

    @property
    def is_provider(self) -> bool:
        return self.role == self.Role.PROVIDER

    @property
    def is_admin_role(self) -> bool:
        return self.role == self.Role.ADMIN


class ProviderProfile(TimeStampedModel):
    """Provider-only details used for onboarding and marketplace display."""

    class BusinessType(models.TextChoices):
        INDIVIDUAL = "individual", _("Individual / Sole Trader")
        LLC = "llc", _("LLC")
        CORPORATION = "corporation", _("Corporation")
        PARTNERSHIP = "partnership", _("Partnership")
        NONPROFIT = "nonprofit", _("Nonprofit")
        OTHER = "other", _("Other")

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        "users.User",
        on_delete=models.CASCADE,
        related_name="provider_profile",
    )

    business_name = models.CharField(_("business name"), max_length=255)
    business_type = models.CharField(
        _("business type"),
        max_length=32,
        choices=BusinessType.choices,
        default=BusinessType.INDIVIDUAL,
    )
    tax_id = models.CharField(
        _("tax / registration ID"),
        max_length=64,
        blank=True,
        help_text=_("EIN, VAT, company registration number, etc."),
    )
    phone_number = models.CharField(_("phone number"), max_length=32)
    service_category = models.CharField(_("primary service category"), max_length=128)
    years_of_experience = models.PositiveSmallIntegerField(
        _("years of experience"),
        default=0,
    )
    service_area = models.CharField(
        _("service area"),
        max_length=255,
        help_text=_("City, region, or radius the provider operates in."),
    )
    short_bio = models.TextField(_("short bio"), blank=True)
    license_or_certification_number = models.CharField(
        _("license or certification number"),
        max_length=128,
        blank=True,
    )
    insurance_provider = models.CharField(
        _("insurance provider"),
        max_length=128,
        blank=True,
    )

    headline = models.CharField(
        _("headline"),
        max_length=180,
        blank=True,
        help_text=_(
            "Short tagline shown on the provider profile and listing cards "
            "(e.g. 'Licensed plumber, 12+ years in Tel Aviv')."
        ),
    )
    response_time_minutes = models.PositiveIntegerField(
        _("average response time (minutes)"),
        null=True,
        blank=True,
        help_text=_(
            "Rolling average reply time. Rendered to the customer as "
            "'Replies in under N hours'."
        ),
    )

    is_verified = models.BooleanField(
        _("verified"),
        default=False,
        help_text=_("Set by admins once KYC / onboarding documentation is reviewed."),
    )
    id_verified = models.BooleanField(
        _("ID verified"),
        default=False,
        help_text=_("Government-issued ID has been confirmed."),
    )
    is_insured = models.BooleanField(
        _("insured"),
        default=False,
        help_text=_(
            "Provider has uploaded a valid insurance certificate. Distinct "
            "from ``insurance_provider`` (free-text name) so the badge is "
            "binary and trustworthy."
        ),
    )
    background_check_completed = models.BooleanField(
        _("background check completed"),
        default=False,
        help_text=_("Third-party background check has cleared."),
    )

    jobs_completed = models.PositiveIntegerField(
        _("jobs completed"),
        default=0,
        help_text=_("Lifetime completed-booking counter; updated by signals."),
    )
    rating_average = models.DecimalField(
        _("rating average"),
        max_digits=3,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=(
            MinValueValidator(Decimal("0.00")),
            MaxValueValidator(Decimal("5.00")),
        ),
        help_text=_("Mean of all review ratings (0.00–5.00)."),
    )
    rating_count = models.PositiveIntegerField(
        _("rating count"),
        default=0,
        help_text=_("Number of reviews backing ``rating_average``."),
    )

    class Meta:
        verbose_name = _("provider profile")
        verbose_name_plural = _("provider profiles")
        ordering = ("-created_at",)
        indexes = (
            models.Index(fields=("is_verified", "rating_average")),
        )

    def __str__(self) -> str:
        return f"{self.business_name} ({self.user.email})"

    @property
    def verification_flags(self) -> list[str]:
        """Badge slugs used by marketplace cards."""
        flags: list[str] = []
        if self.id_verified:
            flags.append("id")
        if self.is_insured:
            flags.append("insured")
        if self.background_check_completed:
            flags.append("background")
        return flags
