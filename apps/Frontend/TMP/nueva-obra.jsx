// NuevaObra — multi-step wizard modal that opens from the "Nueva obra"
// buttons in Obras.html. 4 steps: básicos · ubicación · equipo · cronograma.
// Lateral progress rail on the left, content on the right, footer with
// back/next/create.

const TYPES = [
  { id: 'edificio',  name: 'Edificio en altura',     icon: 'chart',    sub: '8 rubros · ~120 tareas · 14 meses' },
  { id: 'vivienda',  name: 'Vivienda unifamiliar',   icon: 'grid',     sub: '6 rubros · ~60 tareas · 6 meses' },
  { id: 'refaccion', name: 'Refacción / remodelación', icon: 'package', sub: '4 rubros · ~30 tareas · 3 meses' },
  { id: 'comercial', name: 'Comercial / industrial', icon: 'truck',    sub: 'Custom · variable según proyecto' },
];

const DEFAULT_RUBROS = [
  'Hormigón armado',
  'Mampostería',
  'Instalaciones eléctricas',
  'Instalaciones sanitarias',
  'Terminaciones',
  'Carpintería',
];

const makeRubros = () => DEFAULT_RUBROS.map((name, i) => ({ id: 'r' + i + '-' + Date.now(), name, amount: '' }));

const fmtMoney = (n) => {
  const v = Number(n) || 0;
  return v.toLocaleString('es-AR');
};

const PEOPLE = [
  { id: 'JM', name: 'J. Méndez',  role: 'Director' },
  { id: 'CR', name: 'C. Ríos',    role: 'Capataz' },
  { id: 'PS', name: 'P. Salas',   role: 'Capataz' },
  { id: 'LB', name: 'L. Benítez', role: 'Compras' },
  { id: 'MO', name: 'M. Ortiz',   role: 'Capataz' },
  { id: 'AG', name: 'A. Gómez',   role: 'Arquitecta' },
];

// Other people already on BuildData (other obras / contactos), revealed under "más contactos"
const MORE_PEOPLE = [
  { id: 'RV', name: 'R. Vega',    role: 'Capataz' },
  { id: 'DC', name: 'D. Castro',  role: 'Compras' },
  { id: 'SF', name: 'S. Ferreyra',role: 'Arquitecto' },
  { id: 'NB', name: 'N. Brizuela',role: 'Capataz' },
  { id: 'LP', name: 'L. Paredes', role: 'Ingeniera' },
  { id: 'GT', name: 'G. Torres',  role: 'Seguridad e higiene' },
  { id: 'MA', name: 'M. Acosta',  role: 'Cliente' },
];

const STEPS = [
  { id: 1, label: 'Básicos',     sub: 'Nombre y tipo' },
  { id: 2, label: 'Ubicación',   sub: 'Dónde está' },
  { id: 3, label: 'Roles',       sub: 'Permisos por rol' },
  { id: 4, label: 'Equipo',      sub: 'Quién participa' },
  { id: 5, label: 'Cronograma',  sub: 'Fechas estimadas' },
  { id: 6, label: 'Cliente',     sub: 'Datos del cliente' },
  { id: 7, label: 'Presupuesto', sub: 'Total y rubros' },
];

// --- Small primitives -------------------------------------------------------

const WField = ({ label, hint, children, span = 1 }) => (
  <label className={`flex flex-col gap-[6px] col-span-${span}`}>
    <span className="text-[11px] font-bold text-slate700">{label}</span>
    {children}
    {hint && <span className="text-[11px] text-slate500 leading-snug">{hint}</span>}
  </label>
);

const WInput = (props) => (
  <input {...props}
    className={`bg-white border border-slate200 rounded-md px-3 py-[9px] text-[13px] text-slate950
      focus:border-primary focus:outline-none transition-colors ${props.className || ''}`} />
);

const WSelect = ({ children, ...props }) => (
  <select {...props}
    className={`bg-white border border-slate200 rounded-md px-3 py-[9px] text-[13px] text-slate950
      focus:border-primary focus:outline-none transition-colors ${props.className || ''}`}>
    {children}
  </select>
);

const WTextarea = (props) => (
  <textarea {...props}
    className={`bg-white border border-slate200 rounded-md px-3 py-[9px] text-[13px] text-slate950 min-h-[70px]
      focus:border-primary focus:outline-none transition-colors resize-y ${props.className || ''}`} />
);

const PickCard = ({ on, onClick, icon, name, sub, recommended, children }) => (
  <button type="button" onClick={onClick}
    className={`text-left bg-white rounded-lg border-2 p-4 transition-all relative
      ${on ? 'border-primary shadow-card2' : 'border-slate200 hover:border-slate300'}`}>
    {recommended && (
      <span className="absolute -top-2 left-3 bg-accent text-slate950 text-[9px] tracking-wider uppercase font-extrabold px-2 py-[2px] rounded">
        Recomendado
      </span>
    )}
    {icon && (
      <div className={`w-9 h-9 rounded-md flex items-center justify-center mb-3
        ${on ? 'bg-primary-50 text-primary' : 'bg-slate100 text-slate600'}`}>
        <Icon name={icon} size={16} />
      </div>
    )}
    <div className="text-[13px] font-bold text-slate950">{name}</div>
    <div className="text-[11px] text-slate500 leading-snug mt-[2px]">{sub}</div>
    {children}
    {on && (
      <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center">
        <Icon name="check" size={12} />
      </div>
    )}
  </button>
);

