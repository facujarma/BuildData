// Profile page — personal info, role within the project, recent activity.
// Uses primitives from settings-page.jsx but is a self-contained screen.

const PROFILE_PEOPLE = {
  JM: { who: 'JM', first: 'Juan',   last: 'Méndez',  role: 'Director de obra', roleKey: 'director',   email: 'juan.mendez@constructora-norte.com.ar', phone: '+54 11 5234 8821', since: 'Marzo 2025',  bio: 'Director de obra con 12 años en construcción de edificios residenciales. Especializado en hormigón armado y coordinación de cuadrillas.', tasks: 14, reports: 38, orders: 22, alerts: 9 },
  CR: { who: 'CR', first: 'Carlos', last: 'Ríos',    role: 'Capataz',          roleKey: 'capataz',    email: 'carlos.rios@constructora-norte.com.ar',  phone: '+54 11 4487 1120', since: 'Marzo 2025',  bio: 'Capataz de obra. Coordina cuadrillas de movimiento de suelos y hormigón.', tasks: 7, reports: 22, orders: 2, alerts: 3 },
  PS: { who: 'PS', first: 'Pablo',  last: 'Salas',   role: 'Capataz',          roleKey: 'capataz',    email: 'pablo.salas@constructora-norte.com.ar',  phone: '+54 11 6690 4471', since: 'Abril 2025',  bio: 'Capataz a cargo de mampostería y terminaciones.', tasks: 9, reports: 31, orders: 1, alerts: 5 },
  LB: { who: 'LB', first: 'Lucía',  last: 'Benítez', role: 'Compras',          roleKey: 'compras',    email: 'lucia.benitez@constructora-norte.com.ar',phone: '+54 11 3312 7765', since: 'Marzo 2025',  bio: 'Responsable de compras y proveedores. Gestiona pedidos y comprobantes.', tasks: 4, reports: 18, orders: 19, alerts: 1 },
  MO: { who: 'MO', first: 'Marcos', last: 'Ortiz',   role: 'Capataz',          roleKey: 'capataz',    email: 'marcos.ortiz@constructora-norte.com.ar', phone: '+54 11 2245 9083', since: 'Mayo 2025',   bio: 'Capataz de instalaciones eléctricas y sanitarias.', tasks: 6, reports: 12, orders: 0, alerts: 2 },
  AG: { who: 'AG', first: 'Ana',    last: 'Gómez',   role: 'Arquitecta',       roleKey: 'arquitecto', email: 'ana.gomez@estudioag.com.ar',             phone: '+54 11 7781 3390', since: 'Marzo 2025',  bio: 'Arquitecta del proyecto. Revisa avance, planos y documentación técnica.', tasks: 3, reports: 9, orders: 0, alerts: 1 },
};

const PROFILE_PERMS = {
  director:   [['Aprobar pedidos de material',1,'Acción'],['Gestionar el cronograma',1,'Acción'],['Invitar y remover personas',1,'Administración'],['Ver costos y facturación',1,'Administración'],['Editar configuración de la obra',1,'Administración'],['Reportar avances desde WhatsApp',1,'Operativo']],
  capataz:    [['Aprobar pedidos de material',0,'Acción'],['Gestionar el cronograma',1,'Acción'],['Invitar y remover personas',0,'Administración'],['Ver costos y facturación',0,'Administración'],['Editar configuración de la obra',0,'Administración'],['Reportar avances desde WhatsApp',1,'Operativo']],
  compras:    [['Aprobar pedidos de material',1,'Acción'],['Gestionar el cronograma',0,'Acción'],['Invitar y remover personas',0,'Administración'],['Ver costos y facturación',1,'Administración'],['Editar configuración de la obra',0,'Administración'],['Reportar avances desde WhatsApp',1,'Operativo']],
  arquitecto: [['Aprobar pedidos de material',0,'Acción'],['Gestionar el cronograma',0,'Acción'],['Invitar y remover personas',0,'Administración'],['Ver costos y facturación',1,'Administración'],['Editar configuración de la obra',0,'Administración'],['Reportar avances desde WhatsApp',1,'Operativo']],
};

