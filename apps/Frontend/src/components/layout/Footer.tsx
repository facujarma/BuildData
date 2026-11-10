import Link from "next/link";

function LogoIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 56 56" fill="none">
      <rect width="56" height="56" rx="12" fill="#0F4395" />
      <rect x="11" y="30" width="9" height="18" rx="2" fill="#FFFFFF" fillOpacity="0.85" />
      <rect x="23" y="20" width="9" height="28" rx="2" fill="#FFFFFF" />
      <rect x="35" y="10" width="9" height="38" rx="2" fill="#F59E0B" />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="bg-ink-deep text-white">
      <div className="max-w-[1240px] mx-auto px-6 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <LogoIcon />
          <span className="font-extrabold text-[16px]">BuildData</span>
        </div>
        <div className="text-[12px] text-white/55">
          © 2026 BuildData · La información de tu obra, ordenada en un solo lugar.
        </div>
        <div className="flex gap-6 text-[12px] font-semibold text-white/70">
          <Link href="/" className="hover:text-accent">Producto</Link>
          <Link href="/payments" className="hover:text-accent">Planes</Link>
          <a href="mailto:hola@buildata.app" className="hover:text-accent">Contacto</a>
        </div>
      </div>
    </footer>
  );
}
