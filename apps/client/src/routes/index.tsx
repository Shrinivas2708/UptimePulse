import { createFileRoute } from "@tanstack/react-router";
import PricingSection from "../components/PricingSection";
import FeaturesSection from "../components/Features";
import NotificationSection from "../components/NotificationSection";
import FAQ from "../components/FAQ";
import Hero from "../components/Hero";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});
function HomeComponent() {
  return (
    <div className='bg-[#0c0a09] relative text-white min-h-screen flex flex-col max-w-screen-2xl mx-auto z-50'>
        <div
        className="absolute inset-0 z-0 pointer-events-none hidden md:block"
        style={{
          background: "radial-gradient(ellipse 60% 20% at 50% 0%, rgba(16, 185, 129, 0.25), transparent 70%), #0c0a09",
        }}
      />
    <Navbar/>
    <main className="relative z-20 min-h-screen md:mt-16 ">
      <Hero />
      <FeaturesSection />
      <NotificationSection />
      <PricingSection />
      <FAQ />
    </main>
    <Footer />
    </div>
  );
}
