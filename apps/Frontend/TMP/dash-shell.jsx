// DashAppShell — sidebar + topbar wrapper used by Configuración and Perfil
// pages. The dashboard's primary nav items are kept for orientation but
// nothing is "active" — the breadcrumb identifies the secondary route.
// A user menu in the topbar offers links between settings/profile/logout.

const DashAppShell = ({ crumb, current, children, userMenu = true, userInitials = 'JM', userName = 'J. Méndez', userRole = 'Director de obra' }) => {
  const navigateMain = (id) => {
    // Going back to a primary dashboard screen — encode in URL hash.
    window.location.href = `Dashboard.html#${id}`;
  };

  return (
    <div style={{ height: '100vh' }} className="flex bg-paper overflow-hidden">
      <DashSidebar
        current={current /* 'settings' or 'profile' — no match → none active */}
        onNav={navigateMain}
        userInitials={userInitials}
        userName={userName}
        userRole={userRole}
      />
      <div className="flex-1 min-w-0 flex flex-col">
        <DashTopBarExt crumb={crumb} userInitials={userInitials} userName={userName} userRole={userRole} userMenu={userMenu} />
        <main className="flex-1 overflow-y-auto bg-paper">
          <div className="p-6 max-w-[1100px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

// Extended topbar with a working avatar dropdown linking the secondary
// routes (Perfil, Configuración, Cerrar sesión).
const DashTopBarExt = ({ crumb, userInitials, userName, userRole, userMenu }) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <header className="h-[52px] px-5 border-b border-slate200 bg-white/85 backdrop-blur flex items-center gap-3 flex-none">
      <div className="text-[12px] text-slate500">
        Obra Belgrano <span className="mx-2 text-slate300">/</span>
        <b className="text-slate950">{crumb}</b>
      </div>
      <div className="flex-1" />
      <div className="hidden md:flex items-center gap-2 w-[260px] bg-slate50 border border-slate200 rounded-md px-3 py-[6px] text-[12px] text-slate500">
        <Icon name="search" size={14} />
        <span>Buscar tareas, pedidos, personas…</span>
        <span className="ml-auto bg-white border border-slate200 text-[10px] font-bold px-[5px] py-[1px] rounded">⌘K</span>
      </div>
      <button className="w-9 h-9 rounded-md border border-slate200 bg-white text-slate600 flex items-center justify-center relative">
        <Icon name="bell" size={15} />
        <span className="absolute top-[6px] right-[6px] w-2 h-2 rounded-full bg-critical border-2 border-white" />
      </button>

      {userMenu ? (
        <div className="relative" ref={ref}>
          <button onClick={() => setOpen(!open)} className="flex items-center gap-2 pl-1 pr-2 py-[2px] rounded-md hover:bg-slate100">
            <DAvatar initials={userInitials} size={28} />
            <Icon name="chevron-down" size={13} />
          </button>
          {open && (
            <div className="absolute right-0 top-[40px] w-[240px] bg-white border border-slate200 rounded-lg shadow-pop overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-slate200 flex items-center gap-3">
                <DAvatar initials={userInitials} size={36} />
                <div className="min-w-0">
                  <div className="text-[13px] font-bold truncate">{userName}</div>
                  <div className="text-[11px] text-slate500 truncate">{userRole}</div>
                </div>
              </div>
              <a href="Perfil.html" className="flex items-center gap-2 px-4 py-[10px] text-[12px] text-slate700 hover:bg-slate50">
                <Icon name="users" size={14} className="text-slate500" /> Mi perfil
              </a>
              <a href="Configuracion.html" className="flex items-center gap-2 px-4 py-[10px] text-[12px] text-slate700 hover:bg-slate50">
                <Icon name="grid" size={14} className="text-slate500" /> Configuración
              </a>
              <a href="Obras.html" className="flex items-center gap-2 px-4 py-[10px] text-[12px] text-slate700 hover:bg-slate50">
                <Icon name="arrow-right" size={14} className="text-slate500" /> Mis obras
              </a>
              <div className="border-t border-slate200" />
              <a href="Login.html" className="flex items-center gap-2 px-4 py-[10px] text-[12px] text-[#B91C1C] hover:bg-critical50">
                <Icon name="x" size={14} /> Cerrar sesión
              </a>
            </div>
          )}
        </div>
      ) : (
        <DAvatar initials={userInitials} size={32} />
      )}
    </header>
  );
};

Object.assign(window, { DashAppShell });
