"""Marketplace presentation, trust, and aggregate fields on ProviderProfile.

Why these are split off from the initial migration:

- The initial migration captured everything onboarding needs.
- This migration adds the *marketplace surface* and *aggregate counters*
  introduced when the public profile page was built. All new fields have
  defaults or ``blank=True`` so the migration is safe on rows that
  predate it.
"""
from __future__ import annotations

from decimal import Decimal

import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0001_initial"),
    ]

    operations = [
        # --- Marketplace presentation -----------------------------------
        migrations.AddField(
            model_name="providerprofile",
            name="headline",
            field=models.CharField(
                blank=True,
                help_text=(
                    "Short tagline shown on the provider profile and listing "
                    "cards (e.g. 'Licensed plumber, 12+ years in Tel Aviv')."
                ),
                max_length=180,
                verbose_name="headline",
            ),
        ),
        migrations.AddField(
            model_name="providerprofile",
            name="response_time_minutes",
            field=models.PositiveIntegerField(
                blank=True,
                null=True,
                help_text=(
                    "Rolling average reply time. Rendered to the customer as "
                    "'Replies in under N hours'."
                ),
                verbose_name="average response time (minutes)",
            ),
        ),

        # --- Trust & safety ---------------------------------------------
        migrations.AddField(
            model_name="providerprofile",
            name="id_verified",
            field=models.BooleanField(
                default=False,
                help_text="Government-issued ID has been confirmed.",
                verbose_name="ID verified",
            ),
        ),
        migrations.AddField(
            model_name="providerprofile",
            name="is_insured",
            field=models.BooleanField(
                default=False,
                help_text=(
                    "Provider has uploaded a valid insurance certificate. "
                    "Distinct from ``insurance_provider`` (free-text name) "
                    "so the badge is binary and trustworthy."
                ),
                verbose_name="insured",
            ),
        ),
        migrations.AddField(
            model_name="providerprofile",
            name="background_check_completed",
            field=models.BooleanField(
                default=False,
                help_text="Third-party background check has cleared.",
                verbose_name="background check completed",
            ),
        ),

        # --- Denormalized aggregates ------------------------------------
        migrations.AddField(
            model_name="providerprofile",
            name="jobs_completed",
            field=models.PositiveIntegerField(
                default=0,
                help_text="Lifetime completed-booking counter; updated by signals.",
                verbose_name="jobs completed",
            ),
        ),
        migrations.AddField(
            model_name="providerprofile",
            name="rating_average",
            field=models.DecimalField(
                decimal_places=2,
                default=Decimal("0.00"),
                help_text="Mean of all review ratings (0.00\u20135.00).",
                max_digits=3,
                validators=[
                    django.core.validators.MinValueValidator(Decimal("0.00")),
                    django.core.validators.MaxValueValidator(Decimal("5.00")),
                ],
                verbose_name="rating average",
            ),
        ),
        migrations.AddField(
            model_name="providerprofile",
            name="rating_count",
            field=models.PositiveIntegerField(
                default=0,
                help_text="Number of reviews backing ``rating_average``.",
                verbose_name="rating count",
            ),
        ),

        # --- Indexes -----------------------------------------------------
        migrations.AddIndex(
            model_name="providerprofile",
            index=models.Index(
                fields=["is_verified", "rating_average"],
                name="users_provi_is_veri_rating_idx",
            ),
        ),
    ]
