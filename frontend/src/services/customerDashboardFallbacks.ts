import type { AuthUser } from "@/types/auth";
import type { Booking } from "@/types/booking";

/** Fallback customer review metrics until the API exposes them. */
export const CUSTOMER_DASHBOARD_FALLBACKS = {
  averageRatingGiven(_user: AuthUser, _bookings: Booking[]): number {
    return 4.8;
  },
  reviewsWritten(_user: AuthUser, bookings: Booking[]): number {
    return bookings.filter((b) => isCompletedBooking(b)).length;
  },
};

function isCompletedBooking(booking: Booking): boolean {
  if (booking.status !== "confirmed") return false;
  const [y, m, d] = booking.scheduledDate.split("-").map(Number);
  const [hh, mm] = booking.endTime.split(":").map(Number);
  const endAt = new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1, hh ?? 0, mm ?? 0);
  return endAt < new Date();
}