// --- Step components --------------------------------------------------------

const Step1 = ({ data, setData }) => (
  <div className="space-y-5">
    <div>
      <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate500 mb-3">Información básica</div>
      <div className="grid grid-cols-2 gap-4">
        <WField label="Nombre de la obra*" hint="Ej: Edificio Belgrano, Casa Villa Urquiza…" span={2}>
          <WInput value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} placeholder="Nombre que ve todo el equipo" />
        </WField>
        <WField label="Código interno" hint="Opcional · para referencias con proveedores.">
          <WInput value={data.code} onChange={(e) => setData({ ...data, code: e.target.value })} placeholder="OBR-2026-001" />
        </WField>
        <WField label="Estado inicial">
          <WSelect value={data.status} onChange={(e) => setData({ ...data, status: e.target.value })}>
            <option value="planificacion">En planificación</option>
            <option value="en-curso">En curso</option>
          </WSelect>
        </WField>
      </div>
    </div>

    <div>
      <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate500 mb-3">Tipo de obra*</div>
      <div className="grid grid-cols-2 gap-3">
        {TYPES.map((t) => (
          <PickCard key={t.id} on={data.type === t.id} onClick={() => setData({ ...data, type: t.id })}
            icon={t.icon} name={t.name} sub={t.sub} />
        ))}
      </div>
    </div>
  </div>
);

const Step2 = ({ data, setData }) => (
  <div className="space-y-5">
    <div>
      <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate500 mb-3">Dirección de obra</div>
      <div className="grid grid-cols-3 gap-4">
        <WField label="Dirección*" span={2}>
          <WInput value={data.address} onChange={(e) => setData({ ...data, address: e.target.value })} placeholder="Av. Belgrano 1842" />
        </WField>
        <WField label="Localidad">
          <WInput value={data.city} onChange={(e) => setData({ ...data, city: e.target.value })} placeholder="CABA" />
        </WField>
        <WField label="Provincia">
          <WInput value={data.province} onChange={(e) => setData({ ...data, province: e.target.value })} placeholder="Buenos Aires" />
        </WField>
        <WField label="Código postal">
          <WInput value={data.zip} onChange={(e) => setData({ ...data, zip: e.target.value })} placeholder="C1093" />
        </WField>
        <WField label="País">
          <WSelect value={data.country} onChange={(e) => setData({ ...data, country: e.target.value })}>
            <option value="ar">Argentina</option><option value="uy">Uruguay</option>
            <option value="cl">Chile</option><option value="mx">México</option>
          </WSelect>
        </WField>
      </div>
    </div>

    {/* Stylised mini map preview */}
    <div className="rounded-lg border border-slate200 overflow-hidden h-[160px] relative bg-slate100">
      <svg viewBox="0 0 600 160" className="w-full h-full">
        <rect width="600" height="160" fill="#EFF4FC"/>
        {[...Array(7)].map((_, i) => (
          <line key={'h'+i} x1="0" x2="600" y1={20 + i*22} y2={20 + i*22} stroke="#CBD5E1" strokeWidth="0.5"/>
        ))}
        {[...Array(14)].map((_, i) => (
          <line key={'v'+i} x1={i*44} x2={i*44} y1="0" y2="160" stroke="#CBD5E1" strokeWidth="0.5"/>
        ))}
        <path d="M0 90 L240 90 L240 50 L420 50 L420 120 L600 120" stroke="#94A3B8" strokeWidth="3" fill="none"/>
        <circle cx="300" cy="80" r="14" fill="#F59E0B"/>
        <circle cx="300" cy="80" r="6" fill="#fff"/>
      </svg>
      <div className="absolute bottom-3 left-3 bg-white rounded-md px-3 py-2 shadow-card text-[12px] font-bold text-slate950 flex items-center gap-2">
        <Icon name="alert" size={12} className="text-accent" />
        {data.address || 'Dirección de obra'}{data.city ? `, ${data.city}` : ''}
      </div>
    </div>

    <div className="bg-info50 border border-[#BFDBFE] rounded-lg p-4 flex items-start gap-3">
      <div className="w-7 h-7 rounded-full bg-info text-white flex items-center justify-center flex-none">
        <Icon name="info" size={13} />
      </div>
      <div className="text-[12px] text-slate700 leading-snug">
        Usamos la dirección para <b>georreferenciar fotos y reportes</b> que tu equipo manda por WhatsApp. Nunca compartimos esto con nadie.
      </div>
    </div>
  </div>
);

// Áreas sobre las que se definen permisos de cada rol.
const PERM_AREAS = [
  { id: 'cronograma',  label: 'Cronograma' },
  { id: 'pedidos',     label: 'Pedidos' },
  { id: 'stock',       label: 'Stock' },
  { id: 'recibos',     label: 'Recibos y gastos' },
  { id: 'presupuesto', label: 'Presupuesto' },
  { id: 'alertas',     label: 'Alertas' },
  { id: 'equipo',      label: 'Equipo' },
  { id: 'config',      label: 'Configuración' },
];
const perm = (view, edit) => ({ view, edit });
const allPerm = (view, edit) => Object.fromEntries(PERM_AREAS.map((a) => [a.id, perm(view, edit)]));

