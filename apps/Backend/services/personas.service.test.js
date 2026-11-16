// Tests del servicio de identidad (issue #13) sin base real.
//
// El fake de DB implementa solo las consultas que usa el servicio y mantiene
// estado en memoria: así se verifica el merge completo (FKs, membresías,
// remapeo de tareas.asignado_a/completada_por, auditoría y borrado) sin tocar
// Postgres. La validación contra el schema real se hace con el dry-run del
// script sobre la base de desarrollo.

import { beforeEach, describe, expect, mock, test } from "bun:test";
import {
  REFERENCIAS_MIEMBROS_OBRA,
  REFERENCIAS_PERSONA,
  auditarDuplicadosPersonas,
  datosPersonaDesdeAuthUser,
  normalizarNombrePersona,
  normalizarTelefonoPersona,
  planificarUnificacion,
  unificarPersonas,
  variantesTelefono,
  vincularPersonaAuth,
} from "./personas.service.js";

const WEB_ID = "11111111-1111-4111-8111-111111111111";
const TEL_ID = "22222222-2222-4222-8222-222222222222";
const AUTH_ID = "33333333-3333-4333-8333-333333333333";
const OTRO_AUTH_ID = "44444444-4444-4444-8444-444444444444";
const OBRA_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const OBRA_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const OBRA_C = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

const TODAS_LAS_FKS = [
  ...REFERENCIAS_PERSONA.map((ref) => ({
    table_schema: "public",
    table_name: ref.tabla,
    column_name: ref.columna,
    tabla_referida: "personas",
  })),
  {
    table_schema: "public",
    table_name: "proveedores_favoritos",
    column_name: "persona_id",
    tabla_referida: "personas",
  },
  {
    table_schema: "public",
    table_name: "miembros_obra",
    column_name: "persona_id",
    tabla_referida: "personas",
  },
  {
    table_schema: "public",
    table_name: "personas_unificaciones",
    column_name: "ejecutado_por",
    tabla_referida: "personas",
  },
  ...REFERENCIAS_MIEMBROS_OBRA.map((ref) => ({
    table_schema: "public",
    table_name: ref.tabla,
    column_name: ref.columna,
    tabla_referida: "miembros_obra",
  })),
];

function crearEstado() {
  return {
    personas: [
      {
        id: WEB_ID,
        auth_user_id: AUTH_ID,
        nombre: "Facundo  Jarma v. WEB",
        telefono: null,
        created_at: "2026-01-01T00:00:00.000Z",
      },
      {
        id: TEL_ID,
        auth_user_id: null,
        nombre: "Facundo Jarma",
        telefono: "5491143614361",
        created_at: "2026-02-01T00:00:00.000Z",
      },
    ],
    emails: { [WEB_ID]: "facundo@example.com" },
    miembros: [
      { id: "m-web-a", persona_id: WEB_ID, obra_id: OBRA_A, rol: "Director" },
      { id: "m-web-b", persona_id: WEB_ID, obra_id: OBRA_B, rol: "Obrero" },
      { id: "m-tel-a", persona_id: TEL_ID, obra_id: OBRA_A, rol: "Director" },
    ],
    tareas: [
      { id: "t-1", asignado_a: "m-web-a", completada_por: null },
      { id: "t-2", asignado_a: null, completada_por: "m-web-b" },
      { id: "t-3", asignado_a: "m-tel-a", completada_por: null },
    ],
    favoritos: [{ persona_id: WEB_ID, proveedor_id: "prov-1" }],
    referencias: {
      "actividad.usuario_id": { [WEB_ID]: 2, [TEL_ID]: 3 },
      "mensajes.usuario_id": { [WEB_ID]: 10, [TEL_ID]: 44 },
      "movimientos_stock.usuario_id": { [WEB_ID]: 23, [TEL_ID]: 7 },
      "pedidos_materiales.solicitado_por": { [WEB_ID]: 4, [TEL_ID]: 5 },
      "pedidos_materiales.aprobado_por": { [WEB_ID]: 2 },
      "operaciones_bot.usuario_id": { [WEB_ID]: 25 },
      "tareas.created_by": { [WEB_ID]: 4 },
      "tareas.usuario_id": { [WEB_ID]: 4 },
    },
    auditoria: [],
    fksExtra: [],
    failAudit: null,
    nextMiembroId: 1,
    calls: [],
  };
}

let estado = crearEstado();

