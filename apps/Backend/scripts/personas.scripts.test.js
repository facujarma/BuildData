// Tests de las funciones puras de los scripts del issue #13 (sin base real).
//
// El merge transaccional lo cubre `services/personas.service.test.js`. Acá se
// verifica lo que aportan los scripts: parseo de flags, clasificación y
// resolución de identificadores (con fakes inyectados), formateo del plan y
// que el modo humano no filtre teléfonos completos.
//
// Importar los scripts no debe ejecutar `main()` ni tocar la DB: el guard de
// ejecución directa es parte de lo que se prueba implícitamente al importarlos.

import { describe, expect, test } from "bun:test";
import {
  construirFilas,
  filtrarPorObra,
  formatearDetalleReferencias,
  formatearRoles,
  formatearTabla,
  idCorto,
  parsearArgs as parsearArgsAuditoria,
  sumarReferencias,
} from "./auditar_personas.js";
import {
  buscarAuthPorEmail,
  clasificarIdentificador,
  enmascararTelefono,
  formatearPlan,
  formatearResumen,
  parsearArgs as parsearArgsMerge,
  resolverPersona,
  sanearPersona,
  validarArgs,
} from "./unificar_personas.js";

const WEB_ID = "11111111-1111-4111-8111-111111111111";
const TEL_ID = "22222222-2222-4222-8222-222222222222";
const AUTH_ID = "33333333-3333-4333-8333-333333333333";
const OBRA_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const OBRA_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

function candidato(extra = {}) {
  return {
    destino_id: TEL_ID,
    origen_id: WEB_ID,
    destino: {
      id: TEL_ID,
      nombre: "Facundo Jarma",
      telefono: "***4361",
      auth_user_id: null,
      email: null,
    },
    origen: {
      id: WEB_ID,
      nombre: "Facundo Jarma v. WEB",
      telefono: null,
      auth_user_id: AUTH_ID,
      email: "persona@example.com",
    },
    motivos: ["nombre"],
    requiere_revision: false,
    miembros: [],
    referencias: [],
    conflictos: [],
    ...extra,
  };
}

// ─────────────────────────────────────────────────────────────
// Auditoría: parseo y formateo
// ─────────────────────────────────────────────────────────────

describe("auditar_personas: parseo de flags", () => {
  test("sin flags usa los defaults", () => {
    const args = parsearArgsAuditoria(["node", "auditar_personas.js"]);
    expect(args).toMatchObject({ json: false, obra: null, estricto: false, ayuda: false });
    expect(args.errores).toEqual([]);
  });

  test("acepta --json, --estricto y --obra con UUID", () => {
    const args = parsearArgsAuditoria([
      "node",
      "auditar_personas.js",
      "--json",
      "--estricto",
      `--obra=${OBRA_A}`,
    ]);
    expect(args.json).toBe(true);
    expect(args.estricto).toBe(true);
    expect(args.obra).toBe(OBRA_A);
    expect(args.errores).toEqual([]);
  });

  test("rechaza --obra que no es UUID", () => {
    const args = parsearArgsAuditoria(["node", "auditar_personas.js", "--obra=no-es-uuid"]);
    expect(args.errores).toHaveLength(1);
    expect(args.errores[0]).toContain("--obra");
  });

  test("rechaza flags desconocidos", () => {
    const args = parsearArgsAuditoria(["node", "auditar_personas.js", "--telefonos"]);
    expect(args.errores).toEqual(["Argumento desconocido: --telefonos"]);
  });

  test("--ayuda no exige nada más", () => {
    expect(parsearArgsAuditoria(["node", "x", "-h"]).ayuda).toBe(true);
  });
});

