from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model



class Command(BaseCommand):
    help = "Create a superuser with the specified email and password."

    def add_arguments(self, parser):
        parser.add_argument('--email', type=str, required=True, help='Email address for the superuser')
        parser.add_argument('--password', type=str, required=True, help='Password for the superuser')

    def handle(self, *args, **options):
        User = get_user_model()
        email = options['email']
        password = options['password']
        if not User.objects.filter(email=email).exists():
            User.objects.create_superuser(email=email, password=password)
            self.stdout.write(self.style.SUCCESS(f'Superuser created successfully with email: {email}'))
        else:
            self.stdout.write(self.style.WARNING(f'A user with email {email} already exists. No superuser created.'))
