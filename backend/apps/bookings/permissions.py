"""Booking permissions."""
from __future__ import annotations

from rest_framework import permissions


class IsCustomer(permissions.BasePermission):
    """Only customers can create bookings."""

    message = "Only customers can create bookings."

    def has_permission(self, request, view) -> bool:
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and getattr(user, "role", None) == "customer",
        )


class IsBookingParticipant(permissions.BasePermission):
    """Only the customer or provider can access a booking."""

    def has_object_permission(self, request, view, obj) -> bool:
        user = request.user
        if not (user and user.is_authenticated):
            return False
        if obj.customer_id == user.id:
            return True
        provider_user_id = getattr(obj.provider, "user_id", None)
        return provider_user_id == user.id


class CanCancelBooking(permissions.BasePermission):
    """Customers can cancel their bookings; staff can fix bad data."""

    message = "Only the booking's customer can cancel it."

    def has_object_permission(self, request, view, obj) -> bool:
        user = request.user
        if not (user and user.is_authenticated):
            return False
        if user.is_staff:
            return True
        return obj.customer_id == user.id
