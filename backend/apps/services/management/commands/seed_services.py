"""Seed marketplace categories, services, and reviews."""
from __future__ import annotations

from decimal import Decimal
from typing import Iterable

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils.text import slugify

from apps.services.models import Review, Service, ServiceCategory
from apps.users.models import ProviderProfile, User


CATEGORIES: list[dict] = [
    {
        "name": "Plumbing",
        "slug": "plumbing",
        "description": "Leaks, installations, and emergency pipe repair.",
    },
    {
        "name": "Cleaning",
        "slug": "cleaning",
        "description": "Deep cleaning, regular housekeeping, and move-out clean-ups.",
    },
    {
        "name": "Electrical",
        "slug": "electrical",
        "description": "Panel upgrades, wiring, and lighting installation.",
    },
    {
        "name": "Design",
        "slug": "design",
        "description": "Brand identity, web, and product design services.",
    },
    {
        "name": "Tutoring",
        "slug": "tutoring",
        "description": "One-on-one tutoring across school and university subjects.",
    },
    {
        "name": "Gardening",
        "slug": "gardening",
        "description": "Landscaping, lawn care, and seasonal maintenance.",
    },
    {
        "name": "Handyman",
        "slug": "handyman",
        "description": "Furniture assembly, mounting, and small home repairs.",
    },
    {
        "name": "Auto Repair",
        "slug": "auto-repair",
        "description": "Diagnostics, brakes, and routine vehicle maintenance.",
    },
]


