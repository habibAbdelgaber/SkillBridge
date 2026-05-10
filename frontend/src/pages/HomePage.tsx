import { Section } from "@/components/ui/Section";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useHealthCheck } from "@/hooks/useHealthCheck";

export function HomePage() {
  const { status, data, error, refresh } = useHealthCheck();

  return (
    <div className="relative left-1/2 -my-10 min-h-[calc(100vh-8rem)] w-screen -translate-x-1/2 overflow-hidden px-6 py-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[url('/home-bg-transparent.png')] bg-cover bg-center bg-no-repeat opacity-20"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-brand-background/70"
      />
      <Section
        tone="default"
        className="relative z-10 bg-transparent"
        innerClassName="mx-auto w-full max-w-6xl px-0 py-0 sm:py-4"
      >
        <div className="flex flex-col gap-10">
          <header className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-muted">
              SkillBridge · MVP Marketplace
            </p>
            <h1 className="mt-3 text-base leading-relaxed text-brand-muted capitalize sm:text-xl md:text-2xl">
              Connect skilled providers with the people who need them.
            </h1>
            <p className="mt-4 text-base leading-relaxed text-brand-muted">
              SkillBridge is the foundation for a production-grade service marketplace —
              providers publish their offerings, customers book them, and payments flow
              seamlessly in between.
            </p>
          </header>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <article className="card-surface p-5">
              <h3 className="text-sm font-semibold text-brand-logo">Providers</h3>
              <p className="mt-2 text-sm text-brand-muted">
                Onboarding, profiles, and service catalogs arrive in stage 2.
              </p>
            </article>
            <article className="card-surface p-5">
              <h3 className="text-sm font-semibold text-brand-logo">Customers</h3>
              <p className="mt-2 text-sm text-brand-muted">
                Discovery, booking, and payment flows land in subsequent stages.
              </p>
            </article>
            <article className="card-surface p-5">
              <h3 className="text-sm font-semibold text-brand-logo">Operations</h3>
              <p className="mt-2 text-sm text-brand-muted">
                Admin, observability, and deployment tooling evolve alongside the
                platform.
              </p>
            </article>
          </div>

          <section className="card-surface flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-brand-logo">Backend health</h2>
              <p className="mt-1 text-xs text-brand-muted">
                Live probe against <code className="font-mono">/health/</code>.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {status === "loading" && (
                  <StatusBadge tone="neutral">Checking…</StatusBadge>
                )}
                {status === "success" && data && (
                  <>
                    <StatusBadge tone={data.status === "ok" ? "ok" : "warn"}>
                      {data.status.toUpperCase()}
                    </StatusBadge>
                    <StatusBadge tone={data.database === "ok" ? "ok" : "warn"}>
                      DB · {data.database}
                    </StatusBadge>
                    <span className="text-xs text-brand-muted">
                      {new Date(data.timestamp).toLocaleString()}
                    </span>
                  </>
                )}
                {status === "error" && (
                  <StatusBadge tone="error">
                    Unreachable · {error ?? "error"}
                  </StatusBadge>
                )}
              </div>
            </div>
            <button
              type="button"
              className="btn-primary"
              onClick={() => void refresh()}
            >
              Refresh
            </button>
          </section>
        </div>
      </Section>
    </div>
  );
}
