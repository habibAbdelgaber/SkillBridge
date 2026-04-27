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
"""
from __future__ import annotations

from decimal import Decimal

from django.core.validators import MinValueValidator
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
    slug = models.SlugField(_("slug"), max_length=200)
    description = models.TextField(_("description"))
    price = models.DecimalField(
        _("price"),
        max_digits=10,
        decimal_places=2,
        validators=(MinValueValidator(Decimal("0.01")),),
        help_text=_("Per-booking price in the platform's primary currency."),
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
    is_active = models.BooleanField(
        _("active"),
        default=True,
        db_index=True,
        help_text=_("Inactive services are hidden from the public listing."),
    )

    class Meta(BaseModel.Meta):
        verbose_name = _("service")
        verbose_name_plural = _("services")
        ordering = ("-created_at",)
        constraints = (
            models.UniqueConstraint(
                fields=("provider", "slug"),
                name="services_service_unique_provider_slug",
            ),
        )
        indexes = (
            models.Index(fields=("is_active", "category")),
            models.Index(fields=("is_active", "provider")),
        )

    def __str__(self) -> str:
        return f"{self.title} ({self.provider.business_name})"
