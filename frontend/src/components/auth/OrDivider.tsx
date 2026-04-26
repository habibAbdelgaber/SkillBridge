export function OrDivider({ label = "or" }: { label?: string }) {
  return (
    <div className="relative flex items-center gap-4">
      <span className="h-px flex-1 bg-brand-borderLight" />
      <span className="text-xs font-medium uppercase tracking-wider text-brand-muted">
        {label}
      </span>
      <span className="h-px flex-1 bg-brand-borderLight" />
    </div>
  );
}
