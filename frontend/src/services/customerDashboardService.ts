/** Customer dashboard data aggregator. */
import { bookingService } from "@/services/bookingService";
import { CUSTOMER_DASHBOARD_FALLBACKS } from "@/services/customerDashboardFallbacks";
import type { AuthUser } from "@/types/auth";
import type { Booking } from "@/types/booking";
import type {
  ActivityEntry,
  ActivityKind,
  CustomerDashboardSnapshot,
  CustomerDashboardStats,
  UpcomingBookingRow,
} from "@/types/customerDashboard";
import { titleCaseName } from "@/utils/displayName";

interface LoadOptions {
  user: AuthUser;
  now?: Date;
}

export async function loadCustomerDashboard(
  options: LoadOptions,
): Promise<CustomerDashboardSnapshot> {
  const { user } = options;
  const now = options.now ?? new Date();
  const bookings = await bookingService.list();

  return {
    greeting: {
      timeOfDay: greetingForHour(now.getHours()),
      firstName: titleCaseName(user.first_name) || (user.email.split("@")[0] ?? ""),
      subtitle: bookings.length
        ? "Here's what's happening with your bookings."
        : "Browse the marketplace to find your first pro.",
    },
    stats: computeStats(user, bookings, now),
    upcoming: buildUpcoming(bookings, now),
    activity: buildActivity(bookings, now),
    rawBookings: bookings,
  };
}

function greetingForHour(hour: number): string {
  if (hour < 5) return "Good evening";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function isoDay(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function combineDateTime(isoDate: string, hhmm: string): Date {
  const [y, m, d] = isoDate.split("-").map(Number);
  const [hh, mm] = hhmm.split(":").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1, hh ?? 0, mm ?? 0);
}

function computeStats(
  user: AuthUser,
  bookings: Booking[],
  now: Date,
): CustomerDashboardStats {
  const todayKey = isoDay(now);
  const horizon = new Date(now);
  horizon.setDate(now.getDate() + 7);
  const horizonKey = isoDay(horizon);

  let activeBookings = 0;
  let bookingsToday = 0;
  let bookingsThisWeek = 0;
  let inEscrow = 0;
  let pendingCount = 0;
  let jobsCompleted = 0;

  for (const booking of bookings) {
    if (booking.status === "cancelled") continue;
    const total = Number(booking.totalPrice) || 0;
    const endAt = combineDateTime(booking.scheduledDate, booking.endTime);

    if (booking.status === "pending") pendingCount += 1;
    if (booking.status === "confirmed") inEscrow += total;

    if (endAt < now) {
      // Booking completion is inferred until the API exposes a completed status.
      jobsCompleted += 1;
    } else {
      activeBookings += 1;
      if (booking.scheduledDate === todayKey) bookingsToday += 1;
      if (booking.scheduledDate >= todayKey && booking.scheduledDate <= horizonKey) {
        bookingsThisWeek += 1;
      }
    }
  }

  return {
    activeBookings,
    bookingsToday,
    bookingsThisWeek,
    inEscrow,
    pendingCount,
    jobsCompleted,
    averageRatingGiven: CUSTOMER_DASHBOARD_FALLBACKS.averageRatingGiven(user, bookings),
    reviewsWritten: CUSTOMER_DASHBOARD_FALLBACKS.reviewsWritten(user, bookings),
  };
}

const DATE_FMT = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  month: "short",
  day: "numeric",
});
const PRICE_FMT = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function buildUpcoming(bookings: Booking[], now: Date): UpcomingBookingRow[] {
  const todayKey = isoDay(now);
  return bookings
    .filter((b) => b.status !== "cancelled" && b.scheduledDate >= todayKey)
    .sort((a, b) => {
      const ka = `${a.scheduledDate}${a.startTime}`;
      const kb = `${b.scheduledDate}${b.startTime}`;
      return ka.localeCompare(kb);
    })
    .slice(0, 6)
    .map((booking) => {
      const dateObj = new Date(`${booking.scheduledDate}T00:00:00`);
      return {
        bookingId: booking.id,
        providerLabel: booking.provider.businessName || "Pro",
        providerInitials: computeInitials(booking.provider.businessName),
        serviceTitle: booking.service.title,
        whenLabel: DATE_FMT.format(dateObj),
        totalLabel: PRICE_FMT.format(Number(booking.totalPrice) || 0),
        status: booking.status,
      };
    });
}

function buildActivity(bookings: Booking[], now: Date): ActivityEntry[] {
  // Temporary activity feed built from booking rows.
  const events: Array<{ at: Date; entry: ActivityEntry }> = [];
  for (const booking of bookings) {
    const created = new Date(booking.createdAt);
    events.push({
      at: created,
      entry: makeEntry(
        `${booking.id}-created`,
        "booking-created",
        `Booking request sent to ${booking.provider.businessName}`,
        booking.service.title,
        timeAgo(created, now),
      ),
    });
    const updated = new Date(booking.updatedAt);
    if (booking.status === "confirmed" && +updated !== +created) {
      events.push({
        at: updated,
        entry: makeEntry(
          `${booking.id}-confirmed`,
          "booking-confirmed",
          `${booking.provider.businessName} confirmed your booking`,
          booking.service.title,
          timeAgo(updated, now),
        ),
      });
      events.push({
        at: updated,
        entry: makeEntry(
          `${booking.id}-escrow`,
          "payment-held",
          "Payment held in escrow",
          `${PRICE_FMT.format(Number(booking.totalPrice) || 0)} · ${booking.provider.businessName}`,
          timeAgo(updated, now),
        ),
      });
    }
    if (booking.status === "cancelled") {
      events.push({
        at: updated,
        entry: makeEntry(
          `${booking.id}-cancelled`,
          "booking-cancelled",
          "Booking cancelled",
          booking.service.title,
          timeAgo(updated, now),
        ),
      });
    }
    const endAt = combineDateTime(booking.scheduledDate, booking.endTime);
    if (booking.status === "confirmed" && endAt < now) {
      events.push({
        at: endAt,
        entry: makeEntry(
          `${booking.id}-review`,
          "review-submitted",
          "Review submitted",
          booking.provider.businessName,
          timeAgo(endAt, now),
        ),
      });
    }
  }
  events.sort((a, b) => +b.at - +a.at);
  return events.slice(0, 8).map((e) => e.entry);
}

function makeEntry(
  id: string,
  kind: ActivityKind,
  title: string,
  detail: string,
  timeAgoLabel: string,
): ActivityEntry {
  return { id, kind, title, detail, timeAgo: timeAgoLabel };
}

function timeAgo(then: Date, now: Date): string {
  const diff = Math.max(0, +now - +then);
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} minute${m === 1 ? "" : "s"} ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} day${d === 1 ? "" : "s"} ago`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${w} week${w === 1 ? "" : "s"} ago`;
  const mo = Math.floor(d / 30);
  return `${mo} month${mo === 1 ? "" : "s"} ago`;
}

function computeInitials(name: string): string {
  const parts = name.trim().split(/\s+/u).filter(Boolean);
  if (parts.length === 0) return "SB";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}
