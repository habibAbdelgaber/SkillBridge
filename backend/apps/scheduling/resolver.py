"""Availability resolution helpers used by bookings and public schedules."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date as date_cls, time, timedelta
from typing import Iterable

from apps.scheduling.models import AvailabilityException, WeeklyAvailability


@dataclass(frozen=True)
class TimeRange:
    """Half-open minute range within one day."""

    start: int  # minutes since 00:00
    end: int

    @classmethod
    def from_times(cls, start: time, end: time) -> "TimeRange":
        return cls(_to_minutes(start), _to_minutes(end))

    def to_times(self) -> tuple[time, time]:
        return _from_minutes(self.start), _from_minutes(self.end)

    def contains(self, other: "TimeRange") -> bool:
        return self.start <= other.start and self.end >= other.end


def _to_minutes(value: time) -> int:
    return value.hour * 60 + value.minute


def _from_minutes(value: int) -> time:
    value = max(0, min(24 * 60, value))
    return time(hour=value // 60, minute=value % 60)


def _union(ranges: Iterable[TimeRange]) -> list[TimeRange]:
    """Merge overlapping or touching intervals."""
    sorted_ranges = sorted(ranges, key=lambda r: r.start)
    out: list[TimeRange] = []
    for r in sorted_ranges:
        if r.start >= r.end:
            continue
        if out and r.start <= out[-1].end:
            out[-1] = TimeRange(out[-1].start, max(out[-1].end, r.end))
        else:
            out.append(r)
    return out


def _subtract(base: list[TimeRange], cuts: list[TimeRange]) -> list[TimeRange]:
    """Return the parts of ``base`` not covered by blocked intervals."""
    cuts = _union(cuts)
    if not cuts:
        return base
    result: list[TimeRange] = []
    for r in base:
        cursor = r.start
        for cut in cuts:
            if cut.end <= cursor:
                continue
            if cut.start >= r.end:
                break
            if cut.start > cursor:
                result.append(TimeRange(cursor, min(cut.start, r.end)))
            cursor = max(cursor, cut.end)
            if cursor >= r.end:
                break
        if cursor < r.end:
            result.append(TimeRange(cursor, r.end))
    return result


def resolve_for_date(provider_id, on_date: date_cls) -> list[TimeRange]:
    """Resolve open intervals for one provider on one date."""
    weekly = WeeklyAvailability.objects.filter(
        provider_id=provider_id,
        weekday=on_date.weekday(),
    )
    exceptions = AvailabilityException.objects.filter(
        provider_id=provider_id,
        date=on_date,
    )

    base = [TimeRange.from_times(w.start_time, w.end_time) for w in weekly]
    additions = [
        TimeRange.from_times(e.start_time, e.end_time)
        for e in exceptions
        if e.is_available
    ]
    blocks = [
        TimeRange.from_times(e.start_time, e.end_time)
        for e in exceptions
        if not e.is_available
    ]

    open_ranges = _union(base + additions)
    return _subtract(open_ranges, blocks)


def is_provider_available(
    provider_id,
    on_date: date_cls,
    start: time,
    end: time,
) -> bool:
    """Return true when the requested window fits inside an open slot."""
    if start >= end:
        return False
    requested = TimeRange.from_times(start, end)
    for slot in resolve_for_date(provider_id, on_date):
        if slot.contains(requested):
            return True
    return False


def resolve_range(
    provider_id,
    start_date: date_cls,
    end_date: date_cls,
) -> dict[date_cls, list[TimeRange]]:
    """Resolve a date range, including ``end_date``."""
    if end_date < start_date:
        return {}
    out: dict[date_cls, list[TimeRange]] = {}
    cursor = start_date
    while cursor <= end_date:
        out[cursor] = resolve_for_date(provider_id, cursor)
        cursor += timedelta(days=1)
    return out
