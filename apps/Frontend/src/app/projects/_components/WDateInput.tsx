"use client";

import { useRef, useState, type RefObject } from "react";

interface Parts {
  d: string;
  m: string;
  y: string;
}

const EMPTY: Parts = { d: "", m: "", y: "" };

function parseISO(value?: string | null): Parts {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "");
  return match ? { y: match[1], m: match[2], d: match[3] } : EMPTY;
}

function toISO(parts: Parts): string {
  if (parts.d.length !== 2 || parts.m.length !== 2 || parts.y.length !== 4) return "";
  const d = Number(parts.d);
  const m = Number(parts.m);
  const y = Number(parts.y);
  if (y < 1900 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return "";
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return "";
  return `${parts.y}-${parts.m}-${parts.d}`;
}

function onlyDigits(raw: string, max: number): string {
  return raw.replace(/[^\d]/g, "").slice(0, max);
}

const LIMITS: Record<keyof Parts, number> = { d: 2, m: 2, y: 4 };

export function WDateInput({ value, onChange }: {
  value?: string | null;
  onChange: (iso: string) => void;
}) {
  const [parts, setParts] = useState<Parts>(() => parseISO(value));
  const dRef = useRef<HTMLInputElement>(null);
  const mRef = useRef<HTMLInputElement>(null);
  const yRef = useRef<HTMLInputElement>(null);

  const update = (key: keyof Parts, raw: string, next?: RefObject<HTMLInputElement | null>) => {
    let digits = onlyDigits(raw, LIMITS[key]);
    if ((key === "d" || key === "m") && digits.length === 1) {
      const maxFirst = key === "d" ? 3 : 1;
      if (Number(digits) > maxFirst) digits = "0" + digits;
    }
    const nextParts = { ...parts, [key]: digits };
    setParts(nextParts);
    onChange(toISO(nextParts));
    if (digits.length === LIMITS[key]) next?.current?.focus();
  };

  const seg = "bg-transparent border-0 outline-none text-[13px] text-slate-950 tnum placeholder:text-slate-400";

  return (
    <div className="flex items-center gap-[2px] bg-white border border-slate-200 rounded-md px-3 py-[9px] focus-within:border-primary transition-colors">
      <input
        ref={dRef}
        value={parts.d}
        onChange={(e) => update("d", e.target.value, mRef)}
        inputMode="numeric"
        placeholder="dd"
        aria-label="Día"
        className={`w-[22px] text-center ${seg}`}
      />
      <span className="text-slate-400">/</span>
      <input
        ref={mRef}
        value={parts.m}
        onChange={(e) => update("m", e.target.value, yRef)}
        onKeyDown={(e) => { if (e.key === "Backspace" && parts.m === "") dRef.current?.focus(); }}
        inputMode="numeric"
        placeholder="mm"
        aria-label="Mes"
        className={`w-[24px] text-center ${seg}`}
      />
      <span className="text-slate-400">/</span>
      <input
        ref={yRef}
        value={parts.y}
        onChange={(e) => update("y", e.target.value)}
        onKeyDown={(e) => { if (e.key === "Backspace" && parts.y === "") mRef.current?.focus(); }}
        inputMode="numeric"
        placeholder="aaaa"
        aria-label="Año"
        className={`w-[38px] text-center ${seg}`}
      />
    </div>
  );
}
