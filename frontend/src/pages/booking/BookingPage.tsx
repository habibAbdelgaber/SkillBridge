import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import { BookingStepper } from "@/components/booking/BookingStepper";
import { BookingSummaryCard } from "@/components/booking/BookingSummaryCard";
import { DateGrid } from "@/components/booking/DateGrid";
import { JobLocationCard } from "@/components/booking/JobLocationCard";
import { TimeSlotPicker } from "@/components/booking/TimeSlotPicker";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Section } from "@/components/ui/Section";
import { BookingValidationError, bookingService } from "@/services/bookingService";
import { marketplaceService } from "@/services/marketplaceService";
import type { ProviderSummary, ServiceListing } from "@/types/marketplace";

interface AvailabilityDayApi {
  date: string;
  weekday: number;
  slots: Array<{ start_time: string; end_time: string }>;
}

const PLATFORM_FEE_RATE = 0.1; // 10% of service fee
const VAT_RATE = 0.18; // matches IL VAT (≈18%)
const AVAILABILITY_WINDOW_DAYS = 30;

/**
 * Booking page (Schedule step).
 *
 * Flow:
 *   1. /book/:serviceId loads the service + the provider's resolved
 *      availability for the next 30 days.
 *   2. The customer picks a date and a start-time (slots come from the
 *      backend's resolved availability so weekends / off-days greyed out).
 *   3. The summary card aggregates service fee + platform fee + VAT.
 *   4. Submit POSTs to /api/v1/bookings/. Backend field errors are
 *      mapped to inline messages; success routes to /bookings/<id>.
 */
