import type { Booking } from "@/types/booking";
import type { Review } from "@/types/marketplace";

export interface DashboardStats {
  activeJobs: number;
  jobsToday: number;
  jobsThisWeek: number;
  pendingPayout: number;
  nextPayoutLabel: string;
  earnedThisMonth: number;
  earningsDeltaPct: number;
  /** Stubbed until a response-rate metric exists in the API. */
  responseRatePct: number;
  avgReplyLabel: string;
}

export interface EarningsBucket {
  date: string;
  amount: number;
}

export interface ScheduleEntry {
  bookingId: string;
  scheduledDate: string;
  dayLabel: string;
  startTime: string;
  durationLabel: string;
  serviceTitle: string;
  meta: string;
  status: ScheduleStatus;
}

export type ScheduleStatus = "completed" | "upcoming" | "tentative" | "cancelled";

export interface JobRequestEntry {
  bookingId: string;
  customerLabel: string;
  serviceTitle: string;
  meta: string;
}

export interface ProviderDashboardSnapshot {
  greeting: {
    timeOfDay: string;
    firstName: string;
    subtitle: string;
    availableNow: boolean;
  };
  stats: DashboardStats;
  schedule: ScheduleEntry[];
  earnings: EarningsBucket[];
  reviews: Review[];
  pendingRequests: JobRequestEntry[];
  rawBookings: Booking[];
}
