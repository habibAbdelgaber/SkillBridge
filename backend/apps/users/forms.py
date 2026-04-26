"""Auth-related forms.

Subclasses Django's ``PasswordResetForm`` so the reset link points at the
SkillBridge SPA instead of the (unregistered) ``password_reset_confirm``
URL name. This lets us keep dj-rest-auth's ``PasswordResetSerializer``
contract while owning the email's link target.

UID encoding caveat
-------------------
``User.id`` is a ``UUIDField``. dj-rest-auth's
``PasswordResetConfirmSerializer`` decodes the ``uid`` it receives via
allauth's ``url_str_to_user_pk`` (because allauth is in
``INSTALLED_APPS``), not Django's classic ``urlsafe_base64_decode``. For
a UUID PK, allauth's decoder calls ``UUIDField.to_python(pk_str)``
directly on the raw string. The matching encoder is
``user_pk_to_url_str(user)`` which returns ``user.pk.hex``.

If the form encoded with ``urlsafe_base64_encode(force_bytes(user.pk))``,
the email link would carry a base64-of-UUID-string, and the decode side
would feed that back to ``UUIDField.to_python``, raising
``"'<base64>' is not a valid UUID."`` at confirm time. So this form uses
allauth's helpers - the same ones the confirm serializer expects.
"""
from __future__ import annotations

from allauth.account.forms import default_token_generator
from allauth.account.utils import user_pk_to_url_str
from django.conf import settings
from django.contrib.auth.forms import PasswordResetForm


class FrontendPasswordResetForm(PasswordResetForm):
    """Send users to the SPA's reset-confirm route.

    Uses allauth's ``user_pk_to_url_str`` and ``default_token_generator``
    so that the uid + token in the email exactly match what dj-rest-auth
    will validate against on the confirm endpoint.
    """

    SPA_PATH = "/reset-password"

    def save(  # type: ignore[override]
        self,
        domain_override=None,
        subject_template_name="registration/password_reset_subject.txt",
        email_template_name="registration/password_reset_email.html",
        use_https=False,
        token_generator=None,
        from_email=None,
        request=None,
        html_email_template_name=None,
        extra_email_context=None,
    ):
        # The token_generator argument exists for API parity with the parent.
        # Ignore it - allauth's generator is what the confirm serializer
        # validates against when allauth is installed, and a mismatch would
        # silently produce links that always fail.
        generator = default_token_generator
        frontend_url = getattr(settings, "FRONTEND_URL", "").rstrip("/")
        email = self.cleaned_data["email"]

        for user in self.get_users(email):
            uid = user_pk_to_url_str(user)
            token = generator.make_token(user)
            if frontend_url:
                password_reset_url = f"{frontend_url}{self.SPA_PATH}/{uid}/{token}"
            else:
                password_reset_url = f"{self.SPA_PATH}/{uid}/{token}"
            domain = frontend_url.replace("https://", "").replace("http://", "")
            context = {
                "email": user.email,
                "user": user,
                "uid": uid,
                "token": token,
                "frontend_url": frontend_url,
                "password_reset_url": password_reset_url,
                "site_name": "SkillBridge",
                "domain": domain,
                "protocol": "https" if use_https else "http",
            }
            if extra_email_context:
                context.update(extra_email_context)
            self.send_mail(
                subject_template_name,
                email_template_name,
                context,
                from_email,
                user.email,
                html_email_template_name=html_email_template_name,
            )
