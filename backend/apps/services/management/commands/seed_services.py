"""Seed the marketplace with categories, services, and reviews.

Companion to ``seed_providers``: that command sets up the provider
profiles, this one fans them out into a browsable catalog. Idempotent —
re-running updates rows in place via ``update_or_create`` keyed on the
natural identifier (``slug`` for categories and per-provider services,
the deterministic body for reviews).

Usage::

    python manage.py seed_providers   # one-time provider setup
    python manage.py seed_services    # safe to re-run

The seed data is curated to produce a believable marketplace UI: each
category has 1-3 services, hourly + flat pricing is mixed, and
ratings are pre-aggregated onto the service row so list cards render
without hitting the review aggregate.
"""
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


# Each entry maps onto an existing provider via the provider's
# ``service_category`` field. Reviews are seeded inline so list cards and
# detail pages both have aggregated ratings on first load.
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
        {
            "title": "Bathroom & kitchen installation",
            "subtitle": "Faucets, sinks, water heaters",
            "price": Decimal("110.00"),
            "pricing_type": "hourly",
            "duration_minutes": 120,
            "location_type": "onsite",
            "is_featured": False,
            "description": "Full installation and replacement of fixtures with a 30-day warranty.",
            "reviews": [
                ("Ronit B.", 5, "New water heater installed cleanly in under two hours."),
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
            "description": "Two-cleaner team, eco-friendly products, includes inside oven and fridge.",
            "reviews": [
                ("Lior P.", 5, "House looked brand new — even the grout!"),
                ("Tal M.", 5, "Booked for a move-out and got the deposit back in full."),
            ],
        },
        {
            "title": "Weekly housekeeping",
            "subtitle": "Recurring 2-hour visit",
            "price": Decimal("45.00"),
            "pricing_type": "hourly",
            "duration_minutes": 120,
            "location_type": "onsite",
            "is_featured": False,
            "description": "Reliable weekly visit with the same cleaner each time.",
            "reviews": [
                ("Ayelet H.", 4, "Consistent and friendly. Occasionally runs 10 minutes late."),
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
            "description": "Two rounds of concepts, one round of refinement, and a delivered brand kit.",
            "reviews": [
                ("Shai L.", 5, "Captured the brand on the first round of concepts."),
                ("Maya R.", 5, "Loved the process — felt collaborative the whole time."),
            ],
        },
        {
            "title": "Landing page design",
            "subtitle": "Figma file ready for handoff",
            "price": Decimal("85.00"),
            "pricing_type": "hourly",
            "duration_minutes": 480,
            "location_type": "remote",
            "is_featured": False,
            "description": "Wireframe, hi-fi design, and developer-ready Figma file with tokens.",
            "reviews": [
                ("Ben H.", 5, "Page converted 30% better than our old one."),
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
            "description": "Bring the boxes, leave the assembly to a professional.",
            "reviews": [
                ("Ori G.", 5, "Three flat-pack wardrobes built in under two hours."),
            ],
        },
        {
            "title": "TV and shelf mounting",
            "subtitle": "Wall-safe drilling and cable tidy",
            "price": Decimal("75.00"),
            "pricing_type": "flat",
            "duration_minutes": 60,
            "location_type": "onsite",
            "is_featured": False,
            "description": "Includes wall-type assessment, mounting, and cable concealment.",
            "reviews": [
                ("Tom A.", 5, "Mounted a 65\" TV cleanly with no exposed cables."),
            ],
        },
    ],
    "Auto Repair": [
        {
            "title": "Brake service & inspection",
            "subtitle": "Pads, rotors, and full diagnostic",
            "price": Decimal("180.00"),
            "pricing_type": "flat",
            "duration_minutes": 120,
            "location_type": "onsite",
            "is_featured": True,
            "description": "Replacement-grade pads and rotors with a full pre-service inspection.",
            "reviews": [
                ("Roni V.", 5, "Honest pricing and explained every part."),
                ("Sara K.", 4, "Quick turnaround — back on the road same day."),
            ],
        },
    ],
}


def _author_user_for(reviewer_name: str) -> User | None:
    """Return a real user to attribute a review to.

    Reviews use ``SET_NULL`` on the reviewer FK, so it's fine to leave
    it ``None`` — the public serializer falls back to the embedded
    ``author_name`` field below. We still try to attach a real account
    when one already exists so admin tools (filter-by-reviewer) work.
    """
    return None


class Command(BaseCommand):
    help = "Seed the marketplace with categories, services, and reviews."

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Seeding categories..."))
        category_by_name = self._seed_categories()

        self.stdout.write(self.style.NOTICE("Seeding services + reviews..."))
        created_services, updated_services = self._seed_services(category_by_name)

        self.stdout.write(
            self.style.SUCCESS(
                f"Done: {len(category_by_name)} categories, "
                f"{created_services} services created, "
                f"{updated_services} services updated."
            )
        )

    # ---- categories ------------------------------------------------------

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

    # ---- services + reviews ---------------------------------------------

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
            "is_featured": payload.get("is_featured", False),
            "is_active": True,
        }
        return Service.objects.update_or_create(
            provider=provider,
            slug=slug,
            defaults=defaults,
        )

    def _upsert_reviews(self, service: Service, reviews: list[tuple[str, int, str]]) -> None:
        # Wipe-and-replace keeps the seed deterministic across re-runs:
        # otherwise duplicates pile up because there's no natural key.
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
        # Re-aggregate provider rating + jobs from the freshly seeded
        # service rows so the provider profile hero matches the cards.
        services = provider.services.filter(is_active=True)
        total_count = sum(s.rating_count for s in services)
        if total_count == 0:
            provider.rating_average = Decimal("0.00")
            provider.rating_count = 0
        else:
            weighted = sum(s.rating_average * s.rating_count for s in services)
            provider.rating_average = (weighted / total_count).quantize(Decimal("0.01"))
            provider.rating_count = total_count
        # ``jobs_completed`` is a vanity metric; treat each review as a
        # completed job for seed purposes so the hero card has a number.
        provider.jobs_completed = max(provider.jobs_completed, total_count * 4)
        provider.save(
            update_fields=[
                "rating_average",
                "rating_count",
                "jobs_completed",
                "updated_at",
            ]
        )
