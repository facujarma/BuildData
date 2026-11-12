// Tests de contrato de rolesService (sin red ni Supabase real):
// - endpoints, método y body de getMiRol / getRoles / crearRol / actualizarRol / eliminarRol
// - mapeo de la respuesta (nivel numérico, defaults de permisos y de campos)
// - errores del backend: { code, message } → RolesApiError con `.code` y `.status`
//
// Se mockea `@/lib/supabaseClient` (el módulo real exige NEXT_PUBLIC_SUPABASE_*)
// y se reemplaza `fetch` global, igual que equipoService.test.ts.

import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";

const OBRA_ID = "0b7c1f5e-1a2b-4c3d-8e9f-0123456789ab";
const ROL_ID = "11111111-2222-3333-4444-555555555555";

mock.module("@/lib/supabaseClient", () => ({
  supabase: {
    auth: {
      getSession: async () => ({ data: { session: { access_token: "token-de-prueba" } } }),
    },
  },
}));

const { getMiRol, getRoles, crearRol, actualizarRol, eliminarRol, RolesApiError } = await import(
  "./rolesService"
);

type Llamada = { url: string; init: RequestInit & { headers: Record<string, string> } };

const llamadas: Llamada[] = [];
let respuesta: { ok: boolean; status: number; body: unknown };

const fetchOriginal = globalThis.fetch;

beforeEach(() => {
  llamadas.length = 0;
  respuesta = { ok: true, status: 200, body: {} };
  globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
    llamadas.push({
      url: String(url),
      init: { ...init, headers: (init?.headers as Record<string, string>) ?? {} },
    });
    return {
      ok: respuesta.ok,
      status: respuesta.status,
      json: async () => respuesta.body,
    };
  }) as unknown as typeof fetch;
});

afterEach(() => {
  globalThis.fetch = fetchOriginal;
});

function bodyEnviado(): Record<string, unknown> {
  expect(llamadas).toHaveLength(1);
  return JSON.parse(String(llamadas[0].init.body)) as Record<string, unknown>;
}

const ROL_CRUDO = {
  id: ROL_ID,
  nombre: "Capataz",
  descripcion: "Operación de campo",
  nivel: 30,
  es_sistema: true,
  permisos: { bot: { "pedido.crear": true, "stock.registrar": false }, web: { "pedidos.ver": true } },
};

describe("getMiRol — contrato de GET /obras/:obraId/mi-rol", () => {
  test("pega en el endpoint correcto con el token de la sesión y mapea el payload", async () => {
    respuesta = {
      ok: true,
      status: 200,
      body: {
        rol: { id: ROL_ID, nombre: "Capataz", nivel: "30", es_sistema: true },
        permisos: {
          bot: ["pedido.crear"],
          web: ["dashboard.ver", "pedidos.ver"],
          botMap: { "pedido.crear": true },
          webMap: { "dashboard.ver": true, "pedidos.ver": true },
        },
      },
    };

    const miRol = await getMiRol(OBRA_ID);

    expect(llamadas[0].url).toBe(`http://localhost:3001/obras/${OBRA_ID}/mi-rol`);
    expect(llamadas[0].init.method).toBeUndefined(); // GET por default
    expect(llamadas[0].init.headers.Authorization).toContain("token-de-prueba");

    expect(miRol.rol).toEqual({
      id: ROL_ID,
      nombre: "Capataz",
      nivel: 30, // numeric llega como string desde Postgres
      es_sistema: true,
      descripcion: "",
    });
    expect(miRol.permisos.web).toEqual(["dashboard.ver", "pedidos.ver"]);
    expect(miRol.permisos.webMap["dashboard.ver"]).toBe(true);
  });

  test("payload mínimo: listas vacías, mapas vacíos y rol sin sistema", async () => {
    respuesta = { ok: true, status: 200, body: { rol: { nombre: "Rol raro", nivel: 7 } } };

    const miRol = await getMiRol(OBRA_ID);

    expect(miRol.rol).toMatchObject({ id: null, nombre: "Rol raro", nivel: 7, es_sistema: false });
    expect(miRol.permisos).toEqual({ bot: [], web: [], botMap: {}, webMap: {} });
  });

  test("403 SIN_PERMISO: lanza RolesApiError con code y status", async () => {
    respuesta = {
      ok: false,
      status: 403,
      body: { code: "SIN_PERMISO", message: "No pertenecés a esta obra" },
    };

    const error = await getMiRol(OBRA_ID).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(RolesApiError);
    expect(error).toBeInstanceOf(Error);
    const e = error as InstanceType<typeof RolesApiError>;
    expect(e.message).toBe("No pertenecés a esta obra");
    expect(e.code).toBe("SIN_PERMISO");
    expect(e.status).toBe(403);
  });
});

