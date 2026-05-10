"""Shared DRF pagination classes."""
from __future__ import annotations

from rest_framework.pagination import PageNumberPagination


class StandardResultsPagination(PageNumberPagination):
    """Page-number pagination with a capped client page size."""

    page_size_query_param = "page_size"
    max_page_size = 60