describe("auditar_personas: filtros y conteos", () => {
  test("sin --obra devuelve todos los candidatos", () => {
    const candidatos = [candidato(), candidato({ destino_id: "otro" })];
    expect(filtrarPorObra(candidatos, null)).toHaveLength(2);
  });

  test("con --obra deja solo los pares con membresía en esa obra", () => {
    const enA = candidato({
      miembros: [
        {
          obra_id: OBRA_A,
          rol_origen: "Director",
          rol_destino: "Director",
          rol_final: "Director",
        },
      ],
    });
    const enB = candidato({
      miembros: [
        { obra_id: OBRA_B, rol_origen: "Obrero", rol_destino: null, rol_final: "Obrero" },
      ],
    });
    expect(filtrarPorObra([enA, enB], OBRA_A)).toEqual([enA]);
  });

  test("con --obra conserva los pares en conflicto usando las obras crudas", () => {
    // planificarUnificacion devuelve miembros: [] cuando hay conflictos; el
    // filtro no puede depender de eso o esconde justo lo que hay que revisar.
    const conflictivo = candidato({
      miembros: [],
      obras: [OBRA_A],
      conflictos: ["La persona de destino ya está vinculada a otra cuenta web"],
    });
    expect(filtrarPorObra([conflictivo], OBRA_A)).toEqual([conflictivo]);
    expect(filtrarPorObra([conflictivo], OBRA_B)).toEqual([]);
  });

  test("suma las referencias (incluye las que vienen vía miembros_obra)", () => {
    expect(
      sumarReferencias([
        { tabla: "mensajes", columna: "usuario_id", filas: 13 },
        { tabla: "tareas", columna: "asignado_a", filas: 4, via: "miembros_obra" },
        { tabla: "gastos", columna: "usuario_id", filas: 0 },
      ])
    ).toBe(17);
    expect(sumarReferencias()).toBe(0);
  });

  test("formatea los roles por obra mostrando origen→final", () => {
    expect(
      formatearRoles([
        { obra_id: OBRA_A, rol_origen: "Director", rol_final: "Director" },
        { obra_id: OBRA_B, rol_origen: null, rol_final: "Obrero" },
      ])
    ).toBe("aaaaaaaa Director→Director; bbbbbbbb —→Obrero");
    expect(formatearRoles([])).toBe("sin membresías");
  });

  test("id corto de 8 caracteres y guion para vacíos", () => {
    expect(idCorto(TEL_ID)).toBe("22222222");
    expect(idCorto(null)).toBe("—");
  });
});

describe("auditar_personas: tabla legible", () => {
  const columnas = [
    { titulo: "ID", clave: "id" },
    { titulo: "NOMBRE", clave: "nombre" },
    { titulo: "REFS", clave: "refs", alinearDerecha: true },
  ];

  test("arma encabezado, separador y filas alineadas", () => {
    const tabla = formatearTabla(
      [
        { id: "aaaa", nombre: "Ana", refs: "3" },
        { id: "bb", nombre: "Bernardo", refs: "12" },
      ],
      columnas
    );
    const lineas = tabla.split("\n");
    expect(lineas).toHaveLength(4);
    expect(lineas[0]).toContain("ID");
    expect(lineas[0]).toContain("NOMBRE");
    expect(lineas[1]).toBe("----  --------  ----");
    expect(lineas[2]).toContain("Ana");
    // La columna numérica se alinea a la derecha.
    expect(lineas[2].endsWith("   3")).toBe(true);
    expect(lineas[3].endsWith("  12")).toBe(true);
  });

  test("construirFilas usa el teléfono enmascarado tal como viene del servicio", () => {
    const [fila] = construirFilas([candidato()]);
    expect(fila.telefono).toBe("***4361");
    expect(fila.email).toBe("persona@example.com");
    expect(fila.revisar).toBe("no");
  });

  test("el detalle omite las referencias en cero", () => {
    const detalle = formatearDetalleReferencias(
      candidato({
        referencias: [
          { tabla: "mensajes", columna: "usuario_id", filas: 13 },
          { tabla: "gastos", columna: "usuario_id", filas: 0 },
        ],
      })
    );
    expect(detalle).toContain("mensajes.usuario_id");
    expect(detalle).not.toContain("gastos.usuario_id");
  });
});

// ─────────────────────────────────────────────────────────────
// Merge: parseo, clasificación y resolución
// ─────────────────────────────────────────────────────────────

describe("unificar_personas: clasificación de identificadores", () => {
  test("reconoce UUID, email y teléfonos con formato", () => {
    expect(clasificarIdentificador(TEL_ID)).toBe("uuid");
    expect(clasificarIdentificador("persona@example.com")).toBe("email");
    expect(clasificarIdentificador("5491143614361")).toBe("telefono");
    expect(clasificarIdentificador("+54 9 11 4361-4361")).toBe("telefono");
    expect(clasificarIdentificador("(011) 4361 4361")).toBe("telefono");
  });

  test("marca inválidos y vacíos", () => {
    expect(clasificarIdentificador("")).toBe("vacio");
    expect(clasificarIdentificador(null)).toBe("vacio");
    expect(clasificarIdentificador("persona@sin-dominio")).toBe("invalido");
    expect(clasificarIdentificador("nombre apellido")).toBe("invalido");
    expect(clasificarIdentificador("12345")).toBe("invalido");
  });

  test("enmascara dejando solo los últimos 4 dígitos", () => {
    expect(enmascararTelefono("5491143614361")).toBe("***4361");
    expect(enmascararTelefono("+54 9 11 4361-4361")).toBe("***4361");
    expect(enmascararTelefono(null)).toBeNull();
  });

  test("sanearPersona enmascara el teléfono antes de imprimir JSON", () => {
    const saneada = sanearPersona({
      id: TEL_ID,
      nombre: "Facundo Jarma",
      telefono: "5491143614361",
      auth_user_id: null,
    });
    expect(saneada.telefono).toBe("***4361");
    expect(saneada.id).toBe(TEL_ID);
    expect(sanearPersona(null)).toBeNull();
  });
});

