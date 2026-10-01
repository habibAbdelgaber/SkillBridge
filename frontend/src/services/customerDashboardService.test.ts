import { describe, expect, it, vi } from "vitest";

import { bookingService } from "@/services/bookingService";
import { loadCustomerDashboard } from "@/services/customerDashboardService";
import type { AuthUser } from "@/types/auth";
import type { Booking } from "@/types/booking";

vi.mock("@/services/bookingService", () => ({
  bookingService: { list: vi.fn() },
}));

const user: AuthUser = {
  id: "customer-1",
  email: "customer@example.com",
  first_name: "Ada",
  last_name: "Lee",
  role: "customer",
  is_active: true,
  date_joined: "2025-01-01T00:00:00Z",
  provider_profile: null,
};

const booking: Booking = {
  id: "booking-1",
  customer: { id: user.id, email: user.email, firstName: "Ada", lastName: "Lee" },
  provider: { id: "provider-1", businessName: "Local Pro", serviceArea: "City", headline: "" },
  service: {
    id: "service-1", title: "Repair", subtitle: "", price: "85.00",
    pricingType: "hourly", durationMinutes: 60, locationType: "onsite",
  },
  scheduledDate: "2026-09-01",
  startTime: "10:00",
  endTime: "11:00",
  status: "confirmed",
  currency: "USD",
  serviceFee: "85.00",
  platformFee: "8.50",
  vatAmount: "16.83",
  totalPrice: "110.33",
  notes: "",
  createdAt: "2026-08-20T10:00:00Z",
  updatedAt: "2026-08-21T10:00:00Z",
};

describe("customer dashboard persisted activity", () => {
  it("does not infer payment, completed-job, or review events from a past confirmed booking", async () => {
    vi.mocked(bookingService.list).mockResolvedValueOnce([booking]);

    const snapshot = await loadCustomerDashboard({ user, now: new Date("2026-10-01T12:00:00Z") });

    expect(snapshot.activity.map(({ kind }) => kind)).toEqual([
      "booking-confirmed", "booking-created",
    ]);
    expect(snapshot.stats.inEscrow).toBeNull();
    expect(snapshot.stats.jobsCompleted).toBeNull();
    expect(snapshot.stats.averageRatingGiven).toBeNull();
    expect(snapshot.stats.reviewsWritten).toBeNull();
  });

  it("returns an empty activity list when there are no bookings", async () => {
    vi.mocked(bookingService.list).mockResolvedValueOnce([]);

    const snapshot = await loadCustomerDashboard({ user, now: new Date("2026-10-01T12:00:00Z") });

    expect(snapshot.activity).toEqual([]);
    expect(snapshot.stats.averageRatingGiven).toBeNull();
  });
});
