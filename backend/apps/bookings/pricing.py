"""Authoritative booking price calculation and rounding policy."""
from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured

from apps.services.models import Service

CENT = Decimal("0.01")
MAX_BOOKING_AMOUNT = Decimal("99999999.99")


class BookingPricingError(ValueError):
    """The requested booking cannot be represented at the current price."""


def _rate(name: str, default: str) -> Decimal:
    try:
        rate = Decimal(str(getattr(settings, name, default)))
    except (ValueError, ArithmeticError) as exc:
        raise ImproperlyConfigured(f"{name} must be a decimal rate") from exc
    if not rate.is_finite() or not Decimal("0") <= rate <= Decimal("1"):
        raise ImproperlyConfigured(f"{name} must be between 0 and 1")
    return rate


@dataclass(frozen=True)
class BookingPrice:
    currency: str
    service_fee: Decimal
    platform_fee: Decimal
    vat_amount: Decimal
    total_price: Decimal


def quote_booking(service: Service, start_time, end_time) -> BookingPrice:
    """Flat rate or whole hours, then 10% platform fee and VAT on both fees.

    Rates can be overridden by deployment configuration. Each component is
    rounded to cents with ROUND_HALF_UP before summing the customer total.
    """
    if start_time >= end_time:
        raise ValueError("End time must be after start time")
    if service.pricing_type == Service.PricingType.FLAT:
        base = service.price
    else:
        from datetime import datetime, date

        seconds = (datetime.combine(date.min, end_time) -
                   datetime.combine(date.min, start_time)).total_seconds()
        hours = max(1, -(-int(seconds) // 3600))
        base = service.price * hours

    service_fee = base.quantize(CENT, rounding=ROUND_HALF_UP)
    platform_fee = (service_fee * _rate("BOOKING_PLATFORM_FEE_RATE", "0.10")).quantize(
        CENT, rounding=ROUND_HALF_UP
    )
    vat_amount = ((service_fee + platform_fee) * _rate("BOOKING_VAT_RATE", "0.18")).quantize(
        CENT, rounding=ROUND_HALF_UP
    )
    total_price = service_fee + platform_fee + vat_amount
    if total_price > MAX_BOOKING_AMOUNT:
        raise BookingPricingError("Booking total exceeds the supported amount")
    return BookingPrice(
        currency="USD",
        service_fee=service_fee,
        platform_fee=platform_fee,
        vat_amount=vat_amount,
        total_price=total_price,
    )
