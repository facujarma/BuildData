// PhoneInput — split phone entry: country code (with circular flag) + area + number.
// Self-contained: keeps internal parts and emits a combined string via onChange,
// so it drops into forms that previously stored phone as a single string.
//
// Usage:
//   <PhoneInput value={phone} onChange={(full, parts) => setPhone(full)} />
//
// `value` may be a prior combined string (best-effort parsed) or empty.

const PHONE_COUNTRIES = [
  { code: '54',  cc: 'AR', name: 'Argentina' },
  { code: '598', cc: 'UY', name: 'Uruguay' },
  { code: '56',  cc: 'CL', name: 'Chile' },
  { code: '595', cc: 'PY', name: 'Paraguay' },
  { code: '591', cc: 'BO', name: 'Bolivia' },
  { code: '51',  cc: 'PE', name: 'Perú' },
  { code: '57',  cc: 'CO', name: 'Colombia' },
  { code: '55',  cc: 'BR', name: 'Brasil' },
  { code: '52',  cc: 'MX', name: 'México' },
  { code: '34',  cc: 'ES', name: 'España' },
  { code: '1',   cc: 'US', name: 'EE.UU.' },
];

// Simplified circular flags drawn as SVG — render identically on every OS
// (emoji flags fall back to 2-letter codes on Windows/some browsers).
const FLAG_SVG = {
  AR: (<g><rect width="24" height="24" fill="#fff"/><rect width="24" height="8" fill="#74ACDF"/><rect y="16" width="24" height="8" fill="#74ACDF"/><circle cx="12" cy="12" r="2.4" fill="#F6B40E"/></g>),
  UY: (<g><rect width="24" height="24" fill="#fff"/><rect y="3"  width="24" height="3" fill="#0038A8"/><rect y="9"  width="24" height="3" fill="#0038A8"/><rect y="15" width="24" height="3" fill="#0038A8"/><rect y="21" width="24" height="3" fill="#0038A8"/><rect width="9" height="9" fill="#fff"/><circle cx="4.5" cy="4.5" r="2.4" fill="#F6B40E"/></g>),
  CL: (<g><rect width="24" height="24" fill="#fff"/><rect y="12" width="24" height="12" fill="#D52B1E"/><rect width="9" height="12" fill="#0039A6"/><path d="M4.5 3l1.1 3.4H9L6.3 8.5l1 3.4-2.8-2.1L1.7 11.9l1-3.4L0 6.4h3.4z" fill="#fff"/></g>),
  PY: (<g><rect width="24" height="8" fill="#D52B1E"/><rect y="8" width="24" height="8" fill="#fff"/><rect y="16" width="24" height="8" fill="#0038A8"/></g>),
  BO: (<g><rect width="24" height="8" fill="#D52B1E"/><rect y="8" width="24" height="8" fill="#F9E300"/><rect y="16" width="24" height="8" fill="#007934"/></g>),
  PE: (<g><rect width="24" height="24" fill="#fff"/><rect width="8" height="24" fill="#D91023"/><rect x="16" width="8" height="24" fill="#D91023"/></g>),
  CO: (<g><rect width="24" height="12" fill="#FCD116"/><rect y="12" width="24" height="6" fill="#003893"/><rect y="18" width="24" height="6" fill="#CE1126"/></g>),
  BR: (<g><rect width="24" height="24" fill="#009B3A"/><path d="M12 3l9 9-9 9-9-9z" fill="#FEDF00"/><circle cx="12" cy="12" r="3.6" fill="#002776"/></g>),
  MX: (<g><rect width="24" height="24" fill="#fff"/><rect width="8" height="24" fill="#006847"/><rect x="16" width="8" height="24" fill="#CE1126"/></g>),
  ES: (<g><rect width="24" height="24" fill="#AA151B"/><rect y="6" width="24" height="12" fill="#F1BF00"/></g>),
  US: (<g><rect width="24" height="24" fill="#fff"/><rect width="24" height="3.4" fill="#B22234"/><rect y="6.8" width="24" height="3.4" fill="#B22234"/><rect y="13.6" width="24" height="3.4" fill="#B22234"/><rect y="20.4" width="24" height="3.4" fill="#B22234"/><rect width="11" height="13.6" fill="#3C3B6E"/></g>),
};

