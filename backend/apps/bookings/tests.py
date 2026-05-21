"""Tests for the bookings app.

Covers ``Booking.clean`` validation, the role-aware queryset on
``BookingViewSet``, and the customer-only create/cancel surface.

Run with: ``python manage.py test apps.bookings``
"""
from __future__ import annotations

from datetime import date, time, timedelta
from decimal import Decimal

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.bookings.models import Booking
from apps.scheduling.models import WeeklyAvailability
from apps.services.models import Service, ServiceCategory
from apps.users.models import ProviderProfile, User


# ---------------------------------------------------------------------------
# Fixture helpers
# ---------------------------------------------------------------------------


class _BookingFixtureMixin:
    """Shared fixture builders. Mixed into TestCase / APITestCase below."""

    @classmethod
    def make_world(cls) -> None:
        cls.category = ServiceCategory.objects.create(
            name="Plumbing", slug="plumbing", is_active=True,
        )

        cls.provider_user = User.objects.create_user(
            email="pro@example.com",
            password="Pa55word!",
            role=User.Role.PROVIDER,
            first_name="John",
            last_name="Martinez",
        )
        cls.provider = ProviderProfile.objects.create(
            user=cls.provider_user,
            business_name="JM Plumbing",
            business_type=ProviderProfile.BusinessType.INDIVIDUAL,
            phone_number="+15551112222",
            service_category="Plumbing",
            years_of_experience=12,
            service_area="Tel Aviv",
        )

        cls.service = Service.objects.create(
            provider=cls.provider,
            category=cls.category,
            title="Emergency pipe repair",
            slug="emergency-pipe-repair",
            description="Same-day burst-pipe response.",
            price=Decimal("85.00"),
            pricing_type=Service.PricingType.HOURLY,
            duration_minutes=60,
            location_type=Service.LocationType.ONSITE,
            is_active=True,
        )

        # Open availability all day, every weekday — keeps the focus on
        # booking validation rather than scheduling.
        for weekday in range(7):
            WeeklyAvailability.objects.create(
                provider=cls.provider,
                weekday=weekday,
                start_time=time(0, 0),
                end_time=time(23, 59),
            )

        cls.customer = User.objects.create_user(
            email="customer@example.com",
            password="Pa55word!",
            first_name="Iris",
            last_name="Levi",
        )
        cls.other_customer = User.objects.create_user(
            email="other@example.com",
            password="Pa55word!",
        )

    @staticmethod
    def tomorrow() -> date:
        return timezone.localdate() + timedelta(days=1)


# ---------------------------------------------------------------------------
# Model-level validation
# ---------------------------------------------------------------------------


class BookingValidationTests(_BookingFixtureMixin, TestCase):
    @classmethod
    def setUpTestData(cls) -> None:
        cls.make_world()

    def _make(self, **overrides) -> Booking:
        defaults = {
            "customer": self.customer,
            "provider": self.provider,
            "service": self.service,
            "scheduled_date": self.tomorrow(),
            "start_time": time(10, 0),
            "end_time": time(11, 0),
            "total_price": Decimal("85.00"),
        }
        defaults.update(overrides)
        return Booking(**defaults)

    def test_valid_booking_passes_full_clean(self):
        booking = self._make()
        booking.full_clean()

    def test_rejects_end_before_start(self):
        booking = self._make(start_time=time(11, 0), end_time=time(10, 0))
        with self.assertRaises(Exception):
            booking.full_clean()

    def test_rejects_past_date(self):
        booking = self._make(scheduled_date=timezone.localdate() - timedelta(days=1))
        with self.assertRaises(Exception):
            booking.full_clean()

    def test_rejects_inactive_service(self):
        self.service.is_active = False
        self.service.save(update_fields=["is_active"])
        booking = self._make()
        with self.assertRaises(Exception):
            booking.full_clean()
        self.service.is_active = True
        self.service.save(update_fields=["is_active"])

    def test_rejects_when_provider_does_not_own_service(self):
        rogue_user = User.objects.create_user(
            email="rogue@example.com",
            password="Pa55word!",
            role=User.Role.PROVIDER,
        )
        rogue_provider = ProviderProfile.objects.create(
            user=rogue_user,
            business_name="Rogue",
            business_type=ProviderProfile.BusinessType.INDIVIDUAL,
            phone_number="+15558889999",
            service_category="Plumbing",
            years_of_experience=1,
            service_area="Haifa",
        )
        booking = self._make(provider=rogue_provider)
        with self.assertRaises(Exception):
            booking.full_clean()

    def test_overlap_with_existing_booking_is_rejected(self):
        Booking.objects.create(
            customer=self.customer,
            provider=self.provider,
            service=self.service,
            scheduled_date=self.tomorrow(),
            start_time=time(10, 0),
            end_time=time(11, 0),
            total_price=Decimal("85.00"),
        )
        # Overlapping window for the same provider on the same date.
        clashing = self._make(start_time=time(10, 30), end_time=time(11, 30))
        with self.assertRaises(Exception):
            clashing.full_clean()

    def test_cancelled_booking_does_not_block_overlap(self):
        Booking.objects.create(
            customer=self.customer,
            provider=self.provider,
            service=self.service,
            scheduled_date=self.tomorrow(),
            start_time=time(10, 0),
            end_time=time(11, 0),
            total_price=Decimal("85.00"),
            status=Booking.Status.CANCELLED,
        )
        booking = self._make()
        booking.full_clean()  # must not raise


