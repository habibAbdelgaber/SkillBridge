"""SkillBridge settings package.

Concrete settings modules live alongside this file:

- ``base``  : shared configuration consumed by every environment.
- ``dev``   : local development (DEBUG on, permissive CORS, verbose logs).
- ``prod``  : production hardening (security headers, strict validation).

The active configuration is selected via the ``DJANGO_SETTINGS_MODULE``
environment variable, e.g. ``config.settings.dev`` or ``config.settings.prod``.
"""
