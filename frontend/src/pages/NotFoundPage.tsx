import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <section className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-muted">
        404
      </p>
      <h1 className="text-3xl font-bold text-brand-logo">Page not found</h1>
      <p className="max-w-md text-sm text-brand-muted">
        The page you're looking for doesn't exist yet. Navigate back home to keep
        exploring SkillBridge.
      </p>
      <Link to="/" className="btn-primary mt-2">
        Back to home
      </Link>
    </section>
  );
}
