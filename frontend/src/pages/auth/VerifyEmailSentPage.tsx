import { useState } from "react";
import { useLocation } from "react-router-dom";

import { AuthCard } from "@/components/auth/AuthCard";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { FormBanner } from "@/components/auth/FormBanner";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { authService } from "@/services/authService";
import { useUIStore } from "@/store/uiStore";
import { parseApiError } from "@/utils/parseApiError";

export function VerifyEmailSentPage() {
  const location = useLocation();
  const openAuthModal = useUIStore((s) => s.openAuthModal);
  const email = (location.state as { email?: string } | null)?.email ?? "";

  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function resend() {
    if (!email) return;
    setStatus("sending");
    try {
      await authService.resendVerificationEmail(email);
      setStatus("sent");
      setMessage("We've sent a fresh verification link to your inbox.");
    } catch (err) {
      setStatus("error");
      setMessage(parseApiError(err).message);
    }
  }

  return (
    <AuthLayout>
      <AuthCard
        title="Check your inbox"
        subtitle={
          email
            ? `We just sent a verification link to ${email}. Click it to finish setting up your account.`
            : "We just sent you a verification link. Click it to finish setting up your account."
        }
        footer={
          <span>
            Already verified?{" "}
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
        {status === "sent" && message && (
          <FormBanner tone="success">{message}</FormBanner>
        )}
        {status === "error" && message && (
          <FormBanner tone="error">{message}</FormBanner>
        )}
        <div className="rounded-lg border border-brand-borderLight bg-brand-surface/40 p-4 text-sm text-brand-logo">
          Didn't receive it? Check your spam folder, or request a new link below.
        </div>
        {email ? (
          <SubmitButton
            type="button"
            onClick={resend}
            loading={status === "sending"}
            loadingText="Sending…"
          >
            Resend verification email
          </SubmitButton>
        ) : (
          <button
            type="button"
            onClick={() => openAuthModal("login")}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-brand-borderLight bg-white text-sm font-semibold text-brand-logo hover:border-brand-borderStrong"
          >
            Back to sign in
          </button>
        )}
      </AuthCard>
    </AuthLayout>
  );
}

export default VerifyEmailSentPage;
