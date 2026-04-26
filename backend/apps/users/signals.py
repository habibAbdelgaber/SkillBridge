"""Signal receivers for the users app.

Centralizes cross-cutting side-effects on the ``User`` lifecycle so the
domain models stay lean and the behavior is uniform regardless of how a
user is created (management command, admin UI, DRF register, shell).
"""
from __future__ import annotations

import logging

from allauth.account.models import EmailAddress
from django.db import transaction
from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.users.models import User

logger = logging.getLogger(__name__)


@receiver(post_save, sender=User, dispatch_uid="users.auto_verify_superuser_email")
def auto_verify_superuser_email(sender, instance: User, created: bool, **kwargs) -> None:
    """Auto-verify the email on any newly-created superuser.

    ``django-allauth`` tracks verification state in ``EmailAddress`` — a row
    that the signup flow normally creates. Superusers minted outside that
    flow (``createsuperuser``, a custom management command, programmatic
    creation in tests, etc.) have no ``EmailAddress`` row, so they cannot
    authenticate when ``ACCOUNT_EMAIL_VERIFICATION='mandatory'``.

    This receiver bridges that gap exactly once, when the user is first
    created, by upserting a verified + primary ``EmailAddress``. Subsequent
    saves (password changes, profile edits) are no-ops.
    """
    if not created or not instance.is_superuser:
        return

    email = (instance.email or "").strip()
    if not email:
        logger.warning(
            "Skipping superuser auto-verification: user %s has no email.",
            instance.pk,
        )
        return

    # Run inside a transaction so a failure here doesn't leave a half-populated
    # EmailAddress table behind, and on_commit defers the write until the
    # outer User.save() transaction is durable — important when this signal
    # fires from inside ``transaction.atomic`` blocks (e.g. test fixtures).
    def _ensure_verified_email_address() -> None:
        email_address, was_created = EmailAddress.objects.get_or_create(
            user=instance,
            email__iexact=email,
            defaults={"email": email, "verified": True, "primary": True},
        )
        if not was_created and (not email_address.verified or not email_address.primary):
            email_address.verified = True
            email_address.primary = True
            email_address.save(update_fields=["verified", "primary"])

        logger.info(
            "Auto-verified superuser email: user=%s email=%s created=%s",
            instance.pk,
            email,
            was_created,
        )

    transaction.on_commit(_ensure_verified_email_address)