const PROFILE_ACTIVITY = {
  JM: [
    { ico: 'check',    tint: 'bg-success50 text-[#15803D]',   text: 'Marcó completada Hormigonado losa +3',   when: 'hoy 08:42' },
    { ico: 'package',  tint: 'bg-attention50 text-[#A16207]', text: 'Aprobó el pedido PED-0142 (Cemento)',    when: 'ayer 17:30' },
    { ico: 'alert',    tint: 'bg-critical50 text-[#B91C1C]',  text: 'Asignó técnico a falla de Grúa Torre 2', when: 'ayer 14:12' },
    { ico: 'users',    tint: 'bg-info50 text-[#1D4ED8]',      text: 'Invitó a M. Ortiz al equipo',            when: '12 May' },
    { ico: 'calendar', tint: 'bg-primary-50 text-primary',    text: 'Actualizó fechas del cronograma',        when: '08 May' },
  ],
  CR: [
    { ico: 'grid',     tint: 'bg-info50 text-[#1D4ED8]',      text: 'Subió 4 fotos del armado de columnas',   when: 'hoy 10:15' },
    { ico: 'check',    tint: 'bg-success50 text-[#15803D]',   text: 'Avanzó Cimentación pilotes al 100%',     when: 'ayer 09:20' },
    { ico: 'chart',    tint: 'bg-info50 text-[#1D4ED8]',      text: 'Envió el cierre de jornada',             when: 'ayer 18:40' },
  ],
  PS: [
    { ico: 'alert',    tint: 'bg-critical50 text-[#B91C1C]',  text: 'Reportó Falla en Grúa Torre 2',          when: 'hoy 12:48' },
    { ico: 'alert',    tint: 'bg-attention50 text-[#A16207]', text: 'Reportó cuadrilla incompleta',           when: 'ayer 16:20' },
    { ico: 'calendar', tint: 'bg-primary-50 text-primary',    text: 'Actualizó avance de Tabiquería interior', when: '18 Ago' },
  ],
  LB: [
    { ico: 'package',  tint: 'bg-attention50 text-[#A16207]', text: 'Aprobó el pedido PED-0142 (Cemento)',    when: 'hoy 09:15' },
    { ico: 'box',      tint: 'bg-success50 text-[#15803D]',   text: 'Cargó 120 bolsas de cemento al stock',   when: 'hoy 13:20' },
    { ico: 'receipt',  tint: 'bg-attention50 text-[#A16207]', text: 'Cargó el comprobante de Aceros Norte',   when: '18 Ago' },
  ],
  MO: [
    { ico: 'chart',    tint: 'bg-info50 text-[#1D4ED8]',      text: 'Envió el cierre de jornada',             when: 'ayer 18:05' },
    { ico: 'calendar', tint: 'bg-primary-50 text-primary',    text: 'Actualizó avance de Tendido eléctrico',  when: '17 Ago' },
  ],
  AG: [
    { ico: 'check',    tint: 'bg-success50 text-[#15803D]',   text: 'Resolvió Andamio sin protección',        when: 'ayer 11:30' },
    { ico: 'grid',     tint: 'bg-info50 text-[#1D4ED8]',      text: 'Revisó planos de fachada norte',         when: '16 Ago' },
  ],
};

