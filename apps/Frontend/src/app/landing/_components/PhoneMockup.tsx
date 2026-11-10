"use client";

import {
  Microphone,
  ChevronRight,
  Box,
  Sparkles,
  Check,
} from "@gravity-ui/icons";

interface PhoneMockupProps {
  width?: number;
  mode?: "incoming" | "processing" | "confirm" | "saved";
  headerName?: string;
}

export default function PhoneMockup({
  width = 320,
  mode = "confirm",
  headerName = "BuildData · Bot",
}: PhoneMockupProps) {
  const scale = width / 320;
  return (
    <div style={{ width, height: 640 * scale }} className="relative">
      <div style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}>
        <div className="w-[320px] h-[640px] bg-black rounded-[36px] p-[10px] shadow-big">
          <div className="w-full h-full bg-wabg rounded-[28px] overflow-hidden flex flex-col relative">
            <div className="bg-wa text-white pt-7 pb-[10px] px-3 flex items-center gap-2 flex-none">
              <ChevronRight width={14} height={14} className="rotate-180 opacity-70" />
              <div className="w-9 h-9 rounded-full bg-ink-deep flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 56 56" fill="none">
                  <rect width="56" height="56" rx="12" fill="#0F4395" />
                  <rect x="11" y="30" width="9" height="18" rx="2" fill="#FFFFFF" fillOpacity="0.85" />
                  <rect x="23" y="20" width="9" height="28" rx="2" fill="#FFFFFF" />
                  <rect x="35" y="10" width="9" height="38" rx="2" fill="#F59E0B" />
                </svg>
              </div>
              <div className="leading-tight">
                <div className="text-[13px] font-bold">{headerName}</div>
                <div className="text-[10px] text-white/70">en línea · responde en segundos</div>
              </div>
              <div className="ml-auto flex items-center gap-3 opacity-80">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24 11.36 11.36 0 003.58.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1 11.36 11.36 0 00.57 3.58 1 1 0 01-.25 1.01l-2.2 2.2z"/></svg>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
              </div>
            </div>

            <div className="flex-1 wa-bg p-[10px] overflow-hidden flex flex-col gap-[6px]">
              <div className="self-center bg-[rgba(225,245,254,.85)] text-[#54656F] text-[10px] font-semibold px-2 py-[3px] rounded">
                HOY
              </div>

              <div className="self-end bg-wabubble rounded-md rounded-tr-none px-2 py-[6px] shadow-sm max-w-[78%]">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-wa text-white flex items-center justify-center">
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                  </div>
                  <div className="flex-1 h-3 bg-[repeating-linear-gradient(90deg,#94A3B8_0_2px,transparent_2px_5px)] rounded-sm" />
                  <Microphone width={11} height={11} className="text-slate500" />
                  <span className="text-[9px] text-[#667781] font-semibold">0:14</span>
                </div>
                <div className="text-[8.5px] text-[#667781] text-right mt-[2px]">14:32 ✓✓</div>
              </div>

              {mode === "processing" && (
                <div className="self-start bg-white rounded-md rounded-tl-none px-2 py-[7px] shadow-sm max-w-[78%]">
                  <div className="flex items-center gap-2">
                    <Sparkles width={11} height={11} className="text-accent" />
                    <span className="text-[11px] font-semibold text-slate700">Analizando audio</span>
                    <span className="typing"><span /><span /><span /></span>
                  </div>
                </div>
              )}

              {(mode === "confirm" || mode === "saved") && (
                <div className="self-start bg-white rounded-md rounded-tl-none px-[10px] py-[8px] shadow-sm max-w-[82%]">
                  <div className="text-[11px] leading-[15px] text-slate950">
                    Anoté de tu audio:<br />
                    <span className="inline-flex items-center gap-1 mt-[3px]">
                      <Box width={10} height={10} className="text-primary" /> <b>12 bolsas de cemento Portland</b>
                    </span><br />
                    <span className="inline-flex items-center gap-1"><span className="w-2.5 text-center">👤</span>Reportado por J. Méndez</span>
                  </div>
                  {mode === "confirm" && (
                    <div className="text-[10.5px] text-slate700 mt-[6px]">¿Confirmás?</div>
                  )}
                  <div className="text-[8.5px] text-[#667781] text-right mt-[4px]">14:32</div>
                </div>
              )}

              {mode === "confirm" && (
                <div className="self-start flex flex-wrap gap-[5px] max-w-[82%]">
                  {["Sí, confirmar", "Corregir cantidad", "No es cemento"].map((l, i) => (
                    <button key={l}
                      className={`text-[10px] font-bold px-[10px] py-[6px] rounded-full border ${i === 0 ? "bg-primary text-white border-primary" : "bg-white text-primary border-slate300"}`}>
                      {l}
                    </button>
                  ))}
                </div>
              )}

              {mode === "saved" && (
                <>
                  <div className="self-end bg-wabubble rounded-md rounded-tr-none px-2 py-[5px] shadow-sm">
                    <div className="text-[11px]">Sí</div>
                    <div className="text-[8.5px] text-[#667781] text-right">14:33 ✓✓</div>
                  </div>
                  <div className="self-start bg-white rounded-md rounded-tl-none px-[10px] py-[7px] shadow-sm max-w-[82%]">
                    <div className="text-[11px] leading-[15px]">
                      <Check width={11} height={11} className="text-success inline" /> Listo. Lo cargué al pedido <b>#PED-0142</b>.<br />
                      Quedan <b>3 pedidos</b> pendientes de aprobación hoy.
                    </div>
                    <div className="text-[8.5px] text-[#667781] text-right mt-[3px]">14:33</div>
                  </div>
                </>
              )}
            </div>

            <div className="absolute bottom-[6px] left-[6px] right-[6px] flex gap-[5px] items-center">
              <div className="flex-1 bg-white rounded-full px-3 py-[6px] text-[11px] text-slate500 flex items-center gap-2">
                <span>😊</span><span>Mensaje</span>
              </div>
              <div className="w-[34px] h-[34px] rounded-full bg-wa text-white flex items-center justify-center">
                <Microphone width={14} height={14} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
