"""Shared abstract models."""
from __future__ import annotations

import uuid

from django.db import models


class TimeStampedModel(models.Model):
    """Adds created and updated timestamps."""

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
        ordering = ("-created_at",)


class UUIDModel(models.Model):
    """Uses a UUID primary key."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    class Meta:
        abstract = True


class BaseModel(UUIDModel, TimeStampedModel):
    """UUID primary key with timestamps."""

    class Meta(TimeStampedModel.Meta):
        abstract = True