export function BookingPage() {
  const { serviceId } = useParams<{ serviceId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // ---- Source data ------------------------------------------------------
  const [service, setService] = useState<ServiceListing | null>(null);
  const [provider, setProvider] = useState<ProviderSummary | null>(null);
  const [availability, setAvailability] = useState<AvailabilityDayApi[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // ---- Form state -------------------------------------------------------
  const [selectedDate, setSelectedDate] = useState<string | null>(
    searchParams.get("date"),
  );
  const [selectedTime, setSelectedTime] = useState<string | null>(
    normalizeIncomingTime(searchParams.get("time")),
  );
  const [address, setAddress] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  // ---- Calendar navigation ---------------------------------------------
  const today = useMemo(() => new Date(), []);
  const [visibleMonth, setVisibleMonth] = useState<Date>(() => {
    const seedIso = searchParams.get("date");
    const anchor = seedIso ? parseLocalDate(seedIso) : new Date();
    return new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  });

  // ---- Submission state -------------------------------------------------
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [banner, setBanner] = useState<string | null>(null);

  // ---- Initial fetch ----------------------------------------------------
  useEffect(() => {
    if (!serviceId) {
      setLoadError("Missing service id.");
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const fetchedService = await marketplaceService.getService(serviceId);
        if (cancelled) return;
        setService(fetchedService);

        const providerDetail = await marketplaceService.getProvider(
          fetchedService.providerId,
        );
        if (cancelled) return;
        setProvider(providerDetail);

        const from = isoDateKey(today);
        const toDate = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate() + AVAILABILITY_WINDOW_DAYS,
        );
        const days = await marketplaceService.getProviderAvailability(
          fetchedService.providerId,
          { from, to: isoDateKey(toDate) },
        );
        if (cancelled) return;
        setAvailability(days);
      } catch (err) {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : "Failed to load.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [serviceId, today]);

  // ---- Derived: slot lookup tables -------------------------------------
  const slotsByDate = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const day of availability) {
      map.set(
        day.date,
        day.slots.map((s) => formatHHMM(s.start_time)),
      );
    }
    return map;
  }, [availability]);

  const slotCountByDate = useMemo(() => {
    const map = new Map<string, number>();
    slotsByDate.forEach((value, key) => map.set(key, value.length));
    return map;
  }, [slotsByDate]);

  const slotsForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return slotsByDate.get(selectedDate) ?? [];
  }, [selectedDate, slotsByDate]);

  // Snap the selected time to one of the slots for the chosen date so a
  // stale prefill never persists into the submit payload.
  useEffect(() => {
    if (selectedTime && !slotsForSelectedDate.includes(selectedTime)) {
      setSelectedTime(null);
    }
  }, [slotsForSelectedDate, selectedTime]);

  // ---- Pricing ---------------------------------------------------------
  const durationMinutes = service?.durationMinutes ?? 0;

  const pricing = useMemo(() => {
    if (!service) return { serviceFee: 0, platformFee: 0, vat: 0, total: 0 };
    const baseRate = service.pricePerHour ?? service.flatPrice ?? 0;
    let serviceFee = 0;
    if (service.pricePerHour != null) {
      const hours = Math.max(1, Math.ceil(durationMinutes / 60));
      serviceFee = baseRate * hours;
    } else {
      serviceFee = baseRate;
    }
    const platformFee = round2(serviceFee * PLATFORM_FEE_RATE);
    const vat = round2((serviceFee + platformFee) * VAT_RATE);
    const total = round2(serviceFee + platformFee + vat);
    return { serviceFee, platformFee, vat, total };
  }, [service, durationMinutes]);

  // ---- Submit ----------------------------------------------------------
  const canSubmit = Boolean(
    service &&
    selectedDate &&
    selectedTime &&
    address.trim().length > 0 &&
    !isSubmitting,
  );

  const goPrevMonth = () => {
    const prev = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1);
    if (prev < new Date(today.getFullYear(), today.getMonth(), 1)) return;
    setVisibleMonth(prev);
  };
  const goNextMonth = () => {
    const next = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1);
    setVisibleMonth(next);
  };
  const canPrevMonth =
    visibleMonth.getFullYear() > today.getFullYear() ||
    (visibleMonth.getFullYear() === today.getFullYear() &&
      visibleMonth.getMonth() > today.getMonth());
  const canNextMonth = monthsBetween(today, visibleMonth) < 2; // today, +1, +2

  async function handleSubmit() {
    if (!canSubmit || !service || !selectedDate || !selectedTime) return;
    setIsSubmitting(true);
    setFieldErrors({});
    setBanner(null);

    try {
      const start = ensureSeconds(selectedTime);
      const end = ensureSeconds(addMinutes(selectedTime, durationMinutes));
      const noteBlock = address.trim()
        ? `Address: ${address.trim()}${notes.trim() ? `\n\n${notes.trim()}` : ""}`
        : notes.trim();

      const booking = await bookingService.create({
        service: service.id,
        scheduledDate: selectedDate,
        startTime: start,
        endTime: end,
        notes: noteBlock,
      });
      navigate(`/bookings/${booking.id}`, { replace: true });
    } catch (err) {
      if (err instanceof BookingValidationError) {
        setFieldErrors(err.fieldErrors);
        setBanner(err.message);
      } else {
        setBanner(err instanceof Error ? err.message : "Failed to create booking.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  // ---- Render ----------------------------------------------------------
  if (isLoading) {
    return (
      <Section tone="surface" innerClassName="mx-auto w-full max-w-6xl px-6 py-10">
        <LoadingState variant="profile" label="Loading booking…" />
      </Section>
    );
  }

  if (loadError || !service || !provider) {
    return (
      <Section tone="surface" innerClassName="mx-auto w-full max-w-6xl px-6 py-10">
        <ErrorState
          title="Couldn't open the booking flow"
          description={loadError ?? "Service or provider not found."}
          onRetry={() => window.location.reload()}
        />
      </Section>
    );
  }

  const selectedDayLabel = selectedDate
    ? `Time slot · ${formatLongDate(selectedDate)}`
    : "Time slot";

  return (
    <Section tone="surface" innerClassName="mx-auto w-full max-w-6xl px-6 py-10">
      <BookingStepper active="schedule" className="mb-10" />

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-brand-logo sm:text-3xl">
          Pick a date and time
        </h1>
        <p className="mt-2 text-sm text-brand-muted">
          Select when the pro should arrive. You can reschedule up to 4 hours before.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <div className="space-y-6">
          <DateGrid
            visibleMonth={visibleMonth}
            slotsByDate={slotCountByDate}
            selectedDate={selectedDate}
            today={today}
            canGoPrev={canPrevMonth}
            canGoNext={canNextMonth}
            onPrevMonth={goPrevMonth}
            onNextMonth={goNextMonth}
            onSelect={(iso) => {
              setSelectedDate(iso);
              setSelectedTime(null);
              setFieldErrors((prev) => withoutKeys(prev, ["scheduled_date"]));
            }}
          />

          <div className="rounded-xl border border-brand-borderLight bg-white p-5">
            <TimeSlotPicker
              heading={selectedDayLabel}
              slots={slotsForSelectedDate}
              selectedSlot={selectedTime}
              onSelect={(slot) => {
                setSelectedTime(slot);
                setFieldErrors((prev) => withoutKeys(prev, ["start_time", "end_time"]));
              }}
              emptyLabel={
                selectedDate
                  ? "No time slots available on this day."
                  : "Pick a date to see open slots."
              }
            />
          </div>

          <JobLocationCard
            address={address}
            notes={notes}
            onAddressChange={setAddress}
            onNotesChange={setNotes}
            addressError={fieldErrors.address?.[0]}
          />
        </div>

        <BookingSummaryCard
          provider={provider}
          service={service}
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          durationMinutes={durationMinutes}
          serviceFee={pricing.serviceFee}
          platformFee={pricing.platformFee}
          vat={pricing.vat}
          total={pricing.total}
          isSubmitting={isSubmitting}
          canSubmit={canSubmit}
          onSubmit={handleSubmit}
          bannerError={
            banner ??
            firstFieldError(fieldErrors, [
              "non_field_errors",
              "service",
              "scheduled_date",
              "start_time",
            ]) ??
            undefined
          }
          className="lg:sticky lg:top-24"
        />
      </div>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

function isoDateKey(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1, 12);
}

function formatHHMM(raw: string): string {
  const [hh, mm] = raw.split(":");
  return `${(hh ?? "00").padStart(2, "0")}:${(mm ?? "00").padStart(2, "0")}`;
}

function ensureSeconds(hhmm: string): string {
  // Backend's TimeField accepts both, but normalising avoids drift in
  // round-trips and gives consistent string equality in tests.
  return hhmm.length === 5 ? `${hhmm}:00` : hhmm;
}

function addMinutes(hhmm: string, minutes: number): string {
  const [h, m] = hhmm.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm;
  const total = h * 60 + m + Math.max(0, minutes);
  const wrapped = Math.min(total, 24 * 60); // cap at 24:00 sentinel
  const hh = Math.floor(wrapped / 60);
  const mm = wrapped % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function normalizeIncomingTime(raw: string | null): string | null {
  if (!raw) return null;
  return raw.length === 4 ? `0${raw}` : raw.slice(0, 5);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function monthsBetween(a: Date, b: Date): number {
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
}

function withoutKeys<T extends Record<string, unknown>>(obj: T, keys: string[]): T {
  if (keys.every((k) => obj[k] === undefined)) return obj;
  const next = { ...obj };
  for (const key of keys) delete next[key];
  return next;
}

function firstFieldError(
  errors: Record<string, string[]>,
  preferred: string[],
): string | null {
  for (const key of preferred) {
    if (errors[key]?.[0]) return errors[key][0];
  }
  return null;
}

function formatLongDate(iso: string): string {
  const d = parseLocalDate(iso);
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}
