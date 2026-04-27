import { CategoriesSection } from "@/components/landing/CategoriesSection";
import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";

/**
 * Public marketing page rendered at "/".
 *
 * Composed of small section components so each block stays self-contained
 * and reusable (e.g., the CategoriesSection can later be reused on the
 * marketplace landing once real data lands).
 */
export function LandingPage() {
  return (
    <>
      <HeroSection />
      <CategoriesSection />
      <HowItWorksSection />
    </>
  );
}

export default LandingPage;
