import Icon from "./Icon";

export default function LandingFooter() {
  return (
    <footer className="bg-ink-deep text-white">
      <div className="max-w-[1240px] mx-auto px-6 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Icon name="logo-mark" size={26} />
          <span className="font-extrabold text-[16px]">BuildData</span>
        </div>
        <div className="text-[12px] text-white/55">
          © 2026 BuildData · La información de tu obra, ordenada en un solo lugar.
        </div>
        <div className="flex gap-6 text-[12px] font-semibold text-white/70">
          <a href="#funcionalidades" className="hover:text-accent">Producto</a>
          <a href="/payments" className="hover:text-accent">Planes</a>
          <a href="mailto:hola@buildata.app" className="hover:text-accent">Contacto</a>
        </div>
      </div>
    </footer>
  );
}
