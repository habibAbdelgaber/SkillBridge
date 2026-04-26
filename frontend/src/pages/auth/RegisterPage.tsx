import { FormEvent, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { AuthCard } from "@/components/auth/AuthCard";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { FormBanner } from "@/components/auth/FormBanner";
import { OrDivider } from "@/components/auth/OrDivider";
import { SocialButton } from "@/components/auth/SocialButton";
import { SuccessCheckmark } from "@/components/auth/SuccessCheckmark";
import { Checkbox } from "@/components/forms/Checkbox";
import { FormField } from "@/components/forms/FormField";
import { PasswordInput } from "@/components/forms/PasswordInput";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { TextInput } from "@/components/forms/TextInput";
import { splitFullName } from "@/features/auth/fullName";
import { useAuthStore } from "@/store/authStore";
import { useProviderSignupStore } from "@/store/providerSignupStore";
import { isLoginResponse } from "@/types/auth";
import { parseApiError } from "@/utils/parseApiError";

interface FormState {
  fullName: string;
  email: string;
  password: string;
  asProvider: boolean;
}

const INITIAL: FormState = {
  fullName: "",
  email: "",
  password: "",
  asProvider: false,
};

/** How long to hold the success check before navigating. */
const SUCCESS_REDIRECT_MS = 1100;

function validate(state: FormState): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!state.fullName.trim()) errors.full_name = "Enter your full name.";
  if (!state.email.trim()) errors.email = "Enter your email address.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email.trim()))
    errors.email = "Enter a valid email address.";
  if (!state.password) errors.password = "Choose a password.";
  else if (state.password.length < 8)
    errors.password = "Password must be at least 8 characters.";
  return errors;
}

export function RegisterPage() {
  const navigate = useNavigate();
  const registerCustomer = useAuthStore((s) => s.registerCustomer);
  const status = useAuthStore((s) => s.status);
  const setProviderDraft = useProviderSignupStore((s) => s.setDraft);

  const [form, setForm] = useState<FormState>(INITIAL);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<{ tone: "error" | "success"; text: string } | null>(
    null,
  );
  const [succeeded, setSucceeded] = useState<{
    title: string;
    subtitle: string;
  } | null>(null);
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isSubmitting = status === "authenticating";

  useEffect(
    () => () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    },
    [],
  );

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const errs = validate(form);
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const { first_name, last_name } = splitFullName(form.fullName);
    setBanner(null);

    // Service provider branch: capture the account basics and route to step 2.
    // The actual API call happens only at the end of the business-details form.
    if (form.asProvider) {
      setProviderDraft({
        first_name,
        last_name,
        email: form.email.trim(),
        password: form.password,
      });
      navigate("/register/provider");
      return;
    }

    try {
      const response = await registerCustomer({
        email: form.email.trim(),
        password1: form.password,
        password2: form.password,
        first_name,
        last_name,
      });

      const verificationRequired = !isLoginResponse(response);
      setSucceeded({
        title: "Account created",
        subtitle: verificationRequired
          ? "Check your inbox for a verification link to activate your account."
          : "You're all set. Taking you to sign in…",
      });

      redirectTimerRef.current = setTimeout(() => {
        if (verificationRequired) {
          navigate("/verify-email-sent", {
            state: { email: form.email.trim() },
            replace: true,
          });
        } else {
          // Per-spec: after successful registration, send the user to the
          // sign-in page so they enter the app via an explicit auth step.
          navigate("/login", { replace: true });
        }
      }, SUCCESS_REDIRECT_MS);
    } catch (err) {
      const parsed = parseApiError(err);
      // The backend returns `password1: [...]` etc.; map that to the UI fields.
      const mapped: Record<string, string> = {};
      if (parsed.fieldErrors.email) mapped.email = parsed.fieldErrors.email;
      if (parsed.fieldErrors.password1) mapped.password = parsed.fieldErrors.password1;
      if (parsed.fieldErrors.password2) mapped.password = parsed.fieldErrors.password2;
      if (parsed.fieldErrors.first_name || parsed.fieldErrors.last_name) {
        mapped.full_name =
          parsed.fieldErrors.first_name ?? parsed.fieldErrors.last_name ?? "";
      }
      setFieldErrors(mapped);
      setBanner({ tone: "error", text: parsed.message });
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
    <AuthLayout>
      <AuthCard
        title="Create your account"
        subtitle="Two minutes. No credit card."
        footer={
          <span>
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-brand-primary hover:text-brand-primaryHover"
            >
              Sign in
            </Link>
          </span>
        }
      >
        <div className="flex flex-col gap-2.5">
          <SocialButton provider="google" disabled aria-disabled title="Available soon" />
          <SocialButton provider="facebook" disabled aria-disabled title="Available soon" />
        </div>

        <OrDivider />

        <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
          {banner && <FormBanner tone={banner.tone}>{banner.text}</FormBanner>}

          <FormField label="Full name" htmlFor="fullName" error={fieldErrors.full_name}>
            <TextInput
              id="fullName"
              name="fullName"
              autoComplete="name"
              placeholder="Habib Abdelgaber"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              hasError={Boolean(fieldErrors.full_name)}
              required
            />
          </FormField>

          <FormField label="Email" htmlFor="email" error={fieldErrors.email}>
            <TextInput
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="you@company.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              hasError={Boolean(fieldErrors.email)}
              required
            />
          </FormField>

          <FormField
            label="Password"
            htmlFor="password"
            error={fieldErrors.password}
            hint="At least 8 characters."
          >
            <PasswordInput
              id="password"
              name="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              hasError={Boolean(fieldErrors.password)}
              required
            />
          </FormField>

          <div className="rounded-lg border border-brand-borderLight bg-brand-surface/40 p-4">
            <Checkbox
              checked={form.asProvider}
              onChange={(e) => setForm({ ...form, asProvider: e.target.checked })}
              label={
                <span className="flex items-center gap-2">
                  Sign up as a service provider
                  <span className="rounded-full bg-brand-logo px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                    Pro
                  </span>
                </span>
              }
              description="We'll ask for a few business details after you create your account — takes about 3 minutes."
            />
          </div>

          <SubmitButton loading={isSubmitting} loadingText="Creating your account…">
            {form.asProvider ? "Continue to business details" : "Create account"}
          </SubmitButton>
        </form>
      </AuthCard>
    </AuthLayout>
  );
}

export default RegisterPage;
