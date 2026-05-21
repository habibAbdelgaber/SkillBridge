"""Tests for the common app.

Just two: the health-check view (it's the deploy probe) and the shared
pagination class's ``page_size_query_param`` contract — without those
two pieces the rest of the backend doesn't come up cleanly.

Run with: ``python manage.py test apps.common``
"""
from __future__ import annotations

from django.urls import reverse
from rest_framework.test import APITestCase

from apps.common.pagination import StandardResultsPagination


class HealthCheckTests(APITestCase):
    def test_health_check_returns_ok(self):
        resp = self.client.get(reverse("health-check"))
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["status"], "ok")
        self.assertEqual(resp.data["database"], "ok")
        self.assertEqual(resp.data["service"], "skillbridge-backend")


class StandardResultsPaginationTests(APITestCase):
    def test_page_size_is_client_controllable(self):
        pagination = StandardResultsPagination()
        self.assertEqual(pagination.page_size_query_param, "page_size")
        self.assertEqual(pagination.max_page_size, 60)
