import type { Booking } from "@/types/booking";

export interface CustomerDashboardStats {
  activeBookings: number;
  bookingsThisWeek: number;
  bookingsToday: number;
  inEscrow: null;
  pendingCount: number;
  jobsCompleted: null;
  /** No payment, completion, or review metrics are exposed by the API yet. */
  averageRatingGiven: null;
  reviewsWritten: null;
}

export interface UpcomingBookingRow {
  bookingId: string;
  providerLabel: string;
  providerInitials: string;
  serviceTitle: string;
  whenLabel: string;
  totalLabel: string;
  status: "pending" | "confirmed" | "cancelled";
}

export type ActivityKind =
  | "booking-created"
  | "booking-confirmed"
  | "booking-cancelled";

export interface ActivityEntry {
  id: string;
  kind: ActivityKind;
  title: string;
  detail: string;
  timeAgo: string;
}

export interface CustomerDashboardSnapshot {
  greeting: {
    timeOfDay: string;
    firstName: string;
    subtitle: string;
  };
  stats: CustomerDashboardStats;
  upcoming: UpcomingBookingRow[];
  activity: ActivityEntry[];
  rawBookings: Booking[];
}
