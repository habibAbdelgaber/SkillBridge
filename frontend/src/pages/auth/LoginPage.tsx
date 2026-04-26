import { FormEvent, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

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
import { useAuthStore } from "@/store/authStore";
import { parseApiError } from "@/utils/parseApiError";

interface FormState {
  email: string;
  password: string;
  remember: boolean;
}

const INITIAL: FormState = { email: "", password: "", remember: false };

/** How long to hold the success check before navigating. */
const SUCCESS_REDIRECT_MS = 1100;

function validate(state: FormState): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!state.email.trim()) errors.email = "Enter your email address.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email.trim()))
    errors.email = "Enter a valid email address.";
  if (!state.password) errors.password = "Enter your password.";
  return errors;
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((s) => s.login);
  const status = useAuthStore((s) => s.status);

  const [form, setForm] = useState<FormState>(INITIAL);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<{ tone: "error" | "success"; text: string } | null>(
    null,
  );
  const [succeeded, setSucceeded] = useState(false);
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isSubmitting = status === "authenticating";
  const redirectTo = (location.state as { from?: string } | null)?.from ?? "/";
  const justVerified = Boolean((location.state as { justVerified?: boolean } | null)?.justVerified);
  const passwordReset = Boolean((location.state as { passwordReset?: boolean } | null)?.passwordReset);

  // Surface a one-time success banner after email verification or password
  // reset flows hand off to this page.
  useEffect(() => {
    if (justVerified) {
      setBanner({
        tone: "success",
        text: "Your email is verified. Sign in to continue.",
      });
    } else if (passwordReset) {
      setBanner({
        tone: "success",
        text: "Password updated. Sign in with your new password.",
      });
    }
  }, [justVerified, passwordReset]);

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

    setBanner(null);
    try {
      await login({ email: form.email.trim(), password: form.password });
      setSucceeded(true);
      redirectTimerRef.current = setTimeout(() => {
        navigate(redirectTo, { replace: true });
      }, SUCCESS_REDIRECT_MS);
    } catch (err) {
      const parsed = parseApiError(err);
      setFieldErrors(parsed.fieldErrors);
      setBanner({ tone: "error", text: parsed.message });
    }
  }

  if (succeeded) {
    return (
      <AuthLayout>
        <AuthCard
          title="Signed in"
          subtitle="Welcome back. Taking you to your dashboard…"
        >
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
        title="Sign in to SkillBridge"
        subtitle="Enter your credentials to continue."
        footer={
          <span>
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-semibold text-brand-primary hover:text-brand-primaryHover"
            >
              Create one
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

          <FormField label="Password" htmlFor="password" error={fieldErrors.password}>
            <PasswordInput
              id="password"
              name="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              hasError={Boolean(fieldErrors.password)}
              required
            />
          </FormField>

          <div className="flex items-center justify-between">
            <Checkbox
              label="Remember me"
              checked={form.remember}
              onChange={(e) => setForm({ ...form, remember: e.target.checked })}
            />
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-brand-primary hover:text-brand-primaryHover"
            >
              Forgot password?
            </Link>
          </div>

          <SubmitButton loading={isSubmitting} loadingText="Signing in…">
            Sign in
          </SubmitButton>
        </form>
      </AuthCard>
    </AuthLayout>
  );
}

export default LoginPage;