describe("getRoles — contrato de GET /roles/:obra_id", () => {
  test("mapea roles y catálogo, y normaliza nulos", async () => {
    respuesta = {
      ok: true,
      status: 200,
      body: {
        roles: [ROL_CRUDO, { id: "otro", nombre: "Cliente", nivel: 5 }],
        catalogo: {
          bot: [{ key: "pedido.crear", label: "crear pedidos de compra", grupo: "Pedidos" }],
          web: [{ key: "roles.administrar", label: "administrar roles", grupo: "Configuración" }],
        },
      },
    };

    const { roles, catalogo } = await getRoles(OBRA_ID);

    expect(llamadas[0].url).toBe(`http://localhost:3001/roles/${OBRA_ID}`);
    expect(roles).toHaveLength(2);
    expect(roles[0]).toEqual({
      id: ROL_ID,
      nombre: "Capataz",
      descripcion: "Operación de campo",
      nivel: 30,
      es_sistema: true,
      permisos: ROL_CRUDO.permisos,
    });
    expect(roles[1]).toMatchObject({
      descripcion: "",
      es_sistema: false,
      permisos: { bot: {}, web: {} },
    });
    expect(catalogo.web[0].key).toBe("roles.administrar");
  });

  test("respuesta sin roles ni catálogo: listas vacías (no rompe la sección)", async () => {
    respuesta = { ok: true, status: 200, body: {} };

    const { roles, catalogo } = await getRoles(OBRA_ID);

    expect(roles).toEqual([]);
    expect(catalogo).toEqual({ bot: [], web: [] });
  });
});

describe("crearRol — POST /roles/:obra_id", () => {
  test("manda { nombre, descripcion, nivel, permisos } y devuelve el rol mapeado", async () => {
    respuesta = { ok: true, status: 201, body: { rol: ROL_CRUDO } };

    const rol = await crearRol(OBRA_ID, {
      nombre: "Capataz",
      descripcion: "Operación de campo",
      nivel: 30,
      permisos: ROL_CRUDO.permisos,
    });

    expect(llamadas[0].url).toBe(`http://localhost:3001/roles/${OBRA_ID}`);
    expect(llamadas[0].init.method).toBe("POST");
    expect(bodyEnviado()).toEqual({
      nombre: "Capataz",
      descripcion: "Operación de campo",
      nivel: 30,
      permisos: ROL_CRUDO.permisos,
    });
    expect(rol.id).toBe(ROL_ID);
    expect(rol.permisos.web["pedidos.ver"]).toBe(true);
  });
});

describe("actualizarRol — PATCH /roles/:obra_id/:rol_id", () => {
  test("manda solo los campos parciales que recibe", async () => {
    respuesta = { ok: true, status: 200, body: { rol: { ...ROL_CRUDO, nombre: "Capataz de obra" } } };

    const rol = await actualizarRol(OBRA_ID, ROL_ID, { nombre: "Capataz de obra" });

    expect(llamadas[0].url).toBe(`http://localhost:3001/roles/${OBRA_ID}/${ROL_ID}`);
    expect(llamadas[0].init.method).toBe("PATCH");
    expect(bodyEnviado()).toEqual({ nombre: "Capataz de obra" });
    expect(rol.nombre).toBe("Capataz de obra");
  });

  test("permisos: manda el mapa completo de la superficie editada", async () => {
    respuesta = { ok: true, status: 200, body: { rol: ROL_CRUDO } };
    const permisos = { bot: { "pedido.crear": true }, web: {} };

    await actualizarRol(OBRA_ID, ROL_ID, { permisos });

    expect(bodyEnviado()).toEqual({ permisos });
  });
});

describe("eliminarRol — DELETE /roles/:obra_id/:rol_id", () => {
  test("204 sin cuerpo no rompe (no intenta parsear json)", async () => {
    respuesta = { ok: true, status: 204, body: null };

    await expect(eliminarRol(OBRA_ID, ROL_ID)).resolves.toBeUndefined();

    expect(llamadas[0].url).toBe(`http://localhost:3001/roles/${OBRA_ID}/${ROL_ID}`);
    expect(llamadas[0].init.method).toBe("DELETE");
  });

  test("409 con code ROL_EN_USO: el mensaje y el code llegan al caller", async () => {
    respuesta = {
      ok: false,
      status: 409,
      body: { code: "ROL_EN_USO", message: "El rol tiene miembros o invitaciones pendientes" },
    };

    const error = (await eliminarRol(OBRA_ID, ROL_ID).catch((e: unknown) => e)) as InstanceType<
      typeof RolesApiError
    >;

    expect(error).toBeInstanceOf(RolesApiError);
    expect(error.code).toBe("ROL_EN_USO");
    expect(error.status).toBe(409);
    expect(error.message).toBe("El rol tiene miembros o invitaciones pendientes");
  });
});
