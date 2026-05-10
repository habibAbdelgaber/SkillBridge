import { useEffect, useRef } from "react";

import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { useUIStore } from "@/store/uiStore";

export function AuthModal() {
  const mode = useUIStore((s) => s.authModalMode);
  const redirectPath = useUIStore((s) => s.authRedirectPath);
  const close = useUIStore((s) => s.closeAuthModal);
  const switchMode = useUIStore((s) => s.switchAuthModal);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mode) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const firstFocusable = dialogRef.current?.querySelector<HTMLElement>(
      "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
    );
    firstFocusable?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [close, mode]);

  if (!mode) return null;

  const title = mode === "login" ? "Sign in to SkillBridge" : "Create your account";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-brand-logo/45 px-4 py-6 backdrop-blur-sm"
      onMouseDown={close}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="relative max-h-[calc(100vh-3rem)] w-full max-w-md overflow-y-auto rounded-xl border border-brand-borderLight bg-white p-6 shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={close}
          aria-label="Close authentication dialog"
          className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-md text-brand-muted transition-colors hover:bg-brand-surface/70 hover:text-brand-logo"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            className="h-5 w-5"
            aria-hidden="true"
          >
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        </button>

        {mode === "login" ? (
          <LoginForm
            onSwitchToRegister={() => switchMode("register")}
            onSuccess={close}
            onNavigateAway={close}
            redirectPath={redirectPath}
          />
        ) : (
          <RegisterForm onSwitchToLogin={() => switchMode("login")} onSuccess={close} />
        )}
      </div>
    </div>
  );
}
