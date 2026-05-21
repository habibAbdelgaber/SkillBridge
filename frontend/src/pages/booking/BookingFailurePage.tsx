import { Link, useLocation, useNavigate } from "react-router-dom";

import { ResultCard } from "@/components/booking/ResultCard";
import { Section } from "@/components/ui/Section";

interface FailureLocationState {
  /** Stripe-shaped error code, e.g. "card_declined". */
  errorCode?: string;
  /** Customer-facing detail line shown in the alert callout. */
  detail?: string;
  /** Optional headline override; defaults to the Stripe-style copy. */
  title?: string;
  /** Optional subtitle override. */
  subtitle?: string;
  /** Where "Try a different card" should send the user. Defaults to /home
   *  until a real /payment route ships, since payment isn't implemented. */
  retryHref?: string;
}

const DEFAULT_TITLE = "Payment didn't go through";
const DEFAULT_SUBTITLE =
  "Your card was declined. No funds were taken. Please try a different payment method.";
const DEFAULT_ERROR_CODE = "card_declined";
const DEFAULT_DETAIL =
  "Your bank declined this transaction. Contact them or try another card.";

/**
 * "/booking/failure"
 *
 * Renders the post-payment-failure card. State flows in via
 * ``location.state`` so the upstream payment hook can pass the actual
 * error code + detail; defaults preserve the Figma copy when the page
 * is opened directly (e.g. from a deep link or QA).
 */
export function BookingFailurePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state as FailureLocationState | null) ?? {};

  const title = state.title ?? DEFAULT_TITLE;
  const subtitle = state.subtitle ?? DEFAULT_SUBTITLE;
  const errorCode = state.errorCode ?? DEFAULT_ERROR_CODE;
  const detail = state.detail ?? DEFAULT_DETAIL;

  const onRetry = () => {
    if (state.retryHref) {
      navigate(state.retryHref, { replace: true });
      return;
    }
    // No payment screen yet — go back so the customer lands on the
    // booking flow they came from.
    navigate(-1);
  };

  return (
    <Section
      tone="surface"
      innerClassName="mx-auto w-full max-w-3xl px-6 py-14 sm:py-20"
    >
      <ResultCard
        tone="error"
        title={title}
        subtitle={subtitle}
        actions={
          <>
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex w-full items-center justify-center rounded-md bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-primaryHover"
            >
              Try a different card
            </button>
            <Link
              to="/support"
              className="inline-flex w-full items-center justify-center rounded-md border border-brand-borderLight bg-white px-5 py-2.5 text-sm font-semibold text-brand-logo transition-colors hover:border-brand-primary hover:text-brand-primary"
            >
              Contact support
            </Link>
          </>
        }
      >
        <div
          role="alert"
          className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-left"
        >
          <p className="text-sm font-semibold text-rose-700">Error code: {errorCode}</p>
          <p className="mt-1 text-sm leading-relaxed text-rose-600">{detail}</p>
        </div>
      </ResultCard>
    </Section>
  );
}
