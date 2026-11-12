"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Persons, Plus, TrashBin, Xmark } from "@gravity-ui/icons";
import DButton from "@/components/ui/Button";
import { Field, SettingsCard, Toggle, inputCls } from "./settingsUi";
import { DashToast, useToast } from "../../_components/useToast";
import { useDashboardData } from "../../_components/DashboardDataContext";
import { useRole } from "../../_components/RoleContext";
import { SectionBlocked } from "../../_components/SectionBlocked";
import {
  actualizarRol,
  crearRol,
  eliminarRol,
  getRoles,
  RolesApiError,
  type CatalogoPermisos,
  type PermisoCatalogo,
  type PermisosRol,
  type RolObra,
} from "@/services/rolesService";

type Superficie = "bot" | "web";

interface BorradorRol {
  nombre: string;
  descripcion: string;
  nivel: number;
  permisos: PermisosRol;
}

const PERMISOS_VACIOS: PermisosRol = { bot: {}, web: {} };

function borradorDe(rol: RolObra): BorradorRol {
  return {
    nombre: rol.nombre,
    descripcion: rol.descripcion,
    nivel: rol.nivel,
    permisos: { bot: { ...rol.permisos.bot }, web: { ...rol.permisos.web } },
  };
}

function copiarPermisos(rol: RolObra | null | undefined): PermisosRol {
  if (!rol) return { bot: { ...PERMISOS_VACIOS.bot }, web: { ...PERMISOS_VACIOS.web } };
  return { bot: { ...rol.permisos.bot }, web: { ...rol.permisos.web } };
}

function agrupar(catalogo: PermisoCatalogo[]): { grupo: string; items: PermisoCatalogo[] }[] {
  const grupos: { grupo: string; items: PermisoCatalogo[] }[] = [];
  for (const item of catalogo) {
    const existente = grupos.find((g) => g.grupo === item.grupo);
    if (existente) existente.items.push(item);
    else grupos.push({ grupo: item.grupo, items: [item] });
  }
  return grupos;
}

function validarNombre(nombre: string): string | null {
  const limpio = nombre.trim();
  if (limpio.length < 2) return "El nombre del rol tiene que tener al menos 2 caracteres.";
  if (limpio.length > 40) return "El nombre del rol no puede pasar los 40 caracteres.";
  return null;
}

function validarNivel(nivel: number): string | null {
  if (!Number.isFinite(nivel) || !Number.isInteger(nivel) || nivel < 1 || nivel > 100) {
    return "El nivel tiene que ser un número entero entre 1 y 100.";
  }
  return null;
}

