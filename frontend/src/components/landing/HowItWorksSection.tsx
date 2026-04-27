import { Section } from "@/components/ui/Section";

interface Step {
  number: string;
  title: string;
  description: string;
}

const STEPS: Step[] = [
  {
    number: "01",
    title: "Browse & compare",
    description: "Filter by skill, price, and availability. Read verified reviews.",
  },
  {
    number: "02",
    title: "Book in minutes",
    description: "Pick a time, confirm the scope of work, and pay securely.",
  },
  {
    number: "03",
    title: "Get the job done",
    description:
      "Track progress, chat with your pro, and release payment when happy.",
  },
];

export function HowItWorksSection() {
  return (
    <Section id="how-it-works" tone="surface" className="scroll-mt-20">
      <header className="max-w-2xl">
        <h2 className="text-3xl font-bold tracking-tight text-brand-logo sm:text-4xl">
          How SkillBridge works
        </h2>
      </header>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {STEPS.map((step) => (
          <article
            key={step.number}
            className="rounded-2xl border border-brand-borderLight bg-white p-6 shadow-card"
          >
            <p className="text-xs font-semibold tracking-[0.2em] text-brand-primary">
              {step.number}
            </p>
            <h3 className="mt-3 text-lg font-semibold text-brand-logo">
              {step.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-brand-muted">
              {step.description}
            </p>
          </article>
        ))}
      </div>
    </Section>
  );
}
