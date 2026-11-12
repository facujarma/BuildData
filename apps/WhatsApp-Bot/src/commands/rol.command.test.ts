// `!rol`: muestra el rol tal como lo manda el Backend (rol de sistema o rol
// personalizado de la obra) y los permisos efectivos de esa obra. Solo sin
// `permisos` cae a la matriz estática del rol (backend viejo).

import { afterAll, beforeEach, describe, expect, mock, test } from "bun:test";
import type { Message } from "../types/message.types";
import type { User } from "../types/api.types";

let respuesta: User | null = null;
const telefonos: string[] = [];

mock.module("../services/user.service", () => ({
  getUserObras: async (telefono: string) => {
    telefonos.push(telefono);
    return respuesta;
  },
  // El registry de mocks es global al proceso: si otro archivo importa este módulo
  // después, el mock tiene que exponer todos los exports que usa el bot.
  invalidateUserCache: () => {},
}));

const { rolCommand } = await import("./rol.command");

function makeMessage() {
  const textos: string[] = [];
  const message = {
    body: "!rol",
    from: "5491112345678",
    type: "text",
    hasMedia: false,
    reply: async (texto: string) => {
      textos.push(texto);
    },
    getContact: async () => ({ number: "5491112345678" }),
    downloadMedia: async () => undefined,
  } as unknown as Message;
  return { message, textos };
}

async function ejecutar(): Promise<string> {
  const { message, textos } = makeMessage();
  await rolCommand.execute(message, []);
  expect(textos.length).toBe(1);
  return textos[0];
}

beforeEach(() => {
  telefonos.length = 0;
  respuesta = null;
});

afterAll(() => {
  // El mock de módulo es global al proceso de `bun test`: se restaura al salir.
  mock.restore();
});

