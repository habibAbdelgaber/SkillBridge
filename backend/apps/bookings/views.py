"""Booking views."""
from __future__ import annotations

from rest_framework import mixins, permissions, viewsets

from apps.bookings.models import Booking
from apps.bookings.permissions import (
    CanCancelBooking,
    IsBookingParticipant,
    IsCustomer,
)
from apps.bookings.serializers import (
    BookingCreateSerializer,
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
        if self.action == "create":
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