function matchPorTelefono(fila, variantes) {
  const digitos = String(fila.telefono ?? "").replace(/\D/g, "");
  return digitos && variantes.includes(digitos);
}

function contarReferenciasTabla(tabla, columna, valor) {
  const ref = estado.referencias[`${tabla}.${columna}`];
  if (ref) return ref[valor] ?? 0;
  if (tabla === "miembros_obra" && columna === "persona_id") {
    return estado.miembros.filter((miembro) => miembro.persona_id === valor).length;
  }
  if (tabla === "proveedores_favoritos" && columna === "persona_id") {
    return estado.favoritos.filter((favorito) => favorito.persona_id === valor).length;
  }
  return 0;
}

const dbFake = {
  async query(sql, params = []) {
    const consulta = String(sql).replace(/\s+/g, " ").trim();
    estado.calls.push({ sql: consulta, params });

    if (consulta === "BEGIN" || consulta === "COMMIT" || consulta === "ROLLBACK") {
      return { rows: [], rowCount: 0 };
    }

    if (consulta.startsWith("SELECT id, auth_user_id, nombre, telefono, created_at FROM personas")) {
      if (consulta.includes("WHERE id = ANY")) {
        const ids = params[0] ?? [];
        return { rows: estado.personas.filter((persona) => ids.includes(persona.id)) };
      }
      if (consulta.includes("WHERE auth_user_id = $1")) {
        return {
          rows: estado.personas.filter((persona) => persona.auth_user_id === params[0]),
        };
      }
      if (consulta.includes("regexp_replace")) {
        return {
          rows: estado.personas
            .filter((persona) => matchPorTelefono(persona, params[0] ?? []))
            .sort((a, b) => String(a.created_at).localeCompare(String(b.created_at))),
        };
      }
    }

    if (consulta.startsWith("SELECT id FROM personas WHERE regexp_replace")) {
      return {
        rows: estado.personas
          .filter((persona) => matchPorTelefono(persona, params[0] ?? []))
          .map((persona) => ({ id: persona.id })),
      };
    }

    if (consulta.includes("FROM personas p LEFT JOIN auth.users")) {
      return {
        rows: estado.personas.map((persona) => ({
          ...persona,
          email: estado.emails[persona.id] ?? null,
        })),
      };
    }

    if (consulta.startsWith("SELECT id, nombre, telefono, auth_user_id, created_at FROM personas")) {
      return { rows: [...estado.personas] };
    }

    if (consulta.startsWith("SELECT DISTINCT obra_id FROM miembros_obra")) {
      const ids = params[0] ?? [];
      const obras = [
        ...new Set(
          estado.miembros
            .filter((miembro) => ids.includes(miembro.persona_id))
            .map((miembro) => miembro.obra_id)
        ),
      ];
      return { rows: obras.map((obraId) => ({ obra_id: obraId })) };
    }

    if (consulta.includes("FROM miembros_obra WHERE persona_id = ANY")) {
      const ids = params[0] ?? [];
      return {
        rows: estado.miembros
          .filter((miembro) => ids.includes(miembro.persona_id))
          .sort(
            (a, b) =>
              String(a.obra_id).localeCompare(String(b.obra_id)) ||
              String(a.persona_id).localeCompare(String(b.persona_id))
          ),
      };
    }

    if (consulta.includes("FROM roles_obra")) {
      return { rows: [] };
    }

    if (consulta.includes("FROM information_schema")) {
      return { rows: [...TODAS_LAS_FKS, ...estado.fksExtra] };
    }

    if (consulta.includes("count(*)::int AS filas")) {
      const tabla = consulta.match(/FROM (\w+)/)?.[1];
      const columna = consulta.match(/WHERE (\w+) =/)?.[1];
      if (consulta.includes("= ANY($1::uuid[])")) {
        const ids = params[0] ?? [];
        const filas =
          tabla === "tareas"
            ? estado.tareas.filter((tarea) => ids.includes(tarea[columna])).length
            : 0;
        return { rows: [{ filas }] };
      }
      return { rows: [{ filas: contarReferenciasTabla(tabla, columna, params[0]) }] };
    }

    if (consulta.startsWith("UPDATE personas SET auth_user_id = NULL")) {
      const persona = estado.personas.find((fila) => fila.id === params[0]);
      if (persona) persona.auth_user_id = null;
      return { rows: [], rowCount: persona ? 1 : 0 };
    }

    if (consulta.startsWith("UPDATE personas SET auth_user_id = $1")) {
      const persona = estado.personas.find((fila) => fila.id === params[1]);
      if (persona) persona.auth_user_id = params[0];
      return { rows: [], rowCount: persona ? 1 : 0 };
    }

    if (consulta.startsWith("UPDATE personas SET telefono = $1")) {
      const persona = estado.personas.find((fila) => fila.id === params[1]);
      if (persona) persona.telefono = params[0];
      return { rows: [], rowCount: persona ? 1 : 0 };
    }

    if (consulta.startsWith("UPDATE miembros_obra SET rol")) {
      const miembro = estado.miembros.find((fila) => fila.id === params[1]);
      if (miembro) miembro.rol = params[0];
      return { rows: [], rowCount: miembro ? 1 : 0 };
    }

    if (consulta.startsWith("UPDATE ")) {
      const tabla = consulta.match(/^UPDATE (\w+)/)?.[1];
      const columna = consulta.match(/SET (\w+) = \$1/)?.[1];
      const destino = params[0];
      const origen = params[1];
      if (tabla === "tareas" && ["asignado_a", "completada_por"].includes(columna)) {
        let filas = 0;
        for (const tarea of estado.tareas) {
          if (tarea[columna] === origen) {
            tarea[columna] = destino;
            filas += 1;
          }
        }
        return { rows: [], rowCount: filas };
      }
      const ref = estado.referencias[`${tabla}.${columna}`];
      const filas = ref?.[origen] ?? 0;
      if (ref && filas > 0) {
        ref[destino] = (ref[destino] ?? 0) + filas;
        delete ref[origen];
      }
      return { rows: [], rowCount: filas };
    }

    if (consulta.startsWith("DELETE FROM miembros_obra WHERE persona_id")) {
      const antes = estado.miembros.length;
      estado.miembros = estado.miembros.filter((fila) => fila.persona_id !== params[0]);
      return { rows: [], rowCount: antes - estado.miembros.length };
    }

    if (consulta.startsWith("DELETE FROM proveedores_favoritos")) {
      const antes = estado.favoritos.length;
      estado.favoritos = estado.favoritos.filter((fila) => fila.persona_id !== params[0]);
      return { rows: [], rowCount: antes - estado.favoritos.length };
    }

    if (consulta.startsWith("DELETE FROM personas WHERE id")) {
      const antes = estado.personas.length;
      estado.personas = estado.personas.filter((fila) => fila.id !== params[0]);
      return { rows: [], rowCount: antes - estado.personas.length };
    }

    if (consulta.startsWith("INSERT INTO miembros_obra")) {
      const [personaId, obraId, rol] = params;
      const existente = estado.miembros.find(
        (fila) => fila.persona_id === personaId && fila.obra_id === obraId
      );
      if (existente) {
        existente.rol = rol;
        return { rows: [{ id: existente.id }], rowCount: 1 };
      }
      const nuevo = {
        id: `m-nuevo-${estado.nextMiembroId++}`,
        persona_id: personaId,
        obra_id: obraId,
        rol,
      };
      estado.miembros.push(nuevo);
      return { rows: [{ id: nuevo.id }], rowCount: 1 };
    }

    if (consulta.startsWith("INSERT INTO proveedores_favoritos")) {
      for (const favorito of estado.favoritos.filter((fila) => fila.persona_id === params[1])) {
        const yaExiste = estado.favoritos.some(
          (fila) => fila.persona_id === params[0] && fila.proveedor_id === favorito.proveedor_id
        );
        if (!yaExiste) {
          estado.favoritos.push({
            persona_id: params[0],
            proveedor_id: favorito.proveedor_id,
          });
        }
      }
      return { rows: [], rowCount: 1 };
    }

    if (consulta.startsWith("INSERT INTO personas_unificaciones")) {
      if (estado.failAudit) {
        const error = new Error("relation does not exist");
        error.code = estado.failAudit;
        throw error;
      }
      estado.auditoria.push({
        persona_origen: params[0],
        persona_destino: params[1],
        auth_user_id: params[2],
        telefono: params[3],
        snapshot: JSON.parse(params[4]),
        ejecutado_por: params[5],
      });
      return { rows: [], rowCount: 1 };
    }

    if (consulta.startsWith("INSERT INTO personas")) {
      const [authUserId, nombre, telefono] = params;
      const persona = {
        id: `persona-nueva-${estado.personas.length + 1}`,
        auth_user_id: authUserId,
        nombre,
        telefono,
        created_at: new Date().toISOString(),
      };
      estado.personas.push(persona);
      return { rows: [persona], rowCount: 1 };
    }

    throw new Error(`SQL no soportado por el fake: ${consulta}`);
  },
  release() {},
};

