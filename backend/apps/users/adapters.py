"""Allauth adapters."""
from __future__ import annotations

from typing import Any

from allauth.account.adapter import DefaultAccountAdapter
from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from django.conf import settings

from apps.users.models import User


class AccountAdapter(DefaultAccountAdapter):
    """Keep signup roles valid and route email confirmation through the SPA."""

    def is_open_for_signup(self, request) -> bool:
        return getattr(settings, "ACCOUNT_ALLOW_REGISTRATION", True)

    def save_user(self, request, user, form, commit: bool = True):
        user = super().save_user(request, user, form, commit=False)
        role = self._extract_role(form)
        if role in {User.Role.CUSTOMER, User.Role.PROVIDER}:
            user.role = role
        elif not user.role:
            user.role = User.Role.CUSTOMER
        if commit:
            user.save()
        return user

    def get_email_confirmation_url(self, request, emailconfirmation) -> str:
        """Send users to the SPA email-confirmation route."""
        frontend = getattr(settings, "FRONTEND_URL", "").rstrip("/")
        if frontend:
            return f"{frontend}/verify-email/{emailconfirmation.key}"
        return super().get_email_confirmation_url(request, emailconfirmation)

    @staticmethod
    def _extract_role(form: Any) -> str | None:
        cleaned = getattr(form, "cleaned_data", None) or {}
        return cleaned.get("role")


class SocialAccountAdapter(DefaultSocialAccountAdapter):
    """Social signups start as customer accounts."""

    def is_open_for_signup(self, request, sociallogin) -> bool:
        return getattr(settings, "SOCIALACCOUNT_ALLOW_REGISTRATION", True)

    def populate_user(self, request, sociallogin, data):
        user = super().populate_user(request, sociallogin, data)
        if not user.role:
            user.role = User.Role.CUSTOMER
        return user
