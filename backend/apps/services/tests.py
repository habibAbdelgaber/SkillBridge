"""API tests for the services app.

Covers the four spec-mandated scenarios plus a few critical safety nets:

1. Public listing returns only ``is_active=True`` services.
2. Provider can create a service against an active category.
3. Provider cannot edit another provider's service (object-level perm).
4. Inactive services are hidden from public list and retrieve.
5. Customer (non-provider) is forbidden from creating services.
6. Owner can toggle ``is_active`` on their own service.
7. Categories endpoint hides inactive entries from the public.

Run with: ``python manage.py test apps.services``
"""
from __future__ import annotations

from decimal import Decimal

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.services.models import Service, ServiceCategory
from apps.users.models import ProviderProfile, User


class ServicesAPITestCase(APITestCase):
    """Shared fixtures: two providers, one customer, one active + one inactive category."""

    @classmethod
    def setUpTestData(cls) -> None:
        cls.cleaning = ServiceCategory.objects.create(
            name="Cleaning", slug="cleaning", is_active=True,
        )
        cls.dormant = ServiceCategory.objects.create(
            name="Dormant", slug="dormant", is_active=False,
        )

        cls.provider_a_user = User.objects.create_user(
            email="alpha@example.com", password="pwAlpha123!", role=User.Role.PROVIDER,
        )
        cls.provider_a = ProviderProfile.objects.create(
            user=cls.provider_a_user,
            business_name="Alpha Cleaners",
            business_type=ProviderProfile.BusinessType.LLC,
            phone_number="+15551112222",
            service_category="Cleaning",
            years_of_experience=5,
            service_area="Brooklyn, NY",
        )

        cls.provider_b_user = User.objects.create_user(
            email="beta@example.com", password="pwBeta123!", role=User.Role.PROVIDER,
        )
        cls.provider_b = ProviderProfile.objects.create(
            user=cls.provider_b_user,
            business_name="Beta Plumbing",
            business_type=ProviderProfile.BusinessType.INDIVIDUAL,
            phone_number="+15553334444",
            service_category="Plumbing",
            years_of_experience=10,
            service_area="Queens, NY",
        )

        cls.customer_user = User.objects.create_user(
            email="cust@example.com", password="pwCust123!", role=User.Role.CUSTOMER,
        )

        cls.active_service = Service.objects.create(
            provider=cls.provider_a,
            category=cls.cleaning,
            title="Deep Cleaning",
            slug="deep-cleaning",
            description="3-hour deep clean of a 2BR apartment.",
            price=Decimal("180.00"),
            duration_minutes=180,
            location_type=Service.LocationType.ONSITE,
            is_active=True,
        )
        cls.inactive_service = Service.objects.create(
            provider=cls.provider_a,
            category=cls.cleaning,
            title="Move-out Clean",
            slug="move-out-clean",
            description="Reserved for repeat clients.",
            price=Decimal("220.00"),
            duration_minutes=240,
            location_type=Service.LocationType.ONSITE,
            is_active=False,
        )

    # ---- public listing ----------------------------------------------------

    def test_public_service_list_returns_only_active(self):
        url = reverse("services:service-list")
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        ids = {item["id"] for item in resp.data["results"]}
        self.assertIn(str(self.active_service.id), ids)
        self.assertNotIn(str(self.inactive_service.id), ids)

    def test_public_service_retrieve_404_for_inactive(self):
        url = reverse("services:service-detail", args=[self.inactive_service.id])
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    def test_public_category_list_hides_inactive(self):
        url = reverse("services:category-list")
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        slugs = {c["slug"] for c in resp.data["results"]}
        self.assertIn("cleaning", slugs)
        self.assertNotIn("dormant", slugs)

    # ---- provider create ---------------------------------------------------

    def test_provider_can_create_own_service(self):
        self.client.force_authenticate(user=self.provider_b_user)
        url = reverse("services:my-service-list")
        payload = {
            "title": "Leaky Faucet Fix",
            "description": "Standard kitchen / bathroom faucet repair.",
            "price": "85.00",
            "duration_minutes": 60,
            "location_type": Service.LocationType.ONSITE,
            "category_id": str(self.cleaning.id),
        }
        resp = self.client.post(url, payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED, resp.data)
        created = Service.objects.get(id=resp.data["id"])
        self.assertEqual(created.provider, self.provider_b)
        self.assertEqual(created.slug, "leaky-faucet-fix")  # auto-derived

    def test_create_rejects_inactive_category(self):
        self.client.force_authenticate(user=self.provider_b_user)
        url = reverse("services:my-service-list")
        payload = {
            "title": "Should Fail",
            "description": "Category is dormant.",
            "price": "10.00",
            "duration_minutes": 30,
            "location_type": Service.LocationType.REMOTE,
            "category_id": str(self.dormant.id),
        }
        resp = self.client.post(url, payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("category_id", resp.data)

    def test_create_rejects_non_positive_price(self):
        self.client.force_authenticate(user=self.provider_b_user)
        url = reverse("services:my-service-list")
        payload = {
            "title": "Free Job",
            "description": "Bad price.",
            "price": "0.00",
            "duration_minutes": 30,
            "location_type": Service.LocationType.REMOTE,
            "category_id": str(self.cleaning.id),
        }
        resp = self.client.post(url, payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("price", resp.data)

    def test_customer_cannot_create_service(self):
        self.client.force_authenticate(user=self.customer_user)
        url = reverse("services:my-service-list")
        payload = {
            "title": "Should be rejected",
            "description": "Customer attempting provider write.",
            "price": "10.00",
            "duration_minutes": 30,
            "location_type": Service.LocationType.REMOTE,
            "category_id": str(self.cleaning.id),
        }
        resp = self.client.post(url, payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    # ---- cross-provider isolation -----------------------------------------

    def test_provider_cannot_edit_another_providers_service(self):
        self.client.force_authenticate(user=self.provider_b_user)
        # Provider B's queryset doesn't include Provider A's service, so
        # the targeted detail URL 404s before the object-level check fires.
        # That's the desired behaviour: never leak existence.
        url = reverse("services:my-service-detail", args=[self.active_service.id])
        resp = self.client.patch(url, {"title": "Hijack"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)
        self.active_service.refresh_from_db()
        self.assertEqual(self.active_service.title, "Deep Cleaning")

    def test_provider_my_list_only_shows_own_services(self):
        self.client.force_authenticate(user=self.provider_a_user)
        url = reverse("services:my-service-list")
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        ids = {item["id"] for item in resp.data["results"]}
        # Both A's services (active + inactive) appear; none of B's exist yet.
        self.assertIn(str(self.active_service.id), ids)
        self.assertIn(str(self.inactive_service.id), ids)

    def test_owner_can_toggle_is_active(self):
        self.client.force_authenticate(user=self.provider_a_user)
        url = reverse("services:my-service-detail", args=[self.inactive_service.id])
        resp = self.client.patch(url, {"is_active": True}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)
        self.inactive_service.refresh_from_db()
        self.assertTrue(self.inactive_service.is_active)

    # ---- public provider directory ----------------------------------------

    def test_public_provider_list_redacts_kyc_fields(self):
        url = reverse("services:provider-list")
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        sample = resp.data["results"][0]
        for redacted in ("tax_id", "license_or_certification_number", "insurance_provider"):
            self.assertNotIn(redacted, sample)


class MarketplaceFieldsTestCase(APITestCase):
    """Locks in the marketplace contract added in migration 0003.

    These tests don't try to exercise every code path - they assert the
    presence and shape of the *new* fields on the public surfaces, so a
    future refactor can't silently drop one and break the SPA's render.
    """

    @classmethod
    def setUpTestData(cls) -> None:
        cls.cleaning = ServiceCategory.objects.create(
            name="Cleaning", slug="cleaning", is_active=True,
        )

        cls.provider_user = User.objects.create_user(
            email="pro@example.com", password="proPass123!", role=User.Role.PROVIDER,
        )
        cls.provider = ProviderProfile.objects.create(
            user=cls.provider_user,
            business_name="Sparkle Pros",
            business_type=ProviderProfile.BusinessType.LLC,
            phone_number="+15550006000",
            service_category="Cleaning",
            years_of_experience=8,
            service_area="Tel Aviv",
            headline="Eco-friendly cleaning across Tel Aviv",
            response_time_minutes=45,
            id_verified=True,
            is_insured=True,
            background_check_completed=False,
            jobs_completed=120,
            rating_average=Decimal("4.85"),
            rating_count=44,
        )

        cls.featured_service = Service.objects.create(
            provider=cls.provider,
            category=cls.cleaning,
            title="Move-in deep clean",
            subtitle="3 cleaners, full kitchen + bath sanitization",
            slug="move-in-deep-clean",
            description="Full apartment turnaround.",
            price=Decimal("220.00"),
            pricing_type=Service.PricingType.FLAT,
            duration_minutes=240,
            location_type=Service.LocationType.ONSITE,
            hero_image_url="https://cdn.example.com/sparkle.jpg",
            is_featured=True,
            rating_average=Decimal("4.9"),
            rating_count=12,
            is_active=True,
        )

        cls.customer = User.objects.create_user(
            email="customer@example.com",
            password="custPass123!",
            first_name="Iris",
            last_name="Levi",
            role=User.Role.CUSTOMER,
        )

        # One published review, one suppressed - aggregate logic isn't in
        # scope here; we just want the public payload filtering correct.
        cls.review_published = Review.objects.create(
            service=cls.featured_service,
            reviewer=cls.customer,
            rating=5,
            body="Spotless. Will book again.",
            is_published=True,
        )
        cls.review_hidden = Review.objects.create(
            service=cls.featured_service,
            reviewer=cls.customer,
            rating=1,
            body="(moderated)",
            is_published=False,
        )

    # ---- Service public payload -------------------------------------------

    def test_public_service_includes_marketplace_fields(self):
        from apps.services.models import Service as ServiceModel  # noqa: F401

        url = reverse("services:service-detail", args=[self.featured_service.id])
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        body = resp.data
        for required in (
            "subtitle",
            "pricing_type",
            "hero_image_url",
            "is_featured",
            "rating",
        ):
            self.assertIn(required, body, f"missing field: {required}")
        self.assertEqual(body["pricing_type"], "flat")
        self.assertTrue(body["is_featured"])
        self.assertEqual(body["rating"], {"average": 4.9, "count": 12})

    # ---- Provider list payload -------------------------------------------

    def test_public_provider_list_exposes_aggregates_and_verifications(self):
        url = reverse("services:provider-list")
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        sample = resp.data["results"][0]
        self.assertEqual(sample["headline"], "Eco-friendly cleaning across Tel Aviv")
        self.assertEqual(sample["jobs_completed"], 120)
        self.assertEqual(sample["response_time_minutes"], 45)
        self.assertEqual(sample["rating"], {"average": 4.85, "count": 44})
        # Verification flag list is the active set (id + insured), nothing else.
        self.assertEqual(sorted(sample["verifications"]), ["id", "insured"])

    # ---- Provider detail payload -----------------------------------------

    def test_provider_detail_returns_services_and_published_reviews(self):
        url = reverse("services:provider-detail", args=[self.provider.id])
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        body = resp.data
        # Detail extends summary - inherits the rating + verifications shape.
        self.assertIn("rating", body)
        self.assertIn("verifications", body)
        # Services nested without re-embedding the provider card.
        self.assertEqual(len(body["services_offered"]), 1)
        nested = body["services_offered"][0]
        self.assertNotIn("provider", nested)
        self.assertEqual(nested["pricing_type"], "flat")
        self.assertTrue(nested["is_featured"])
        # Reviews: only the published one, with a humanized author name.
        self.assertEqual(len(body["reviews"]), 1)
        review = body["reviews"][0]
        self.assertEqual(review["rating"], 5)
        self.assertEqual(review["author_name"], "Iris Levi")


# Late import keeps the original ServicesAPITestCase setup module-scoped.
from apps.services.models import Review  # noqa: E402
