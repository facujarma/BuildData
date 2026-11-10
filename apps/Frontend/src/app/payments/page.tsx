import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Hero from "./sections/Hero";
import Pricing from "./sections/Pricing";
import Stats from "./sections/Stats";
import Comparison from "./sections/Comparison";
import FAQSection from "./sections/FAQSection";
import CTA from "./sections/CTA";

export default function PaymentsPage() {
  return (
    <div>
      <Navbar />
      <Hero />
      <Pricing />
      <Stats />
      <Comparison />
      <FAQSection />
      <CTA />
      <Footer />
    </div>
  );
}
