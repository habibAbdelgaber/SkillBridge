from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.users.models import User, ProviderProfile


PROVIDERS = [
    {
        "email": "john.plumbing@example.com",
        "first_name": "John",
        "last_name": "Martinez",
        "profile": {
            "business_name": "JM Plumbing Services",
            "business_type": "individual",
            "tax_id": "PL-123456",
            "phone_number": "+972501111111",
            "service_category": "Plumbing",
            "years_of_experience": 12,
            "service_area": "Tel Aviv",
            "short_bio": "Licensed plumber specializing in residential and emergency repairs.",
            "license_or_certification_number": "LIC-PL-9876",
            "insurance_provider": "Harel Insurance",
            "headline": "Licensed plumber, 12+ years experience",
            "response_time_minutes": 30,
            "is_verified": True,
            "id_verified": True,
            "is_insured": True,
            "background_check_completed": True,
            "jobs_completed": 214,
            "rating_average": Decimal("4.85"),
            "rating_count": 132,
        },
    },
    {
        "email": "clean.pro@example.com",
        "first_name": "Sarah",
        "last_name": "Levi",
        "profile": {
            "business_name": "Sparkle Cleaning Co.",
            "business_type": "llc",
            "tax_id": "CL-987654",
            "phone_number": "+972502222222",
            "service_category": "Cleaning",
            "years_of_experience": 8,
            "service_area": "Ramat Gan",
            "short_bio": "Professional home and office cleaning services.",
            "license_or_certification_number": "",
            "insurance_provider": "Phoenix Insurance",
            "headline": "Top-rated cleaning service for homes & offices",
            "response_time_minutes": 45,
            "is_verified": True,
            "id_verified": True,
            "is_insured": True,
            "background_check_completed": False,
            "jobs_completed": 340,
            "rating_average": Decimal("4.72"),
            "rating_count": 210,
        },
    },
    {
        "email": "alex.electric@example.com",
        "first_name": "Alex",
        "last_name": "Cohen",
        "profile": {
            "business_name": "Cohen Electrical",
            "business_type": "individual",
            "tax_id": "EL-543210",
            "phone_number": "+972503333333",
            "service_category": "Electrical",
            "years_of_experience": 10,
            "service_area": "Herzliya",
            "short_bio": "Certified electrician for residential and commercial work.",
            "license_or_certification_number": "ELEC-7788",
            "insurance_provider": "",
            "headline": "Certified electrician, fast & reliable",
            "response_time_minutes": 25,
            "is_verified": True,
            "id_verified": True,
            "is_insured": False,
            "background_check_completed": True,
            "jobs_completed": 189,
            "rating_average": Decimal("4.90"),
            "rating_count": 98,
        },
    },
    {
        "email": "design.studio@example.com",
        "first_name": "Maya",
        "last_name": "Rosen",
        "profile": {
            "business_name": "Rosen Design Studio",
            "business_type": "llc",
            "tax_id": "DS-222333",
            "phone_number": "+972504444444",
            "service_category": "Design",
            "years_of_experience": 6,
            "service_area": "Tel Aviv",
            "short_bio": "Creative graphic and UI designer.",
            "license_or_certification_number": "",
            "insurance_provider": "",
            "headline": "Modern UI/UX & branding expert",
            "response_time_minutes": 60,
            "is_verified": False,
            "id_verified": True,
            "is_insured": False,
            "background_check_completed": False,
            "jobs_completed": 95,
            "rating_average": Decimal("4.65"),
            "rating_count": 70,
        },
    },
    {
        "email": "tutor.math@example.com",
        "first_name": "David",
        "last_name": "Katz",
        "profile": {
            "business_name": "Katz Tutoring",
            "business_type": "individual",
            "tax_id": "",
            "phone_number": "+972505555555",
            "service_category": "Tutoring",
            "years_of_experience": 5,
            "service_area": "Jerusalem",
            "short_bio": "Math and physics tutor for high school students.",
            "license_or_certification_number": "",
            "insurance_provider": "",
            "headline": "Patient math tutor, exam-focused",
            "response_time_minutes": 120,
            "is_verified": False,
            "id_verified": True,
            "is_insured": False,
            "background_check_completed": False,
            "jobs_completed": 120,
            "rating_average": Decimal("4.80"),
            "rating_count": 85,
        },
    },
    {
        "email": "garden.pro@example.com",
        "first_name": "Eli",
        "last_name": "Sharon",
        "profile": {
            "business_name": "Green Garden Experts",
            "business_type": "partnership",
            "tax_id": "GD-789456",
            "phone_number": "+972506666666",
            "service_category": "Gardening",
            "years_of_experience": 15,
            "service_area": "Netanya",
            "short_bio": "Garden design and maintenance specialists.",
            "license_or_certification_number": "",
            "insurance_provider": "Migdal",
            "headline": "Garden design & maintenance pros",
            "response_time_minutes": 90,
            "is_verified": True,
            "id_verified": True,
            "is_insured": True,
            "background_check_completed": True,
            "jobs_completed": 260,
            "rating_average": Decimal("4.88"),
            "rating_count": 140,
        },
    },
    {
        "email": "handyman.fix@example.com",
        "first_name": "Omer",
        "last_name": "Barak",
        "profile": {
            "business_name": "QuickFix Handyman",
            "business_type": "individual",
            "tax_id": "",
            "phone_number": "+972507777777",
            "service_category": "Handyman",
            "years_of_experience": 9,
            "service_area": "Bat Yam",
            "short_bio": "All-in-one handyman services.",
            "license_or_certification_number": "",
            "insurance_provider": "",
            "headline": "Fast fixes for every home problem",
            "response_time_minutes": 40,
            "is_verified": False,
            "id_verified": True,
            "is_insured": False,
            "background_check_completed": True,
            "jobs_completed": 175,
            "rating_average": Decimal("4.60"),
            "rating_count": 95,
        },
    },
    {
        "email": "auto.repair@example.com",
        "first_name": "Yossi",
        "last_name": "Ben-David",
        "profile": {
            "business_name": "Yossi Auto Repair",
            "business_type": "llc",
            "tax_id": "AR-555888",
            "phone_number": "+972508888888",
            "service_category": "Car services",
            "years_of_experience": 14,
            "service_area": "Holon",
            "short_bio": "Reliable car repair and diagnostics.",
            "license_or_certification_number": "AUTO-9988",
            "insurance_provider": "Clal",
            "headline": "Trusted car repair expert",
            "response_time_minutes": 50,
            "is_verified": True,
            "id_verified": True,
            "is_insured": True,
            "background_check_completed": True,
            "jobs_completed": 310,
            "rating_average": Decimal("4.91"),
            "rating_count": 160,
        },
    },
    {
        "email": "deep.clean@example.com",
        "first_name": "Noa",
        "last_name": "Peretz",
        "profile": {
            "business_name": "DeepClean Experts",
            "business_type": "corporation",
            "tax_id": "CL-321654",
            "phone_number": "+972509999999",
            "service_category": "Cleaning",
            "years_of_experience": 11,
            "service_area": "Haifa",
            "short_bio": "Deep cleaning and sanitation services.",
            "license_or_certification_number": "",
            "insurance_provider": "Harel",
            "headline": "Deep cleaning & sanitization pros",
            "response_time_minutes": 35,
            "is_verified": True,
            "id_verified": True,
            "is_insured": True,
            "background_check_completed": False,
            "jobs_completed": 290,
            "rating_average": Decimal("4.78"),
            "rating_count": 143,
        },
    },
    {
        "email": "tech.support@example.com",
        "first_name": "Daniel",
        "last_name": "Friedman",
        "profile": {
            "business_name": "IT Help Desk",
            "business_type": "individual",
            "tax_id": "",
            "phone_number": "+972501010101",
            "service_category": "IT Support",
            "years_of_experience": 7,
            "service_area": "Petah Tikva",
            "short_bio": "Home and small business IT support.",
            "license_or_certification_number": "",
            "insurance_provider": "",
            "headline": "Fast IT fixes for home & office",
            "response_time_minutes": 20,
            "is_verified": False,
            "id_verified": True,
            "is_insured": False,
            "background_check_completed": True,
            "jobs_completed": 140,
            "rating_average": Decimal("4.55"),
            "rating_count": 60,
        },
    },
]


class Command(BaseCommand):
    help = "Seed SkillBridge with demo provider users and provider profiles."

    @transaction.atomic
    def handle(self, *args, **options):
        default_password = "ProviderPass123!"

        created_count = 0
        updated_count = 0

        for item in PROVIDERS:
            user_data = {
                "first_name": item["first_name"],
                "last_name": item["last_name"],
                "role": User.Role.PROVIDER,
                "is_active": True,
            }

            user, user_created = User.objects.update_or_create(
                email=item["email"],
                defaults=user_data,
            )

            if user_created:
                user.set_password(default_password)
                user.save(update_fields=["password"])

            profile_data = item["profile"]

            ProviderProfile.objects.update_or_create(
                user=user,
                defaults=profile_data,
            )

            if user_created:
                created_count += 1
            else:
                updated_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Provider seed completed. Created: {created_count}, Updated: {updated_count}"
            )
        )
        self.stdout.write(
            self.style.WARNING(
                f"Default password for seeded providers: {default_password}"
            )
        )