describe("unificar_personas: parseo de flags", () => {
  test("por defecto es dry-run", () => {
    const args = parsearArgsMerge([
      "node",
      "unificar_personas.js",
      `--destino=${TEL_ID}`,
      "--origen=persona@example.com",
    ]);
    expect(args.aplicar).toBe(false);
    expect(args.dryRun).toBe(false); // el default se resuelve por ausencia de --aplicar
    expect(args.destino).toBe(TEL_ID);
    expect(args.origen).toBe("persona@example.com");
    expect(validarArgs(args)).toEqual([]);
  });

  test("lee --aplicar, --si y --ejecutado-por", () => {
    const args = parsearArgsMerge([
      "node",
      "unificar_personas.js",
      "--destino=5491143614361",
      `--origen=${WEB_ID}`,
      "--aplicar",
      "--si",
      `--ejecutado-por=${TEL_ID}`,
      "--json",
    ]);
    expect(args.aplicar).toBe(true);
    expect(args.si).toBe(true);
    expect(args.json).toBe(true);
    expect(args.ejecutadoPor).toBe(TEL_ID);
    expect(validarArgs(args)).toEqual([]);
  });

  test("--aplicar y --dry-run son excluyentes", () => {
    const args = parsearArgsMerge([
      "node",
      "x",
      `--destino=${TEL_ID}`,
      `--origen=${WEB_ID}`,
      "--aplicar",
      "--dry-run",
    ]);
    expect(validarArgs(args).some((error) => error.includes("excluyentes"))).toBe(true);
  });

  test("rechaza flags desconocidos", () => {
    const args = parsearArgsMerge(["node", "x", "--force"]);
    expect(args.errores).toEqual(["Argumento desconocido: --force"]);
  });
});

describe("unificar_personas: validación de la combinación", () => {
  const base = { errores: [], ejecutadoPor: null };

  test("destino teléfono y origen email es válido", () => {
    expect(
      validarArgs({ ...base, destino: "5491143614361", origen: "persona@example.com" })
    ).toEqual([]);
  });

  test("destino email no es un identificador aceptado", () => {
    const errores = validarArgs({ ...base, destino: "persona@example.com", origen: WEB_ID });
    expect(errores.some((error) => error.includes("--destino"))).toBe(true);
  });

  test("origen teléfono no es un identificador aceptado", () => {
    const errores = validarArgs({ ...base, destino: TEL_ID, origen: "5491143614361" });
    expect(errores.some((error) => error.includes("--origen"))).toBe(true);
  });

  test("exige los dos flags y un --ejecutado-por UUID", () => {
    const errores = validarArgs({ ...base, destino: null, origen: null, ejecutadoPor: "nope" });
    expect(errores).toHaveLength(3);
    expect(errores.join(" ")).toContain("--destino");
    expect(errores.join(" ")).toContain("--origen");
    expect(errores.join(" ")).toContain("--ejecutado-por");
  });

  test("rechaza destino y origen iguales", () => {
    const errores = validarArgs({ ...base, destino: TEL_ID, origen: TEL_ID });
    expect(errores.some((error) => error.includes("mismo valor"))).toBe(true);
  });
});

