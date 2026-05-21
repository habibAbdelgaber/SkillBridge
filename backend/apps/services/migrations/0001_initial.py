"""Initial schema for the services app: ServiceCategory + Service."""
from __future__ import annotations

import uuid
from decimal import Decimal

import django.core.validators
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("users", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="ServiceCategory",
            fields=[
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
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
                ("name", models.CharField(max_length=120, unique=True, verbose_name="name")),
                ("slug", models.SlugField(max_length=140, unique=True, verbose_name="slug")),
                ("description", models.TextField(blank=True, verbose_name="description")),
                (
                    "is_active",
                    models.BooleanField(
                        default=True,
                        help_text=(
                            "Inactive categories are hidden from the public listing and "
                            "cannot be selected by providers when creating new services."
                        ),
                        verbose_name="active",
                    ),
                ),
            ],
            options={
                "verbose_name": "service category",
                "verbose_name_plural": "service categories",
                "ordering": ("name",),
            },
        ),
        migrations.AddIndex(
            model_name="servicecategory",
            index=models.Index(
                fields=["is_active", "name"],
                name="services_se_is_acti_70ed16_idx",
            ),
        ),
        migrations.CreateModel(
            name="Service",
            fields=[
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
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
                ("title", models.CharField(max_length=180, verbose_name="title")),
                ("slug", models.SlugField(max_length=200, verbose_name="slug")),
                ("description", models.TextField(verbose_name="description")),
                (
                    "price",
                    models.DecimalField(
                        decimal_places=2,
                        help_text="Per-booking price in the platform's primary currency.",
                        max_digits=10,
                        validators=[django.core.validators.MinValueValidator(Decimal("0.01"))],
                        verbose_name="price",
                    ),
                ),
                (
                    "duration_minutes",
                    models.PositiveIntegerField(
                        help_text="Estimated session length in minutes.",
                        validators=[django.core.validators.MinValueValidator(1)],
                        verbose_name="duration (minutes)",
                    ),
                ),
                (
                    "location_type",
                    models.CharField(
                        choices=[("remote", "Remote"), ("onsite", "On-site"), ("hybrid", "Hybrid")],
                        default="onsite",
                        max_length=12,
                        verbose_name="location type",
                    ),
                ),
                (
                    "is_active",
                    models.BooleanField(
                        db_index=True,
                        default=True,
                        help_text="Inactive services are hidden from the public listing.",
                        verbose_name="active",
                    ),
                ),
                (
                    "category",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="services",
                        to="services.servicecategory",
                        verbose_name="category",
                    ),
                ),
                (
                    "provider",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="services",
                        to="users.providerprofile",
                        verbose_name="provider",
                    ),
                ),
            ],
            options={
                "verbose_name": "service",
                "verbose_name_plural": "services",
                "ordering": ("-created_at",),
            },
        ),
        migrations.AddConstraint(
            model_name="service",
            constraint=models.UniqueConstraint(
                fields=("provider", "slug"),
                name="services_service_unique_provider_slug",
            ),
        ),
        migrations.AddIndex(
            model_name="service",
            index=models.Index(
                fields=["is_active", "category"],
                name="services_se_is_acti_a3d2c4_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="service",
            index=models.Index(
                fields=["is_active", "provider"],
                name="services_se_is_acti_b41f57_idx",
            ),
        ),
    ]
