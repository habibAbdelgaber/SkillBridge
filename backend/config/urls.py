"""Root URL configuration for the SkillBridge project."""
from django.contrib import admin
from django.urls import include, path

from apps.common.views import health_check

urlpatterns = [
    path("admin/", admin.site.urls),
    path("health/", health_check, name="health-check"),
    path("api/", include("config.api_urls")),

    # django-allauth's classic URL set. Not consumed by the SPA (clients hit
    # the DRF endpoints under /api/v1/auth/), but its URL *names* must resolve
    # because dj-rest-auth and allauth internally call reverse() on them
    # (e.g. ``account_email_verification_sent`` after a successful signup
    # when ACCOUNT_EMAIL_VERIFICATION='mandatory').
    path("accounts/", include("allauth.urls")),
]
