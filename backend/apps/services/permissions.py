"""Permission classes for the services app."""
from __future__ import annotations

from rest_framework import permissions

from apps.users.models import User


class IsProvider(permissions.BasePermission):
    """User must be authenticated and have role=PROVIDER with a profile.

    The presence of a ``ProviderProfile`` is checked on top of the role
    so half-onboarded users (signed up as a customer, role flipped later
    by an admin) can't sidestep the onboarding form.
    """

    message = "You must complete provider onboarding before performing this action."

    def has_permission(self, request, view) -> bool:
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if getattr(user, "role", None) != User.Role.PROVIDER:
            return False
        return getattr(user, "provider_profile", None) is not None


class IsServiceOwner(permissions.BasePermission):
    """Object-level: the service must belong to the requester's provider profile."""

    message = "You can only modify services that belong to your provider profile."

    def has_object_permission(self, request, view, obj) -> bool:
        provider = getattr(obj, "provider", None)
        if provider is None:
            return False
        return provider.user_id == request.user.id


class IsAdminOrReadOnly(permissions.BasePermission):
    """Read for everyone; write only for staff (admins). Used for ServiceCategory."""

    def has_permission(self, request, view) -> bool:
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)
