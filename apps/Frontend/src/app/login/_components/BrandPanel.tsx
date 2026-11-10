import FakeMessageCard from "./FakeMessageCard";

export default function BrandPanel() {
  return (
    <div className="brand-panel relative flex flex-col p-10 lg:p-12 overflow-hidden">
      <div className="flex items-center gap-3 relative z-10">
        <div className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur flex items-center justify-center">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="13" width="4" height="8" rx="1" fill="#fff" fillOpacity="0.85" />
            <rect x="10" y="8" width="4" height="13" rx="1" fill="#fff" />
            <rect x="17" y="3" width="4" height="18" rx="1" fill="#F59E0B" />
          </svg>
        </div>
        <div className="text-[18px] font-extrabold tracking-tight">BuildData</div>
      </div>

      <div className="mt-16 max-w-[440px] relative z-10">
        <div className="text-[10px] tracking-[0.18em] uppercase font-bold text-accent mb-3">
          ◆ Para directores de obra
        </div>
        <h1 className="text-[36px] lg:text-[42px] font-extrabold leading-[1.05] tracking-tight text-white">
          La información de tu obra,<br />
          <span className="text-accent">ordenada</span> en un solo lugar.
        </h1>
        <p className="text-[15px] text-white/70 leading-relaxed mt-5">
          Tu equipo sigue reportando por WhatsApp. Nosotros transcribimos, clasificamos y organizamos todo en un panel claro y exportable.
        </p>
      </div>

      <div className="mt-10 lg:mt-12 relative z-10 max-w-[440px]">
        <div className="bg-white/[0.04] border border-white/10 rounded-xl p-4 backdrop-blur">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-success live-dot" />
            <span className="text-[10px] font-bold tracking-[0.08em] uppercase text-success">En vivo · hace 12 min</span>
          </div>
          <div className="space-y-2">
            <FakeMessageCard
              initials="PS"
              name="P. Salas"
              role="capataz Sector C"
              tag="CRÍTICO"
              tagVariant="critical"
              avatarGradient="from-accent to-critical"
            >
              &quot;Se rompió el motor de la grúa, no podemos seguir&quot;
            </FakeMessageCard>
            <FakeMessageCard
              initials="LB"
              name="L. Benítez"
              role="compras"
              tag="PEDIDO"
              tagVariant="accent"
              avatarGradient="from-primary to-success"
            >
              &quot;Pedile 200 ladrillos a San Pedro para el martes&quot;
            </FakeMessageCard>
          </div>
        </div>
      </div>
    </div>
  );
}
