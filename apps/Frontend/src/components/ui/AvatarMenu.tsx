"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowRightFromSquare, Person, Gear, House } from "@gravity-ui/icons";
import { DAvatar } from "@/components/ui/DAvatar";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useParams } from "next/navigation";

export function AvatarMenu() {
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { profile, logout } = useAuth();
  const router = useRouter();
  const params = useParams<{ obraId?: string }>();
  const dBase = params?.obraId ? `/${params.obraId}/dashboard` : null;

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      router.push("/login");
    } catch {
      setLoggingOut(false);
      setOpen(false);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="rounded-full focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
      >
        <DAvatar size={32} />
      </button>
      {open && (
        <div className="absolute right-0 top-[42px] w-[200px] bg-white border border-slate-200 rounded-lg shadow-pop overflow-hidden z-50 animate-fade-task">
          <div className="px-4 py-2.5 border-b border-slate-100">
            <span className="block text-[13px] font-bold text-slate-950 truncate">
              {(profile?.nombre as string) || "Usuario"}
            </span>
            <span className="block text-[11px] text-slate-500 truncate">
              {profile?.email as string || profile?.telefono as string || ""}
            </span>
          </div>
          {dBase && (
            <>
              <button
                onClick={() => { router.push(`${dBase}/perfil`); setOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-[10px] hover:bg-slate-50 text-left transition-colors"
              >
                <span className="w-8 h-8 rounded-md flex items-center justify-center bg-primary-50 text-primary">
                  <Person width={15} height={15} />
                </span>
                <span className="text-[13px] font-medium text-slate-700">Mi perfil</span>
              </button>
              <button
                onClick={() => { router.push(`${dBase}/configuracion`); setOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-[10px] hover:bg-slate-50 text-left transition-colors"
              >
                <span className="w-8 h-8 rounded-md flex items-center justify-center bg-slate-100 text-slate-600">
                  <Gear width={15} height={15} />
                </span>
                <span className="text-[13px] font-medium text-slate-700">Configuración</span>
              </button>
              <button
                onClick={() => { router.push("/projects"); setOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-[10px] hover:bg-slate-50 text-left transition-colors"
              >
                <span className="w-8 h-8 rounded-md flex items-center justify-center bg-info-50 text-info">
                  <House width={15} height={15} />
                </span>
                <span className="text-[13px] font-medium text-slate-700">Mis obras</span>
              </button>
              <div className="border-t border-slate-100 my-1" />
            </>
          )}
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center gap-3 px-4 py-[10px] hover:bg-critical-50 text-left transition-colors disabled:opacity-50"
          >
            <span className="w-8 h-8 rounded-md flex items-center justify-center bg-critical-50 text-critical">
              <ArrowRightFromSquare width={15} height={15} />
            </span>
            <span className="text-[13px] font-medium text-slate-700">
              {loggingOut ? "Saliendo…" : "Cerrar sesión"}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
