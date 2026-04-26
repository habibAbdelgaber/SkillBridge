from django.apps import AppConfig


class UsersConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.users"
    label = "users"
    verbose_name = "Users"

    def ready(self) -> None:
        """Register signal receivers once the app registry is populated."""
        # Imported for its side-effect of connecting ``post_save`` receivers.
        from apps.users import signals  # noqa: F401
