"""Shared abstract models used across SkillBridge apps."""
from __future__ import annotations

import uuid

from django.db import models


class TimeStampedModel(models.Model):
    """Abstract base that adds self-updating `created_at` and `updated_at`."""

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
        ordering = ("-created_at",)


class UUIDModel(models.Model):
    """Abstract base that uses an external-facing UUID primary key."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    class Meta:
        abstract = True


class BaseModel(UUIDModel, TimeStampedModel):
    """Sensible default: UUID primary key + timestamps."""

    class Meta(TimeStampedModel.Meta):
        abstract = True