const poolConnectMock = mock(async () => dbFake);
const poolQueryMock = mock(async () => {
  throw new Error("pool.query no esperado: los tests pasan un client");
});

mock.module("../db.js", () => ({
  pool: { query: poolQueryMock, connect: poolConnectMock },
}));

beforeEach(() => {
  estado = crearEstado();
});

describe("normalización de teléfono", () => {
  test("el 9 de celular argentino no cambia la identidad", () => {
    expect(normalizarTelefonoPersona("5491143614361")).toBe("541143614361");
    expect(normalizarTelefonoPersona("+54 9 11 4361-4361")).toBe("541143614361");
    expect(normalizarTelefonoPersona("+54 11 4361 4361")).toBe("541143614361");
  });

  test("variantes cubre con y sin 9", () => {
    expect(variantesTelefono("5491143614361").sort()).toEqual(
      ["541143614361", "5491143614361"].sort()
    );
    expect(variantesTelefono("+54 11 4361 4361").sort()).toEqual(
      ["541143614361", "5491143614361"].sort()
    );
  });
});

describe("normalización de nombre", () => {
  test("ignora acentos, mayúsculas, espacios y el sufijo v. WEB", () => {
    expect(normalizarNombrePersona("Facundo  Jarma v. WEB")).toBe("facundo jarma");
    expect(normalizarNombrePersona("FACUNDO JARMA")).toBe("facundo jarma");
    expect(normalizarNombrePersona("José  Pérez")).toBe("jose perez");
  });
});

