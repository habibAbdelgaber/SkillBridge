export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-brand-borderLight bg-white/70">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 text-xs text-brand-muted">
        <span>&copy; {year} SkillBridge</span>
        <span>Stage 1 · Foundation</span>
      </div>
    </footer>
  );
}
