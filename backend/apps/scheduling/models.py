"""Provider availability models."""
from __future__ import annotations

from django.core.exceptions import ValidationError
from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.common.models import BaseModel


class Weekday(models.IntegerChoices):
    """Matches Python's ``date.weekday()`` values."""

    MONDAY = 0, _("Monday")
    TUESDAY = 1, _("Tuesday")
    WEDNESDAY = 2, _("Wednesday")
    THURSDAY = 3, _("Thursday")
    FRIDAY = 4, _("Friday")
    SATURDAY = 5, _("Saturday")
    SUNDAY = 6, _("Sunday")


class WeeklyAvailability(BaseModel):
    """Recurring weekly slot for a provider."""

    provider = models.ForeignKey(
        "users.ProviderProfile",
        on_delete=models.CASCADE,
        related_name="weekly_availability",
        verbose_name=_("provider"),
    )
    weekday = models.IntegerField(
        _("weekday"),
        choices=Weekday.choices,
        db_index=True,
    )
    start_time = models.TimeField(_("start time"))
    end_time = models.TimeField(_("end time"))

    class Meta(BaseModel.Meta):
        verbose_name = _("weekly availability")
        verbose_name_plural = _("weekly availability")
        ordering = ("weekday", "start_time")
        indexes = (
            models.Index(fields=("provider", "weekday")),
        )
        constraints = (
            models.CheckConstraint(
                check=models.Q(start_time__lt=models.F("end_time")),
                name="scheduling_weekly_start_before_end",
            ),
            models.UniqueConstraint(
                fields=("provider", "weekday", "start_time", "end_time"),
                name="scheduling_weekly_unique_slot",
            ),
        )

    def __str__(self) -> str:
        weekday = Weekday(self.weekday).label
        return (
            f"{self.provider.business_name} · {weekday} "
            f"{self.start_time:%H:%M}–{self.end_time:%H:%M}"
        )

    def clean(self) -> None:
        super().clean()
        errors: dict[str, list[str]] = {}
        if self.start_time and self.end_time and self.start_time >= self.end_time:
            errors.setdefault("end_time", []).append(
                "End time must be after start time.",
            )

        # A provider cannot expose overlapping slots on the same weekday.
        if self.provider_id and self.weekday is not None:
            qs = WeeklyAvailability.objects.filter(
                provider_id=self.provider_id,
                weekday=self.weekday,
                start_time__lt=self.end_time,
                end_time__gt=self.start_time,
            )
            if self.pk:
                qs = qs.exclude(pk=self.pk)
            if qs.exists():
                errors.setdefault("start_time", []).append(
                    "Slot overlaps another weekly slot for this weekday.",
                )

        if errors:
            raise ValidationError(errors)


class AvailabilityException(BaseModel):
    """One-off slot override for a specific date."""

    provider = models.ForeignKey(
        "users.ProviderProfile",
        on_delete=models.CASCADE,
        related_name="availability_exceptions",
        verbose_name=_("provider"),
    )
    date = models.DateField(_("date"), db_index=True)
    start_time = models.TimeField(_("start time"))
    end_time = models.TimeField(_("end time"))
    is_available = models.BooleanField(
        _("is available"),
        default=False,
        help_text=_(
            "True extends the recurring schedule with an ad-hoc slot; "
            "False blocks a window that the recurring schedule would "
            "otherwise expose (vacation, sick day, fully-booked)."
        ),
    )
    reason = models.CharField(_("reason"), max_length=160, blank=True)

    class Meta(BaseModel.Meta):
        verbose_name = _("availability exception")
        verbose_name_plural = _("availability exceptions")
        ordering = ("date", "start_time")
        indexes = (
            models.Index(fields=("provider", "date")),
        )
        constraints = (
            models.CheckConstraint(
                check=models.Q(start_time__lt=models.F("end_time")),
                name="scheduling_exception_start_before_end",
            ),
        )

    def __str__(self) -> str:
        kind = "open" if self.is_available else "blocked"
        return (
            f"{self.provider.business_name} · {self.date} "
            f"{self.start_time:%H:%M}–{self.end_time:%H:%M} ({kind})"
        )

    def clean(self) -> None:
        super().clean()
        if self.start_time and self.end_time and self.start_time >= self.end_time:
            raise ValidationError(
                {"end_time": "End time must be after start time."},
            )
