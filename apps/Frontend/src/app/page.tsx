import type { Metadata } from "next";
import LandingNav from "./landing/_components/LandingNav";
import LandingFooter from "./landing/_components/LandingFooter";
import Hero from "./landing/sections/Hero";
import Problema from "./landing/sections/Problema";
import HowItWorks from "./landing/sections/HowItWorks";
import Funcionalidades from "./landing/sections/Funcionalidades";
import DashboardSection from "./landing/sections/DashboardSection";
import ChatbotSection from "./landing/sections/ChatbotSection";
import Beneficios from "./landing/sections/Beneficios";
import Testimonios from "./landing/sections/Testimonios";
import FAQSection from "./landing/sections/FAQSection";
import CTA from "./landing/sections/CTA";

export const metadata: Metadata = {
  title: "BuildData — La información de tu obra, ordenada en un solo lugar.",
  description:
    "BuildData junta los audios, fotos y mensajes que tu equipo ya manda por WhatsApp y los ordena en un solo panel: avance, pedidos, costos y alertas de cada obra.",
};

export default function Home() {
  return (
    <div className="min-h-screen bg-paper overflow-x-clip">
      <LandingNav />
      <Hero />
      <Problema />
      <HowItWorks />
      <Funcionalidades />
      <DashboardSection />
      <ChatbotSection />
      <Beneficios />
      <Testimonios />
      <FAQSection />
      <CTA />
      <LandingFooter />
    </div>
  );
}
