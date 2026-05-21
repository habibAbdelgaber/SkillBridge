"""Tests for the scheduling app.

Locks in the resolver's interval arithmetic and the public availability
endpoint contract used by the booking flow.

Run with: ``python manage.py test apps.scheduling``
"""
from __future__ import annotations

from datetime import date, time, timedelta

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.scheduling.models import (
    AvailabilityException,
    Weekday,
    WeeklyAvailability,
)
from apps.scheduling.resolver import (
    is_provider_available,
    resolve_for_date,
    resolve_range,
)
from apps.users.models import ProviderProfile, User


def make_provider() -> ProviderProfile:
    user = User.objects.create_user(
        email="pro@example.com",
        password="Pa55word!",
        role=User.Role.PROVIDER,
    )
    return ProviderProfile.objects.create(
        user=user,
        business_name="Pro",
        business_type=ProviderProfile.BusinessType.INDIVIDUAL,
        phone_number="+15550000",
        service_category="Plumbing",
        years_of_experience=1,
        service_area="Tel Aviv",
    )


class ResolverTests(TestCase):
    @classmethod
    def setUpTestData(cls) -> None:
        cls.provider = make_provider()
        cls.tomorrow = timezone.localdate() + timedelta(days=1)
        # Tomorrow's weekday under Python's Mon=0..Sun=6 convention.
        cls.weekday = cls.tomorrow.weekday()

    def test_resolve_returns_weekly_slots(self):
        WeeklyAvailability.objects.create(
            provider=self.provider,
            weekday=self.weekday,
            start_time=time(9, 0),
            end_time=time(17, 0),
        )
        slots = resolve_for_date(self.provider.id, self.tomorrow)
        self.assertEqual(len(slots), 1)
        self.assertEqual(slots[0].to_times(), (time(9, 0), time(17, 0)))

    def test_blocked_exception_subtracts_from_weekly_slot(self):
        WeeklyAvailability.objects.create(
            provider=self.provider,
            weekday=self.weekday,
            start_time=time(9, 0),
            end_time=time(17, 0),
        )
        AvailabilityException.objects.create(
            provider=self.provider,
            date=self.tomorrow,
            start_time=time(12, 0),
            end_time=time(13, 0),
            is_available=False,
            reason="Lunch",
        )
        slots = resolve_for_date(self.provider.id, self.tomorrow)
        self.assertEqual(
            [s.to_times() for s in slots],
            [(time(9, 0), time(12, 0)), (time(13, 0), time(17, 0))],
        )

    def test_open_exception_extends_weekly_slot(self):
        WeeklyAvailability.objects.create(
            provider=self.provider,
            weekday=self.weekday,
            start_time=time(9, 0),
            end_time=time(12, 0),
        )
        AvailabilityException.objects.create(
            provider=self.provider,
            date=self.tomorrow,
            start_time=time(13, 0),
            end_time=time(15, 0),
            is_available=True,
        )
        slots = resolve_for_date(self.provider.id, self.tomorrow)
        self.assertEqual(
            [s.to_times() for s in slots],
            [(time(9, 0), time(12, 0)), (time(13, 0), time(15, 0))],
        )

    def test_is_provider_available_window_must_fit_inside_slot(self):
        WeeklyAvailability.objects.create(
            provider=self.provider,
            weekday=self.weekday,
            start_time=time(9, 0),
            end_time=time(17, 0),
        )
        self.assertTrue(
            is_provider_available(
                self.provider.id, self.tomorrow, time(10, 0), time(11, 0),
            ),
        )
        self.assertFalse(
            is_provider_available(
                self.provider.id, self.tomorrow, time(8, 0), time(10, 0),
            ),
        )
        # Empty window is rejected.
        self.assertFalse(
            is_provider_available(
                self.provider.id, self.tomorrow, time(10, 0), time(10, 0),
            ),
        )

    def test_resolve_range_returns_one_entry_per_day(self):
        start = self.tomorrow
        end = start + timedelta(days=3)
        result = resolve_range(self.provider.id, start, end)
        self.assertEqual(len(result), 4)
        for cursor in (start, start + timedelta(days=1), end):
            self.assertIn(cursor, result)


class WeeklyAvailabilityModelTests(TestCase):
    @classmethod
    def setUpTestData(cls) -> None:
        cls.provider = make_provider()

    def test_overlapping_weekly_slots_rejected_by_clean(self):
        WeeklyAvailability.objects.create(
            provider=self.provider,
            weekday=Weekday.MONDAY,
            start_time=time(9, 0),
            end_time=time(12, 0),
        )
        clashing = WeeklyAvailability(
            provider=self.provider,
            weekday=Weekday.MONDAY,
            start_time=time(11, 0),
            end_time=time(13, 0),
        )
        with self.assertRaises(Exception):
            clashing.full_clean()

    def test_end_must_be_after_start(self):
        slot = WeeklyAvailability(
            provider=self.provider,
            weekday=Weekday.TUESDAY,
            start_time=time(15, 0),
            end_time=time(15, 0),
        )
        with self.assertRaises(Exception):
            slot.full_clean()


class PublicAvailabilityEndpointTests(APITestCase):
    @classmethod
    def setUpTestData(cls) -> None:
        cls.provider = make_provider()
        cls.tomorrow = timezone.localdate() + timedelta(days=1)
        WeeklyAvailability.objects.create(
            provider=cls.provider,
            weekday=cls.tomorrow.weekday(),
            start_time=time(9, 0),
            end_time=time(11, 0),
        )

    def _url(self) -> str:
        return reverse(
            "scheduling:public-provider-availability",
            args=[self.provider.id],
        )

    def test_default_window_is_7_days(self):
        resp = self.client.get(self._url())
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data), 7)

    def test_resolved_slots_appear_on_target_date(self):
        params = {
            "from": self.tomorrow.isoformat(),
            "to": self.tomorrow.isoformat(),
        }
        resp = self.client.get(self._url(), params)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data), 1)
        day = resp.data[0]
        # DRF serializes the DateField to an ISO string in the JSON
        # response — compare against ``isoformat()`` so the assertion
        # matches the wire shape rather than the in-memory dataclass.
        self.assertEqual(day["date"], self.tomorrow.isoformat())
        self.assertEqual(day["slots"][0]["start_time"], "09:00:00")

    def test_invalid_date_param_returns_400(self):
        resp = self.client.get(self._url(), {"from": "not-a-date"})
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