describe("datosPersonaDesdeAuthUser", () => {
  test("toma nombre y teléfono de la metadata de Supabase", () => {
    expect(
      datosPersonaDesdeAuthUser({
        email: "ana@example.com",
        user_metadata: { nombre: "Ana Pérez", telefono: "+54 9 11 1234 5678" },
      })
    ).toEqual({ nombre: "Ana Pérez", telefono: "+54 9 11 1234 5678" });
  });

  test("cae al local-part del email y a phone cuando no hay metadata", () => {
    expect(
      datosPersonaDesdeAuthUser({ email: "ana@example.com", phone: "5491100000000" })
    ).toEqual({ nombre: "ana", telefono: "5491100000000" });
  });
});

describe("auditoría de duplicados", () => {
  test("detecta el caso real (teléfono vs web) con roles y referencias", async () => {
    const { total, candidatos } = await auditarDuplicadosPersonas(dbFake);

    expect(total).toBe(1);
    const candidato = candidatos[0];
    expect(candidato.origen_id).toBe(WEB_ID);
    expect(candidato.destino_id).toBe(TEL_ID);
    expect(candidato.motivos).toContain("nombre");
    expect(candidato.requiere_revision).toBe(false);
    expect(candidato.origen.telefono).toBeNull();
    expect(candidato.destino.telefono).toBe("***4361");
    expect(candidato.origen.email).toBe("facundo@example.com");
    expect(candidato.miembros).toHaveLength(2);
    expect(candidato.conflictos).toEqual([]);
    expect(candidato.referencias).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ tabla: "mensajes", columna: "usuario_id", filas: 10 }),
        expect.objectContaining({ tabla: "miembros_obra", columna: "persona_id", filas: 2 }),
      ])
    );
  });
});

