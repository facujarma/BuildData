// Tests del editor real de Configuración → Roles y permisos (ENTREGABLE 5).
//
// No se mockea el service: se mockea `fetch` (la API) y se renderiza el
// componente real, así el test cubre el flujo completo: GET de roles + catálogo,
// selección, edición de la matriz por superficie, alta, baja y las restricciones
// de los roles de sistema (nombre/nivel fijos, sin baja, candado del Director).

import { afterAll, afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { fireEvent, waitFor } from "@testing-library/react";

mock.module("@/lib/supabaseClient", () => ({
  supabase: {
    auth: {
      getSession: async () => ({ data: { session: { access_token: "token-de-prueba" } } }),
    },
  },
}));

const OBRA = "0b7c1f5e-1a2b-4c3d-8e9f-0123456789ab";

mock.module("../../_components/DashboardDataContext", () => ({
  useDashboardData: () => ({
    obraId: OBRA,
    obraName: "Obra de prueba",
    obraProgress: 0,
    operacionesPendientes: 0,
  }),
}));

// happy-dom se registra una vez para todo el proceso en test/setup.ts.
const { cleanup, render, screen, within } = await import("@testing-library/react");
const { RolesPermisosSection } = await import(
  "@/app/[obraId]/dashboard/configuracion/_components/RolesPermisosSection"
);
const { RoleContext } = await import("@/app/[obraId]/dashboard/_components/RoleContext");

// ─────────────────────────────────────────────────────────────
// Fixtures de la API
// ─────────────────────────────────────────────────────────────

const CATALOGO = {
  bot: [
    { key: "pedido.crear", label: "crear pedidos de compra", grupo: "Pedidos" },
    { key: "stock.registrar", label: "registrar movimientos de stock", grupo: "Stock" },
  ],
  web: [
    { key: "dashboard.ver", label: "ver el dashboard", grupo: "General" },
    { key: "equipo.administrar", label: "administrar el equipo", grupo: "Equipo" },
    { key: "roles.administrar", label: "administrar roles y permisos", grupo: "Configuración" },
    { key: "pedidos.ver", label: "ver pedidos", grupo: "Pedidos" },
    { key: "stock.ajustar", label: "ajustar stock y materiales", grupo: "Stock" },
  ],
};

function rol(extra: Record<string, unknown>) {
  return {
    descripcion: "",
    es_sistema: false,
    permisos: { bot: {}, web: {} },
    ...extra,
  };
}

const ROLES_BASE = [
  rol({
    id: "r-cliente",
    nombre: "Cliente",
    nivel: 5,
    es_sistema: true,
    permisos: { bot: {}, web: { "dashboard.ver": true } },
  }),
  rol({
    id: "r-capataz",
    nombre: "Capataz",
    nivel: 30,
    es_sistema: true,
    permisos: {
      bot: { "pedido.crear": true, "stock.registrar": true },
      web: { "dashboard.ver": true, "pedidos.ver": true },
    },
  }),
  rol({
    id: "r-director",
    nombre: "Director",
    nivel: 100,
    es_sistema: true,
    permisos: {
      bot: { "pedido.crear": true },
      web: {
        "dashboard.ver": true,
        "equipo.administrar": true,
        "roles.administrar": true,
        "pedidos.ver": true,
      },
    },
  }),
  rol({
    id: "r-encargado",
    nombre: "Encargado",
    descripcion: "Compras de la obra",
    nivel: 40,
    permisos: { bot: {}, web: { "dashboard.ver": true, "pedidos.ver": true } },
  }),
];

interface Llamada {
  method: string;
  url: string;
  body: Record<string, unknown> | null;
}

let llamadas: Llamada[] = [];
let rolesActuales: ReturnType<typeof rol>[] = [];
let deleteStatus = 204;
let deleteBody: unknown = null;
let postStatus = 201;
let patchStatus = 200;

const fetchOriginal = globalThis.fetch;

function respuesta(ok: boolean, status: number, body: unknown): Response {
  return {
    ok,
    status,
    json: async () => body,
  } as unknown as Response;
}

beforeEach(() => {
  llamadas = [];
  rolesActuales = structuredClone(ROLES_BASE);
  deleteStatus = 204;
  deleteBody = null;
  postStatus = 201;
  patchStatus = 200;

  globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
    const metodo = init?.method ?? "GET";
    const ruta = String(url).replace("http://localhost:3001", "");
    const body = init?.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : null;
    llamadas.push({ method: metodo, url: ruta, body });

    // GET /roles/:obra
    if (metodo === "GET" && /^\/roles\/[^/]+$/.test(ruta)) {
      return respuesta(true, 200, { roles: rolesActuales, catalogo: CATALOGO });
    }
    // POST /roles/:obra
    if (metodo === "POST" && /^\/roles\/[^/]+$/.test(ruta)) {
      const creado = rol({ id: "r-nuevo", ...(body ?? {}) });
      rolesActuales = [...rolesActuales, creado];
      return respuesta(postStatus < 400, postStatus, { rol: creado });
    }
    // PATCH /roles/:obra/:rol
    if (metodo === "PATCH") {
      if (patchStatus >= 400) {
        return respuesta(false, patchStatus, {
          code: "SIN_PERMISO",
          message: "No podés editar este rol",
        });
      }
      const id = ruta.split("/").pop();
      const actual = rolesActuales.find((r) => r.id === id) ?? null;
      const actualizado = actual ? { ...actual, ...(body ?? {}) } : null;
      rolesActuales = rolesActuales.map((r) => (r.id === id ? { ...r, ...(body ?? {}) } : r));
      return respuesta(patchStatus < 400, patchStatus, { rol: actualizado });
    }
    // DELETE /roles/:obra/:rol
    if (metodo === "DELETE") {
      if (deleteStatus >= 400) return respuesta(false, deleteStatus, deleteBody);
      return respuesta(true, 204, null);
    }

    throw new Error(`fetch inesperado: ${metodo} ${ruta}`);
  }) as unknown as typeof fetch;
});

