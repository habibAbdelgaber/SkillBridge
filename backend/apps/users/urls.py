"""Auth and user routes.

Mounted at ``/api/v1/auth/`` from ``config.api_urls``.

Routes exposed:

- ``POST   /register/``                 — customer signup (default dj-rest-auth)
- ``POST   /register/provider/``        — provider signup (custom serializer)
- ``POST   /register/verify-email/``    — confirm email via key
- ``POST   /register/resend-email/``    — resend verification email
- ``POST   /login/``                    — email + password → JWT pair (dj-rest-auth)
- ``POST   /logout/``                   — blacklist refresh token
- ``POST   /token/``                    — SimpleJWT token obtain (email + password → pair)
- ``POST   /token/refresh/``            — issue new access token
- ``POST   /token/verify/``             — validate access token
- ``GET|PUT|PATCH /user/``              — current user profile
- ``POST   /password/change/``          — change password (authenticated)
- ``POST   /password/reset/``           — request password reset email
- ``POST   /password/reset/confirm/``   — complete password reset with token
- ``GET|PATCH /provider/me/``           — authenticated provider's business profile
- ``POST   /social/google/``            — Google OAuth2 login
- ``POST   /social/facebook/``          — Facebook OAuth2 login
"""
from __future__ import annotations

from django.urls import include, path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)

from apps.users.views import (
    FacebookLoginView,
    GoogleLoginView,
    ProviderProfileMeView,
    ProviderRegisterView,
    PublicLoginView,
    PublicRegisterView,
)

app_name = "users"

urlpatterns = [
    # Public overrides MUST come before the dj_rest_auth includes so Django's
    # URL resolver picks them first. They clear the authentication chain so a
    # stale/invalid bearer token cannot turn a public endpoint into a 401.
    path("login/", PublicLoginView.as_view(), name="rest_login"),
    path("register/provider/", ProviderRegisterView.as_view(), name="register-provider"),
    path("register/", PublicRegisterView.as_view(), name="rest_register"),

    # Remaining core auth (logout, user, password change/reset) from dj-rest-auth.
    path("", include("dj_rest_auth.urls")),

    # Registration support endpoints (verify-email, resend-email) from dj-rest-auth.
    path("register/", include("dj_rest_auth.registration.urls")),

    # SimpleJWT token lifecycle. ``/login/`` (dj-rest-auth) wraps this flow
    # and additionally returns the serialized user, which is what the SPA
    # typically consumes. ``/token/`` is exposed for clients that prefer the
    # canonical SimpleJWT handshake (e.g. CLI tools, integration tests).
    # SimpleJWT uses ``User.USERNAME_FIELD`` to decide which credential field
    # to accept — since our User model sets it to ``email``, the request body
    # for ``/token/`` is ``{"email": "...", "password": "..."}``.
    path("token/", TokenObtainPairView.as_view(), name="token-obtain-pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("token/verify/", TokenVerifyView.as_view(), name="token-verify"),

    # Provider self-service profile.
    path("provider/me/", ProviderProfileMeView.as_view(), name="provider-me"),

    # Social login (Google, Facebook). SSO-extensible: add further providers
    # by creating another SocialLoginView subclass and a route here.
    path("social/google/", GoogleLoginView.as_view(), name="social-google"),
    path("social/facebook/", FacebookLoginView.as_view(), name="social-facebook"),
]
