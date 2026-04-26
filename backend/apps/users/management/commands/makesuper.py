from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model



class Command(BaseCommand):
    help = 'Create a superuser with the specified email and password'

    def add_arguments(self, parser):
        """Add command-line arguments for email, and password."""
        # parser.add_argument('--username', type=str, required=False, help='Username for the superuser (optional)')
        parser.add_argument('--email', type=str, required=True, help='Email address for the superuser')
        parser.add_argument('--password', type=str, required=True, help='Password for the superuser')

    def handle(self, *args, **options):
        """
        Handle the command to create a superuser. It checks if a user with the provided email already exists, and if not, it creates a new superuser with the given email and password.
        """
        User = get_user_model()
        email = options['email']
        password = options['password']
        # username = options['username'] or email  # Use email as username if not provided
        if not User.objects.filter(email=email).exists():
            User.objects.create_superuser(email=email, password=password)
            self.stdout.write(self.style.SUCCESS(f'Superuser created successfully with email: {email}'))
        else:
            self.stdout.write(self.style.WARNING(f'A user with email {email} already exists. No superuser created.'))