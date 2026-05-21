"""Marketplace fields on Service + introduce the Review model.

All Service additions have safe defaults so this migration is non-blocking
on existing rows. ``ordering`` flips to put featured services first - the
default sort the marketplace already shows.
"""
from __future__ import annotations

from decimal import Decimal
import uuid

import django.core.validators
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("services", "0002_rename_services_se_is_acti_a3d2c4_idx_services_se_is_acti_b3b6ee_idx_and_more"),
        ("users", "0002_marketplace_fields"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # --- New scalar fields on Service -------------------------------
        migrations.AddField(
            model_name="service",
            name="subtitle",
            field=models.CharField(
                blank=True,
                help_text="Optional one-liner shown under the title on listing cards.",
                max_length=200,
                verbose_name="subtitle",
            ),
        ),
        migrations.AddField(
            model_name="service",
            name="pricing_type",
            field=models.CharField(
                choices=[("hourly", "Per hour"), ("flat", "Flat rate")],
                default="flat",
                max_length=10,
                verbose_name="pricing type",
            ),
        ),
        migrations.AddField(
            model_name="service",
            name="hero_image_url",
            field=models.URLField(
                blank=True,
                help_text=(
                    "Public URL of the listing-card image. Stored as a URL "
                    "rather than an ImageField so we don't need MEDIA_ROOT/S3 "
                    "wired up for the marketplace MVP."
                ),
                max_length=500,
                verbose_name="hero image URL",
            ),
        ),
        migrations.AddField(
            model_name="service",
            name="is_featured",
            field=models.BooleanField(
                db_index=True,
                default=False,
                help_text=(
                    "Curated promotion flag - featured services get a badge "
                    "and rank ahead of peers in the default sort."
                ),
                verbose_name="featured",
            ),
        ),
        migrations.AddField(
            model_name="service",
            name="rating_average",
            field=models.DecimalField(
                decimal_places=2,
                default=Decimal("0.00"),
                max_digits=3,
                validators=[
                    django.core.validators.MinValueValidator(Decimal("0.00")),
                    django.core.validators.MaxValueValidator(Decimal("5.00")),
                ],
                verbose_name="rating average",
            ),
        ),
        migrations.AddField(
            model_name="service",
            name="rating_count",
            field=models.PositiveIntegerField(default=0, verbose_name="rating count"),
        ),

        # --- Refresh the price help text + ordering --------------------
        migrations.AlterField(
            model_name="service",
            name="price",
            field=models.DecimalField(
                decimal_places=2,
                help_text=(
                    "Numeric amount; meaning depends on ``pricing_type`` "
                    "(hourly rate vs flat per-booking fee)."
                ),
                max_digits=10,
                validators=[django.core.validators.MinValueValidator(Decimal("0.01"))],
                verbose_name="price",
            ),
        ),
        migrations.AlterModelOptions(
            name="service",
            options={
                "ordering": ("-is_featured", "-created_at"),
                "verbose_name": "service",
                "verbose_name_plural": "services",
            },
        ),
        migrations.AddIndex(
            model_name="service",
            index=models.Index(
                fields=["is_active", "is_featured"],
                name="services_se_is_acti_feat_idx",
            ),
        ),

        # --- Review model ----------------------------------------------
        migrations.CreateModel(
            name="Review",
            fields=[
                (
                    "created_at",
                    models.DateTimeField(auto_now_add=True, db_index=True),
                ),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                (
                    "rating",
                    models.PositiveSmallIntegerField(
                        help_text="Whole-star rating, 1 through 5.",
                        validators=[
                            django.core.validators.MinValueValidator(1),
                            django.core.validators.MaxValueValidator(5),
                        ],
                        verbose_name="rating",
                    ),
                ),
                ("body", models.TextField(blank=True, verbose_name="body")),
                (
                    "is_published",
                    models.BooleanField(
                        default=True,
                        help_text=(
                            "Hidden reviews are excluded from public aggregates. "
                            "Used by moderation to suppress abusive content "
                            "without deleting it."
                        ),
                        verbose_name="published",
                    ),
                ),
                (
                    "service",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="reviews",
                        to="services.service",
                        verbose_name="service",
                    ),
                ),
                (
                    "reviewer",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="reviews_authored",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="reviewer",
                    ),
                ),
            ],
            options={
                "verbose_name": "review",
                "verbose_name_plural": "reviews",
                "ordering": ("-created_at",),
            },
        ),
        migrations.AddIndex(
            model_name="review",
            index=models.Index(
                fields=["service", "-created_at"],
                name="services_re_service_created_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="review",
            index=models.Index(
                fields=["is_published", "-created_at"],
                name="services_re_pub_created_idx",
            ),
        ),
    ]