# Services are matched to providers by service_category.
SERVICES_BY_CATEGORY: dict[str, list[dict]] = {
    "Plumbing": [
        {
            "title": "Emergency pipe repair",
            "subtitle": "24/7 burst pipe and leak response",
            "price": Decimal("85.00"),
            "pricing_type": "hourly",
            "duration_minutes": 60,
            "location_type": "onsite",
            "is_featured": True,
            "service_location_name": "Tel Aviv Savidor Center",
            "service_address": "Al Parashat Drachim St 10",
            "service_city": "Tel Aviv",
            "service_country": "Israel",
            "latitude": Decimal("32.0839"),
            "longitude": Decimal("34.7983"),
            "description": (
                "Same-day response for burst pipes, blocked drains, and "
                "leaking fixtures. Covers diagnosis, sealing, and clean-up."
            ),
            "reviews": [
                ("Daniel R.", 5, "Showed up within the hour and fixed a flooded kitchen — saved my evening."),
                ("Maya S.", 5, "Fast, polite, and walked me through what he was doing."),
                ("Itai K.", 4, "Good work, slightly above the quoted price but reasonable."),
            ],
        },
    ],
    "Cleaning": [
        {
            "title": "Deep home cleaning",
            "subtitle": "Top-to-bottom 4-hour clean",
            "price": Decimal("220.00"),
            "pricing_type": "flat",
            "duration_minutes": 240,
            "location_type": "onsite",
            "is_featured": True,
            "service_location_name": "Rothschild Boulevard",
            "service_address": "Rothschild Blvd 45",
            "service_city": "Tel Aviv",
            "service_country": "Israel",
            "latitude": Decimal("32.0645"),
            "longitude": Decimal("34.7748"),
            "description": "Two-cleaner team, eco-friendly products, includes inside oven and fridge.",
            "reviews": [
                ("Lior P.", 5, "House looked brand new — even the grout!"),
                ("Tal M.", 5, "Booked for a move-out and got the deposit back in full."),
            ],
        },
    ],
    "Electrical": [
        {
            "title": "Lighting installation",
            "subtitle": "Fixtures, dimmers, and smart switches",
            "price": Decimal("95.00"),
            "pricing_type": "hourly",
            "duration_minutes": 90,
            "location_type": "onsite",
            "is_featured": True,
            "service_location_name": "Dizengoff Center",
            "service_address": "Dizengoff St 50",
            "service_city": "Tel Aviv",
            "service_country": "Israel",
            "latitude": Decimal("32.0753"),
            "longitude": Decimal("34.7750"),
            "description": "Licensed installation of lighting fixtures and smart-home switches.",
            "reviews": [
                ("Noa F.", 5, "Installed five smart switches and labeled the breaker — very thorough."),
                ("Amir T.", 5, "Knew exactly what I needed and finished ahead of schedule."),
            ],
        },
    ],
    "Design": [
        {
            "title": "Logo and brand identity",
            "subtitle": "Concepts, refinement, and final files",
            "price": Decimal("650.00"),
            "pricing_type": "flat",
            "duration_minutes": 600,
            "location_type": "remote",
            "is_featured": True,
            "service_location_name": "Remote studio",
            "service_address": "",
            "service_city": "Tel Aviv",
            "service_country": "Israel",
            "latitude": Decimal("32.0853"),
            "longitude": Decimal("34.7818"),
            "description": "Two rounds of concepts, one round of refinement, and a delivered brand kit.",
            "reviews": [
                ("Shai L.", 5, "Captured the brand on the first round of concepts."),
                ("Maya R.", 5, "Loved the process — felt collaborative the whole time."),
            ],
        },
    ],
    "Tutoring": [
        {
            "title": "High-school math tutoring",
            "subtitle": "Algebra, calculus, exam prep",
            "price": Decimal("55.00"),
            "pricing_type": "hourly",
            "duration_minutes": 60,
            "location_type": "hybrid",
            "is_featured": True,
            "service_location_name": "Hebrew University campus",
            "service_address": "Safra Campus",
            "service_city": "Jerusalem",
            "service_country": "Israel",
            "latitude": Decimal("31.7750"),
            "longitude": Decimal("35.1965"),
            "description": "Personalised lesson plans aligned to the matriculation syllabus.",
            "reviews": [
                ("Yael D.", 5, "My son went from a 70 to a 92. Patient and clear."),
            ],
        },
    ],
    "Gardening": [
        {
            "title": "Garden maintenance",
            "subtitle": "Lawn, pruning, and weeding",
            "price": Decimal("65.00"),
            "pricing_type": "hourly",
            "duration_minutes": 120,
            "location_type": "onsite",
            "is_featured": False,
            "service_location_name": "Park HaYarkon",
            "service_address": "Rokach Blvd",
            "service_city": "Tel Aviv",
            "service_country": "Israel",
            "latitude": Decimal("32.1007"),
            "longitude": Decimal("34.8115"),
            "description": "Bi-weekly visit covering lawn, beds, and seasonal pruning.",
            "reviews": [
                ("Hila C.", 5, "Garden has never looked better."),
                ("Eli M.", 4, "Solid work; would like a quicker reply over WhatsApp."),
            ],
        },
    ],
    "Handyman": [
        {
            "title": "Furniture assembly",
            "subtitle": "IKEA, Wayfair, and custom builds",
            "price": Decimal("40.00"),
            "pricing_type": "hourly",
            "duration_minutes": 60,
            "location_type": "onsite",
            "is_featured": False,
            "service_location_name": "Givatayim Mall area",
            "service_address": "Derech Yitzhak Rabin 53",
            "service_city": "Givatayim",
            "service_country": "Israel",
            "latitude": Decimal("32.0684"),
            "longitude": Decimal("34.8125"),
            "description": "Bring the boxes, leave the assembly to a professional.",
            "reviews": [
                ("Ori G.", 5, "Three flat-pack wardrobes built in under two hours."),
            ],
        },
    ],
}

LEGACY_SEEDED_SERVICE_SLUGS = {
    "bathroom-kitchen-installation",
    "weekly-housekeeping",
    "landing-page-design",
    "tv-and-shelf-mounting",
    "brake-service-inspection",
}


def _author_user_for(reviewer_name: str) -> User | None:
    """Return a real reviewer account when one is available."""
    return None