afterEach(() => {
  globalThis.fetch = fetchOriginal;
  cleanup();
});

afterAll(() => {
  mock.restore();
});

function renderEditor(puede = true) {
  const refresco = mock(() => {});
  render(
    <RoleContext.Provider
      value={{
        rol: { id: "r-director", nombre: "Director", nivel: 100, es_sistema: true, descripcion: "" },
        permisos: null,
        loading: false,
        error: null,
        puede: () => puede,
        refresh: refresco,
      }}
    >
      <RolesPermisosSection />
    </RoleContext.Provider>,
  );
  return { refresco };
}

/** Fila de un permiso en la matriz: el <button role=switch> de al lado. */
function toggleDe(permiso: string): HTMLButtonElement {
  const code = screen.getByText(permiso);
  const fila = code.closest("div");
  const boton = fila?.querySelector("button");
  if (!boton) throw new Error(`No encontré el toggle de ${permiso}`);
  return boton;
}

function botonDeLista(nombre: string): HTMLElement {
  const span = screen.getByText(nombre);
  const boton = span.closest("button");
  if (!boton) throw new Error(`No encontré el botón del rol ${nombre}`);
  return boton;
}

async function cargarEditor(puede = true) {
  const utils = renderEditor(puede);
  await screen.findByText("Cliente");
  return utils;
}

// ─────────────────────────────────────────────────────────────
// Listado y restricciones de sistema
// ─────────────────────────────────────────────────────────────

describe("editor de roles — listado", () => {
  test("lista los roles de la obra con su nivel y marca cuáles son de sistema", async () => {
    await cargarEditor();

    expect(screen.getByText("Cliente")).toBeTruthy();
    expect(screen.getByText("Capataz")).toBeTruthy();
    expect(screen.getByText("Director")).toBeTruthy();
    expect(screen.getByText("Encargado")).toBeTruthy();

    expect(screen.getAllByText("Sistema")).toHaveLength(3);
    expect(screen.getByText("Personalizado")).toBeTruthy();
    expect(screen.getByText("Nivel 30")).toBeTruthy();
    expect(screen.getByText("Nivel 40")).toBeTruthy();

    // El GET lleva el token de la sesión.
    expect(llamadas[0]).toMatchObject({ method: "GET", url: `/roles/${OBRA}` });
  });
});