describe("!rol", () => {
  test("muestra los permisos efectivos de la obra y el rol personalizado", async () => {
    respuesta = {
      nombre: "Ana Pérez",
      telefono: "5491112345678",
      obras: [
        {
          obra_id: "obra-1",
          obra_nombre: "Torre A",
          rol: "Paisajista",
          permisos: ["tarea.crear", "foto.subir"],
        },
      ],
    };

    const texto = await ejecutar();

    expect(telefonos).toEqual(["5491112345678"]);
    expect(texto).toContain("🏗️ *Torre A*");
    expect(texto).toContain("Rol: *Paisajista*");
    expect(texto).toContain("• reportar tareas");
    expect(texto).toContain("• subir fotos a la galería");
    // No se completa con la matriz estática de ningún rol.
    expect(texto).not.toContain("ajustar stock");
    expect(texto).not.toContain("crear pedidos de compra");
    // Deja claro que los permisos son los de la obra, no los de la matriz.
    expect(texto).toContain("Permisos configurados en la obra.");
  });

  test("muestra las capacidades efectivas de los seis roles", async () => {
    const LABELS = {
      "stock.registrar": "registrar movimientos de stock",
      "stock.ajustar": "ajustar stock",
      "gasto.crear": "cargar gastos",
      "pedido.crear": "crear pedidos de compra",
      "pedido.entregar": "marcar pedidos como entregados",
      "tarea.crear": "reportar tareas",
      "tarea.completar": "completar tareas",
      "retraso.registrar": "registrar retrasos",
      "alerta.crear": "generar alertas",
      "foto.subir": "subir fotos a la galería",
    } as const;

    const casos: { rol: string; permisos: (keyof typeof LABELS)[] }[] = [
      { rol: "Cliente", permisos: [] },
      {
        rol: "Obrero",
        permisos: [
          "stock.registrar",
          "gasto.crear",
          "tarea.crear",
          "tarea.completar",
          "retraso.registrar",
          "alerta.crear",
          "foto.subir",
        ],
      },
      {
        rol: "Seguridad e Higiene",
        permisos: ["tarea.crear", "retraso.registrar", "alerta.crear", "foto.subir"],
      },
      { rol: "Capataz", permisos: Object.keys(LABELS) as (keyof typeof LABELS)[] },
      {
        rol: "Administrativo",
        permisos: ["stock.ajustar", "gasto.crear", "pedido.crear", "foto.subir"],
      },
      { rol: "Director", permisos: Object.keys(LABELS) as (keyof typeof LABELS)[] },
    ];

    const todos = Object.values(LABELS);

    for (const caso of casos) {
      respuesta = {
        nombre: "Ana Pérez",
        telefono: "5491112345678",
        obras: [
          {
            obra_id: "obra-1",
            obra_nombre: "Torre A",
            rol: caso.rol,
            permisos: [...caso.permisos],
          },
        ],
      };

      const texto = await ejecutar();
      const esperados = caso.permisos.map((permiso) => LABELS[permiso]);

      expect(texto).toContain(`👤 Rol: *${caso.rol}*`);
      for (const label of esperados) expect(texto).toContain(`  • ${label}`);
      for (const label of todos.filter((l) => !esperados.includes(l))) {
        expect(texto).not.toContain(`  • ${label}`);
      }
      if (esperados.length === 0) {
        expect(texto).toContain("Sin permisos de WhatsApp en esta obra.");
      }
    }
  });

  test("un rol sin permisos de WhatsApp lo dice en vez de dejar la lista vacía", async () => {
    respuesta = {
      nombre: "Cliente",
      telefono: "5491112345678",
      obras: [
        {
          obra_id: "obra-1",
          obra_nombre: "Torre A",
          rol: "Cliente",
          permisos: [],
        },
      ],
    };

    const texto = await ejecutar();

    expect(texto).toContain("Rol: *Cliente*");
    expect(texto).toContain("Sin permisos de WhatsApp en esta obra.");
    expect(texto).toContain("Permisos configurados en la obra.");
  });

  test("sin `permisos` (backend viejo) cae a la matriz estática del rol", async () => {
    respuesta = {
      nombre: "Ana Pérez",
      telefono: "5491112345678",
      obras: [
        {
          obra_id: "obra-1",
          obra_nombre: "Torre A",
          rol: "Director de obra",
        },
      ],
    };

    const texto = await ejecutar();

    // El rol libre viejo se muestra normalizado y con la matriz de Director.
    expect(texto).toContain("Rol: *Director*");
    expect(texto).toContain("• marcar pedidos como entregados");
    // Se advierte que son los permisos por defecto, no los de la obra.
    expect(texto).toContain("Permisos por defecto del rol.");
    expect(texto).not.toContain("Permisos configurados en la obra.");
  });

  test("sin `permisos` también cubre Capataz y Seguridad e Higiene", async () => {
    respuesta = {
      nombre: "Ana Pérez",
      telefono: "5491112345678",
      obras: [{ obra_id: "obra-1", obra_nombre: "Torre A", rol: "Capataz" }],
    };

    const capataz = await ejecutar();

    expect(capataz).toContain("Rol: *Capataz*");
    // Capataz: todo el catálogo del bot.
    expect(capataz).toContain("• marcar pedidos como entregados");
    expect(capataz).toContain("• registrar movimientos de stock");

    respuesta = {
      nombre: "Ana Pérez",
      telefono: "5491112345678",
      obras: [
        { obra_id: "obra-2", obra_nombre: "Torre B", rol: "Seguridad e Higiene" },
      ],
    };

    const seguridad = await ejecutar();

    expect(seguridad).toContain("Rol: *Seguridad e Higiene*");
    // Seguridad e Higiene: reporta tareas y alertas, no carga gastos.
    expect(seguridad).toContain("• reportar tareas");
    expect(seguridad).toContain("• generar alertas");
    expect(seguridad).not.toContain("• cargar gastos");
    expect(seguridad).not.toContain("• ajustar stock");
    expect(seguridad).not.toContain("• registrar movimientos de stock");
  });

  test("sin obras asociadas avisa y no llama a los permisos", async () => {
    respuesta = { nombre: "Ana", telefono: "5491112345678", obras: [] };

    const texto = await ejecutar();

    expect(texto).toContain("No tenés ninguna obra asociada a este número.");
  });
});
