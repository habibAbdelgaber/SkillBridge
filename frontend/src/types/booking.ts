export type BookingStatus = "pending" | "confirmed" | "cancelled";

export interface BookingCustomerSummary {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface BookingProviderSummary {
  id: string;
  businessName: string;
  serviceArea: string;
  headline: string;
}

export interface BookingServiceSummary {
  id: string;
  title: string;
  subtitle: string;
  price: string;
  pricingType: "hourly" | "flat";
  durationMinutes: number;
  locationType: "remote" | "onsite" | "hybrid";
}

export interface Booking {
  id: string;
  customer: BookingCustomerSummary;
  provider: BookingProviderSummary;
  service: BookingServiceSummary;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  totalPrice: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookingPayload {
  service: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  notes?: string;
}