class Command(BaseCommand):
    help = "Seed the marketplace with categories, services, and reviews."

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Seeding categories..."))
        category_by_name = self._seed_categories()

        self.stdout.write(self.style.NOTICE("Seeding services + reviews..."))
        created_services, updated_services = self._seed_services(category_by_name)
        removed_services = self._remove_legacy_seeded_services()

        self.stdout.write(
            self.style.SUCCESS(
                f"Done: {len(category_by_name)} categories, "
                f"{created_services} services created, "
                f"{updated_services} services updated, "
                f"{removed_services} legacy services removed."
            )
        )

    def _seed_categories(self) -> dict[str, ServiceCategory]:
        out: dict[str, ServiceCategory] = {}
        for cat in CATEGORIES:
            obj, _ = ServiceCategory.objects.update_or_create(
                slug=cat["slug"],
                defaults={
                    "name": cat["name"],
                    "description": cat["description"],
                    "is_active": True,
                },
            )
            out[cat["name"]] = obj
        return out

    def _seed_services(
        self,
        category_by_name: dict[str, ServiceCategory],
    ) -> tuple[int, int]:
        created = 0
        updated = 0
        for category_name, services in SERVICES_BY_CATEGORY.items():
            category = category_by_name.get(category_name)
            if category is None:
                continue
            providers = list(self._providers_for_category(category_name))
            if not providers:
                self.stdout.write(
                    self.style.WARNING(
                        f"  no provider matched category '{category_name}', skipping"
                    )
                )
                continue
            for idx, payload in enumerate(services):
                provider = providers[idx % len(providers)]
                service_obj, was_created = self._upsert_service(
                    provider=provider,
                    category=category,
                    payload=payload,
                )
                created += int(was_created)
                updated += int(not was_created)
                self._upsert_reviews(service_obj, payload.get("reviews") or [])
                self._refresh_service_aggregates(service_obj)
                self._refresh_provider_aggregates(provider)
        return created, updated

    def _providers_for_category(self, category_name: str) -> Iterable[ProviderProfile]:
        return ProviderProfile.objects.filter(
            service_category__iexact=category_name,
        ).select_related("user")

    def _upsert_service(
        self,
        *,
        provider: ProviderProfile,
        category: ServiceCategory,
        payload: dict,
    ) -> tuple[Service, bool]:
        slug = slugify(payload["title"])[:200]
        defaults = {
            "category": category,
            "title": payload["title"],
            "subtitle": payload.get("subtitle", ""),
            "description": payload.get("description", ""),
            "price": payload["price"],
            "pricing_type": payload["pricing_type"],
            "duration_minutes": payload["duration_minutes"],
            "location_type": payload["location_type"],
            "service_location_name": payload.get("service_location_name", ""),
            "service_address": payload.get("service_address", ""),
            "service_city": payload.get("service_city", ""),
            "service_country": payload.get("service_country", ""),
            "latitude": payload.get("latitude"),
            "longitude": payload.get("longitude"),
            "hero_image_url": "",
            "is_featured": payload.get("is_featured", False),
            "is_active": True,
        }
        return Service.objects.update_or_create(
            provider=provider,
            slug=slug,
            defaults=defaults,
        )

    def _remove_legacy_seeded_services(self) -> int:
        queryset = Service.objects.filter(
            slug__in=LEGACY_SEEDED_SERVICE_SLUGS,
        )
        count = queryset.count()
        queryset.delete()
        return count

    def _upsert_reviews(self, service: Service, reviews: list[tuple[str, int, str]]) -> None:
        # Reviews do not have a natural seed key, so replace them per service.
        Review.objects.filter(service=service).delete()
        for author_name, rating, body in reviews:
            Review.objects.create(
                service=service,
                reviewer=_author_user_for(author_name),
                rating=rating,
                body=body,
                is_published=True,
            )

    def _refresh_service_aggregates(self, service: Service) -> None:
        published = service.reviews.filter(is_published=True)
        count = published.count()
        if count == 0:
            service.rating_average = Decimal("0.00")
            service.rating_count = 0
        else:
            total = sum(r.rating for r in published)
            service.rating_average = (Decimal(total) / Decimal(count)).quantize(Decimal("0.01"))
            service.rating_count = count
        service.save(update_fields=["rating_average", "rating_count", "updated_at"])

    def _refresh_provider_aggregates(self, provider: ProviderProfile) -> None:
        # Keep provider cards aligned with the seeded service reviews.
        services = provider.services.filter(is_active=True)
        total_count = sum(s.rating_count for s in services)
        if total_count == 0:
            provider.rating_average = Decimal("0.00")
            provider.rating_count = 0
        else:
            weighted = sum(s.rating_average * s.rating_count for s in services)
            provider.rating_average = (weighted / total_count).quantize(Decimal("0.01"))
            provider.rating_count = total_count
        # Seed jobs from reviews so marketplace cards do not look empty.
        provider.jobs_completed = max(provider.jobs_completed, total_count * 4)
        provider.save(
            update_fields=[
                "rating_average",
                "rating_count",
                "jobs_completed",
                "updated_at",
            ]
        )