describe("unificar_personas: resolución contra la DB (fakes)", () => {
  const servicioFake = {
    buscarPersonaPorTelefono: async (_db, telefono) =>
      String(telefono).replace(/\D/g, "").endsWith("43614361") ? { id: TEL_ID, telefono } : null,
    buscarPersonaPorAuthUserId: async (_db, authUserId) =>
      authUserId === AUTH_ID ? { id: WEB_ID, auth_user_id: authUserId } : null,
  };

  const dbFake = {
    query: async (_sql, [email]) => ({
      rows: email === "persona@example.com" ? [{ id: AUTH_ID, email }] : [],
    }),
  };

  test("un UUID se usa tal cual, sin consultar", async () => {
    const resuelto = await resolverPersona(dbFake, TEL_ID, "destino", servicioFake);
    expect(resuelto).toEqual({ id: TEL_ID, via: "uuid", persona: null });
  });

  test("un teléfono resuelve a la persona del bot", async () => {
    const resuelto = await resolverPersona(dbFake, "+54 9 11 4361-4361", "destino", servicioFake);
    expect(resuelto.id).toBe(TEL_ID);
    expect(resuelto.via).toBe("telefono");
  });

  test("un teléfono inexistente falla con el número enmascarado", async () => {
    let mensaje = "";
    try {
      await resolverPersona(dbFake, "5491100000000", "destino", servicioFake);
    } catch (error) {
      mensaje = error.message;
    }
    expect(mensaje).toContain("***0000");
    expect(mensaje).not.toContain("5491100000000");
  });

  test("un email resuelve auth.users → personas.auth_user_id", async () => {
    const resuelto = await resolverPersona(dbFake, "persona@example.com", "origen", servicioFake);
    expect(resuelto.id).toBe(WEB_ID);
    expect(resuelto.via).toBe("email");
    expect(resuelto.auth.id).toBe(AUTH_ID);
  });

  test("un email sin cuenta web falla", async () => {
    await expect(
      resolverPersona(dbFake, "nadie@example.com", "origen", servicioFake)
    ).rejects.toThrow("No existe una cuenta web");
  });

  test("una cuenta web sin persona asociada falla", async () => {
    const servicioSinPersona = {
      ...servicioFake,
      buscarPersonaPorAuthUserId: async () => null,
    };
    await expect(
      resolverPersona(dbFake, "persona@example.com", "origen", servicioSinPersona)
    ).rejects.toThrow("no tiene una persona asociada");
  });

  test("buscarAuthPorEmail compara el email sin distinguir mayúsculas", async () => {
    let sqlRecibido = "";
    const db = {
      query: async (sql) => {
        sqlRecibido = sql;
        return { rows: [] };
      },
    };
    await buscarAuthPorEmail(db, "Persona@Example.com");
    expect(sqlRecibido).toContain("lower(email) = lower($1)");
  });
});

// ─────────────────────────────────────────────────────────────
// Merge: salida humana
// ─────────────────────────────────────────────────────────────

describe("unificar_personas: plan y resumen legibles", () => {
  const plan = {
    origen: {
      id: WEB_ID,
      nombre: "Facundo Jarma v. WEB",
      telefono: null,
      auth_user_id: AUTH_ID,
    },
    destino: {
      id: TEL_ID,
      nombre: "Facundo Jarma",
      telefono: "5491143614361",
      auth_user_id: null,
    },
    miembros: [
      {
        obra_id: OBRA_A,
        miembro_origen_id: "m-web-a",
        miembro_destino_id: "m-tel-a",
        rol_origen: "Director",
        rol_destino: "Director",
        rol_final: "Director",
        nivel_final: 40,
      },
      {
        obra_id: OBRA_B,
        miembro_origen_id: "m-web-b",
        miembro_destino_id: null,
        rol_origen: "Obrero",
        rol_destino: null,
        rol_final: "Obrero",
        nivel_final: 10,
      },
    ],
    referencias: [
      { tabla: "chat_consultas", columna: "persona_id", filas: 13 },
      { tabla: "movimientos_stock", columna: "usuario_id", filas: 23 },
      { tabla: "gastos", columna: "usuario_id", filas: 0 },
    ],
    conflictos: [],
  };

  test("muestra las dos personas, las membresías y los totales", () => {
    const texto = formatearPlan(plan);
    expect(texto).toContain("ORIGEN  (se elimina)  11111111");
    expect(texto).toContain("DESTINO (se conserva) 22222222");
    expect(texto).toContain("obra aaaaaaaa");
    expect(texto).toContain("→ Director");
    expect(texto).toContain("(se crea la membresía)");
    expect(texto).toContain("Referencias a mover (36 filas)");
    expect(texto).toContain("Conflictos: ninguno.");
    // La referencia en cero no se lista.
    expect(texto).not.toContain("gastos.usuario_id");
  });

  test("nunca imprime el teléfono completo", () => {
    const texto = formatearPlan(plan);
    expect(texto).toContain("***4361");
    expect(texto).not.toContain("5491143614361");
  });

  test("lista los conflictos cuando hay", () => {
    const texto = formatearPlan({
      ...plan,
      miembros: [],
      referencias: [],
      conflictos: ["La persona de origen no tiene una cuenta web (auth_user_id)"],
    });
    expect(texto).toContain("Conflictos (1):");
    expect(texto).toContain("no tiene una cuenta web");
  });

  test("resume el resultado del merge", () => {
    const texto = formatearResumen({
      origen: plan.origen,
      destino: { ...plan.destino, auth_user_id: AUTH_ID },
      miembros: plan.miembros,
      referencias: [{ tabla: "mensajes", columna: "usuario_id", filas: 10 }],
      total_movido: 10,
      ejecutado_por: null,
    });
    expect(texto).toContain("Merge aplicado.");
    expect(texto).toContain("(eliminada)");
    expect(texto).toContain("web: " + AUTH_ID);
    expect(texto).toContain("filas movidas: 10");
    expect(texto).toContain("personas_unificaciones");
  });
});
