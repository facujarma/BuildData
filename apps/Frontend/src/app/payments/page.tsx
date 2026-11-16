import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Hero from "./sections/Hero";
import DemoAviso from "./_components/DemoAviso";
import Pricing from "./sections/Pricing";
import Comparison from "./sections/Comparison";
import FAQSection from "./sections/FAQSection";
import CTA from "./sections/CTA";
import { DEMO_ACTIVO } from "./data/demo";

export default function PaymentsPage() {
  return (
    <div>
      <Navbar />
      <Hero />
      {DEMO_ACTIVO && <DemoAviso />}
      <Pricing />
      <Comparison />
      <FAQSection />
      <CTA />
      <Footer />
    </div>
  );
}
