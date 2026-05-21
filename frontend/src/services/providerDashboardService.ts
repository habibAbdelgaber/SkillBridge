/** Provider dashboard data aggregator. */
import { bookingService } from "@/services/bookingService";
import { marketplaceService } from "@/services/marketplaceService";
import type { AuthUser } from "@/types/auth";
import type { Booking } from "@/types/booking";
import type { ProviderDetail, Review } from "@/types/marketplace";
import type {
  DashboardStats,
  EarningsBucket,
  JobRequestEntry,
  ProviderDashboardSnapshot,
  ScheduleEntry,
  ScheduleStatus,
} from "@/types/providerDashboard";
import { titleCaseName } from "@/utils/displayName";

/** Temporary fallbacks for metrics the backend does not expose yet. */
export const DASHBOARD_STUBS = {
  responseRatePct(_user: AuthUser): number {
    return 98;
  },
  avgReplyLabel(_user: AuthUser): string {
    return "< 1 hr";
  },
  nextPayoutDate(today: Date): Date {
    // Placeholder: next Thursday relative to today.
    const day = today.getDay(); // 0=Sun..6=Sat
    const offset = (4 - day + 7) % 7 || 7; // always strictly forward
    const next = new Date(today);
    next.setDate(today.getDate() + offset);
    return next;
  },
  async requestPayout(_amount: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 400));
  },
  async respondToRequest(
    _bookingId: string,
    _decision: "accept" | "decline",
  ): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 300));
  },
};

interface LoadOptions {
  user: AuthUser;
  now?: Date;
}

export async function loadProviderDashboard(
  options: LoadOptions,
): Promise<ProviderDashboardSnapshot> {
  const { user } = options;
  const now = options.now ?? new Date();

  if (!user.provider_profile) {
    throw new Error("Only provider accounts can open the provider dashboard.");
  }
  const providerId = user.provider_profile.id;

  const [provider, bookings] = await Promise.all([
    marketplaceService.getProvider(providerId),
    bookingService.list(),
  ]);

  const reviews = pickReviews(provider, 3);
  const stats = computeStats(user, bookings, now);
  const schedule = buildSchedule(bookings, now);
  const earnings = buildEarnings(bookings, now);
  const pendingRequests = buildPendingRequests(bookings, now);

  return {
    greeting: {
      timeOfDay: greetingForHour(now.getHours()),
      firstName:
        titleCaseName(user.first_name) ||
        titleCaseName(provider.fullName.split(" ")[0] ?? "") ||
        "",
      subtitle: scheduleSubtitle(schedule.length, stats.jobsToday),
      availableNow: provider.verifications.length > 0 || true,
    },
    stats,
    schedule,
    earnings,
    reviews,
    pendingRequests,
    rawBookings: bookings,
  };
}

function greetingForHour(hour: number): string {
  if (hour < 5) return "Good evening";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function scheduleSubtitle(scheduleLen: number, todayCount: number): string {
  if (todayCount === 0 && scheduleLen === 0) {
    return "No jobs on the books — share your profile to get more requests.";
  }
  const noun = todayCount === 1 ? "job" : "jobs";
  return `You have ${todayCount} ${noun} scheduled today.`;
}

function pickReviews(provider: ProviderDetail, limit: number): Review[] {
  return provider.reviews.slice(0, limit);
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

function computeStats(user: AuthUser, bookings: Booking[], now: Date): DashboardStats {
  const todayKey = isoDay(now);
  const oneWeekFromNow = new Date(now);
  oneWeekFromNow.setDate(now.getDate() + 7);

  let activeJobs = 0;
  let jobsToday = 0;
  let jobsThisWeek = 0;
  let pendingPayout = 0;
  let earnedThisMonth = 0;
  let earnedPrevMonth = 0;

  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthKey = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`;

  for (const booking of bookings) {
    const isCancelled = booking.status === "cancelled";
    if (isCancelled) continue;

    const total = Number(booking.totalPrice) || 0;
    const dateObj = new Date(`${booking.scheduledDate}T00:00:00`);
    const dateMonthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}`;

    if (booking.status === "pending" || booking.status === "confirmed") {
      activeJobs += 1;
      if (booking.scheduledDate === todayKey) jobsToday += 1;
      if (dateObj >= now && dateObj <= oneWeekFromNow) jobsThisWeek += 1;
    }
    if (booking.status === "confirmed") {
      pendingPayout += total;
    }
    if (dateMonthKey === monthKey) earnedThisMonth += total;
    if (dateMonthKey === prevMonthKey) earnedPrevMonth += total;
  }

  const earningsDeltaPct =
    earnedPrevMonth > 0
      ? Math.round(((earnedThisMonth - earnedPrevMonth) / earnedPrevMonth) * 100)
      : earnedThisMonth > 0
        ? 100
        : 0;

  const nextPayoutDate = DASHBOARD_STUBS.nextPayoutDate(now);

  return {
    activeJobs,
    jobsToday,
    jobsThisWeek,
    pendingPayout,
    nextPayoutLabel: new Intl.DateTimeFormat(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    }).format(nextPayoutDate),
    earnedThisMonth,
    earningsDeltaPct,
    responseRatePct: DASHBOARD_STUBS.responseRatePct(user),
    avgReplyLabel: DASHBOARD_STUBS.avgReplyLabel(user),
  };
}