# ---------------------------------------------------------------------------
# API behaviour
# ---------------------------------------------------------------------------


class BookingAPITests(_BookingFixtureMixin, APITestCase):
    list_url = reverse("bookings:booking-list")

    @classmethod
    def setUpTestData(cls) -> None:
        cls.make_world()

    # ---- creation -------------------------------------------------------

    def test_customer_can_create_booking(self):
        self.client.force_authenticate(user=self.customer)
        payload = {
            "service": str(self.service.id),
            "scheduled_date": self.tomorrow().isoformat(),
            "start_time": "10:00",
            "end_time": "11:00",
            "notes": "Please ring buzzer 4B.",
        }
        resp = self.client.post(self.list_url, payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED, resp.data)
        booking = Booking.objects.get(id=resp.data["id"])
        self.assertEqual(booking.customer, self.customer)
        self.assertEqual(booking.provider, self.provider)
        # ``provider`` and ``total_price`` are derived server-side, never
        # trusted from the client payload.
        self.assertEqual(booking.total_price, Decimal("85.00"))
        self.assertEqual(booking.status, Booking.Status.PENDING)

    def test_provider_cannot_create_booking(self):
        self.client.force_authenticate(user=self.provider_user)
        payload = {
            "service": str(self.service.id),
            "scheduled_date": self.tomorrow().isoformat(),
            "start_time": "10:00",
            "end_time": "11:00",
        }
        resp = self.client.post(self.list_url, payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthenticated_create_returns_401(self):
        resp = self.client.post(self.list_url, {}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_invalid_window_is_rejected(self):
        self.client.force_authenticate(user=self.customer)
        payload = {
            "service": str(self.service.id),
            "scheduled_date": self.tomorrow().isoformat(),
            "start_time": "12:00",
            "end_time": "11:00",
        }
        resp = self.client.post(self.list_url, payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    # ---- role-scoped queryset ------------------------------------------

    def _seed_booking_for(self, customer: User) -> Booking:
        return Booking.objects.create(
            customer=customer,
            provider=self.provider,
            service=self.service,
            scheduled_date=self.tomorrow(),
            start_time=time(14, 0),
            end_time=time(15, 0),
            total_price=Decimal("85.00"),
        )

    def test_customer_list_shows_only_own_bookings(self):
        mine = self._seed_booking_for(self.customer)
        Booking.objects.create(
            customer=self.other_customer,
            provider=self.provider,
            service=self.service,
            scheduled_date=self.tomorrow(),
            start_time=time(16, 0),
            end_time=time(17, 0),
            total_price=Decimal("85.00"),
        )
        self.client.force_authenticate(user=self.customer)
        resp = self.client.get(self.list_url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        ids = {item["id"] for item in resp.data["results"]}
        self.assertEqual(ids, {str(mine.id)})

    def test_provider_list_shows_assigned_bookings(self):
        booking = self._seed_booking_for(self.customer)
        self.client.force_authenticate(user=self.provider_user)
        resp = self.client.get(self.list_url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        ids = {item["id"] for item in resp.data["results"]}
        self.assertIn(str(booking.id), ids)

    def test_other_customer_cannot_retrieve_someone_elses_booking(self):
        booking = self._seed_booking_for(self.customer)
        self.client.force_authenticate(user=self.other_customer)
        url = reverse("bookings:booking-detail", args=[booking.id])
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    # ---- cancellation ---------------------------------------------------

    def test_owner_can_cancel_their_booking(self):
        booking = self._seed_booking_for(self.customer)
        url = reverse("bookings:booking-detail", args=[booking.id])
        self.client.force_authenticate(user=self.customer)
        resp = self.client.patch(url, {"status": "cancelled"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)
        booking.refresh_from_db()
        self.assertEqual(booking.status, Booking.Status.CANCELLED)

    def test_provider_cannot_cancel_via_this_endpoint(self):
        booking = self._seed_booking_for(self.customer)
        url = reverse("bookings:booking-detail", args=[booking.id])
        self.client.force_authenticate(user=self.provider_user)
        resp = self.client.patch(url, {"status": "cancelled"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
