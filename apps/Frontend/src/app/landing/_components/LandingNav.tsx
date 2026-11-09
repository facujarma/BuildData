"use client";

import { useEffect, useState } from "react";
import Icon from "./Icon";

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all ${
        scrolled ? "bg-white/85 backdrop-blur border-b border-slate200" : "bg-transparent"
      }`}
    >
      <div className="max-w-[1240px] mx-auto px-6 h-[68px] flex items-center justify-between">
        <a href="#" className="flex items-center gap-2">
          <Icon name="logo-mark" size={28} />
          <span className="text-[18px] font-extrabold display-tight">BuildData</span>
        </a>
        <div className="hidden md:flex items-center gap-7 text-[13px] font-semibold text-slate700">
          <a href="#problema" className="hover:text-primary">Problema</a>
          <a href="#how" className="hover:text-primary">Cómo funciona</a>
          <a href="#funcionalidades" className="hover:text-primary">Funcionalidades</a>
          <a href="#dashboard" className="hover:text-primary">Dashboard</a>
          <a href="#chatbot" className="hover:text-primary">IA</a>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/login"
            className="hidden sm:inline-flex items-center text-[13px] font-bold text-slate700 hover:text-primary px-3 py-2"
          >
            Ingresar
          </a>
          <a
            href="/payments"
            className="inline-flex items-center gap-1 bg-primary hover:bg-primary-700 text-white text-[13px] font-bold px-4 py-[10px] rounded-md shadow-card"
          >
            Pedir demo <Icon name="arrow-right" size={14} />
          </a>
        </div>
      </div>
    </nav>
  );
}