function buildSchedule(bookings: Booking[], now: Date): ScheduleEntry[] {
  const todayKey = isoDay(now);
  const horizon = new Date(now);
  horizon.setDate(now.getDate() + 6);
  const horizonKey = isoDay(horizon);

  const upcoming = bookings
    .filter(
      (b) =>
        b.scheduledDate >= todayKey &&
        b.scheduledDate <= horizonKey &&
        b.status !== "cancelled",
    )
    .sort((a, b) => {
      const ka = `${a.scheduledDate}${a.startTime}`;
      const kb = `${b.scheduledDate}${b.startTime}`;
      return ka.localeCompare(kb);
    });

  return upcoming.map((booking) => ({
    bookingId: booking.id,
    scheduledDate: booking.scheduledDate,
    dayLabel: formatDayLabel(booking.scheduledDate, todayKey),
    startTime: booking.startTime.slice(0, 5),
    durationLabel: formatDuration(booking.service.durationMinutes),
    serviceTitle: booking.service.title,
    meta: buildScheduleMeta(booking),
    status: deriveScheduleStatus(booking, now),
  }));
}

const SHORT_WEEKDAY = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  month: "short",
  day: "numeric",
});

function formatDayLabel(isoDate: string, todayKey: string): string {
  if (isoDate === todayKey) return "Today";
  // Use todayKey so the label stays stable within a render.
  const todayObj = new Date(`${todayKey}T00:00:00`);
  const tomorrow = new Date(todayObj);
  tomorrow.setDate(todayObj.getDate() + 1);
  if (isoDay(tomorrow) === isoDate) return "Tomorrow";
  return SHORT_WEEKDAY.format(new Date(`${isoDate}T00:00:00`));
}

function deriveScheduleStatus(booking: Booking, now: Date): ScheduleStatus {
  if (booking.status === "cancelled") return "cancelled";
  const start = combineDateTime(booking.scheduledDate, booking.startTime);
  const end = combineDateTime(booking.scheduledDate, booking.endTime);
  if (booking.status === "confirmed") {
    if (now > end) return "completed";
    return "upcoming";
  }
  if (booking.status === "pending") {
    if (now > start) return "tentative";
    return "tentative";
  }
  return "upcoming";
}

function buildScheduleMeta(booking: Booking): string {
  const customer = formatCustomerLabel(
    booking.customer.firstName,
    booking.customer.lastName,
  );
  const address = extractAddress(booking.notes);
  return address ? `${customer} · ${address}` : customer;
}

function formatCustomerLabel(first: string, last: string): string {
  const f = first.trim();
  const l = last.trim();
  if (!f && !l) return "Customer";
  if (!l) return f;
  return `${f} ${l[0]}.`;
}

function extractAddress(notes: string | undefined): string | null {
  if (!notes) return null;
  const match = notes.match(/^Address:\s*(.+?)(?:\n|$)/);
  return match ? match[1]!.trim() : null;
}

function formatDuration(minutes: number): string {
  if (!minutes || minutes <= 0) return "—";
  if (minutes < 60) return `${minutes}m`;
  const hours = minutes / 60;
  const rounded = Math.round(hours * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}h` : `${rounded}h`;
}

function buildEarnings(bookings: Booking[], now: Date): EarningsBucket[] {
  // 30-day window ending today.
  const buckets: EarningsBucket[] = [];
  const start = new Date(now);
  start.setDate(now.getDate() - 29);

  const map = new Map<string, number>();
  for (let i = 0; i < 30; i += 1) {
    const cursor = new Date(start);
    cursor.setDate(start.getDate() + i);
    map.set(isoDay(cursor), 0);
  }

  for (const booking of bookings) {
    if (booking.status === "cancelled") continue;
    if (!map.has(booking.scheduledDate)) continue;
    const total = Number(booking.totalPrice) || 0;
    map.set(booking.scheduledDate, (map.get(booking.scheduledDate) ?? 0) + total);
  }

  for (const [date, amount] of map.entries()) {
    buckets.push({ date, amount });
  }
  buckets.sort((a, b) => a.date.localeCompare(b.date));
  return buckets;
}

function buildPendingRequests(bookings: Booking[], now: Date): JobRequestEntry[] {
  const todayKey = isoDay(now);
  return bookings
    .filter((b) => b.status === "pending" && b.scheduledDate >= todayKey)
    .sort((a, b) => {
      const ka = `${a.scheduledDate}${a.startTime}`;
      const kb = `${b.scheduledDate}${b.startTime}`;
      return ka.localeCompare(kb);
    })
    .map((b) => ({
      bookingId: b.id,
      customerLabel: formatCustomerLabel(b.customer.firstName, b.customer.lastName),
      serviceTitle: b.service.title,
      meta: formatRequestMeta(b),
    }));
}

function formatRequestMeta(booking: Booking): string {
  const dateObj = new Date(`${booking.scheduledDate}T00:00:00`);
  const day = new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(dateObj);
  const start = combineDateTime(booking.scheduledDate, booking.startTime);
  const time = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(start);
  const price = Number(booking.totalPrice) || 0;
  return `${day} ${time} · $${price.toFixed(0)}`;
}
