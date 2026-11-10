// Tests del gate "no podés invitar con un rol superior al tuyo" de
// POST /obreros/invitacion (crearInvitacionWeb).
//
// Con la matriz actual ese 403 es inalcanzable: puedeAdministrarEquipo solo deja
// pasar a Director, y un Director puede asignar cualquier rol. La rama existe como
// defensa para cuando la matriz habilite a Capataz (ver permisos.service.js).
// Para ejercitarla se mockea permisos.service con una matriz FUTURA (Capataz y
// Obrero administran) y la misma jerarquía Obrero < Capataz < Director.
// El test es significativo: si el controller deja de llamar a puedeAsignarRol (o
// de cortar antes de crearInvitacion), el caso "superior" responde 201 y falla.
//
// No se toca la base real: db, obraAccess e invitaciones están mockeados.
// IMPORTANTE: requiere `bun test --isolate` (script y CI): sin isolate, el mock de
// permisos.service.js se filtra a obrerosController.test.js y rompe sus 3 casos.

import { beforeEach, describe, expect, mock, test } from "bun:test";

const OBRA_ID = "0b7c1f5e-1a2b-4c3d-8e9f-0123456789ab";
const PERSONA_ID = "1c8d2e6f-2b3c-4d4e-9f00-123456789abc";

const NIVEL_ROL = { Obrero: 1, Capataz: 2, Director: 3 };

const estado = {
  rolLlamante: "Capataz",
  invitaciones: [],
};

const rolEnObraMock = mock(async () => estado.rolLlamante);
const crearInvitacionMock = mock(async (datos) => {
  estado.invitaciones.push(datos);
  return { id: "inv-1", token: "v1.token", expira_at: "2026-11-17T12:00:00.000Z" };
});

// Matriz futura: cualquiera de los tres roles administra el equipo. La jerarquía
// de asignación se mantiene igual que la real.
mock.module("../services/permisos.service.js", () => {
  const normalizarRol = (rol) => {
    const r = String(rol ?? "").trim().toLowerCase();
    if (!r) return "Obrero";
    if (r.includes("director")) return "Director";
    if (r.includes("capataz")) return "Capataz";
    return "Obrero";
  };
  return {
    normalizarRol,
    puedeAdministrarEquipo: () => true,
    puedeAsignarRol: (rolLlamante, rolObjetivo) =>
      NIVEL_ROL[normalizarRol(rolObjetivo)] <= NIVEL_ROL[normalizarRol(rolLlamante)],
  };
});

mock.module("../db.js", () => ({
  pool: {
    query: async () => {
      throw new Error("pool.query no esperado en crearInvitacionWeb");
    },
    connect: async () => {
      throw new Error("pool.connect no esperado en crearInvitacionWeb");
    },
  },
}));

mock.module("../services/obraAccess.service.js", () => ({
  rolEnObra: rolEnObraMock,
  esMiembroDeObra: async () => true,
}));

mock.module("../services/invitaciones.service.js", () => ({
  crearInvitacion: crearInvitacionMock,
  consumirInvitacion: async () => ({ ok: true }),
}));

const { crearInvitacionWeb } = await import("./obrerosController.js");

function resFalso() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

async function invitar({ rolLlamante, rol, nombre = "Ana Pérez" }) {
  estado.rolLlamante = rolLlamante;
  const res = resFalso();
  await crearInvitacionWeb(
    { personaId: PERSONA_ID, body: { obra_id: OBRA_ID, nombre, telefono: "5491112345678", rol } },
    res,
  );
  return res;
}

beforeEach(() => {
  estado.rolLlamante = "Capataz";
  estado.invitaciones.length = 0;
  rolEnObraMock.mockClear();
  crearInvitacionMock.mockClear();
});

describe("crearInvitacionWeb — jerarquía de roles (matriz futura)", () => {
  test("Capataz que invita como 'Director': 403 y no se crea la invitación", async () => {
    const res = await invitar({ rolLlamante: "Capataz", rol: "Director" });

    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({ error: "No podés invitar con un rol superior al tuyo" });
    expect(crearInvitacionMock).not.toHaveBeenCalled();
  });

  test("Obrero que invita como 'Capataz': 403 y no se crea la invitación", async () => {
    const res = await invitar({ rolLlamante: "Obrero", rol: "Capataz" });

    expect(res.statusCode).toBe(403);
    expect(res.body.error).toContain("superior");
    expect(crearInvitacionMock).not.toHaveBeenCalled();
  });

  test("control: Capataz que invita como 'Capataz' (mismo nivel) sí crea la invitación", async () => {
    const res = await invitar({ rolLlamante: "Capataz", rol: "Capataz" });

    expect(res.statusCode).toBe(201);
    expect(crearInvitacionMock).toHaveBeenCalledTimes(1);
    expect(estado.invitaciones[0].rol).toBe("Capataz");
  });
});