// Roles por defecto que trae cada obra nueva. El director es fijo (acceso total).
const makeRoles = () => ([
  { id: 'rl-dir',   name: 'Director de obra',      locked: true,  perms: allPerm(true, true) },
  { id: 'rl-cap',   name: 'Capataz',               locked: false, perms: { cronograma: perm(true, true), pedidos: perm(true, false), stock: perm(true, true), recibos: perm(false, false), presupuesto: perm(false, false), alertas: perm(true, true), equipo: perm(true, false), config: perm(false, false) } },
  { id: 'rl-com',   name: 'Compras',               locked: false, perms: { cronograma: perm(true, false), pedidos: perm(true, true), stock: perm(true, true), recibos: perm(true, true), presupuesto: perm(true, false), alertas: perm(true, false), equipo: perm(true, false), config: perm(false, false) } },
  { id: 'rl-arq',   name: 'Arquitecto/a',          locked: false, perms: { cronograma: perm(true, false), pedidos: perm(true, false), stock: perm(true, false), recibos: perm(false, false), presupuesto: perm(true, false), alertas: perm(true, false), equipo: perm(true, false), config: perm(false, false) } },
  { id: 'rl-cli',   name: 'Cliente / propietario', locked: false, perms: { cronograma: perm(true, false), pedidos: perm(false, false), stock: perm(false, false), recibos: perm(false, false), presupuesto: perm(true, false), alertas: perm(false, false), equipo: perm(false, false), config: perm(false, false) } },
]);

// Resumen corto de los permisos de un rol (para mostrar al lado del nombre).
const permSummary = (role) => {
  if (role.locked) return 'Acceso total';
  const areas = Object.values(role.perms);
  const edits = areas.filter((p) => p.edit).length;
  const views = areas.filter((p) => p.view).length;
  if (views === 0) return 'Sin acceso';
  if (edits === 0) return 'Solo lectura';
  if (edits >= PERM_AREAS.length - 1) return 'Acceso total';
  return `Edita ${edits} · ve ${views}`;
};

// Deriva un nombre legible a partir de un email (parte antes de @).

// Deriva un nombre legible a partir de un email (parte antes de @).
const nameFromEmail = (email) => {
  const local = (email.split('@')[0] || '').replace(/[._-]+/g, ' ').trim();
  return local.split(' ').filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join(' ') || email;
};
const initialsFromName = (name) => name.split(' ').map((w) => w[0]).join('').replace(/[^A-Za-zÀ-ÿ]/g, '').slice(0, 2).toUpperCase() || '?';
const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());

