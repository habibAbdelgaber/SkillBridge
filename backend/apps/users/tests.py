"""Tests for the users app.

Covers User creation paths, role helpers, ProviderProfile creation, and
the dj-rest-auth registration + login endpoints exposed under
``/api/v1/auth/``.

Run with: ``python manage.py test apps.users``
"""
from __future__ import annotations

from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.users.models import ProviderProfile, User


# ---------------------------------------------------------------------------
# Test helpers
# ---------------------------------------------------------------------------


def make_customer(**overrides) -> User:
    defaults = {
        "email": "customer@example.com",
        "password": "Pa55word!",
        "first_name": "Iris",
        "last_name": "Levi",
    }
    defaults.update(overrides)
    return User.objects.create_user(**defaults)


def make_provider_user(**overrides) -> User:
    defaults = {
        "email": "pro@example.com",
        "password": "Pa55word!",
        "first_name": "John",
        "last_name": "Martinez",
        "role": User.Role.PROVIDER,
    }
    defaults.update(overrides)
    return User.objects.create_user(**defaults)


def make_provider_profile(user: User, **overrides) -> ProviderProfile:
    defaults = {
        "user": user,
        "business_name": "JM Plumbing",
        "business_type": ProviderProfile.BusinessType.INDIVIDUAL,
        "phone_number": "+15551112222",
        "service_category": "Plumbing",
        "years_of_experience": 5,
        "service_area": "Tel Aviv",
    }
    defaults.update(overrides)
    return ProviderProfile.objects.create(**defaults)


# ---------------------------------------------------------------------------
# Model tests
# ---------------------------------------------------------------------------


class UserModelTests(TestCase):
    def test_create_user_normalises_email_and_hashes_password(self):
        user = User.objects.create_user(
            email="HELLO@Example.com", password="Pa55word!",
        )
        self.assertEqual(user.email, "hello@example.com")
        self.assertTrue(user.check_password("Pa55word!"))
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)

    def test_create_user_defaults_to_customer_role(self):
        user = make_customer()
        self.assertEqual(user.role, User.Role.CUSTOMER)
        self.assertTrue(user.is_customer)
        self.assertFalse(user.is_provider)

    def test_create_provider_user_sets_role(self):
        user = make_provider_user()
        self.assertTrue(user.is_provider)
        self.assertFalse(user.is_customer)

    def test_create_user_requires_email(self):
        with self.assertRaises(ValueError):
            User.objects.create_user(email="", password="Pa55word!")

    def test_create_superuser_marks_staff_and_admin(self):
        admin = User.objects.create_superuser(
            email="admin@example.com", password="Pa55word!",
        )
        self.assertTrue(admin.is_staff)
        self.assertTrue(admin.is_superuser)
        self.assertEqual(admin.role, User.Role.ADMIN)
        self.assertTrue(admin.is_admin_role)

    def test_full_name_falls_back_to_email_when_blank(self):
        user = User.objects.create_user(
            email="anon@example.com", password="Pa55word!",
        )
        # Blank first/last → ``get_full_name`` returns the email.
        self.assertEqual(user.get_full_name(), "anon@example.com")


class ProviderProfileModelTests(TestCase):
    def test_provider_profile_links_to_user(self):
        user = make_provider_user()
        profile = make_provider_profile(user)
        self.assertEqual(profile.user, user)
        self.assertEqual(user.provider_profile, profile)

    def test_required_fields_rejected_when_missing(self):
        user = make_provider_user()
        # ``service_area`` is required (CharField, no default) — full_clean
        # surfaces the missing-field error for both blank and unset.
        profile = ProviderProfile(
            user=user,
            business_name="Empty Co.",
            business_type=ProviderProfile.BusinessType.INDIVIDUAL,
            phone_number="+15551112222",
            service_category="Plumbing",
            service_area="",
        )
        with self.assertRaises(Exception):
            profile.full_clean()


# ---------------------------------------------------------------------------
# API tests — registration + login
# ---------------------------------------------------------------------------


class CustomerRegistrationAPITests(APITestCase):
    """Hits the dj-rest-auth registration endpoint our SPA actually uses."""

    url = reverse("users:rest_register")

    def test_customer_registration_creates_user_with_role_customer(self):
        payload = {
            "email": "new@example.com",
            "password1": "Pa55word!",
            "password2": "Pa55word!",
            "first_name": "iris",
            "last_name": "levi",
        }
        resp = self.client.post(self.url, payload, format="json")
        # With ACCOUNT_EMAIL_VERIFICATION=mandatory, the response is a
        # 201 with a {"detail": "Verification e-mail sent."} body. We
        # assert the side-effect on the User row instead of the body
        # shape so this test isn't coupled to that toggle.
        self.assertIn(resp.status_code, (status.HTTP_201_CREATED, status.HTTP_200_OK))
        user = User.objects.get(email="new@example.com")
        self.assertEqual(user.role, User.Role.CUSTOMER)
        # Names are title-cased by the registration serializer.
        self.assertEqual(user.first_name, "Iris")
        self.assertEqual(user.last_name, "Levi")

    def test_password_mismatch_is_rejected(self):
        payload = {
            "email": "mismatch@example.com",
            "password1": "Pa55word!",
            "password2": "different!",
            "first_name": "A",
            "last_name": "B",
        }
        resp = self.client.post(self.url, payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(User.objects.filter(email="mismatch@example.com").exists())


class LoginAPITests(APITestCase):
    """The SPA reads ``access`` / ``refresh`` keys from this response."""

    url = reverse("users:rest_login")

    def setUp(self) -> None:
        self.user = make_customer(email="login@example.com")
        # ``ACCOUNT_EMAIL_VERIFICATION="mandatory"`` is on in dev; the
        # login serializer rejects users without a verified primary
        # email. Stamp an EmailAddress row so the test focuses on the
        # JWT contract, not the verification flow.
        from allauth.account.models import EmailAddress

        EmailAddress.objects.create(
            user=self.user,
            email=self.user.email,
            primary=True,
            verified=True,
        )

    def test_login_returns_jwt_pair(self):
        payload = {"email": "login@example.com", "password": "Pa55word!"}
        resp = self.client.post(self.url, payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)
        self.assertIn("access", resp.data)
        self.assertIn("refresh", resp.data)
        self.assertEqual(resp.data["user"]["email"], "login@example.com")

    def test_login_rejects_wrong_password(self):
        payload = {"email": "login@example.com", "password": "wrong"}
        resp = self.client.post(self.url, payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