describe("plan de unificación", () => {
  test("arma el rol final por obra y cuenta referencias", async () => {
    const plan = await planificarUnificacion(dbFake, {
      origenId: WEB_ID,
      destinoId: TEL_ID,
    });

    expect(plan.conflictos).toEqual([]);
    expect(plan.miembros).toHaveLength(2);
    expect(plan.miembros).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          obra_id: OBRA_A,
          rol_origen: "Director",
          rol_destino: "Director",
          rol_final: "Director",
          miembro_origen_id: "m-web-a",
          miembro_destino_id: "m-tel-a",
        }),
        expect.objectContaining({
          obra_id: OBRA_B,
          rol_origen: "Obrero",
          rol_destino: null,
          rol_final: "Obrero",
          miembro_destino_id: null,
        }),
      ])
    );
    expect(plan.referencias).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ tabla: "tareas", columna: "asignado_a", filas: 1 }),
        expect.objectContaining({ tabla: "tareas", columna: "completada_por", filas: 1 }),
      ])
    );
  });

  test("conflicto si el destino ya tiene otra cuenta web", async () => {
    estado.personas.find((fila) => fila.id === TEL_ID).auth_user_id = OTRO_AUTH_ID;

    const plan = await planificarUnificacion(dbFake, {
      origenId: WEB_ID,
      destinoId: TEL_ID,
    });

    expect(plan.conflictos).toContain(
      "La persona de destino ya está vinculada a otra cuenta web"
    );
  });
});

describe("unificarPersonas", () => {
  test("migra FKs y membresías, remapea tareas y borra el origen", async () => {
    const resumen = await unificarPersonas({
      origenId: WEB_ID,
      destinoId: TEL_ID,
      ejecutadoPor: TEL_ID,
      client: dbFake,
    });

    expect(estado.personas.map((fila) => fila.id)).toEqual([TEL_ID]);
    const destino = estado.personas[0];
    expect(destino.auth_user_id).toBe(AUTH_ID);
    expect(destino.telefono).toBe("5491143614361");

    // Membresías: la de OBRA_A se conserva y se suma la de OBRA_B con su rol.
    expect(estado.miembros.filter((fila) => fila.persona_id === TEL_ID)).toHaveLength(2);
    const miembroB = estado.miembros.find(
      (fila) => fila.persona_id === TEL_ID && fila.obra_id === OBRA_B
    );
    expect(miembroB.rol).toBe("Obrero");

    // Tareas: las dos que apuntaban a membresías del origen ahora apuntan a las
    // membresías del destino (no se pierden asignaciones ni quién completó).
    const t1 = estado.tareas.find((fila) => fila.id === "t-1");
    const t2 = estado.tareas.find((fila) => fila.id === "t-2");
    expect(t1.asignado_a).toBe("m-tel-a");
    expect(t2.completada_por).toBe(miembroB.id);

    // FKs simples y favoritos.
    expect(estado.referencias["mensajes.usuario_id"][TEL_ID]).toBe(54);
    expect(estado.referencias["tareas.created_by"][TEL_ID]).toBe(4);
    expect(estado.favoritos).toEqual([{ persona_id: TEL_ID, proveedor_id: "prov-1" }]);

    // Auditoría con snapshot y resumen.
    expect(estado.auditoria).toHaveLength(1);
    expect(estado.auditoria[0].persona_origen).toBe(WEB_ID);
    expect(estado.auditoria[0].persona_destino).toBe(TEL_ID);
    expect(estado.auditoria[0].snapshot.miembros).toHaveLength(2);
    expect(resumen.total_movido).toBeGreaterThan(0);
    expect(resumen.destino.auth_user_id).toBe(AUTH_ID);
  });

  test("borra el origen antes de transferir el auth (CHECK personas_auth_or_phone_chk)", async () => {
    await unificarPersonas({
      origenId: WEB_ID,
      destinoId: TEL_ID,
      client: dbFake,
    });

    const limpiarAuth = estado.calls.find(({ sql }) =>
      sql.startsWith("UPDATE personas SET auth_user_id = NULL")
    );
    expect(limpiarAuth).toBeUndefined();

    const indiceDelete = estado.calls.findIndex(({ sql }) =>
      sql.startsWith("DELETE FROM personas WHERE id")
    );
    const indiceAuth = estado.calls.findIndex(({ sql }) =>
      sql.startsWith("UPDATE personas SET auth_user_id = $1")
    );
    expect(indiceDelete).toBeGreaterThan(-1);
    expect(indiceAuth).toBeGreaterThan(indiceDelete);
  });

  test("aborta si hay una FK desconocida y no borra nada", async () => {
    estado.fksExtra.push({
      table_schema: "public",
      table_name: "tabla_nueva",
      column_name: "persona_id",
      tabla_referida: "personas",
    });

    await expect(
      unificarPersonas({ origenId: WEB_ID, destinoId: TEL_ID, client: dbFake })
    ).rejects.toMatchObject({ code: "REFERENCIAS_DESCONOCIDAS" });

    expect(estado.personas).toHaveLength(2);
    expect(estado.miembros).toHaveLength(3);
    expect(estado.auditoria).toHaveLength(0);
  });

  test("aborta si falta la migración de auditoría", async () => {
    estado.failAudit = "42P01";

    await expect(
      unificarPersonas({ origenId: WEB_ID, destinoId: TEL_ID, client: dbFake })
    ).rejects.toMatchObject({ code: "MIGRACION_PENDIENTE" });
  });
});

