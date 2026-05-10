"""Booking records and validation rules."""
from __future__ import annotations

from datetime import datetime, timedelta
from decimal import Decimal

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from apps.common.models import BaseModel
from apps.services.models import Service


class Booking(BaseModel):
    """A customer's booking request for a provider service."""

    class Status(models.TextChoices):
        PENDING = "pending", _("Pending")
        CONFIRMED = "confirmed", _("Confirmed")
        CANCELLED = "cancelled", _("Cancelled")

    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="bookings",
        verbose_name=_("customer"),
        help_text=_("The User (role=customer) who placed the booking."),
    )
    provider = models.ForeignKey(
        "users.ProviderProfile",
        on_delete=models.PROTECT,
        related_name="bookings",
        verbose_name=_("provider"),
        help_text=_(
            "Denormalised from ``service.provider`` so booking lists "
            "can be filtered by provider without joining through Service."
        ),
    )
    service = models.ForeignKey(
        "services.Service",
        on_delete=models.PROTECT,
        related_name="bookings",
        verbose_name=_("service"),
    )

    scheduled_date = models.DateField(_("scheduled date"), db_index=True)
    start_time = models.TimeField(_("start time"))
    end_time = models.TimeField(_("end time"))

    status = models.CharField(
        _("status"),
        max_length=12,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True,
    )
    total_price = models.DecimalField(
        _("total price"),
        max_digits=10,
        decimal_places=2,
        help_text=_(
            "Frozen at booking time so subsequent service-price changes "
            "don't retroactively alter outstanding bookings."
        ),
    )
    notes = models.TextField(_("notes"), blank=True)

    class Meta(BaseModel.Meta):
        verbose_name = _("booking")
        verbose_name_plural = _("bookings")
        ordering = ("-scheduled_date", "-start_time")
        indexes = (
            models.Index(fields=("provider", "scheduled_date")),
            models.Index(fields=("customer", "-scheduled_date")),
            models.Index(fields=("status", "-scheduled_date")),
        )

    def __str__(self) -> str:
        return (
            f"{self.service.title} for {self.customer.email} "
            f"on {self.scheduled_date} {self.start_time:%H:%M}"
        )

    def clean(self) -> None:
        """Validate booking ownership, availability, and overlap rules."""
        super().clean()
        errors: dict[str, list[str]] = {}

        if self.customer_id and getattr(self.customer, "role", None) != "customer":
            errors.setdefault("customer", []).append(
                "Only customers can create bookings.",
            )

        if (
            self.service_id
            and self.provider_id
            and self.service.provider_id != self.provider_id
        ):
            errors.setdefault("provider", []).append(
                "Provider does not own the requested service.",
            )

        if self.service_id and not self.service.is_active:
            errors.setdefault("service", []).append(
                "This service is not currently bookable.",
            )

        if self.start_time and self.end_time and self.start_time >= self.end_time:
            errors.setdefault("end_time", []).append(
                "End time must be after start time.",
            )

        if self.scheduled_date and self.scheduled_date < timezone.localdate():
            errors.setdefault("scheduled_date", []).append(
                "Scheduled date cannot be in the past.",
            )

        # Imported lazily to avoid a scheduling -> bookings import cycle.
        if (
            self.provider_id
            and self.scheduled_date
            and self.start_time
            and self.end_time
            and self.start_time < self.end_time
            and self.status != self.Status.CANCELLED
        ):
            from apps.scheduling.resolver import is_provider_available

            if not is_provider_available(
                self.provider_id,
                self.scheduled_date,
                self.start_time,
                self.end_time,
            ):
                errors.setdefault("start_time", []).append(
                    "Provider is not available for the requested time window.",
                )

        # Pending and confirmed bookings reserve the slot; cancelled ones do not.
        if (
            self.provider_id
            and self.scheduled_date
            and self.start_time
            and self.end_time
            and self.status != self.Status.CANCELLED
        ):
            qs = Booking.objects.filter(
                provider_id=self.provider_id,
                scheduled_date=self.scheduled_date,
                start_time__lt=self.end_time,
                end_time__gt=self.start_time,
            ).exclude(status=self.Status.CANCELLED)
            if self.pk:
                qs = qs.exclude(pk=self.pk)
            if qs.exists():
                errors.setdefault("start_time", []).append(
                    "This time window overlaps an existing booking "
                    "for the provider.",
                )

        if errors:
            raise ValidationError(errors)

    def derive_total_price(self) -> Decimal:
        """Return the frozen booking price for the selected service window."""
        service = self.service
        if service.pricing_type == Service.PricingType.FLAT:
            return Decimal(service.price).quantize(Decimal("0.01"))

        start_dt = datetime.combine(self.scheduled_date, self.start_time)
        end_dt = datetime.combine(self.scheduled_date, self.end_time)
        delta: timedelta = end_dt - start_dt
        seconds = max(int(delta.total_seconds()), 0)
        if seconds == 0:
            return Decimal("0.00")
        ceiled_hours = -(-seconds // 3600)  # ceil division
        ceiled_hours = max(ceiled_hours, 1)
        return (Decimal(service.price) * Decimal(ceiled_hours)).quantize(
            Decimal("0.01"),
        )
