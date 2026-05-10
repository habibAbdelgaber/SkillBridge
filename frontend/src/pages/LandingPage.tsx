import { CategoriesSection } from "@/components/landing/CategoriesSection";
import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";

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
