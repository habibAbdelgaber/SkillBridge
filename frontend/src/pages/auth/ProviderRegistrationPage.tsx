import { FormEvent, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { AuthCard } from "@/components/auth/AuthCard";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { FormBanner } from "@/components/auth/FormBanner";
import { ProviderHeroPanel } from "@/components/auth/ProviderHeroPanel";
import { StepBreadcrumb } from "@/components/auth/StepBreadcrumb";
import { SuccessCheckmark } from "@/components/auth/SuccessCheckmark";
import { Checkbox } from "@/components/forms/Checkbox";
import { FormField } from "@/components/forms/FormField";
import { SelectInput } from "@/components/forms/SelectInput";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { TextInput } from "@/components/forms/TextInput";
import { TextareaInput } from "@/components/forms/TextareaInput";
import {
  BUSINESS_TYPE_OPTIONS,
  SERVICE_CATEGORY_OPTIONS,
  YEARS_EXPERIENCE_OPTIONS,
} from "@/features/auth/providerOptions";
import { useAuthStore } from "@/store/authStore";
import { useProviderSignupStore } from "@/store/providerSignupStore";
import { useUIStore } from "@/store/uiStore";
import type { BusinessType } from "@/types/auth";
import { isLoginResponse } from "@/types/auth";
import { parseApiError } from "@/utils/parseApiError";

interface FormState {
  business_name: string;
  business_type: BusinessType | "";
  tax_id: string;
  registered_address: string;
  service_category: string;
  years_of_experience: string;
  short_bio: string;
  service_area: string;
  phone_number: string;
  base_hourly_rate: string;
  license_or_certification_number: string;
  insurance_provider: string;
  accept_terms: boolean;
}

/** How long to hold the success check before navigating. */
const SUCCESS_REDIRECT_MS = 1100;

const INITIAL: FormState = {
  business_name: "",
  business_type: "",
  tax_id: "",
  registered_address: "",
  service_category: "",
  years_of_experience: "",
  short_bio: "",
  service_area: "",
  phone_number: "",
  base_hourly_rate: "",
  license_or_certification_number: "",
  insurance_provider: "",
  accept_terms: false,
};

function validate(state: FormState): Record<string, string> {
  const e: Record<string, string> = {};
  if (!state.business_name.trim()) e.business_name = "Business name is required.";
  if (!state.business_type) e.business_type = "Select a business type.";
  if (!state.phone_number.trim()) e.phone_number = "Enter a contact phone number.";
  else if (state.phone_number.replace(/\D/g, "").length < 7)
    e.phone_number = "Enter a valid phone number.";
  if (!state.service_category) e.service_category = "Choose a service category.";
  if (!state.years_of_experience)
    e.years_of_experience = "Select your years of experience.";
  if (!state.service_area.trim()) e.service_area = "Enter your service area.";
  if (!state.accept_terms)
    e.accept_terms = "You must accept the provider terms to continue.";
  return e;
}

export function ProviderRegistrationPage() {
  const navigate = useNavigate();
  const draft = useProviderSignupStore((s) => s.draft);
  const clearDraft = useProviderSignupStore((s) => s.clearDraft);
  const registerProvider = useAuthStore((s) => s.registerProvider);
  const status = useAuthStore((s) => s.status);
  const openAuthModal = useUIStore((s) => s.openAuthModal);

  const [form, setForm] = useState<FormState>(INITIAL);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState<{
    title: string;
    subtitle: string;
  } | null>(null);
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isSubmitting = status === "authenticating";

  // If a user lands here directly without a draft from step 1, open the
  // signup modal — this flow can't function without the email + password
  // captured on the previous step. Suspend this guard once we've shown the
  // success state, since `clearDraft()` deliberately empties the store.
  useEffect(() => {
    if (!draft && !succeeded) {
      navigate("/", { replace: true });
      openAuthModal("register");
    }
  }, [draft, openAuthModal, succeeded, navigate]);

  useEffect(
    () => () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    },
    [],
  );

  function patch<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!draft) return;
    const errs = validate(form);
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setBanner(null);

    try {
      const response = await registerProvider({
        email: draft.email,
        password1: draft.password,
        password2: draft.password,
        first_name: draft.first_name,
        last_name: draft.last_name,

        business_name: form.business_name.trim(),
        business_type: form.business_type as BusinessType,
        tax_id: form.tax_id.trim(),
        phone_number: form.phone_number.trim(),
        service_category: form.service_category,
        years_of_experience: Number(form.years_of_experience),
        service_area: form.service_area.trim(),
        short_bio: form.short_bio.trim(),
        license_or_certification_number: form.license_or_certification_number.trim(),
        insurance_provider: form.insurance_provider.trim(),
      });

      const verificationRequired = !isLoginResponse(response);
      const draftEmail = draft.email;
      clearDraft();

      setSucceeded({
        title: "Provider account created",
        subtitle: verificationRequired
          ? "Check your inbox to verify your email and finish setup."
          : "You're all set. Taking you to your provider dashboard…",
      });

      redirectTimerRef.current = setTimeout(() => {
        if (verificationRequired) {
          navigate("/verify-email-sent", {
            state: { email: draftEmail },
            replace: true,
          });
        } else {
          navigate("/dashboard/provider", { replace: true });
        }
      }, SUCCESS_REDIRECT_MS);
    } catch (err) {
      const parsed = parseApiError(err);
      setFieldErrors(parsed.fieldErrors);
      setBanner(parsed.message);
    }
  }

  if (succeeded) {
    return (
      <AuthLayout>
        <AuthCard title={succeeded.title} subtitle={succeeded.subtitle}>
          <div className="flex flex-col items-center gap-3 py-4">
            <SuccessCheckmark size="lg" />
          </div>
        </AuthCard>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout variant="plain">
      <div className="flex min-h-[calc(100vh-120px)] flex-col lg:flex-row">
        <ProviderHeroPanel />

        <div className="flex-1 bg-brand-background px-4 py-10 sm:px-8 lg:px-12">
          <div className="mx-auto flex max-w-3xl flex-col gap-8">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  navigate("/", { replace: true });
                  openAuthModal("register");
                }}
                className="text-sm font-medium text-brand-primary hover:text-brand-primaryHover"
              >
                ← Back to account
              </button>
              <StepBreadcrumb
                steps={[
                  { label: "Account", state: "done" },
                  { label: "Business details", state: "current" },
                ]}
              />
            </div>

            <header className="flex flex-col gap-1">
              <h1 className="text-3xl font-bold tracking-tight text-brand-logo">
                Tell us about your business
              </h1>
              <p className="text-sm text-brand-muted">
                You can update these details anytime from your provider profile. Fields
                marked <span className="font-medium">optional</span> can be completed
                later.
              </p>
            </header>

            <form className="flex flex-col gap-6" onSubmit={onSubmit} noValidate>
              {banner && <FormBanner tone="error">{banner}</FormBanner>}

              {/* 01 Business identity */}
              <Section number="01" eyebrow="Who you are" title="Business identity">
                <FormField
                  label="Business or trading name"
                  htmlFor="business_name"
                  error={fieldErrors.business_name}
                >
                  <TextInput
                    id="business_name"
                    value={form.business_name}
                    onChange={(e) => patch("business_name", e.target.value)}
                    placeholder="e.g. John Martinez Plumbing"
                    hasError={Boolean(fieldErrors.business_name)}
                  />
                </FormField>

                <div className="grid gap-5 sm:grid-cols-2">
                  <FormField
                    label="Business type"
                    htmlFor="business_type"
                    error={fieldErrors.business_type}
                  >
                    <SelectInput
                      id="business_type"
                      value={form.business_type}
                      onChange={(e) =>
                        patch("business_type", e.target.value as BusinessType)
                      }
                      options={BUSINESS_TYPE_OPTIONS}
                      placeholder="Sole proprietor"
                      hasError={Boolean(fieldErrors.business_type)}
                    />
                  </FormField>
                  <FormField
                    label="Tax ID / VAT number"
                    htmlFor="tax_id"
                    optional
                    error={fieldErrors.tax_id}
                  >
                    <TextInput
                      id="tax_id"
                      value={form.tax_id}
                      onChange={(e) => patch("tax_id", e.target.value)}
                      placeholder="123-45-6789"
                      hasError={Boolean(fieldErrors.tax_id)}
                    />
                  </FormField>
                </div>

                <FormField
                  label="Registered address"
                  htmlFor="registered_address"
                  optional
                  hint="Used for invoicing and tax reporting. Not shown publicly."
                >
                  <TextInput
                    id="registered_address"
                    value={form.registered_address}
                    onChange={(e) => patch("registered_address", e.target.value)}
                    placeholder="12 Rothschild Blvd, Tel Aviv"
                  />
                </FormField>
              </Section>

              {/* 02 Services & pricing */}
              <Section number="02" eyebrow="Services & pricing" title="What you offer">
                <div className="grid gap-5 sm:grid-cols-2">
                  <FormField
                    label="Primary service category"
                    htmlFor="service_category"
                    error={fieldErrors.service_category}
                  >
                    <SelectInput
                      id="service_category"
                      value={form.service_category}
                      onChange={(e) => patch("service_category", e.target.value)}
                      options={SERVICE_CATEGORY_OPTIONS}
                      placeholder="Plumbing"
                      hasError={Boolean(fieldErrors.service_category)}
                    />
                  </FormField>
                  <FormField
                    label="Years of experience"
                    htmlFor="years_of_experience"
                    error={fieldErrors.years_of_experience}
                  >
                    <SelectInput
                      id="years_of_experience"
                      value={form.years_of_experience}
                      onChange={(e) => patch("years_of_experience", e.target.value)}
                      options={YEARS_EXPERIENCE_OPTIONS}
                      placeholder="5 – 9 years"
                      hasError={Boolean(fieldErrors.years_of_experience)}
                    />
                  </FormField>
                </div>

                <FormField
                  label="Short bio"
                  htmlFor="short_bio"
                  optional
                  hint="100 characters max — shown on your public profile."
                  error={fieldErrors.short_bio}
                >
                  <TextareaInput
                    id="short_bio"
                    rows={3}
                    maxLength={100}
                    value={form.short_bio}
                    onChange={(e) => patch("short_bio", e.target.value)}
                    placeholder="Licensed master plumber specializing in emergency repairs and bathroom remodels…"
                    hasError={Boolean(fieldErrors.short_bio)}
                  />
                </FormField>

                <div className="grid gap-5 sm:grid-cols-2">
                  <FormField
                    label="Service area"
                    htmlFor="service_area"
                    error={fieldErrors.service_area}
                  >
                    <TextInput
                      id="service_area"
                      value={form.service_area}
                      onChange={(e) => patch("service_area", e.target.value)}
                      placeholder="Tel Aviv & Central District"
                      hasError={Boolean(fieldErrors.service_area)}
                    />
                  </FormField>
                  <FormField
                    label="Contact phone number"
                    htmlFor="phone_number"
                    error={fieldErrors.phone_number}
                  >
                    <TextInput
                      id="phone_number"
                      type="tel"
                      autoComplete="tel"
                      value={form.phone_number}
                      onChange={(e) => patch("phone_number", e.target.value)}
                      placeholder="+972 50 123 4567"
                      hasError={Boolean(fieldErrors.phone_number)}
                    />
                  </FormField>
                </div>

                <FormField
                  label="Base hourly rate"
                  htmlFor="base_hourly_rate"
                  optional
                  hint="You can adjust this per service later."
                >
                  <div className="flex items-stretch overflow-hidden rounded-lg border border-brand-borderLight bg-white focus-within:ring-2 focus-within:ring-brand-borderStrong">
                    <span className="flex items-center px-3 text-xs font-semibold uppercase tracking-wider text-brand-muted">
                      USD / hr
                    </span>
                    <input
                      id="base_hourly_rate"
                      type="number"
                      min={0}
                      step={1}
                      className="w-full border-l border-brand-borderLight bg-white px-3 py-2.5 text-sm text-brand-logo focus:outline-none"
                      value={form.base_hourly_rate}
                      onChange={(e) => patch("base_hourly_rate", e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </FormField>
              </Section>

              {/* 03 Credentials */}
              <Section number="03" eyebrow="Credentials" title="Verification & trust">
                <p className="-mt-1 text-xs text-brand-muted">
                  Pros with verified credentials book 3× more jobs on average. You can
                  skip this and complete verification later, but your profile will show
                  as "Unverified" until then.
                </p>

                <div className="grid gap-5 sm:grid-cols-2">
                  <FormField
                    label="License or certification number"
                    htmlFor="license"
                    optional
                    error={fieldErrors.license_or_certification_number}
                  >
                    <TextInput
                      id="license"
                      value={form.license_or_certification_number}
                      onChange={(e) =>
                        patch("license_or_certification_number", e.target.value)
                      }
                      placeholder="PL-2019-00847"
                      hasError={Boolean(fieldErrors.license_or_certification_number)}
                    />
                  </FormField>
                  <FormField
                    label="Insurance provider"
                    htmlFor="insurance"
                    optional
                    error={fieldErrors.insurance_provider}
                  >
                    <TextInput
                      id="insurance"
                      value={form.insurance_provider}
                      onChange={(e) => patch("insurance_provider", e.target.value)}
                      placeholder="Hiscox Insurance"
                      hasError={Boolean(fieldErrors.insurance_provider)}
                    />
                  </FormField>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <UploadPlaceholder
                    title="Upload government ID"
                    helper="Passport, driver's license, or national ID · PDF, JPG, PNG · max 10 MB"
                  />
                  <UploadPlaceholder
                    title="Upload business registration"
                    helper="Certificate of incorporation or trade license · optional"
                  />
                </div>
              </Section>

              {/* 04 Payouts */}
              <Section number="04" eyebrow="Payouts" title="Get paid securely">
                <div className="flex items-start gap-3 rounded-lg border border-brand-borderLight bg-white p-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-primary/10 text-sm font-semibold text-brand-primary">
                    S
                  </span>
                  <div className="flex flex-col gap-1 text-sm">
                    <span className="font-semibold text-brand-logo">
                      Set up payouts with Stripe
                    </span>
                    <span className="text-xs leading-relaxed text-brand-muted">
                      After you create your account, we'll redirect you to Stripe to
                      verify your identity and connect a bank account for payouts. Takes
                      2 – 3 minutes.
                    </span>
                  </div>
                </div>
              </Section>

              <div className="flex flex-col gap-4 border-t border-brand-borderLight pt-6">
                <Checkbox
                  checked={form.accept_terms}
                  onChange={(e) => patch("accept_terms", e.target.checked)}
                  label="I agree to the SkillBridge Provider Terms"
                  description="I acknowledge that SkillBridge holds a 10% platform fee on completed jobs, and that I'm responsible for my own taxes and business insurance."
                />
                {fieldErrors.accept_terms && (
                  <p className="text-xs font-medium text-rose-600" role="alert">
                    {fieldErrors.accept_terms}
                  </p>
                )}

                <SubmitButton
                  loading={isSubmitting}
                  loadingText="Creating your provider account…"
                >
                  Create provider account & continue →
                </SubmitButton>
                <p className="text-center text-xs text-brand-muted">
                  You'll complete email verification and set up payouts next. No charges
                  will be made to you.
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}

// ---- Internal helpers -----------------------------------------------------

function Section({
  number,
  eyebrow,
  title,
  children,
}: {
  number: string;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-5 rounded-xl border border-brand-borderLight bg-white p-6 shadow-card">
      <header className="flex flex-col gap-0.5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-muted">
          {number} · {eyebrow}
        </span>
        <h2 className="text-lg font-semibold text-brand-logo">{title}</h2>
      </header>
      <div className="flex flex-col gap-5">{children}</div>
    </section>
  );
}

function UploadPlaceholder({ title, helper }: { title: string; helper: string }) {
  return (
    <div
      role="button"
      tabIndex={0}
      className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-brand-borderStrong bg-brand-background/70 px-4 py-6 text-center transition hover:border-brand-primary hover:bg-brand-surface/40"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 16V4m0 0 4 4m-4-4-4 4M4 20h16"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <p className="text-sm font-semibold text-brand-logo">{title}</p>
      <p className="text-[11px] leading-relaxed text-brand-muted">{helper}</p>
    </div>
  );
}

export default ProviderRegistrationPage;
