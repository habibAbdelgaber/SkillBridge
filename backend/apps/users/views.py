"""Auth / user views.

Reuses ``dj-rest-auth`` where possible and only introduces custom views
for:

- provider registration (needs a different serializer than the default)
- provider profile self-service read/update
- per-provider social login endpoints (Google, Facebook)
"""
from __future__ import annotations

from allauth.socialaccount.providers.facebook.views import FacebookOAuth2Adapter
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import RegisterView, SocialLoginView
from dj_rest_auth.views import LoginView
from django.conf import settings
from rest_framework import generics, permissions
from rest_framework.exceptions import NotFound

from apps.users.models import ProviderProfile
from apps.users.serializers import (
    ProviderProfileSerializer,
    ProviderRegisterSerializer,
)

# ---------------------------------------------------------------------------
# Public auth endpoints
# ---------------------------------------------------------------------------
# The project's global ``DEFAULT_AUTHENTICATION_CLASSES`` includes JWT auth,
# which runs *before* permission checks. A stale/invalid bearer token in a
# client would therefore return 401 even on endpoints marked ``AllowAny``.
# For endpoints that are meant to issue or mint credentials we clear the
# authentication chain so inbound tokens are ignored entirely.
_PUBLIC_AUTH_CLASSES: tuple = ()
_PUBLIC_PERMISSION_CLASSES = (permissions.AllowAny,)


class PublicLoginView(LoginView):
    """``POST /login/`` — always public, ignores any inbound Authorization header."""

    authentication_classes = _PUBLIC_AUTH_CLASSES
    permission_classes = _PUBLIC_PERMISSION_CLASSES


class PublicRegisterView(RegisterView):
    """``POST /register/`` — customer signup, public."""

    authentication_classes = _PUBLIC_AUTH_CLASSES
    permission_classes = _PUBLIC_PERMISSION_CLASSES


class ProviderRegisterView(RegisterView):
    """Dedicated registration endpoint for providers.

    Accepts the full customer payload plus the business onboarding
    fields defined on ``ProviderRegisterSerializer``. Email verification
    and JWT issuance follow the same flow as the default register view.
    """

    serializer_class = ProviderRegisterSerializer
    authentication_classes = _PUBLIC_AUTH_CLASSES
    permission_classes = _PUBLIC_PERMISSION_CLASSES


class ProviderProfileMeView(generics.RetrieveUpdateAPIView):
    """``GET`` / ``PATCH`` the authenticated provider's business profile."""

    serializer_class = ProviderProfileSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self) -> ProviderProfile:
        profile = getattr(self.request.user, "provider_profile", None)
        if profile is None:
            raise NotFound("No provider profile for this user.")
        return profile


# ---------------------------------------------------------------------------
# Social login
# ---------------------------------------------------------------------------


def _resolve_social_callback(path: str) -> str:
    """Build the frontend callback URL for a given social provider."""
    frontend = getattr(settings, "FRONTEND_URL", "").rstrip("/")
    return f"{frontend}{path}" if frontend else path


class GoogleLoginView(SocialLoginView):
    """Exchange a Google OAuth2 code/access_token for a SkillBridge JWT pair."""

    adapter_class = GoogleOAuth2Adapter
    client_class = OAuth2Client
    callback_url = _resolve_social_callback("/auth/google/callback")


class FacebookLoginView(SocialLoginView):
    """Exchange a Facebook OAuth2 access_token for a SkillBridge JWT pair."""

    adapter_class = FacebookOAuth2Adapter
    client_class = OAuth2Client
    callback_url = _resolve_social_callback("/auth/facebook/callback")
