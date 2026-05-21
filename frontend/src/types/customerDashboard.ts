import type { Booking } from "@/types/booking";

export interface CustomerDashboardStats {
  activeBookings: number;
  bookingsThisWeek: number;
  bookingsToday: number;
  inEscrow: number;
  pendingCount: number;
  jobsCompleted: number;
  /** Fallback until customer review metrics exist in the API. */
  averageRatingGiven: number;
  reviewsWritten: number;
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
  | "booking-cancelled"
  | "payment-held"
  | "message"
  | "review-submitted"
  | "review-window";

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
