"""Auth and user routes."""
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
    # Public overrides must precede dj-rest-auth's included routes.
    path("login/", PublicLoginView.as_view(), name="rest_login"),
    path("register/provider/", ProviderRegisterView.as_view(), name="register-provider"),
    path("register/", PublicRegisterView.as_view(), name="rest_register"),

    path("", include("dj_rest_auth.urls")),

    path("register/", include("dj_rest_auth.registration.urls")),

    # Keep raw SimpleJWT endpoints for CLI clients and integration tests.
    path("token/", TokenObtainPairView.as_view(), name="token-obtain-pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("token/verify/", TokenVerifyView.as_view(), name="token-verify"),

    path("provider/me/", ProviderProfileMeView.as_view(), name="provider-me"),

    path("social/google/", GoogleLoginView.as_view(), name="social-google"),
    path("social/facebook/", FacebookLoginView.as_view(), name="social-facebook"),
]
