"""AllAuth adapters.

Keep the role-assignment logic in one place so both the DRF registration
flow (``dj-rest-auth``) and the classic allauth signup flow produce
consistent users.
"""
from __future__ import annotations

from typing import Any

from allauth.account.adapter import DefaultAccountAdapter
from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from django.conf import settings

from apps.users.models import User


class AccountAdapter(DefaultAccountAdapter):
    """Customize the vanilla signup flow.

    The DRF ``RegisterSerializer`` subclasses in ``apps.users.serializers``
    are responsible for promoting a user to PROVIDER; this adapter simply
    guarantees we never persist an invalid role. It also rewrites the
    email-confirmation URL so the link lands on the SPA, which then posts
    the key back to ``/api/v1/auth/register/verify-email/``.
    """

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
        """Send users to the SPA, not the classic allauth HTML page.

        The frontend route ``/verify-email/:key`` POSTs the key back to
        ``/api/v1/auth/registration/verify-email/`` and shows a result state.
        """
        frontend = getattr(settings, "FRONTEND_URL", "").rstrip("/")
        if frontend:
            return f"{frontend}/verify-email/{emailconfirmation.key}"
        return super().get_email_confirmation_url(request, emailconfirmation)

    @staticmethod
    def _extract_role(form: Any) -> str | None:
        cleaned = getattr(form, "cleaned_data", None) or {}
        return cleaned.get("role")


class SocialAccountAdapter(DefaultSocialAccountAdapter):
    """Normalize social-auth signups.

    Social logins currently only produce CUSTOMER accounts; provider
    onboarding is an explicit multi-field form and should not be performed
    implicitly from an OAuth round-trip. If a provider wants to link a
    social account to an existing user they do so after signing up.
    """

    def is_open_for_signup(self, request, sociallogin) -> bool:
        return getattr(settings, "SOCIALACCOUNT_ALLOW_REGISTRATION", True)

    def populate_user(self, request, sociallogin, data):
        user = super().populate_user(request, sociallogin, data)
        if not user.role:
            user.role = User.Role.CUSTOMER
        return user
