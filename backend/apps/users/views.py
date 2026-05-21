"""Auth and user views."""
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

# The project's global ``DEFAULT_AUTHENTICATION_CLASSES`` includes JWT auth,
# which runs *before* permission checks. A stale/invalid bearer token in a
# client would therefore return 401 even on endpoints marked ``AllowAny``.
# Public auth endpoints ignore inbound tokens entirely.
_PUBLIC_AUTH_CLASSES: tuple = ()
_PUBLIC_PERMISSION_CLASSES = (permissions.AllowAny,)


class PublicLoginView(LoginView):
    """Public login endpoint."""

    authentication_classes = _PUBLIC_AUTH_CLASSES
    permission_classes = _PUBLIC_PERMISSION_CLASSES


class PublicRegisterView(RegisterView):
    """Public customer signup endpoint."""

    authentication_classes = _PUBLIC_AUTH_CLASSES
    permission_classes = _PUBLIC_PERMISSION_CLASSES


class ProviderRegisterView(RegisterView):
    """Public provider signup endpoint."""

    serializer_class = ProviderRegisterSerializer
    authentication_classes = _PUBLIC_AUTH_CLASSES
    permission_classes = _PUBLIC_PERMISSION_CLASSES


class ProviderProfileMeView(generics.RetrieveUpdateAPIView):
    """Read or update the authenticated provider's profile."""

    serializer_class = ProviderProfileSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self) -> ProviderProfile:
        profile = getattr(self.request.user, "provider_profile", None)
        if profile is None:
            raise NotFound("No provider profile for this user.")
        return profile


def _resolve_social_callback(path: str) -> str:
    """Build a frontend callback URL."""
    frontend = getattr(settings, "FRONTEND_URL", "").rstrip("/")
    return f"{frontend}{path}" if frontend else path


class GoogleLoginView(SocialLoginView):
    """Exchange Google OAuth2 credentials for SkillBridge tokens."""

    adapter_class = GoogleOAuth2Adapter
    client_class = OAuth2Client
    callback_url = _resolve_social_callback("/auth/google/callback")


class FacebookLoginView(SocialLoginView):
    """Exchange Facebook OAuth2 credentials for SkillBridge tokens."""

    adapter_class = FacebookOAuth2Adapter
    client_class = OAuth2Client
    callback_url = _resolve_social_callback("/auth/facebook/callback")
