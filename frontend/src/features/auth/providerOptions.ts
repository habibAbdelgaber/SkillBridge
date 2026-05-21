import type { BusinessType } from "@/types/auth";

export const BUSINESS_TYPE_OPTIONS: Array<{ value: BusinessType; label: string }> = [
  { value: "individual", label: "Individual / Sole Trader" },
  { value: "llc", label: "LLC" },
  { value: "corporation", label: "Corporation" },
  { value: "partnership", label: "Partnership" },
  { value: "nonprofit", label: "Nonprofit" },
  { value: "other", label: "Other" },
];

export const SERVICE_CATEGORY_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "Plumbing", label: "Plumbing" },
  { value: "Electrical", label: "Electrical" },
  { value: "Cleaning", label: "Cleaning" },
  { value: "Handyman", label: "Handyman" },
  { value: "Landscaping", label: "Landscaping" },
  { value: "Painting", label: "Painting" },
  { value: "Moving", label: "Moving" },
  { value: "Tutoring", label: "Tutoring" },
  { value: "Personal Training", label: "Personal Training" },
  { value: "Other", label: "Other" },
];

export const YEARS_EXPERIENCE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "0", label: "Less than a year" },
  { value: "1", label: "1 year" },
  { value: "3", label: "2 – 4 years" },
  { value: "6", label: "5 – 9 years" },
  { value: "10", label: "10+ years" },
];
