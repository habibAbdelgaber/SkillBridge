import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/services/apiClient";
import { bookingService } from "@/services/bookingService";

vi.mock("@/services/apiClient", () => ({
  apiClient: { post: vi.fn(), get: vi.fn() },
}));

const request = {
  service: "service-id",
  scheduledDate: "2026-10-01",
  startTime: "10:00:00",
  endTime: "11:00:00",
};

describe("bookingService pricing contract", () => {
  beforeEach(() => vi.clearAllMocks());

  it("maps the server quote without calculating fees in the browser", async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: {
      currency: "USD",
      service_fee: "85.00",
      platform_fee: "8.50",
      vat_amount: "16.83",
      total_price: "110.33",
    } });

    const quote = await bookingService.quote(request);
    expect(quote).toEqual({
      currency: "USD",
      serviceFee: "85.00",
      platformFee: "8.50",
      vatAmount: "16.83",
      totalPrice: "110.33",
    });
    expect(apiClient.post).toHaveBeenCalledWith("/api/v1/bookings/quote/", {
      service: "service-id",
      scheduled_date: "2026-10-01",
      start_time: "10:00:00",
      end_time: "11:00:00",
    });
  });

  it("sends the quoted total when creating a booking", async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: {
      id: "booking-id",
      customer: { id: "customer-id", email: "a@example.com", first_name: "A", last_name: "B" },
      provider: { id: "provider-id", business_name: "Pro", service_area: "City", headline: "" },
      service: { id: "service-id", title: "Work", subtitle: "", price: "85.00", pricing_type: "hourly", duration_minutes: 60, location_type: "onsite" },
      scheduled_date: "2026-10-01", start_time: "10:00:00", end_time: "11:00:00",
      status: "pending", currency: "USD", service_fee: "85.00", platform_fee: "8.50",
      vat_amount: "16.83", total_price: "110.33", notes: "",
      created_at: "2026-09-28T00:00:00Z", updated_at: "2026-09-28T00:00:00Z",
    } });

    const booking = await bookingService.create({ ...request, quotedTotal: "110.33" });
    expect(booking.totalPrice).toBe("110.33");
    expect(apiClient.post).toHaveBeenCalledWith("/api/v1/bookings/", {
      service: "service-id",
      scheduled_date: "2026-10-01",
      start_time: "10:00:00",
      end_time: "11:00:00",
      quoted_total: "110.33",
      notes: "",
    });
  });
});

describe("bookingService paginated list", () => {
  const apiBooking = (id: string) => ({
    id,
    customer: { id: "customer-id", email: "a@example.com", first_name: "A", last_name: "B" },
    provider: { id: "provider-id", business_name: "Pro", service_area: "City", headline: "" },
    service: { id: "service-id", title: "Work", subtitle: "", price: "85.00", pricing_type: "hourly", duration_minutes: 60, location_type: "onsite" },
    scheduled_date: "2026-10-01", start_time: "10:00:00", end_time: "11:00:00",
    status: "pending", currency: "USD", service_fee: "85.00", platform_fee: "8.50",
    vat_amount: "16.83", total_price: "110.33", notes: "",
    created_at: "2026-09-28T00:00:00Z", updated_at: "2026-09-28T00:00:00Z",
  });

  beforeEach(() => vi.clearAllMocks());

  it("loads all pages so dashboard counts and booking history include rows after the first 20", async () => {
    vi.mocked(apiClient.get)
      .mockResolvedValueOnce({ data: {
        count: 21,
        next: "https://api.example.test/api/v1/bookings/?page=2",
        results: Array.from({ length: 20 }, (_, i) => apiBooking(`booking-${i + 1}`)),
      } })
      .mockResolvedValueOnce({ data: {
        count: 21,
        next: null,
        results: [apiBooking("booking-21")],
      } });

    const bookings = await bookingService.list();

    expect(bookings).toHaveLength(21);
    expect(bookings[20]?.id).toBe("booking-21");
    expect(apiClient.get).toHaveBeenNthCalledWith(1, "/api/v1/bookings/", undefined);
    expect(apiClient.get).toHaveBeenNthCalledWith(2, "/api/v1/bookings/", { params: { page: 2 } });
  });

  it("rejects the whole list if a later page fails", async () => {
    vi.mocked(apiClient.get)
      .mockResolvedValueOnce({ data: { next: "?page=2", results: [apiBooking("booking-1")] } })
      .mockRejectedValueOnce(new Error("Network error"));

    await expect(bookingService.list()).rejects.toThrow("Network error");
  });
});
