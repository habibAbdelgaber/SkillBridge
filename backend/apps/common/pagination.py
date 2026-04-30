"""Shared DRF pagination classes.

The default DRF ``PageNumberPagination`` ignores ``?page_size=`` from
clients, which means the SPA can't ask for a page-size that matches its
card grid. ``StandardResultsPagination`` opts into the
``page_size_query_param`` so views can be driven by the UI without each
viewset reaching for its own pagination subclass.
"""
from __future__ import annotations

from rest_framework.pagination import PageNumberPagination


class StandardResultsPagination(PageNumberPagination):
    """Page-number pagination with a client-controlled page size.

    - ``?page=N``         -> 1-indexed page number (default 1)
    - ``?page_size=K``    -> requested page size, clamped to ``max_page_size``

    Falls back to ``PAGE_SIZE`` from settings when ``page_size`` is omitted.
    """

    page_size_query_param = "page_size"
    max_page_size = 60
