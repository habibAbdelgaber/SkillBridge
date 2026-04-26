import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { AuthCard } from "@/components/auth/AuthCard";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { FormBanner } from "@/components/auth/FormBanner";
import { SuccessCheckmark } from "@/components/auth/SuccessCheckmark";
import { authService } from "@/services/authService";
import { parseApiError } from "@/utils/parseApiError";

type VerifyStatus = "verifying" | "success" | "error";

const REDIRECT_DELAY_MS = 1800;

/**
 * Lands here from the verification email. Posts the key to the backend,
 * shows a result state, and forwards to /login on success.
 */
export function VerifyEmailPage() {
  const { key } = useParams<{ key: string }>();
  const navigate = useNavigate();

  const [status, setStatus] = useState<VerifyStatus>("verifying");
  const [error, setError] = useState<string | null>(null);

  // The verification key is single-use server-side, and React 18 strict-mode
  // dev re-runs effects twice. The ref guard ensures we issue exactly one
  // request per mount; we deliberately do NOT use a `cancelled` flag in the
  // cleanup, because doing so would discard the in-flight response between
  // the two strict-mode passes and leave the spinner stuck forever.
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    if (!key) {
      setStatus("error");
      setError("This verification link is missing its token.");
      return;
    }

    let redirectTimer: ReturnType<typeof setTimeout> | undefined;

    (async () => {
      try {
        await authService.verifyEmail(key);
        setStatus("success");
        redirectTimer = setTimeout(() => {
          navigate("/login", { replace: true, state: { justVerified: true } });
        }, REDIRECT_DELAY_MS);
      } catch (err) {
        setStatus("error");
        setError(parseApiError(err).message);
      }
    })();

    return () => {
      if (redirectTimer) clearTimeout(redirectTimer);
    };
  }, [key, navigate]);

  return (
    <AuthLayout>
      <AuthCard
        title={
          status === "success"
            ? "Email verified"
            : status === "error"
              ? "We couldn't verify that link"
              : "Verifying your email…"
        }
        subtitle={
          status === "success"
            ? "Your account is ready. Taking you to sign in…"
            : status === "error"
              ? "The link may have expired or already been used."
              : "Hang tight — this only takes a moment."
        }
        footer={
          status !== "verifying" && (
            <span>
              <Link
                to="/login"
                className="font-semibold text-brand-primary hover:text-brand-primaryHover"
              >
                Go to sign in
              </Link>
            </span>
          )
        }
      >
        <div className="flex min-h-[180px] w-full flex-col items-center justify-center gap-4 py-6">
          {status === "verifying" && (
            <span
              role="status"
              aria-label="Verifying your email"
              className="h-16 w-16 animate-spin rounded-full border-[5px] border-brand-borderLight border-t-brand-primary"
            />
          )}
          {status === "success" && <SuccessCheckmark size="lg" />}
          {status === "error" && error && (
            <FormBanner tone="error">{error}</FormBanner>
          )}
        </div>
      </AuthCard>
    </AuthLayout>
  );
}

export default VerifyEmailPage;
