/** Booking API layer. */
import { isAxiosError } from "axios";

import { apiClient } from "@/services/apiClient";
import type { Booking, BookingQuote, BookingQuoteRequest, CreateBookingPayload } from "@/types/booking";

const ENDPOINTS = {
  bookings: "/api/v1/bookings/",
  quote: "/api/v1/bookings/quote/",
  booking: (id: string) => `/api/v1/bookings/${id}/`,
} as const;

interface ApiCustomer {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}

interface ApiProviderMini {
  id: string;
  business_name: string;
  service_area: string;
  headline: string;
}

interface ApiServiceMini {
  id: string;
  title: string;
  subtitle: string;
  price: string;
  pricing_type: "hourly" | "flat";
  duration_minutes: number;
  location_type: "remote" | "onsite" | "hybrid";
}

interface ApiBooking {
  id: string;
  customer: ApiCustomer;
  provider: ApiProviderMini;
  service: ApiServiceMini;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  status: "pending" | "confirmed" | "cancelled";
  currency: string;
  service_fee: string;
  platform_fee: string;
  vat_amount: string;
  total_price: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

interface ApiBookingQuote {
  currency: string;
  service_fee: string;
  platform_fee: string;
  vat_amount: string;
  total_price: string;
}

function mapQuote(api: ApiBookingQuote): BookingQuote {
  return {
    currency: api.currency,
    serviceFee: api.service_fee,
    platformFee: api.platform_fee,
    vatAmount: api.vat_amount,
    totalPrice: api.total_price,
  };
}

function mapBooking(api: ApiBooking): Booking {
  return {
    id: api.id,
    customer: {
      id: api.customer.id,
      email: api.customer.email,
      firstName: api.customer.first_name,
      lastName: api.customer.last_name,
    },
    provider: {
      id: api.provider.id,
      businessName: api.provider.business_name,
      serviceArea: api.provider.service_area,
      headline: api.provider.headline,
    },
    service: {
      id: api.service.id,
      title: api.service.title,
      subtitle: api.service.subtitle,
      price: api.service.price,
      pricingType: api.service.pricing_type,
      durationMinutes: api.service.duration_minutes,
      locationType: api.service.location_type,
    },
    scheduledDate: api.scheduled_date,
    startTime: api.start_time,
    endTime: api.end_time,
    status: api.status,
    currency: api.currency,
    serviceFee: api.service_fee,
    platformFee: api.platform_fee,
    vatAmount: api.vat_amount,
    totalPrice: api.total_price,
    notes: api.notes,
    createdAt: api.created_at,
    updatedAt: api.updated_at,
  };
}

export type BookingFieldErrors = Record<string, string[]>;

export class BookingValidationError extends Error {
  fieldErrors: BookingFieldErrors;

  constructor(message: string, fieldErrors: BookingFieldErrors) {
    super(message);
    this.name = "BookingValidationError";
    this.fieldErrors = fieldErrors;
  }
}

function normalizeError(error: unknown, fallback: string): Error {
  if (isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data;

    // Keep the raw payload visible while booking validation is still evolving.
    if (typeof console !== "undefined") {
      console.error("[bookingService] request failed", {
        status,
        data,
        url: error.config?.url,
      });
    }

    if (status === 400 && data && typeof data === "object") {
      const fieldErrors: BookingFieldErrors = {};
      for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
        if (Array.isArray(value)) {
          fieldErrors[key] = value.map(String);
        } else if (typeof value === "string") {
          fieldErrors[key] = [value];
        }
      }
      const firstMsg =
        Object.values(fieldErrors).flat()[0] ?? "The booking details aren't valid.";
      return new BookingValidationError(firstMsg, fieldErrors);
    }

    if (status === 401) {
      return new Error(
        "Your session expired before the booking could be created. " +
          "Please sign in again and retry.",
      );
    }
    if (status === 403) {
      return new Error(
        (data as { detail?: string } | undefined)?.detail ??
          "Only customer accounts can create bookings.",
      );
    }
    const detail = (data as { detail?: string } | undefined)?.detail;
    if (detail) return new Error(detail);
    if (status) return new Error(`${fallback} (HTTP ${status})`);
    return new Error(error.message || fallback);
  }
  if (error instanceof Error) return error;
  return new Error(fallback);
}

export const bookingService = {
  async quote(payload: BookingQuoteRequest): Promise<BookingQuote> {
    try {
      const { data } = await apiClient.post<ApiBookingQuote>(ENDPOINTS.quote, {
        service: payload.service,
        scheduled_date: payload.scheduledDate,
        start_time: payload.startTime,
        end_time: payload.endTime,
      });
      return mapQuote(data);
    } catch (error) {
      throw normalizeError(error, "Failed to load the booking quote.");
    }
  },

  async create(payload: CreateBookingPayload): Promise<Booking> {
    const body = {
      service: payload.service,
      scheduled_date: payload.scheduledDate,
      start_time: payload.startTime,
      end_time: payload.endTime,
      quoted_total: payload.quotedTotal,
      notes: payload.notes ?? "",
    };
    try {
      const { data } = await apiClient.post<ApiBooking>(ENDPOINTS.bookings, body);
      return mapBooking(data);
    } catch (error) {
      throw normalizeError(error, "Failed to create booking.");
    }
  },

  async list(): Promise<Booking[]> {
    try {
      const bookings: Booking[] = [];
      let page = 1;
      // DRF uses page-number pagination. Follow every page before computing
      // dashboard totals, so bookings beyond the default first 20 are included.
      while (true) {
        const { data } = await apiClient.get<
          { results: ApiBooking[]; next: string | null } | ApiBooking[]
        >(ENDPOINTS.bookings, page === 1 ? undefined : { params: { page } });
        if (Array.isArray(data)) {
          bookings.push(...data.map(mapBooking));
          break;
        }
        bookings.push(...data.results.map(mapBooking));
        if (!data.next) break;
        page += 1;
      }
      return bookings;
    } catch (error) {
      throw normalizeError(error, "Failed to load bookings.");
    }
  },

  async get(id: string): Promise<Booking> {
    try {
      const { data } = await apiClient.get<ApiBooking>(ENDPOINTS.booking(id));
      return mapBooking(data);
    } catch (error) {
      throw normalizeError(error, "Failed to load booking.");
    }
  },

  async cancel(id: string): Promise<Booking> {
    try {
      const { data } = await apiClient.patch<ApiBooking>(ENDPOINTS.booking(id), {
        status: "cancelled",
      });
      return mapBooking(data);
    } catch (error) {
      throw normalizeError(error, "Failed to cancel booking.");
    }
  },
};
