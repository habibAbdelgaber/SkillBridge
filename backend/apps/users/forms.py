"""Auth forms."""
from __future__ import annotations

from allauth.account.forms import default_token_generator
from allauth.account.utils import user_pk_to_url_str
from django.conf import settings
from django.contrib.auth.forms import PasswordResetForm


class FrontendPasswordResetForm(PasswordResetForm):
    """Send users to the SPA password-reset route."""

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
        # dj-rest-auth validates against allauth's uid and token helpers.
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