// ── Paso: Roles de la obra ──────────────────────────────────────────────────
const StepRoles = ({ data, setData }) => {
  const roles = data.roles || makeRoles();
  const [expanded, setExpanded] = React.useState(null);
  const [adding, setAdding] = React.useState(false);
  const [newName, setNewName] = React.useState('');

  const update = (next) => setData({ ...data, roles: next });
  const togglePerm = (roleId, areaId, kind) => {
    update(roles.map((r) => {
      if (r.id !== roleId || r.locked) return r;
      const cur = r.perms[areaId] || perm(false, false);
      let view = cur.view, edit = cur.edit;
      if (kind === 'view') { view = !view; if (!view) edit = false; }
      else { edit = !edit; if (edit) view = true; }
      return { ...r, perms: { ...r.perms, [areaId]: perm(view, edit) } };
    }));
  };
  const addRole = () => {
    const n = newName.trim();
    if (n.length < 2) return;
    update([...roles, { id: 'rl-' + Date.now().toString(36), name: n, locked: false, perms: allPerm(true, false) }]);
    setNewName(''); setAdding(false);
  };
  const removeRole = (id) => update(roles.filter((r) => r.id !== id));

  return (
    <div className="space-y-4">
      <div>
        <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate500">Roles de la obra</div>
        <div className="text-[11px] text-slate500 mt-[1px]">Definí qué puede <b>ver</b> y <b>editar</b> cada rol. Después se los asignás a las personas del equipo.</div>
      </div>

      <div className="space-y-2">
        {roles.map((r) => {
          const open = expanded === r.id;
          return (
            <div key={r.id} className="border border-slate200 rounded-lg overflow-hidden bg-white">
              <button type="button" onClick={() => setExpanded(open ? null : r.id)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate50 text-left">
                <span className="w-8 h-8 rounded-md bg-primary-50 text-primary flex items-center justify-center flex-none"><Icon name="users" size={15} /></span>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-bold text-slate950 flex items-center gap-2">
                    {r.name}
                    {r.locked && <span className="text-[9px] font-bold text-slate500 bg-slate100 rounded px-[5px] py-[1px]">FIJO</span>}
                  </div>
                  <div className="text-[11px] text-slate500">{permSummary(r)}</div>
                </div>
                {!r.locked && (
                  <span onClick={(e) => { e.stopPropagation(); removeRole(r.id); }}
                    className="text-slate400 hover:text-[#B91C1C] p-1 flex-none"><Icon name="trash" size={13} /></span>
                )}
                <Icon name={open ? 'chevron-up' : 'chevron-down'} size={14} className="text-slate400 flex-none" />
              </button>
              {open && (
                <div className="border-t border-slate200">
                  {r.locked ? (
                    <div className="px-4 py-3 text-[12px] text-slate500">El director de obra tiene acceso total y no se puede limitar.</div>
                  ) : (
                    <table className="w-full text-[12px]">
                      <thead>
                        <tr className="bg-slate50 text-[9px] tracking-[0.06em] uppercase text-slate500">
                          <th className="text-left font-bold px-4 py-2">Área</th>
                          <th className="font-bold px-2 py-2 w-[64px] text-center">Ver</th>
                          <th className="font-bold px-2 py-2 w-[64px] text-center">Editar</th>
                        </tr>
                      </thead>
                      <tbody>
                        {PERM_AREAS.map((a) => {
                          const p = r.perms[a.id] || perm(false, false);
                          return (
                            <tr key={a.id} className="border-t border-slate100">
                              <td className="px-4 py-[7px] font-semibold text-slate800">{a.label}</td>
                              <td className="px-2 py-[7px] text-center"><PermToggle on={p.view} onClick={() => togglePerm(r.id, a.id, 'view')} /></td>
                              <td className="px-2 py-[7px] text-center"><PermToggle on={p.edit} onClick={() => togglePerm(r.id, a.id, 'edit')} /></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {adding ? (
        <div className="flex items-center gap-2 border border-primary rounded-lg p-2 bg-primary-50/30">
          <input autoFocus value={newName} onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') addRole(); if (e.key === 'Escape') setAdding(false); }}
            placeholder="Nombre del rol (ej: Inspector, Jefe de seguridad)"
            className="flex-1 bg-white border border-slate200 rounded-md px-3 py-[9px] text-[13px] focus:border-primary focus:outline-none" />
          <DButton variant="primary" size="md" onClick={addRole} className={newName.trim().length < 2 ? 'opacity-50 pointer-events-none' : ''}>Crear</DButton>
          <button onClick={() => setAdding(false)} className="px-2 text-slate500 hover:text-slate950"><Icon name="x" size={16} /></button>
        </div>
      ) : (
        <button type="button" onClick={() => setAdding(true)}
          className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-slate300 rounded-lg py-3 text-[13px] font-bold text-primary hover:border-primary hover:bg-primary-50/40 transition-colors">
          <Icon name="plus" size={14} /> Crear rol nuevo
        </button>
      )}
    </div>
  );
};

const PermToggle = ({ on, onClick }) => (
  <button type="button" onClick={onClick}
    className={`w-[34px] h-[20px] rounded-full p-[2px] inline-flex transition-colors ${on ? 'bg-primary' : 'bg-slate300'}`}>
    <span className={`block w-[16px] h-[16px] rounded-full bg-white shadow transition-transform ${on ? 'translate-x-[14px]' : 'translate-x-0'}`} />
  </button>
);

const Step3 = ({ data, setData }) => {
  const [showMore, setShowMore] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [inviteRole, setInviteRole] = React.useState('Sin asignar');

  const invited = data.invited || [];
  const roleNames = ['Sin asignar', ...((data.roles || makeRoles()).map((r) => r.name))];
  const roleSummary = (name) => {
    if (name === 'Sin asignar') return 'Sin rol';
    const r = (data.roles || makeRoles()).find((x) => x.name === name);
    return r ? permSummary(r) : '';
  };

  const toggle = (p) => {
    const has = data.team.includes(p.id);
    if (has) {
      const roles = { ...(data.teamRoles || {}) };
      delete roles[p.id];
      setData({ ...data, team: data.team.filter((x) => x !== p.id), teamRoles: roles });
    } else {
      setData({ ...data, team: [...data.team, p.id], teamRoles: { ...(data.teamRoles || {}), [p.id]: 'Sin asignar' } });
    }
  };
  const setRole = (id, role) => setData({ ...data, teamRoles: { ...(data.teamRoles || {}), [id]: role } });

  const addByEmail = () => {
    const e = email.trim().toLowerCase();
    if (!isEmail(e)) return;
    if (invited.some((x) => x.email === e)) { setEmail(''); return; }
    const name = nameFromEmail(e);
    const id = 'inv-' + e;
    setData({
      ...data,
      invited: [...invited, { id, email: e, name, role: inviteRole }],
      team: [...data.team, id],
      teamRoles: { ...(data.teamRoles || {}), [id]: inviteRole },
    });
    setEmail('');
  };
  const removeInvited = (id) => {
    const roles = { ...(data.teamRoles || {}) }; delete roles[id];
    setData({ ...data, invited: invited.filter((x) => x.id !== id), team: data.team.filter((x) => x !== id), teamRoles: roles });
  };

  // Fila de la agenda (gente que ya está en BuildData)
  const Row = (p) => {
    const on = data.team.includes(p.id);
    const role = (data.teamRoles || {})[p.id] || 'Sin asignar';
    return (
      <div key={p.id} className={on ? 'bg-primary-50/30' : ''}>
        <button type="button" onClick={() => toggle(p)}
          className="w-full flex items-center gap-3 px-4 py-[10px] hover:bg-slate50 text-left">
          <DAvatar initials={p.id} size={32} />
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-bold text-slate950">{p.name}</div>
            <div className="text-[11px] text-slate500">{on ? role : p.role}</div>
          </div>
          <span className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-none
            ${on ? 'bg-primary border-primary text-white' : 'border-slate300 bg-white'}`}>
            {on && <Icon name="check" size={12} />}
          </span>
        </button>
        {on && (
          <div className="px-4 pb-3 pl-[60px] flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <span className="text-[11px] font-bold text-slate500 flex-none">Rol</span>
            <select value={role} onChange={(e) => setRole(p.id, e.target.value)}
              className={`flex-1 bg-white border rounded-md px-2 py-[6px] text-[12px] font-semibold focus:border-primary focus:outline-none ${role === 'Sin asignar' ? 'border-attention text-[#A16207]' : 'border-slate200'}`}>
              {roleNames.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <span className="text-[10px] font-bold text-primary bg-primary-50 rounded px-2 py-[4px] flex-none whitespace-nowrap">{roleSummary(role)}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <div>
        <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate500">Equipo con acceso a BuildData</div>
        <div className="text-[11px] text-slate500 mt-[1px] mb-3">Las personas que van a poder <b>ver o editar</b> la obra desde la app. <b>Solo podés invitar a personas que ya tengan una cuenta en BuildData.</b> Los obreros que solo reportan por WhatsApp se invitan aparte.</div>

        {/* Invitar por email (estilo Google Docs) */}
        <div className="bg-white border border-slate200 rounded-lg p-3 mb-3">
          <div className="text-[11px] font-bold text-slate700 mb-1">Invitar por email</div>
          <div className="text-[10px] text-slate500 mb-2">La persona ya debe tener una cuenta en BuildData con ese email.</div>
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 bg-white border border-slate200 rounded-md px-3 focus-within:border-primary transition-colors">
              <Icon name="message" size={14} className="text-slate400 flex-none" />
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="nombre@empresa.com"
                onKeyDown={(e) => e.key === 'Enter' && addByEmail()}
                className="flex-1 min-w-0 bg-transparent border-0 outline-none py-[9px] text-[13px] text-slate950 placeholder:text-slate400" />
            </div>
            <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}
              className="bg-white border border-slate200 rounded-md px-2 py-[9px] text-[12px] font-semibold focus:border-primary focus:outline-none flex-none">
              {roleNames.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <DButton variant="primary" size="md" onClick={addByEmail} className={!isEmail(email) ? 'opacity-50 pointer-events-none' : ''}>Invitar</DButton>
          </div>
          <div className="text-[11px] text-slate500 mt-2 leading-snug">Le llega una invitación por email con el rol que elijas. Si todavía no tiene cuenta, se crea al aceptar.</div>

          {/* Invitados por email recién agregados */}
          {invited.length > 0 && (
            <div className="mt-3 border-t border-slate100 pt-3 space-y-2">
              {invited.map((p) => (
                <div key={p.id} className="flex items-center gap-3">
                  <DAvatar initials={initialsFromName(p.name)} size={30} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-bold text-slate950 truncate">{p.name} <span className="text-[10px] font-bold text-[#A16207] bg-attention50 rounded px-[5px] py-[1px] align-middle">PENDIENTE</span></div>
                    <div className="text-[11px] text-slate500 truncate">{p.email}</div>
                  </div>
                  <select value={(data.teamRoles || {})[p.id] || 'Sin asignar'} onChange={(e) => setRole(p.id, e.target.value)}
                    className="bg-white border border-slate200 rounded-md px-2 py-[5px] text-[11px] font-semibold focus:border-primary focus:outline-none flex-none">
                    {roleNames.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <button type="button" onClick={() => removeInvited(p.id)} className="text-slate400 hover:text-[#B91C1C] p-1 flex-none"><Icon name="x" size={14} /></button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Agenda de contactos que ya están en BuildData */}
        <div className="flex items-end justify-between mb-2">
          <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate500">Desde tu agenda</div>
          <div className="text-[11px] text-slate600 font-semibold">{data.team.length} en el equipo</div>
        </div>
        <div className="bg-white border border-slate200 rounded-lg divide-y divide-slate100">
          {PEOPLE.map(Row)}

          {showMore && (
            <>
              <div className="px-4 py-2 bg-slate50 text-[10px] tracking-[0.06em] uppercase font-bold text-slate500">
                Otros contactos en BuildData
              </div>
              {MORE_PEOPLE.map(Row)}
            </>
          )}

          <button type="button" onClick={() => setShowMore((v) => !v)}
            className="w-full flex items-center gap-3 px-4 py-[10px] hover:bg-slate50 text-left text-primary">
            <div className="w-8 h-8 rounded-full border-2 border-dashed border-primary text-primary flex items-center justify-center">
              <Icon name={showMore ? 'chevron-up' : 'plus'} size={13} />
            </div>
            <div className="text-[13px] font-bold">
              {showMore ? 'Ocultar otros contactos' : `Ver más contactos de BuildData (${MORE_PEOPLE.length})`}
            </div>
          </button>
        </div>

        {/* Nota sobre obreros */}
        <div className="flex items-start gap-3 bg-slate50 border border-slate200 rounded-lg p-3 mt-3">
          <div className="w-7 h-7 rounded-full bg-[#25D366]/15 text-[#15803D] flex items-center justify-center flex-none">
            <Icon name="message" size={13} />
          </div>
          <div className="text-[12px] text-slate600 leading-snug">
            ¿Querés sumar <b>obreros</b> que solo reportan avances por WhatsApp (sin acceso a la app)? Los invitás con un link individual desde <b>Equipo</b>, una vez creada la obra.
          </div>
        </div>
      </div>
    </div>
  );
};

const Step4 = ({ data, setData }) => (
  <div className="space-y-5">
    <div>
      <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate500 mb-3">Fechas estimadas</div>
      <div className="grid grid-cols-2 gap-4">
        <WField label="Inicio de obra">
          <WInput type="date" value={data.startDate} onChange={(e) => setData({ ...data, startDate: e.target.value })} />
        </WField>
        <WField label="Fin estimado" hint="Opcional · podés definirlo después.">
          <WInput type="date" value={data.endDate} onChange={(e) => setData({ ...data, endDate: e.target.value })} />
        </WField>
      </div>
    </div>

    <div className="bg-info50 border border-[#BFDBFE] rounded-lg p-4 flex items-start gap-3">
      <div className="w-7 h-7 rounded-full bg-info text-white flex items-center justify-center flex-none">
        <Icon name="calendar" size={13} />
      </div>
      <div className="text-[12px] text-slate700 leading-snug">
        Después vas a poder cargar el <b>cronograma de tareas</b> completo desde la pantalla de Cronograma, creando las tareas a mano.
      </div>
    </div>
  </div>
);

// Step 5 — Datos del cliente
const Step5 = ({ data, setData }) => (
  <div className="space-y-5">
    <div>
      <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate500 mb-3">Datos del cliente</div>
      <div className="grid grid-cols-2 gap-4">
        <WField label="Nombre del cliente*" hint="Persona o razón social." span={2}>
          <WInput value={data.client.name} onChange={(e) => setData({ ...data, client: { ...data.client, name: e.target.value } })} placeholder="Ej: Inversiones Belgrano S.A." />
        </WField>
        <WField label="Persona de contacto">
          <WInput value={data.client.contact} onChange={(e) => setData({ ...data, client: { ...data.client, contact: e.target.value } })} placeholder="Ej: Marta Robles" />
        </WField>
        <WField label="CUIT / DNI">
          <WInput value={data.client.cuit} onChange={(e) => setData({ ...data, client: { ...data.client, cuit: e.target.value } })} placeholder="30-12345678-9" />
        </WField>
        <WField label="Email">
          <WInput type="email" value={data.client.email} onChange={(e) => setData({ ...data, client: { ...data.client, email: e.target.value } })} placeholder="cliente@empresa.com" />
        </WField>
        <WField label="Teléfono">
          <PhoneInput value={data.client.phone} onChange={(full) => setData({ ...data, client: { ...data.client, phone: full } })} />
        </WField>
        <WField label="Notas" span={2} hint="Condiciones, observaciones del cliente, etc.">
          <WTextarea value={data.client.notes} onChange={(e) => setData({ ...data, client: { ...data.client, notes: e.target.value } })} placeholder="Opcional" />
        </WField>
      </div>
    </div>
  </div>
);

// Step 6 — Presupuesto
const Step6 = ({ data, setData }) => {
  const total = Number(data.budgetTotal) || 0;
  const subtotal = data.rubros.reduce((a, r) => a + (Number(r.amount) || 0), 0);
  const over = total > 0 && subtotal > total;
  const remaining = total - subtotal;

  const setRubro = (id, patch) => setData({ ...data, rubros: data.rubros.map((r) => r.id === id ? { ...r, ...patch } : r) });
  const addRubro = () => setData({ ...data, rubros: [...data.rubros, { id: 'r-' + Date.now(), name: '', amount: '' }] });
  const delRubro = (id) => setData({ ...data, rubros: data.rubros.filter((r) => r.id !== id) });

  return (
    <div className="space-y-5">
      {/* Parte A — total */}
      <div>
        <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate500 mb-3">Presupuesto total de la obra</div>
        <WField label="Monto total*" hint="En pesos. Es la referencia para controlar gastos por rubro.">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] font-bold text-slate500">AR$</span>
            <WInput type="number" min="0" value={data.budgetTotal}
              onChange={(e) => setData({ ...data, budgetTotal: e.target.value })}
              placeholder="0" className="pl-12 tnum" />
          </div>
        </WField>
      </div>

      {/* Parte B — rubros */}
      <div>
        <div className="flex items-end justify-between mb-3">
          <div>
            <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate500">Presupuesto por rubro</div>
            <div className="text-[11px] text-slate500 mt-[1px]">Repartí el total entre los rubros de la obra.</div>
          </div>
          <button type="button" onClick={addRubro}
            className="inline-flex items-center gap-1 text-[12px] font-bold text-primary hover:underline">
            <Icon name="plus" size={13} /> Agregar rubro
          </button>
        </div>

        <div className="space-y-2">
          {data.rubros.map((r) => (
            <div key={r.id} className="grid grid-cols-[1fr_180px_32px] gap-2 items-center">
              <WInput value={r.name} onChange={(e) => setRubro(r.id, { name: e.target.value })} placeholder="Nombre del rubro" />
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] font-bold text-slate500">AR$</span>
                <WInput type="number" min="0" value={r.amount} onChange={(e) => setRubro(r.id, { amount: e.target.value })} placeholder="0" className="pl-11 tnum" />
              </div>
              <button type="button" onClick={() => delRubro(r.id)}
                className="w-8 h-8 rounded-md hover:bg-critical50 text-slate400 hover:text-[#B91C1C] flex items-center justify-center">
                <Icon name="x" size={14} />
              </button>
            </div>
          ))}
          {data.rubros.length === 0 && (
            <div className="text-center text-slate400 text-[12px] py-6 border border-dashed border-slate200 rounded-lg">
              Sin rubros. Agregá al menos uno.
            </div>
          )}
        </div>

        {/* Subtotal / control */}
        <div className={`mt-4 rounded-lg border p-4 ${over ? 'bg-critical50 border-[#FECACA]' : 'bg-paper border-slate200'}`}>
          <div className="flex items-center justify-between text-[12px] mb-2">
            <span className="text-slate600">Suma de rubros</span>
            <span className={`font-extrabold tnum ${over ? 'text-[#B91C1C]' : 'text-slate950'}`}>AR$ {fmtMoney(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-[12px] mb-2">
            <span className="text-slate600">Presupuesto total</span>
            <span className="font-bold tnum text-slate950">AR$ {fmtMoney(total)}</span>
          </div>
          <div className="h-px bg-slate200 my-2" />
          <div className="flex items-center justify-between text-[12px]">
            <span className="text-slate600">{remaining >= 0 ? 'Sin asignar' : 'Excedente'}</span>
            <span className={`font-extrabold tnum ${over ? 'text-[#B91C1C]' : remaining === 0 ? 'text-[#15803D]' : 'text-slate950'}`}>
              AR$ {fmtMoney(Math.abs(remaining))}
            </span>
          </div>

          {/* Allocation bar */}
          {total > 0 && (
            <div className="mt-3 h-[8px] bg-slate100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${over ? 'bg-critical' : 'bg-primary'}`}
                style={{ width: Math.min(100, (subtotal / total) * 100) + '%' }} />
            </div>
          )}

          {over && (
            <div className="mt-3 flex items-start gap-2 text-[12px] text-[#B91C1C] font-semibold">
              <Icon name="alert" size={14} className="mt-[1px] flex-none" />
              La suma de rubros supera el presupuesto total por AR$ {fmtMoney(subtotal - total)}.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Wizard shell -----------------------------------------------------------

const NuevaObraModal = ({ open, onClose }) => {
  const [step, setStep] = React.useState(1);
  const [created, setCreated] = React.useState(false);
  const [data, setData] = React.useState({
    name: '', code: '', status: 'planificacion', type: '',
    address: '', city: '', province: '', zip: '', country: 'ar',
    roles: makeRoles(),
    team: ['JM'], teamRoles: { JM: 'Director de obra' },
    startDate: '', endDate: '',
    client: { name: '', contact: '', cuit: '', email: '', phone: '', notes: '' },
    budgetTotal: '', rubros: makeRubros(),
  });

  // Reset when opening
  React.useEffect(() => {
    if (open) { setStep(1); setCreated(false); }
  }, [open]);

  // Esc to close
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const budgetTotal = Number(data.budgetTotal) || 0;
  const budgetSum = data.rubros.reduce((a, r) => a + (Number(r.amount) || 0), 0);
  const canNext = ({
    1: data.name.trim() && data.type,
    2: data.address.trim(),
    3: true,
    4: true,
    5: true,
    6: data.client.name.trim(),
    7: budgetTotal > 0 && budgetSum <= budgetTotal,
  })[step];

  const next = () => {
    if (step < STEPS.length) setStep(step + 1);
    else setCreated(true);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate950/60 backdrop-blur-sm animate-modal-in">
      <div className="bg-white w-full max-w-[900px] max-h-[calc(100vh-32px)] rounded-2xl shadow-big overflow-hidden flex flex-col">

        {created ? (
          <SuccessState data={data} onClose={onClose} />
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate200 flex-none">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-md bg-primary-50 text-primary flex items-center justify-center">
                  <Icon name="plus" size={16} />
                </div>
                <div>
                  <div className="text-[15px] font-extrabold display-tight">Crear nueva obra</div>
                  <div className="text-[11px] text-slate500">Paso {step} de {STEPS.length} · {STEPS[step - 1].label}</div>
                </div>
              </div>
              <button onClick={onClose}
                className="w-8 h-8 rounded-md hover:bg-slate100 text-slate500 hover:text-slate950 flex items-center justify-center">
                <Icon name="x" size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="flex flex-1 min-h-0 overflow-hidden">
              {/* Left rail */}
              <div className="w-[220px] bg-slate50 border-r border-slate200 p-4 flex flex-col gap-1 flex-none">
                {STEPS.map((s) => {
                  const isDone = s.id < step;
                  const isCurrent = s.id === step;
                  return (
                    <button key={s.id} type="button" onClick={() => isDone && setStep(s.id)}
                      className={`flex items-start gap-3 px-3 py-[10px] rounded-md text-left transition-colors
                        ${isCurrent ? 'bg-white shadow-card border border-slate200' : 'border border-transparent'}
                        ${isDone ? 'hover:bg-white cursor-pointer' : !isCurrent ? 'opacity-60 cursor-default' : ''}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-none
                        ${isDone ? 'bg-success text-white' : isCurrent ? 'bg-primary text-white' : 'bg-slate200 text-slate600'}`}>
                        {isDone ? <Icon name="check" size={12} /> : s.id}
                      </div>
                      <div className="min-w-0">
                        <div className={`text-[12px] font-bold leading-tight ${isCurrent ? 'text-slate950' : 'text-slate700'}`}>{s.label}</div>
                        <div className="text-[10px] text-slate500 leading-snug mt-[1px]">{s.sub}</div>
                      </div>
                    </button>
                  );
                })}

                <div className="mt-auto pt-3">
                  <div className="bg-white border border-slate200 rounded-md p-3 text-[11px] text-slate600 leading-snug">
                    <div className="flex items-center gap-1 font-bold text-slate950 mb-1">
                      <Icon name="info" size={12} className="text-primary" /> Podés editar todo después.
                    </div>
                    Ningún paso es definitivo. Cambiás equipo, fechas o cronograma cuando quieras.
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {step === 1 && <Step1 data={data} setData={setData} />}
                {step === 2 && <Step2 data={data} setData={setData} />}
                {step === 3 && <StepRoles data={data} setData={setData} />}
                {step === 4 && <Step3 data={data} setData={setData} />}
                {step === 5 && <Step4 data={data} setData={setData} />}
                {step === 6 && <Step5 data={data} setData={setData} />}
                {step === 7 && <Step6 data={data} setData={setData} />}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate200 px-6 py-3 flex items-center justify-between bg-slate50 flex-none">
              <button onClick={onClose}
                className="text-[12px] font-bold text-slate600 hover:text-slate950 px-3 py-[8px]">
                Cancelar
              </button>
              <div className="flex items-center gap-2">
                {step > 1 && (
                  <button onClick={() => setStep(step - 1)}
                    className="text-[13px] font-bold bg-white hover:bg-slate100 text-slate700 border border-slate300 rounded-md px-4 py-[9px]">
                    Atrás
                  </button>
                )}
                <button onClick={next} disabled={!canNext}
                  className={`inline-flex items-center gap-2 text-[13px] font-bold rounded-md px-4 py-[9px] transition-colors
                    ${canNext ? 'bg-primary hover:bg-primary-700 text-white' : 'bg-slate200 text-slate500 cursor-not-allowed'}`}>
                  {step === STEPS.length ? <>Crear obra <Icon name="check" size={14} /></> : <>Siguiente <Icon name="arrow-right" size={14} /></>}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// --- Success state ----------------------------------------------------------

const SuccessState = ({ data, onClose }) => (
  <div className="flex flex-col">
    <div className="blueprint-bg px-8 py-10 text-center text-white relative overflow-hidden">
      <div className="w-16 h-16 rounded-full bg-success text-white flex items-center justify-center mx-auto mb-4 ring-4 ring-success/30">
        <Icon name="check" size={28} />
      </div>
      <h2 className="text-[26px] font-extrabold display-tight leading-tight">¡Tu obra está creada!</h2>
      <p className="text-[14px] text-white/70 mt-2 max-w-[480px] mx-auto leading-snug">
        <b className="text-white">{data.name}</b> ya está lista. Invitamos por email al equipo que cargaste; entrá al dashboard para empezar a gestionarla.
      </p>
    </div>

    <div className="p-8">
      <div className="text-[10px] tracking-[0.06em] uppercase font-bold text-slate500 mb-3">Resumen</div>
      <div className="grid grid-cols-2 gap-y-2 gap-x-6 text-[13px]">
        <div className="text-slate500">Nombre</div><div className="font-bold text-slate950 text-right truncate">{data.name || '—'}</div>
        <div className="text-slate500">Tipo</div><div className="font-bold text-slate950 text-right">{TYPES.find((t) => t.id === data.type)?.name || '—'}</div>
        <div className="text-slate500">Ubicación</div><div className="font-bold text-slate950 text-right truncate">{data.address ? `${data.address}${data.city ? ', ' + data.city : ''}` : '—'}</div>
        <div className="text-slate500">Equipo</div><div className="font-bold text-slate950 text-right">{data.team.length} persona{data.team.length === 1 ? '' : 's'}</div>
        <div className="text-slate500">Cliente</div><div className="font-bold text-slate950 text-right truncate">{data.client.name || '—'}</div>
        <div className="text-slate500">Presupuesto</div><div className="font-bold text-slate950 text-right tnum">AR$ {fmtMoney(data.budgetTotal)}</div>
      </div>
    </div>

    <div className="border-t border-slate200 px-8 py-4 flex items-center justify-between bg-slate50">
      <button onClick={onClose} className="text-[12px] font-bold text-slate600 hover:text-slate950">Más tarde</button>
      <a href="Dashboard.html" className="inline-flex items-center gap-2 text-[13px] font-bold bg-primary hover:bg-primary-700 text-white rounded-md px-4 py-[9px]">
        Ir al dashboard <Icon name="arrow-right" size={14} />
      </a>
    </div>
  </div>
);

Object.assign(window, { NuevaObraModal });
