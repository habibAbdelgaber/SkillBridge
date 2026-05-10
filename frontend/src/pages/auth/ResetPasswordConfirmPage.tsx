import { FormEvent, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { AuthCard } from "@/components/auth/AuthCard";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { FormBanner } from "@/components/auth/FormBanner";
import { SuccessCheckmark } from "@/components/auth/SuccessCheckmark";
import { FormField } from "@/components/forms/FormField";
import { PasswordInput } from "@/components/forms/PasswordInput";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { authService } from "@/services/authService";
import { useUIStore } from "@/store/uiStore";
import { parseApiError } from "@/utils/parseApiError";

interface FormState {
  password: string;
  confirm: string;
}

const INITIAL: FormState = { password: "", confirm: "" };
const SUCCESS_REDIRECT_MS = 1400;

function validate(state: FormState): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!state.password) {
    errors.new_password1 = "Choose a new password.";
  } else if (state.password.length < 8) {
    errors.new_password1 = "Password must be at least 8 characters.";
  }
  if (!state.confirm) {
    errors.new_password2 = "Confirm your new password.";
  } else if (state.password && state.password !== state.confirm) {
    errors.new_password2 = "Passwords do not match.";
  }
  return errors;
}

/**
 * Lands here from the password-reset email at /reset-password/:uid/:token.
 * Posts the credentials to /api/v1/auth/password/reset/confirm/, shows the
 * success checkmark on a 200, then opens the login modal.
 */
export function ResetPasswordConfirmPage() {
  const { uid, token } = useParams<{ uid: string; token: string }>();
  const navigate = useNavigate();
  const openAuthModal = useUIStore((s) => s.openAuthModal);

  const [form, setForm] = useState<FormState>(INITIAL);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<{
    tone: "error" | "success";
    text: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Defensive: a malformed link (missing uid or token) should fail fast with
  // a clear message rather than letting the form submit and bounce off the API.
  const linkValid = Boolean(uid && token);

  useEffect(
    () => () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    },
    [],
  );

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!linkValid) return;

    const errs = validate(form);
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setBanner(null);
    setSubmitting(true);
    try {
      await authService.confirmPasswordReset({
        uid: uid!,
        token: token!,
        new_password1: form.password,
        new_password2: form.confirm,
      });
      setSucceeded(true);
      redirectTimerRef.current = setTimeout(() => {
        navigate("/", { replace: true });
        openAuthModal("login");
      }, SUCCESS_REDIRECT_MS);
    } catch (err) {
      const parsed = parseApiError(err);
      setFieldErrors(parsed.fieldErrors);
      // dj-rest-auth surfaces "uid" / "token" failures as field errors. Promote
      // those into the banner so the user understands the link itself is bad.
      const linkBroken = parsed.fieldErrors.uid || parsed.fieldErrors.token;
      setBanner({
        tone: "error",
        text: linkBroken
          ? "This reset link is invalid or has expired. Request a new one."
          : parsed.message,
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (succeeded) {
    return (
      <AuthLayout>
        <AuthCard
          title="Password updated"
          subtitle="Your password has been changed. Taking you to sign in…"
        >
          <div className="flex flex-col items-center gap-3 py-4">
            <SuccessCheckmark size="lg" />
          </div>
        </AuthCard>
      </AuthLayout>
    );
  }

  if (!linkValid) {
    return (
      <AuthLayout>
        <AuthCard
          title="This reset link is incomplete"
          subtitle="The link is missing its token. Request a fresh one to continue."
          footer={
            <span>
              <Link
                to="/forgot-password"
                className="font-semibold text-brand-primary hover:text-brand-primaryHover"
              >
                Send a new reset link
              </Link>
            </span>
          }
        >
          <FormBanner tone="error">
            We couldn't read the credentials in this URL.
          </FormBanner>
        </AuthCard>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <AuthCard
        title="Choose a new password"
        subtitle="Pick something at least 8 characters long. You'll be signed out of any other sessions."
        footer={
          <span>
            Remembered your old one?{" "}
            <button
              type="button"
              onClick={() => openAuthModal("login")}
              className="font-semibold text-brand-primary hover:text-brand-primaryHover"
            >
              Sign in
            </button>
          </span>
        }
      >
        <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
          {banner && <FormBanner tone={banner.tone}>{banner.text}</FormBanner>}

          <FormField
            label="New password"
            htmlFor="new_password1"
            error={fieldErrors.new_password1}
          >
            <PasswordInput
              id="new_password1"
              name="new_password1"
              autoComplete="new-password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              hasError={Boolean(fieldErrors.new_password1)}
              required
            />
          </FormField>

          <FormField
            label="Confirm new password"
            htmlFor="new_password2"
            error={fieldErrors.new_password2}
          >
            <PasswordInput
              id="new_password2"
              name="new_password2"
              autoComplete="new-password"
              placeholder="••••••••"
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              hasError={Boolean(fieldErrors.new_password2)}
              required
            />
          </FormField>

          <SubmitButton loading={submitting} loadingText="Updating…">
            Update password
          </SubmitButton>
        </form>
      </AuthCard>
    </AuthLayout>
  );
}

export default ResetPasswordConfirmPage;