function BloquePermisos({
  superficie,
  titulo,
  hint,
  catalogo,
  permisos,
  esDirectorSistema,
  onToggle,
}: {
  superficie: Superficie;
  titulo: string;
  hint: string;
  catalogo: PermisoCatalogo[];
  permisos: PermisosRol | null;
  esDirectorSistema: boolean;
  onToggle: (superficie: Superficie, key: string, valor: boolean) => void;
}) {
  const grupos = agrupar(catalogo);
  return (
    <div className="border border-slate-200 rounded-lg p-4">
      <div className="mb-3">
        <div className="text-[13px] font-bold text-slate-950">{titulo}</div>
        <div className="text-[11px] text-slate-500">{hint}</div>
      </div>
      {grupos.length === 0 ? (
        <div className="text-[12px] text-slate-500">Sin permisos en el catálogo.</div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {grupos.map((g) => (
            <div key={g.grupo} className="border border-slate-100 rounded-md p-3">
              <div className="text-[10px] tracking-wide uppercase font-bold text-slate-400 mb-2">
                {g.grupo}
              </div>
              <div className="space-y-2">
                {g.items.map((item) => {
                  const bloqueado =
                    esDirectorSistema &&
                    superficie === "web" &&
                    (item.key === "roles.administrar" || item.key === "equipo.administrar");
                  return (
                    <div key={item.key} className="flex items-center justify-between gap-3">
                      <span className="min-w-0">
                        <span className="block text-[12px] text-slate-700">{item.label}</span>
                        <code className="block text-[10px] font-mono text-slate-400">{item.key}</code>
                      </span>
                      <Toggle
                        on={permisos?.[superficie]?.[item.key] === true}
                        disabled={!permisos || bloqueado}
                        title={
                          bloqueado
                            ? "El rol Director de sistema siempre conserva este permiso"
                            : undefined
                        }
                        onChange={(v) => onToggle(superficie, item.key, v)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Configuración → Roles y permisos. Lista los roles de la obra y edita nombre,
 * descripción, nivel y la matriz de permisos de cada superficie (WhatsApp/Web).
 * Solo se muestra con `roles.administrar`; sin el permiso, cartel de bloqueo.
 */
export function RolesPermisosSection() {
  // La obra activa sale del provider del dashboard (mismo dato que usa el resto
  // de las pantallas): no hace falta leer el param de la URL.
  const { obraId } = useDashboardData();
  const { puede, refresh: refreshRol } = useRole();
  const [toast, flash] = useToast();
  const puedeAdministrar = puede("roles.administrar");

  const [roles, setRoles] = useState<RolObra[]>([]);
  const [catalogo, setCatalogo] = useState<CatalogoPermisos>({ bot: [], web: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seleccionadoId, setSeleccionadoId] = useState<string | null>(null);
  // Borrador atado al rol que se está editando: si cambia la selección (o se
  // recarga después de guardar) se descarta solo, sin un effect que copie estado.
  const [borradorEditado, setBorradorEditado] = useState<{ rolId: string; datos: BorradorRol } | null>(
    null,
  );
  const [guardando, setGuardando] = useState(false);
  const [confirmandoBaja, setConfirmandoBaja] = useState(false);
  const [nuevoAbierto, setNuevoAbierto] = useState(false);
  const [creando, setCreando] = useState(false);
  const [nuevo, setNuevo] = useState({ nombre: "", descripcion: "", nivel: 10, copiarDe: "" });

  const cargar = useCallback(
    async (seleccionar?: string) => {
      try {
        const data = await getRoles(obraId);
        setRoles(data.roles);
        setCatalogo(data.catalogo);
        setSeleccionadoId((prev) => {
          const objetivo = seleccionar || prev;
          if (objetivo && data.roles.some((r) => r.id === objetivo)) return objetivo;
          return data.roles[0]?.id ?? null;
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudieron cargar los roles");
      } finally {
        setLoading(false);
      }
    },
    [obraId],
  );

  useEffect(() => {
    if (!puedeAdministrar) return;
    // Lectura remota al montar/cambiar de obra: el setState ocurre al volver la
    // respuesta, no en el body sincrónico del effect (la regla no lo distingue
    // cuando la carga se delega en una función async).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void cargar();
  }, [cargar, puedeAdministrar]);

  const rolSel = useMemo(
    () => roles.find((r) => r.id === seleccionadoId) ?? null,
    [roles, seleccionadoId],
  );

  if (!puedeAdministrar) return <SectionBlocked permiso="roles.administrar" />;

  // Si el borrador es de otro rol (o no hay), se arranca desde los datos del
  // servidor; editarlo lo deja atado a `rolSel.id`.
  const borrador =
    rolSel && borradorEditado?.rolId === rolSel.id
      ? borradorEditado.datos
      : rolSel
        ? borradorDe(rolSel)
        : null;

  function editarBorrador(cambios: Partial<BorradorRol>) {
    if (!rolSel || !borrador) return;
    setBorradorEditado({ rolId: rolSel.id, datos: { ...borrador, ...cambios } });
  }

  const esDirectorSistema = rolSel?.es_sistema === true && rolSel.nombre === "Director";

  function alternar(superficie: Superficie, key: string, valor: boolean) {
    if (!borrador) return;
    editarBorrador({
      permisos: { ...borrador.permisos, [superficie]: { ...borrador.permisos[superficie], [key]: valor } },
    });
  }

  async function guardar() {
    if (!rolSel || !borrador) return;
    const problema =
      (rolSel.es_sistema ? null : validarNombre(borrador.nombre)) || validarNivel(borrador.nivel);
    if (problema) {
      setError(problema);
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      // En los roles de sistema nombre y nivel están deshabilitados: se mandan
      // solo la descripción y la matriz (el backend rechaza renombrarlos).
      const cambios = rolSel.es_sistema
        ? { descripcion: borrador.descripcion, permisos: borrador.permisos }
        : {
            nombre: borrador.nombre.trim(),
            descripcion: borrador.descripcion,
            nivel: borrador.nivel,
            permisos: borrador.permisos,
          };
      await actualizarRol(obraId, rolSel.id, cambios);
      await cargar(rolSel.id);
      setBorradorEditado(null);
      flash("Rol actualizado");
      // Si edité el rol con el que estoy navegando, el sidebar se entera.
      refreshRol();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar el rol");
    } finally {
      setGuardando(false);
    }
  }

  async function crear() {
    const problema = validarNombre(nuevo.nombre) || validarNivel(nuevo.nivel);
    if (problema) {
      setError(problema);
      return;
    }
    // "" = "Sin permisos": el rol arranca vacío. Si eligió un rol, copia su matriz.
    const origen = nuevo.copiarDe ? (roles.find((r) => r.id === nuevo.copiarDe) ?? null) : null;
    setCreando(true);
    setError(null);
    try {
      const creado = await crearRol(obraId, {
        nombre: nuevo.nombre.trim(),
        descripcion: nuevo.descripcion.trim(),
        nivel: nuevo.nivel,
        permisos: copiarPermisos(origen),
      });
      setNuevoAbierto(false);
      setNuevo({ nombre: "", descripcion: "", nivel: 10, copiarDe: "" });
      await cargar(creado.id);
      setBorradorEditado(null);
      flash("Rol creado");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo crear el rol");
    } finally {
      setCreando(false);
    }
  }

  async function borrar() {
    if (!rolSel) return;
    setGuardando(true);
    setError(null);
    try {
      await eliminarRol(obraId, rolSel.id);
      setConfirmandoBaja(false);
      await cargar();
      setBorradorEditado(null);
      flash("Rol eliminado");
    } catch (e) {
      // 409 ROL_EN_USO: el mensaje del backend ("tiene N miembros…") va tal cual.
      const mensaje =
        e instanceof RolesApiError && e.code === "ROL_EN_USO"
          ? e.message
          : e instanceof Error
            ? e.message
            : "No se pudo eliminar el rol";
      setError(mensaje);
      setConfirmandoBaja(false);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="space-y-4">
      <SettingsCard
        title="Roles y permisos"
        hint="Los permisos de WhatsApp y Web son independientes: un rol puede operar desde el bot sin ver la misma sección en la web."
        actions={
          <DButton
            size="sm"
            icon={<Plus width={13} height={13} />}
            onClick={() => {
              setError(null);
              setNuevo((n) => ({ ...n, copiarDe: n.copiarDe || seleccionadoId || "" }));
              setNuevoAbierto(true);
            }}
          >
            Nuevo rol
          </DButton>
        }
      >
        {loading ? (
          <div className="grid grid-cols-[210px_1fr] gap-4">
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="shimmer h-12 w-full rounded-md" />
              ))}
            </div>
            <div className="space-y-3">
              <div className="shimmer h-9 w-full rounded-md" />
              <div className="shimmer h-24 w-full rounded-md" />
              <div className="shimmer h-24 w-full rounded-md" />
            </div>
          </div>
        ) : roles.length === 0 ? (
          <div className="text-[12px] text-slate-500">
            Esta obra todavía no tiene roles. Creá el primero con “Nuevo rol”.
          </div>
        ) : (
          <div className="grid grid-cols-[210px_1fr] gap-4 items-start">
            {/* Lista de roles */}
            <div className="border border-slate-200 rounded-lg p-1 flex flex-col gap-[2px]">
              {roles.map((r) => {
                const on = r.id === seleccionadoId;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      setSeleccionadoId(r.id);
                      setBorradorEditado(null);
                      setConfirmandoBaja(false);
                      setError(null);
                    }}
                    className={`text-left rounded-md px-3 py-2 transition-colors ${on ? "bg-primary-50" : "hover:bg-slate-50"}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={on ? "text-primary" : "text-slate-400"}>
                        <Persons width={13} height={13} />
                      </span>
                      <span className={`text-[12px] font-bold ${on ? "text-primary" : "text-slate-800"}`}>
                        {r.nombre}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-[2px] pl-[21px]">
                      <span className="text-[10px] text-slate-500">Nivel {r.nivel}</span>
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wide rounded-full px-[6px] py-[1px] ${r.es_sistema ? "bg-slate-100 text-slate-600" : "bg-attention-50 text-[#A16207]"}`}
                      >
                        {r.es_sistema ? "Sistema" : "Personalizado"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Editor */}
            <div className="min-w-0">
              {rolSel && borrador ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <Field label="Nombre">
                        <input
                          className={inputCls}
                          value={borrador.nombre}
                          disabled={rolSel.es_sistema}
                          title={rolSel.es_sistema ? "Los roles de sistema no se pueden renombrar" : undefined}
                          onChange={(e) => editarBorrador({ nombre: e.target.value })}
                        />
                      </Field>
                    </div>
                    <Field label="Nivel (1–100)">
                      <input
                        className={inputCls}
                        type="number"
                        min={1}
                        max={100}
                        value={borrador.nivel}
                        disabled={rolSel.es_sistema}
                        title={
                          rolSel.es_sistema
                            ? "Los roles de sistema no cambian de nivel"
                            : "Nadie puede asignar un rol de nivel mayor al propio"
                        }
                        onChange={(e) => editarBorrador({ nivel: Number(e.target.value) })}
                      />
                    </Field>
                  </div>

                  <Field label="Descripción">
                    <input
                      className={inputCls}
                      value={borrador.descripcion}
                      placeholder="Para qué sirve este rol en la obra"
                      onChange={(e) => editarBorrador({ descripcion: e.target.value })}
                    />
                  </Field>

                  <BloquePermisos
                    superficie="bot"
                    titulo="WhatsApp"
                    hint="Lo que la persona puede hacer desde el bot."
                    catalogo={catalogo.bot}
                    permisos={borrador.permisos}
                    esDirectorSistema={esDirectorSistema}
                    onToggle={alternar}
                  />
                  <BloquePermisos
                    superficie="web"
                    titulo="Web"
                    hint="Lo que la persona puede ver y hacer en el dashboard."
                    catalogo={catalogo.web}
                    permisos={borrador.permisos}
                    esDirectorSistema={esDirectorSistema}
                    onToggle={alternar}
                  />

                  {error && (
                    <div className="text-[12px] font-semibold text-[#B91C1C] bg-critical-50 border border-critical-100 rounded-md px-3 py-2">
                      {error}
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div>
                      {!rolSel.es_sistema &&
                        (confirmandoBaja ? (
                          <div className="flex items-center gap-2">
                            <span className="text-[12px] text-slate-600">
                              ¿Eliminar “{rolSel.nombre}”?
                            </span>
                            <DButton
                              size="sm"
                              variant="danger"
                              disabled={guardando}
                              icon={<Check width={12} height={12} />}
                              onClick={borrar}
                            >
                              Sí, eliminar
                            </DButton>
                            <DButton
                              size="sm"
                              variant="outline"
                              icon={<Xmark width={12} height={12} />}
                              onClick={() => setConfirmandoBaja(false)}
                            >
                              Cancelar
                            </DButton>
                          </div>
                        ) : (
                          <DButton
                            size="sm"
                            variant="outline"
                            icon={<TrashBin width={12} height={12} />}
                            onClick={() => {
                              setError(null);
                              setConfirmandoBaja(true);
                            }}
                          >
                            Eliminar rol
                          </DButton>
                        ))}
                    </div>
                    <DButton
                      icon={<Check width={13} height={13} />}
                      disabled={guardando}
                      onClick={guardar}
                    >
                      {guardando ? "Guardando…" : "Guardar"}
                    </DButton>
                  </div>

                  {rolSel.es_sistema && (
                    <div className="text-[11px] text-slate-500">
                      Los roles de sistema no se pueden renombrar, cambiar de nivel ni eliminar; sí
                      editar sus permisos (el Director conserva la administración de roles y equipo).
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-[12px] text-slate-500">Elegí un rol para editarlo.</div>
              )}
            </div>
          </div>
        )}
      </SettingsCard>

      {nuevoAbierto && (
        <SettingsCard
          title="Nuevo rol"
          hint="Los permisos arrancan copiados del rol que elijas; después los ajustás."
          actions={
            <button
              type="button"
              onClick={() => {
                setNuevoAbierto(false);
                setError(null);
              }}
              className="text-slate-400 hover:text-slate-700"
              aria-label="Cerrar"
            >
              <Xmark width={14} height={14} />
            </button>
          }
        >
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Field label="Nombre">
                <input
                  className={inputCls}
                  value={nuevo.nombre}
                  placeholder="Ej: Encargado de compras"
                  onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })}
                />
              </Field>
            </div>
            <Field label="Nivel (1–100)">
              <input
                className={inputCls}
                type="number"
                min={1}
                max={100}
                value={nuevo.nivel}
                onChange={(e) => setNuevo({ ...nuevo, nivel: Number(e.target.value) })}
              />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-3">
            <div className="col-span-2">
              <Field label="Descripción">
                <input
                  className={inputCls}
                  value={nuevo.descripcion}
                  placeholder="Para qué sirve este rol"
                  onChange={(e) => setNuevo({ ...nuevo, descripcion: e.target.value })}
                />
              </Field>
            </div>
            <Field label="Copiar permisos de">
              <select
                className={inputCls}
                value={nuevo.copiarDe}
                onChange={(e) => setNuevo({ ...nuevo, copiarDe: e.target.value })}
              >
                <option value="">Sin permisos</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nombre}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {error && (
            <div className="mt-3 text-[12px] font-semibold text-[#B91C1C] bg-critical-50 border border-critical-100 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <div className="mt-4 flex justify-end gap-2">
            <DButton variant="outline" onClick={() => setNuevoAbierto(false)}>
              Cancelar
            </DButton>
            <DButton disabled={creando} onClick={crear}>
              {creando ? "Creando…" : "Crear rol"}
            </DButton>
          </div>
        </SettingsCard>
      )}

      <DashToast msg={toast} />
    </div>
  );
}