// Circular flag chip
const FlagDot = ({ cc, size = 20 }) => (
  <span style={{
    width: size, height: size, borderRadius: '999px', overflow: 'hidden',
    display: 'inline-flex', flex: 'none', boxShadow: 'inset 0 0 0 1px rgba(15,23,42,0.08)',
  }}>
    <svg viewBox="0 0 24 24" width={size} height={size} preserveAspectRatio="xMidYMid slice">
      {FLAG_SVG[cc] || <rect width="24" height="24" fill="#E2E8F0"/>}
    </svg>
  </span>
);

function PhoneInput({ value, onChange, autoFocus }) {
  // best-effort parse of an existing "+54 11 1234..." string
  const parse = (v) => {
    if (!v || typeof v !== 'string') return { code: '54', area: '', number: '' };
    const digits = v.replace(/[^\d]/g, '');
    const c = PHONE_COUNTRIES.find((x) => digits.startsWith(x.code));
    if (c) {
      const rest = digits.slice(c.code.length);
      return { code: c.code, area: rest.slice(0, 2), number: rest.slice(2) };
    }
    return { code: '54', area: '', number: digits };
  };

  const [parts, setParts] = React.useState(parse(value));
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);

  React.useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const emit = (next) => {
    setParts(next);
    const full = `+${next.code} ${next.area} ${next.number}`.replace(/\s+/g, ' ').trim();
    onChange && onChange(full, next);
  };

  const country = PHONE_COUNTRIES.find((c) => c.code === parts.code) || PHONE_COUNTRIES[0];

  return (
    <div className="flex gap-2">
      {/* Country code selector */}
      <div className="relative" ref={ref}>
        <button type="button" onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-[6px] bg-white border border-slate200 rounded-md pl-2 pr-2 py-[9px] text-[13px] focus:border-primary focus:outline-none hover:border-slate300 transition-colors h-full">
          <FlagDot cc={country.cc} />
          <span className="font-semibold text-slate950 tnum">+{country.code}</span>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate400"><path d="m6 9 6 6 6-6"/></svg>
        </button>
        {open && (
          <div className="absolute z-50 left-0 top-[44px] w-[220px] max-h-[260px] overflow-y-auto bg-white border border-slate200 rounded-lg shadow-pop py-1">
            {PHONE_COUNTRIES.map((c) => (
              <button key={c.code} type="button" onClick={() => { emit({ ...parts, code: c.code }); setOpen(false); }}
                className={`w-full flex items-center gap-[10px] px-3 py-[8px] text-left hover:bg-slate50 ${c.code === parts.code ? 'bg-primary-50' : ''}`}>
                <FlagDot cc={c.cc} size={22} />
                <span className="flex-1 text-[12px] font-semibold text-slate800">{c.name}</span>
                <span className="text-[11px] font-bold text-slate500 tnum">+{c.code}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Area code */}
      <input value={parts.area} autoFocus={autoFocus} inputMode="numeric"
        onChange={(e) => emit({ ...parts, area: e.target.value.replace(/[^\d]/g, '').slice(0, 4) })}
        placeholder="Cód. área" aria-label="Código de área"
        className="w-[88px] bg-white border border-slate200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none tnum" />

      {/* Number */}
      <input value={parts.number} inputMode="numeric"
        onChange={(e) => emit({ ...parts, number: e.target.value.replace(/[^\d]/g, '').slice(0, 10) })}
        placeholder="Número" aria-label="Número de teléfono"
        className="flex-1 min-w-0 bg-white border border-slate200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none tnum" />
    </div>
  );
}

Object.assign(window, { PhoneInput, PHONE_COUNTRIES });
