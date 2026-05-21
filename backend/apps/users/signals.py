"""User signal receivers."""
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
    """Verify superusers created outside allauth's signup flow."""
    if not created or not instance.is_superuser:
        return

    email = (instance.email or "").strip()
    if not email:
        logger.warning(
            "Skipping superuser auto-verification: user %s has no email.",
            instance.pk,
        )
        return

    # Wait for the outer user save before writing the allauth email row.
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