const ProfilePage = () => {
  const [savedToast, setSavedToast] = React.useState(false);
  const flash = () => { setSavedToast(true); setTimeout(() => setSavedToast(false), 2200); };

  const pid = (new URLSearchParams(location.search).get('p') || 'JM').toUpperCase();
  const me = PROFILE_PEOPLE[pid] || PROFILE_PEOPLE.JM;
  const isSelf = me.who === 'JM';
  const perms = PROFILE_PERMS[me.roleKey] || PROFILE_PERMS.capataz;

  return (
    <>
      <DPageHeader
        title={isSelf ? 'Mi perfil' : 'Perfil de ' + me.first + ' ' + me.last}
        subtitle={isSelf ? 'Cómo te ven el resto del equipo y tu información personal.' : 'Perfil del miembro del equipo en Edificio Belgrano.'}
        right={!isSelf ? <DButton variant="secondary" size="sm" onClick={() => { location.href = 'Dashboard.html'; }}>← Volver al equipo</DButton> : null}
      />

      {/* Hero card */}
      <DCard padding="p-0" className="mb-4 overflow-hidden">
        <div className="blueprint-bg h-[120px] relative">
          <button className="absolute top-3 right-3 text-white/80 bg-white/10 hover:bg-white/20 backdrop-blur text-[11px] font-bold px-3 py-[5px] rounded-md">
            Cambiar portada
          </button>
        </div>
        <div className="px-6 pb-6 relative">
          <div className="flex items-end gap-4 -mt-12">
            <div className="relative flex-none">
              <div className="w-[96px] h-[96px] rounded-full bg-gradient-to-br from-primary to-accent ring-4 ring-white text-white text-[32px] font-extrabold flex items-center justify-center">
                {me.who}
              </div>
              <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-white border border-slate200 shadow-card flex items-center justify-center text-slate700">
                <Icon name="photo" size={14} />
              </button>
            </div>
            <div className="flex-1 min-w-0 pb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-[22px] font-extrabold display-tight text-white">{me.first} {me.last}</h2>
                <DPill tone="primary">{me.role.toUpperCase()}</DPill>
              </div>
              <div className="text-[13px] text-slate500 mt-[2px]">{me.email} · {me.phone}</div>
              <div className="text-[12px] text-slate600 mt-1">Edificio Belgrano · activo desde {me.since}</div>
            </div>
            <DButton variant="primary" size="md">{isSelf ? 'Editar perfil' : 'Enviar mensaje'}</DButton>
          </div>
        </div>
      </DCard>

      {/* Stats strip */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <DStatTile tone="primary"   label="Tareas asignadas"  value={me.tasks} icon="check" delta="3 vencen esta semana" />
        <DStatTile tone="info"      label="Reportes generados" value={me.reports} icon="message" delta="+12 este mes" deltaTone="success" />
        <DStatTile tone="attention" label="Pedidos aprobados"  value={me.orders} icon="package" />
        <DStatTile tone="success"   label="Alertas resueltas"  value={me.alerts} icon="check-circle" delta="100% del mes" deltaTone="success" />
      </div>

      <div className="grid grid-cols-[1.6fr_1fr] gap-4 items-start">
        {/* Personal info form */}
        <div>
          <SettingsCard
            title="Información personal"
            sub={isSelf ? 'Datos visibles para el resto del equipo.' : 'Datos de contacto de esta persona.'}
            footer={isSelf ? <><DButton variant="secondary" size="sm">Descartar</DButton><DButton variant="primary" size="sm" onClick={flash}>Guardar cambios</DButton></> : null}
          >
            <div className="grid grid-cols-2 gap-4">
              <Field label="Nombre"><Input key={me.who+'f'} defaultValue={me.first} disabled={!isSelf} /></Field>
              <Field label="Apellido"><Input key={me.who+'l'} defaultValue={me.last} disabled={!isSelf} /></Field>
              <Field label="Email" hint={isSelf ? 'Cambiarlo requiere reverificación.' : null}>
                <Input key={me.who+'e'} defaultValue={me.email} disabled={!isSelf} />
              </Field>
              <Field label="Teléfono" hint={isSelf ? 'Tu número en WhatsApp para reportar al bot.' : 'Número vinculado al bot de WhatsApp.'}>
                {isSelf ? <PhoneInput key={me.who+'p'} value={me.phone} onChange={() => {}} /> : <Input key={me.who+'p'} defaultValue={me.phone} disabled />}
              </Field>
              <Field label="Cargo" span={2}>
                <Select key={me.who+'r'} defaultValue={me.roleKey} disabled={!isSelf}>
                  <option value="director">Director de obra</option>
                  <option value="capataz">Capataz</option>
                  <option value="compras">Compras</option>
                  <option value="arquitecto">Arquitecto/a</option>
                  <option value="cliente">Cliente / propietario</option>
                </Select>
              </Field>
              <Field label="Sobre mí" span={2} hint={isSelf ? 'Una línea para que el equipo te conozca.' : null}>
                <Textarea key={me.who+'b'} defaultValue={me.bio} disabled={!isSelf} />
              </Field>
            </div>
          </SettingsCard>

          <SettingsCard title="Rol y permisos" sub={isSelf ? 'Lo que podés ver y hacer en esta obra.' : 'Lo que puede ver y hacer en esta obra, según su rol.'}>
            <div className="space-y-3">
              {perms.map(([label, on, perm]) => ({ label, on: !!on, perm })).map((p) => (
                <div key={p.label} className="flex items-center justify-between gap-3 py-1">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-none
                      ${p.on ? 'bg-success50 text-[#15803D]' : 'bg-slate100 text-slate500'}`}>
                      <Icon name={p.on ? 'check' : 'x'} size={12} />
                    </div>
                    <div className="text-[13px] font-semibold text-slate950">{p.label}</div>
                  </div>
                  <DPill tone="slate">{p.perm}</DPill>
                </div>
              ))}
            </div>
          </SettingsCard>
        </div>

        {/* Right column: activity */}
        <div>
          <DCard padding="p-0" className="mb-4">
            <div className="px-5 py-3 border-b border-slate200">
              <div className="text-[13px] font-bold">Actividad reciente</div>
              <div className="text-[11px] text-slate500 mt-[1px]">{isSelf ? 'Tus últimas acciones en BuildData.' : 'Últimas acciones de ' + me.first + ' en la obra.'}</div>
            </div>
            <div className="divide-y divide-slate100">
              {(PROFILE_ACTIVITY[me.who] || []).map((a, i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-3">
                  <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-none ${a.tint}`}>
                    <Icon name={a.ico} size={12} />
                  </div>
                  <div className="flex-1 min-w-0 text-[12px]">
                    <div className="text-slate800 leading-snug">{a.text}</div>
                    <div className="text-[10px] text-slate500 mt-[2px]">{a.when}</div>
                  </div>
                </div>
              ))}
            </div>
          </DCard>

          {isSelf && <DCard padding="p-0">
            <div className="px-5 py-3 border-b border-slate200">
              <div className="text-[13px] font-bold">Preferencias</div>
            </div>
            <div className="px-5 py-3 space-y-1">
              <Toggle on={true} onChange={() => {}}
                label="Mostrar mi avatar en reportes"
                hint="Tus iniciales aparecen junto a las acciones que hacés." />
              <Toggle on={false} onChange={() => {}}
                label="Modo compacto"
                hint="Reduce el padding de cards y tablas." />
              <Toggle on={true} onChange={() => {}}
                label="Tono de la interfaz claro"
                hint="Modo oscuro próximamente." />
            </div>
          </DCard>}
        </div>
      </div>

      {/* Save toast */}
      {savedToast && (
        <div className="fixed bottom-6 right-6 bg-slate950 text-white text-[13px] font-semibold rounded-lg px-4 py-3 flex items-center gap-2 shadow-pop z-50">
          <Icon name="check" size={14} className="text-success" />
          Cambios guardados
        </div>
      )}
    </>
  );
};

Object.assign(window, { ProfilePage });
