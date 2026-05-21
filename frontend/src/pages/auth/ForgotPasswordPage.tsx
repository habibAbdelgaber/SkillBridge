import { FormEvent, useState } from "react";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { FormBanner } from "@/components/auth/FormBanner";
import { FormField } from "@/components/forms/FormField";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { TextInput } from "@/components/forms/TextInput";
import { authService } from "@/services/authService";
import { useUIStore } from "@/store/uiStore";
import { parseApiError } from "@/utils/parseApiError";

export function ForgotPasswordPage() {
  const openAuthModal = useUIStore((s) => s.openAuthModal);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [banner, setBanner] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEmailError(null);
    setBanner(null);

    const normalized = email.trim();
    if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      setEmailError("Enter a valid email address.");
      return;
    }

    setStatus("sending");
    try {
      await authService.requestPasswordReset(normalized);
      setStatus("sent");
      setBanner({
        tone: "success",
        text: "If an account exists for that email, you'll receive reset instructions shortly.",
      });
    } catch (err) {
      setStatus("error");
      setBanner({ tone: "error", text: parseApiError(err).message });
    }
  }

  return (
    <AuthLayout>
      <AuthCard
        title="Reset your password"
        subtitle="Enter the email associated with your account. We'll send you a link to set a new password."
        footer={
          <span>
            Remembered it?{" "}
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
          <FormField label="Email" htmlFor="email" error={emailError}>
            <TextInput
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              hasError={Boolean(emailError)}
              required
            />
          </FormField>
          <SubmitButton loading={status === "sending"} loadingText="Sending…">
            Send reset link
          </SubmitButton>
        </form>
      </AuthCard>
    </AuthLayout>
  );
}

export default ForgotPasswordPage;
