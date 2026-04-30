"""Marketplace catalog models.

This app owns the public-facing service catalog. Authentication and the
``ProviderProfile`` (1:1 with a provider ``User``) stay in
``apps.users`` - this app only references those via foreign keys.

Design notes
------------
- ``ServiceCategory`` is a flat lookup table managed by admins. Providers
  pick from the active set; we never delete a category that's referenced
  by a service (FK is ``PROTECT``) - admins deactivate instead.
- ``Service.slug`` is unique *within a provider*, not globally. A hundred
  providers can each own a "deep-cleaning" slug. Public retrieval is
  therefore by primary key (UUID), not slug.
- Soft-delete via ``is_active``: removing a service from public listings
  while preserving booking history is the common path. Hard delete is
  available to providers but should be rare.
- ``Review`` lives here (not in its own app) because it only ever links a
  service + the customer who used it. If the model grows into moderation
  workflows or sentiment scoring, we'll graduate it to ``apps.reviews``.
"""
from __future__ import annotations

from decimal import Decimal

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.common.models import BaseModel


class ServiceCategory(BaseModel):
    """A flat top-level service taxonomy (e.g. Cleaning, Plumbing, Tutoring)."""

    name = models.CharField(_("name"), max_length=120, unique=True)
    slug = models.SlugField(_("slug"), max_length=140, unique=True)
    description = models.TextField(_("description"), blank=True)
    is_active = models.BooleanField(
        _("active"),
        default=True,
        help_text=_(
            "Inactive categories are hidden from the public listing and "
            "cannot be selected by providers when creating new services."
        ),
    )

    class Meta(BaseModel.Meta):
        verbose_name = _("service category")
        verbose_name_plural = _("service categories")
        ordering = ("name",)
        indexes = (
            models.Index(fields=("is_active", "name")),
        )

    def __str__(self) -> str:
        return self.name


class Service(BaseModel):
    """A single offering published by one provider, listed under one category."""

    class LocationType(models.TextChoices):
        REMOTE = "remote", _("Remote")
        ONSITE = "onsite", _("On-site")
        HYBRID = "hybrid", _("Hybrid")

    class PricingType(models.TextChoices):
        """How ``price`` should be interpreted at render time.

        ``HOURLY`` services display "From $X/hr" and are charged per hour;
        ``FLAT`` services display "$X flat" and bill once per booking.
        """

        HOURLY = "hourly", _("Per hour")
        FLAT = "flat", _("Flat rate")

    provider = models.ForeignKey(
        "users.ProviderProfile",
        on_delete=models.CASCADE,
        related_name="services",
        verbose_name=_("provider"),
    )
    category = models.ForeignKey(
        "services.ServiceCategory",
        on_delete=models.PROTECT,
        related_name="services",
        verbose_name=_("category"),
    )
    title = models.CharField(_("title"), max_length=180)
    subtitle = models.CharField(
        _("subtitle"),
        max_length=200,
        blank=True,
        help_text=_("Optional one-liner shown under the title on listing cards."),
    )
    slug = models.SlugField(_("slug"), max_length=200)
    description = models.TextField(_("description"))
    price = models.DecimalField(
        _("price"),
        max_digits=10,
        decimal_places=2,
        validators=(MinValueValidator(Decimal("0.01")),),
        help_text=_(
            "Numeric amount; meaning depends on ``pricing_type`` "
            "(hourly rate vs flat per-booking fee)."
        ),
    )
    pricing_type = models.CharField(
        _("pricing type"),
        max_length=10,
        choices=PricingType.choices,
        default=PricingType.FLAT,
    )
    duration_minutes = models.PositiveIntegerField(
        _("duration (minutes)"),
        validators=(MinValueValidator(1),),
        help_text=_("Estimated session length in minutes."),
    )
    location_type = models.CharField(
        _("location type"),
        max_length=12,
        choices=LocationType.choices,
        default=LocationType.ONSITE,
    )
    hero_image_url = models.URLField(
        _("hero image URL"),
        max_length=500,
        blank=True,
        help_text=_(
            "Public URL of the listing-card image. Stored as a URL rather "
            "than an ImageField so we don't need MEDIA_ROOT/S3 wired up "
            "for the marketplace MVP."
        ),
    )
    is_featured = models.BooleanField(
        _("featured"),
        default=False,
        db_index=True,
        help_text=_(
            "Curated promotion flag - featured services get a badge and "
            "rank ahead of peers in the default sort."
        ),
    )

    # ---- Denormalized rating aggregate -----------------------------------

    rating_average = models.DecimalField(
        _("rating average"),
        max_digits=3,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=(
            MinValueValidator(Decimal("0.00")),
            MaxValueValidator(Decimal("5.00")),
        ),
    )
    rating_count = models.PositiveIntegerField(_("rating count"), default=0)

    is_active = models.BooleanField(
        _("active"),
        default=True,
        db_index=True,
        help_text=_("Inactive services are hidden from the public listing."),
    )

    class Meta(BaseModel.Meta):
        verbose_name = _("service")
        verbose_name_plural = _("services")
        ordering = ("-is_featured", "-created_at")
        constraints = (
            models.UniqueConstraint(
                fields=("provider", "slug"),
                name="services_service_unique_provider_slug",
            ),
        )
        indexes = (
            models.Index(fields=("is_active", "category")),
            models.Index(fields=("is_active", "provider")),
            models.Index(fields=("is_active", "is_featured")),
        )

    def __str__(self) -> str:
        return f"{self.title} ({self.provider.business_name})"


class Review(BaseModel):
    """Customer review of a completed service.

    A review always links to a service (which itself links to a provider),
    so we don't store a redundant ``provider`` FK - aggregates fan out
    via ``service.provider``. The reviewer FK uses ``SET_NULL`` so account
    deletion doesn't cascade-erase historical reviews.
    """

    service = models.ForeignKey(
        "services.Service",
        on_delete=models.CASCADE,
        related_name="reviews",
        verbose_name=_("service"),
    )
    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviews_authored",
        verbose_name=_("reviewer"),
    )
    rating = models.PositiveSmallIntegerField(
        _("rating"),
        validators=(MinValueValidator(1), MaxValueValidator(5)),
        help_text=_("Whole-star rating, 1 through 5."),
    )
    body = models.TextField(_("body"), blank=True)
    is_published = models.BooleanField(
        _("published"),
        default=True,
        help_text=_(
            "Hidden reviews are excluded from public aggregates. Used by "
            "moderation to suppress abusive content without deleting it."
        ),
    )

    class Meta(BaseModel.Meta):
        verbose_name = _("review")
        verbose_name_plural = _("reviews")
        ordering = ("-created_at",)
        indexes = (
            models.Index(fields=("service", "-created_at")),
            models.Index(fields=("is_published", "-created_at")),
        )

    def __str__(self) -> str:
        return f"{self.rating}★ for {self.service.title}"
