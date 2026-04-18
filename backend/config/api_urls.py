"""Versioned API URL configuration.

Individual apps will register their routers here as they are implemented
in later stages (users, services, bookings). Keeping this separate from
`config.urls` makes versioning and API-only routing straightforward.
"""
# Stage-1: no API endpoints yet. App routers will be mounted under /api/v1/
# in stage-2, e.g.:
#   from django.urls import include, path
#   urlpatterns = [
#       path("v1/users/", include("apps.users.urls")),
#       path("v1/services/", include("apps.services.urls")),
#       path("v1/bookings/", include("apps.bookings.urls")),
#   ]
urlpatterns = []
