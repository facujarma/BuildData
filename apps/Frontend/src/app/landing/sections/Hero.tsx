import Icon from "../_components/Icon";
import PhoneMockup from "../_components/PhoneMockup";
import { LOGOS } from "../data/landing";

const FACES = [
  ["JM", "from-primary to-info"],
  ["AG", "from-info to-primary"],
  ["CR", "from-[#F59E0B] to-[#EF4444]"],
  ["LB", "from-primary to-[#22C55E]"],
  ["PS", "from-[#EF4444] to-[#F59E0B]"],
  ["MO", "from-[#22C55E] to-info"],
];

export default function Hero() {
  return (
    <section className="relative bg-white overflow-hidden">
      <div className="bd-dots bd-dots-hero" aria-hidden="true" />
      <div className="relative max-w-[1180px] mx-auto px-6 pt-[92px] pb-14 text-center">
        {/* Prueba social */}
        <div className="flex flex-col items-center gap-2 mb-7 animate-fadein">
          <div className="flex -space-x-2">
            {FACES.map(([initials, gradient]) => (
              <span
                key={initials}
                className={
                  "w-7 h-7 rounded-full ring-2 ring-white bg-gradient-to-br text-white text-[9px] font-extrabold flex items-center justify-center " +
                  gradient
                }
              >
                {initials}
              </span>
            ))}
          </div>
          <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-slate500">
            +120 constructoras y estudios
          </span>
        </div>

        <h1 className="text-[clamp(38px,5.6vw,72px)] leading-[1.05] font-bold display-tight text-slate950 max-w-[980px] mx-auto mb-6 animate-fadein-1">
          Tu equipo ya lo cuenta por WhatsApp. Nosotros lo ordenamos.
        </h1>

        <p className="text-[18px] leading-[1.6] text-slate600 max-w-[680px] mx-auto mb-9 animate-fadein-2">
          BuildData junta los audios, fotos y mensajes que tu equipo ya manda por WhatsApp y los
          ordena en un solo panel: avance, pedidos, costos y alertas de cada obra.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 animate-fadein-3">
          <a
            href="/payments"
            className="inline-flex items-center bg-primary hover:bg-primary-700 text-white font-bold text-[15px] px-7 py-[14px] rounded-full transition-colors"
          >
            Probar gratis 14 días
          </a>
          <a
            href="#dashboard"
            className="inline-flex items-center bg-white hover:bg-primary-50 text-primary border border-slate200 font-bold text-[15px] px-7 py-[14px] rounded-full transition-colors"
          >
            Ver el panel por dentro
          </a>
        </div>
      </div>

      {/* Producto sobre una franja de ciudad */}
      <div className="relative">
        <div
          className="absolute inset-x-0 top-0 h-[260px] bg-gradient-to-b from-[#EEF3FB] to-white overflow-hidden"
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 1440 260"
            preserveAspectRatio="xMidYMax slice"
            className="absolute inset-0 w-full h-full"
          >
            <g fill="#0F4395">
              {[
                [40, 120, 70], [130, 80, 60], [210, 140, 50], [280, 60, 80],
                [380, 110, 55], [460, 40, 70], [560, 130, 60], [640, 90, 75],
                [740, 150, 50], [810, 70, 65], [900, 120, 60], [980, 50, 80],
                [1080, 140, 55], [1160, 90, 70], [1250, 130, 60], [1330, 70, 75],
              ].map(([x, h, w], i) => (
                <rect
                  key={i}
                  x={x}
                  y={260 - h}
                  width={w}
                  height={h}
                  rx="3"
                  opacity={0.05 + (i % 3) * 0.025}
                />
              ))}
            </g>
            <g stroke="#0F4395" strokeWidth="2" opacity="0.12" fill="none">
              <path d="M1120 260 V60 M1060 64 H1220 M1120 64 L1090 90 M1120 64 L1150 90 M1200 64 V104" />
            </g>
          </svg>
        </div>

        <div className="relative max-w-[1100px] mx-auto px-6 pt-16 pb-6 animate-fadein-4">
          <div className="bg-white rounded-2xl border border-slate200 shadow-[0_30px_80px_-30px_rgba(15,23,42,.35)] overflow-hidden">
            <div className="flex items-center gap-2 px-4 h-10 border-b border-slate200 bg-slate50">
              <span className="w-[10px] h-[10px] rounded-full bg-[#FF5F57]" />
              <span className="w-[10px] h-[10px] rounded-full bg-[#FEBC2E]" />
              <span className="w-[10px] h-[10px] rounded-full bg-[#28C840]" />
              <div className="flex-1 flex justify-center">
                <span className="text-[11px] text-slate500 bg-white border border-slate200 rounded-md px-3 py-[3px]">
                  app.buildata.com.ar/obras/belgrano
                </span>
              </div>
            </div>
            <HeroProduct />
          </div>
          <div className="hidden lg:block absolute -right-2 bottom-[-40px] z-10">
            <PhoneMockup width={230} mode="confirm" />
          </div>
        </div>
      </div>

      {/* Logos */}
      <div className="max-w-[1180px] mx-auto px-6 pt-20 pb-6">
        <div className="text-center text-[12px] font-semibold text-slate500 mb-6">
          Equipos de obra que ya trabajan así
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-x-8 gap-y-4 items-center justify-items-center opacity-60">
          {LOGOS.map((logo) => (
            <div
              key={logo}
              className="text-[13px] font-extrabold tracking-[0.08em] text-slate600 whitespace-nowrap"
            >
              {logo}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Panel del producto para el hero: fluido (se adapta al ancho del marco) y
// con la navegación actual de la app.
function HeroProduct() {
  const nav: Array<[string, string, boolean?, (string | number)?]> = [
    ["grid", "Dashboard", true],
    ["message", "Bandeja", false, 3],
    ["calendar", "Cronograma"],
    ["alert", "Alertas", false, 2],
    ["box", "Materiales"],
    ["dollar", "Costos"],
    ["chart", "Registro"],
    ["users", "Equipo"],
  ];

  return (
    <div className="flex text-left">
      <div className="hidden sm:flex w-[190px] flex-none bg-ink-deep text-white flex-col py-4 px-3">
        <div className="flex items-center gap-2 px-2 mb-4">
          <Icon name="logo-mark" size={22} />
          <span className="text-[13px] font-extrabold">BuildData</span>
        </div>
        <div className="bg-white/[0.06] rounded-lg px-3 py-2 mb-3">
          <div className="text-[9px] tracking-[0.06em] uppercase font-bold text-white/50">
            Obra activa
          </div>
          <div className="text-[12px] font-bold">Edificio Belgrano</div>
        </div>
        {nav.map(([icon, label, active, badge]) => (
          <div
            key={label}
            className={
              "flex items-center gap-2 px-2 py-[7px] rounded-md text-[12px] font-semibold " +
              (active ? "bg-white/10 text-white" : "text-white/60")
            }
          >
            <Icon name={icon} size={14} className={active ? "text-accent" : ""} />
            <span className="flex-1">{label}</span>
            {badge && (
              <span
                className={
                  "text-[9px] font-bold rounded-full px-[6px] " +
                  (label === "Alertas" ? "bg-critical" : "bg-white/20")
                }
              >
                {badge}
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="flex-1 min-w-0 bg-paper p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="min-w-0">
            <div className="text-[16px] font-extrabold display-tight text-slate950">Dashboard</div>
            <div className="text-[11px] text-slate500 truncate">
              Edificio Belgrano · actualizado hace 12 min
            </div>
          </div>
          <span className="text-[11px] font-bold text-white bg-primary rounded-md px-3 py-[6px] flex-none">
            + Nuevo
          </span>
        </div>

        <div className="text-[10px] tracking-[0.08em] uppercase font-bold text-slate600 mb-2">
          Requiere tu atención
        </div>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            ["3", "mensajes por confirmar", "bg-primary text-white", "bg-white border-slate200"],
            ["3", "pedidos por aprobar", "bg-accent text-slate950", "bg-attention50 border-[#FDE68A]"],
            ["2", "alertas sin atender", "bg-critical text-white", "bg-critical50 border-[#FECACA]"],
          ].map(([n, label, badge, box]) => (
            <div
              key={label}
              className={"border rounded-lg p-3 flex items-center gap-2 min-w-0 " + box}
            >
              <span
                className={
                  "w-8 h-8 rounded-md font-extrabold text-[14px] tnum flex items-center justify-center flex-none " +
                  badge
                }
              >
                {n}
              </span>
              <span className="text-[11px] font-bold text-slate900 leading-tight min-w-0">
                {label}
              </span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-[1.3fr_1fr] gap-3">
          <div className="bg-white border border-slate200 rounded-lg p-4 min-w-0">
            <div className="text-[12px] font-bold text-slate950 mb-3">Avance por rubro</div>
            {[
              ["Mampostería", 88, "#22C55E"],
              ["Hormigón armado", 62, "#0F4395"],
              ["Instalaciones", 46, "#3B82F6"],
              ["Terminaciones", 24, "#F59E0B"],
            ].map(([name, pct, color]) => (
              <div
                key={name}
                className="grid grid-cols-[minmax(0,110px)_1fr_34px] gap-2 items-center py-[5px]"
              >
                <span className="text-[11px] text-slate700 truncate">{name}</span>
                <span className="h-[6px] bg-slate100 rounded-full overflow-hidden">
                  <span
                    className="block h-full rounded-full"
                    style={{ width: pct + "%", background: color }}
                  />
                </span>
                <span className="text-[11px] font-bold text-right tnum">{pct}%</span>
              </div>
            ))}
          </div>
          <div className="bg-white border border-slate200 rounded-lg p-4 min-w-0">
            <div className="text-[12px] font-bold text-slate950 mb-3">Llega esta semana</div>
            {[
              ["Hierro 12 mm · 2,5 t", "En camino", "bg-info50 text-[#1D4ED8]"],
              ["Ladrillo 18×18", "Aprobado", "bg-primary-50 text-primary"],
              ["Arena fina · 15 m³", "Demorado", "bg-critical50 text-[#B91C1C]"],
            ].map(([material, status, tone]) => (
              <div
                key={material}
                className="flex items-center justify-between gap-2 py-[6px] border-b border-slate100 last:border-b-0"
              >
                <span className="text-[11px] font-semibold text-slate800 truncate">{material}</span>
                <span className={"text-[9px] font-bold rounded px-[6px] py-[2px] flex-none " + tone}>
                  {status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