describe("vincularPersonaAuth", () => {
  test("si existen las dos filas, unifica el teléfono con la cuenta web (solo con permiso explícito)", async () => {
    const persona = await vincularPersonaAuth({
      authUserId: AUTH_ID,
      nombre: "Facundo Jarma",
      telefono: "+54 9 11 4361-4361",
      permitirVinculoPorTelefono: true,
      client: dbFake,
    });

    expect(persona.id).toBe(TEL_ID);
    expect(persona.auth_user_id).toBe(AUTH_ID);
    expect(estado.personas).toHaveLength(1);
    expect(estado.auditoria).toHaveLength(1);
  });

  test("por defecto NO vincula por teléfono si ya existe otra persona (anti-takeover)", async () => {
    await expect(
      vincularPersonaAuth({
        authUserId: AUTH_ID,
        nombre: "Facundo Jarma",
        telefono: "+54 9 11 4361-4361",
        client: dbFake,
      })
    ).rejects.toMatchObject({ code: "TELEFONO_EN_USO" });

    expect(estado.personas).toHaveLength(2);
    expect(estado.auditoria).toHaveLength(0);
  });

  test("si solo existe el teléfono, no lo reclama sin permiso explícito", async () => {
    estado.personas = estado.personas.filter((fila) => fila.id === TEL_ID);

    await expect(
      vincularPersonaAuth({
        authUserId: AUTH_ID,
        nombre: "Facundo Jarma",
        telefono: "5491143614361",
        client: dbFake,
      })
    ).rejects.toMatchObject({ code: "TELEFONO_EN_USO" });

    expect(estado.personas[0].auth_user_id).toBeNull();
  });

  test("si solo existe el teléfono, completa auth_user_id sin crear otra fila (flujo confiable)", async () => {
    estado.personas = estado.personas.filter((fila) => fila.id === TEL_ID);

    const persona = await vincularPersonaAuth({
      authUserId: AUTH_ID,
      nombre: "Facundo Jarma",
      telefono: "5491143614361",
      permitirVinculoPorTelefono: true,
      client: dbFake,
    });

    expect(persona.id).toBe(TEL_ID);
    expect(persona.auth_user_id).toBe(AUTH_ID);
    expect(estado.personas).toHaveLength(1);
  });

  test("si solo existe la cuenta web, completa el teléfono", async () => {
    estado.personas = estado.personas.filter((fila) => fila.id === WEB_ID);

    const persona = await vincularPersonaAuth({
      authUserId: AUTH_ID,
      nombre: "Facundo Jarma",
      telefono: "5491143614361",
      client: dbFake,
    });

    expect(persona.id).toBe(WEB_ID);
    expect(persona.telefono).toBe("5491143614361");
  });

  test("si no existe ninguna, crea la persona", async () => {
    estado.personas = [];

    const persona = await vincularPersonaAuth({
      authUserId: AUTH_ID,
      nombre: "Persona Nueva",
      telefono: "5491100000000",
      client: dbFake,
    });

    expect(persona.auth_user_id).toBe(AUTH_ID);
    expect(persona.nombre).toBe("Persona Nueva");
    expect(estado.personas).toHaveLength(1);
  });

  test("si el teléfono pertenece a otra cuenta web, falla y no toca nada", async () => {
    estado.personas = [
      {
        id: OBRA_C,
        auth_user_id: OTRO_AUTH_ID,
        nombre: "Otra Persona",
        telefono: "5491143614361",
        created_at: "2026-01-01T00:00:00.000Z",
      },
    ];

    await expect(
      vincularPersonaAuth({
        authUserId: AUTH_ID,
        nombre: "Facundo Jarma",
        telefono: "5491143614361",
        client: dbFake,
      })
    ).rejects.toMatchObject({ code: "TELEFONO_EN_USO" });

    expect(estado.personas).toHaveLength(1);
    expect(estado.personas[0].auth_user_id).toBe(OTRO_AUTH_ID);
  });
});
