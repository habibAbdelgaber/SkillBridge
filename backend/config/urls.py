"""Root URL configuration for the SkillBridge project."""
from django.contrib import admin
from django.urls import include, path

from apps.common.views import health_check

urlpatterns = [
    path("admin/", admin.site.urls),
    path("health/", health_check, name="health-check"),
    path("api/", include("config.api_urls")),

    # dj-rest-auth and allauth still reverse these URL names internally.
    path("accounts/", include("allauth.urls")),
]
