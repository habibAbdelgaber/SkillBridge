"""Booking views."""
from __future__ import annotations

from rest_framework import mixins, permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError as DRFValidationError

from apps.bookings.models import Booking
from apps.bookings.pricing import BookingPricingError, quote_booking
from apps.bookings.permissions import (
    CanCancelBooking,
    IsBookingParticipant,
    IsCustomer,
)
from apps.bookings.serializers import (
    BookingCreateSerializer,
    BookingQuoteSerializer,
    BookingReadSerializer,
    BookingStatusUpdateSerializer,
)


class BookingViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    """List, retrieve, create, and cancel bookings."""

    http_method_names = ("get", "post", "patch", "head", "options")
    queryset = Booking.objects.select_related(
        "customer",
        "provider",
        "provider__user",
        "service",
        "service__category",
    ).all()

    def get_queryset(self):
        """Scope rows to the caller's role."""
        user = self.request.user
        qs = super().get_queryset()
        if not user.is_authenticated:
            return qs.none()
        if user.is_staff:
            return qs
        if getattr(user, "role", None) == "provider":
            return qs.filter(provider__user_id=user.id)
        return qs.filter(customer_id=user.id)

    def get_serializer_class(self):
        if self.action == "quote":
            return BookingQuoteSerializer
        if self.action in ("create", "quote"):
            return BookingCreateSerializer
        if self.action in ("update", "partial_update"):
            return BookingStatusUpdateSerializer
        return BookingReadSerializer

    def get_permissions(self):
        """Use stricter checks for create, retrieve, and cancel."""
        if self.action == "create":
            classes = (permissions.IsAuthenticated, IsCustomer)
        elif self.action in ("update", "partial_update"):
            classes = (permissions.IsAuthenticated, CanCancelBooking)
        elif self.action == "retrieve":
            classes = (permissions.IsAuthenticated, IsBookingParticipant)
        else:
            classes = (permissions.IsAuthenticated,)
        return [cls() for cls in classes]

    @action(detail=False, methods=["post"], url_path="quote")
    def quote(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        attrs = serializer.validated_data
        try:
            price = quote_booking(attrs["service"], attrs["start_time"], attrs["end_time"])
        except BookingPricingError as exc:
            raise DRFValidationError({"service": str(exc)}) from exc
        return Response({
            "currency": price.currency,
            "service_fee": format(price.service_fee, ".2f"),
            "platform_fee": format(price.platform_fee, ".2f"),
            "vat_amount": format(price.vat_amount, ".2f"),
            "total_price": format(price.total_price, ".2f"),
        })
