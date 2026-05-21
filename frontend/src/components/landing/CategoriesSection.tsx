import { CategoryCard } from "@/components/landing/CategoryCard";
import {
  CarIcon,
  CleaningIcon,
  DesignIcon,
  ElectricalIcon,
  GardeningIcon,
  HandymanIcon,
  PlumbingIcon,
  TutoringIcon,
} from "@/components/landing/icons";
import { Section } from "@/components/ui/Section";

const CATEGORIES = [
  { label: "Handyman", slug: "handyman", proCount: 312, Icon: HandymanIcon },
  { label: "Cleaning", slug: "cleaning", proCount: 458, Icon: CleaningIcon },
  { label: "Plumbing", slug: "plumbing", proCount: 187, Icon: PlumbingIcon },
  { label: "Electrical", slug: "electrical", proCount: 156, Icon: ElectricalIcon },
  { label: "Design", slug: "design", proCount: 233, Icon: DesignIcon },
  { label: "Tutoring", slug: "tutoring", proCount: 541, Icon: TutoringIcon },
  { label: "Gardening", slug: "gardening", proCount: 97, Icon: GardeningIcon },
  { label: "Car services", slug: "car-services", proCount: 128, Icon: CarIcon },
];

export function CategoriesSection() {
  return (
    <Section id="categories" tone="dark">
      <header className="max-w-2xl">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Browse by category
        </h2>
        <p className="mt-3 text-sm text-white/70 sm:text-base">
          Dozens of services. Vetted professionals. Transparent pricing.
        </p>
      </header>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CATEGORIES.map((c) => (
          <CategoryCard key={c.slug} {...c} />
        ))}
      </div>
    </Section>
  );
}