describe("editor de roles — restricciones de los roles de sistema", () => {
  test("Director: nombre y nivel deshabilitados, sin botón de baja y candado en roles/equipo", async () => {
    await cargarEditor();

    fireEvent.click(botonDeLista("Director"));

    const nombre = screen.getByDisplayValue("Director") as HTMLInputElement;
    const nivel = screen.getByDisplayValue("100") as HTMLInputElement;
    expect(nombre.disabled).toBe(true);
    expect(nivel.disabled).toBe(true);

    expect(screen.queryByText("Eliminar rol")).toBeNull();

    expect(toggleDe("roles.administrar").disabled).toBe(true);
    expect(toggleDe("equipo.administrar").disabled).toBe(true);
    // Los demás permisos del Director sí se pueden editar.
    expect(toggleDe("pedidos.ver").disabled).toBe(false);

    expect(screen.getByText(/conserva la administración de roles/i)).toBeTruthy();
  });

  test("un rol de sistema no Director se puede editar pero no renombrar ni borrar", async () => {
    await cargarEditor();

    fireEvent.click(botonDeLista("Capataz"));

    expect((screen.getByDisplayValue("Capataz") as HTMLInputElement).disabled).toBe(true);
    expect((screen.getByDisplayValue("30") as HTMLInputElement).disabled).toBe(true);
    expect(screen.queryByText("Eliminar rol")).toBeNull();
    // Sin el candado de Director, sus permisos se pueden tocar.
    expect(toggleDe("pedidos.ver").disabled).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────
// Edición de la matriz
// ─────────────────────────────────────────────────────────────

describe("editor de roles — editar permisos", () => {
  test("toggle de una capacidad web y guardar: PATCH con la matriz y los datos del rol", async () => {
    await cargarEditor();

    fireEvent.click(botonDeLista("Encargado"));
    fireEvent.change(screen.getByDisplayValue("Encargado"), {
      target: { value: "Encargado de compras" },
    });

    expect(toggleDe("stock.ajustar").getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(toggleDe("stock.ajustar"));
    expect(toggleDe("stock.ajustar").getAttribute("aria-pressed")).toBe("true");

    fireEvent.click(screen.getByText("Guardar"));

    await waitFor(() => expect(llamadas.some((l) => l.method === "PATCH")).toBe(true));
    const patch = llamadas.find((l) => l.method === "PATCH")!;
    expect(patch.url).toBe(`/roles/${OBRA}/r-encargado`);
    expect(patch.body).toMatchObject({
      nombre: "Encargado de compras",
      descripcion: "Compras de la obra",
      nivel: 40,
    });
    const permisos = patch.body?.permisos as { bot: Record<string, boolean>; web: Record<string, boolean> };
    expect(permisos.web["stock.ajustar"]).toBe(true);
    // Los permisos que ya tenía se conservan.
    expect(permisos.web["dashboard.ver"]).toBe(true);
    expect(permisos.web["pedidos.ver"]).toBe(true);
  });

  test("la superficie WhatsApp se edita aparte de la web", async () => {
    await cargarEditor();

    fireEvent.click(botonDeLista("Encargado"));
    fireEvent.click(toggleDe("pedido.crear")); // bot
    fireEvent.click(screen.getByText("Guardar"));

    await waitFor(() => expect(llamadas.some((l) => l.method === "PATCH")).toBe(true));
    const permisos = llamadas.find((l) => l.method === "PATCH")!.body?.permisos as {
      bot: Record<string, boolean>;
      web: Record<string, boolean>;
    };
    expect(permisos.bot["pedido.crear"]).toBe(true);
    expect(permisos.web["pedido.crear"]).toBeUndefined();
    expect(permisos.bot["stock.registrar"]).toBeUndefined();
  });

  test("validación local: nombre de 1 carácter no llega a la API", async () => {
    await cargarEditor();

    fireEvent.click(botonDeLista("Encargado"));
    fireEvent.change(screen.getByDisplayValue("Encargado"), { target: { value: "A" } });
    fireEvent.click(screen.getByText("Guardar"));

    expect(await screen.findByText(/al menos 2 caracteres/i)).toBeTruthy();
    expect(llamadas.some((l) => l.method === "PATCH")).toBe(false);
  });

  test("el 403 SIN_PERMISO de la API se muestra en el editor", async () => {
    await cargarEditor();
    fireEvent.click(botonDeLista("Encargado"));
    patchStatus = 403;

    fireEvent.click(screen.getByText("Guardar"));

    await waitFor(() => expect(screen.getByText(/No podés editar este rol/i)).toBeTruthy());
  });
});

// ─────────────────────────────────────────────────────────────
// Alta
// ─────────────────────────────────────────────────────────────

describe("editor de roles — crear rol", () => {
  test("crea un rol copiando los permisos del rol elegido", async () => {
    await cargarEditor();

    fireEvent.click(screen.getByText("Nuevo rol"));

    const card = screen.getByRole("heading", { name: "Nuevo rol" }).closest("div.bg-white");
    if (!card) throw new Error("No encontré la tarjeta de alta");
    const dentro = within(card as HTMLElement);

    fireEvent.change(dentro.getByPlaceholderText("Ej: Encargado de compras"), {
      target: { value: "Encargado de obra" },
    });
    fireEvent.change(dentro.getByPlaceholderText("Para qué sirve este rol"), {
      target: { value: "Reemplaza al capataz" },
    });
    fireEvent.change(dentro.getByDisplayValue("10"), { target: { value: "35" } });
    fireEvent.change(dentro.getByRole("combobox"), { target: { value: "r-capataz" } });

    fireEvent.click(screen.getByText("Crear rol"));

    await waitFor(() => expect(llamadas.some((l) => l.method === "POST")).toBe(true));
    const post = llamadas.find((l) => l.method === "POST")!;
    expect(post.url).toBe(`/roles/${OBRA}`);
    expect(post.body).toMatchObject({
      nombre: "Encargado de obra",
      descripcion: "Reemplaza al capataz",
      nivel: 35,
    });
    const permisos = post.body?.permisos as { bot: Record<string, boolean>; web: Record<string, boolean> };
    expect(permisos.bot["pedido.crear"]).toBe(true);
    expect(permisos.web["pedidos.ver"]).toBe(true);
  });

  test("nombre vacío: no dispara el POST y explica el motivo", async () => {
    await cargarEditor();

    fireEvent.click(screen.getByText("Nuevo rol"));
    fireEvent.click(screen.getByText("Crear rol"));

    expect(await screen.findAllByText(/al menos 2 caracteres/i)).not.toHaveLength(0);
    expect(llamadas.some((l) => l.method === "POST")).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────
// Baja
// ─────────────────────────────────────────────────────────────

describe("editor de roles — borrar rol", () => {
  test("pide confirmación y borra un rol personalizado", async () => {
    await cargarEditor();

    fireEvent.click(botonDeLista("Encargado"));
    fireEvent.click(screen.getByText("Eliminar rol"));
    expect(screen.getByText(/¿Eliminar “Encargado”\?/)).toBeTruthy();

    fireEvent.click(screen.getByText("Sí, eliminar"));

    await waitFor(() => expect(llamadas.some((l) => l.method === "DELETE")).toBe(true));
    expect(llamadas.find((l) => l.method === "DELETE")!.url).toBe(`/roles/${OBRA}/r-encargado`);
  });

  test("cancelar la confirmación no borra", async () => {
    await cargarEditor();

    fireEvent.click(botonDeLista("Encargado"));
    fireEvent.click(screen.getByText("Eliminar rol"));
    fireEvent.click(screen.getByText("Cancelar"));

    expect(llamadas.some((l) => l.method === "DELETE")).toBe(false);
    expect(screen.queryByText(/¿Eliminar/)).toBeNull();
  });

  test("409 ROL_EN_USO: muestra el mensaje del backend y no saca el rol de la lista", async () => {
    deleteStatus = 409;
    deleteBody = {
      code: "ROL_EN_USO",
      message: "El rol tiene 2 miembros e invitaciones pendientes",
    };
    await cargarEditor();

    fireEvent.click(botonDeLista("Encargado"));
    fireEvent.click(screen.getByText("Eliminar rol"));
    fireEvent.click(screen.getByText("Sí, eliminar"));

    expect(await screen.findByText("El rol tiene 2 miembros e invitaciones pendientes")).toBeTruthy();
    expect(screen.getByText("Encargado")).toBeTruthy();
    expect(llamadas.filter((l) => l.method === "GET")).toHaveLength(1);
  });
});

// ─────────────────────────────────────────────────────────────
// Sin permiso
// ─────────────────────────────────────────────────────────────

describe("editor de roles — gate", () => {
  test("sin roles.administrar muestra el cartel y no pide roles a la API", async () => {
    renderEditor(false);

    expect(screen.getByText("Sección bloqueada")).toBeTruthy();
    expect(screen.getByText("administrar roles y permisos")).toBeTruthy();
    expect(llamadas).toHaveLength(0);
  });
});
