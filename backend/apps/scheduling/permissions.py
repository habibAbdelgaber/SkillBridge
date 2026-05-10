"""Scheduling permissions."""
from __future__ import annotations

from rest_framework import permissions


class IsProviderUser(permissions.BasePermission):
    """Only providers can manage their availability."""

    message = "Only provider accounts can manage availability."

    def has_permission(self, request, view) -> bool:
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and getattr(user, "role", None) == "provider"
            and hasattr(user, "provider_profile"),
        )
