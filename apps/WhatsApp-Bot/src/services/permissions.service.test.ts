import { describe, expect, test } from "bun:test";
import {
  ENDPOINT_PERMISOS,
  PERMISOS,
  PERMISO_LABELS,
  ROLES,
  nombreRolVisible,
  normalizarRol,
  origenPermisosDeObra,
  puede,
  puedeAprobar,
  puedeConPermisos,
  puedeOperar,
  puedeOperarConPermisos,
  permisoDeEndpoint,
  permisosDe,
  permisosDeObra,
} from "./permissions.service";

// Lista ordenada de permisos bot de un rol de la matriz estática.
function claves(rol: string): string[] {
  return permisosDe(rol)
    .map((permiso) => permiso.permiso)
    .sort();
}

describe("normalizarRol", () => {
  test("null/vacío cae en Obrero", () => {
    expect(normalizarRol(null)).toBe("Obrero");
    expect(normalizarRol(undefined)).toBe("Obrero");
    expect(normalizarRol("")).toBe("Obrero");
  });

  test("los seis roles canónicos se conservan", () => {
    expect(normalizarRol("Cliente")).toBe("Cliente");
    expect(normalizarRol("Obrero")).toBe("Obrero");
    expect(normalizarRol("Seguridad e Higiene")).toBe("Seguridad e Higiene");
    expect(normalizarRol("Capataz")).toBe("Capataz");
    expect(normalizarRol("Administrativo")).toBe("Administrativo");
    expect(normalizarRol("Director")).toBe("Director");
  });

  test("los valores viejos de la web se mapean como en el Backend", () => {
    expect(normalizarRol("Director de obra")).toBe("Director");
    // Cambio de mapeo: antes "Compras" era Capataz.
    expect(normalizarRol("Compras")).toBe("Administrativo");
    expect(normalizarRol("Administración")).toBe("Administrativo");
    expect(normalizarRol("Seguridad e higiene")).toBe("Seguridad e Higiene");
    // "Cliente" ya no cae en Director.
    expect(normalizarRol("cliente")).toBe("Cliente");
    expect(normalizarRol("Sin asignar")).toBe("Obrero");
    expect(normalizarRol("Rey de la obra")).toBe("Obrero");
  });
});

describe("ROLES", () => {
  test("son los seis roles de sistema, en orden ascendente de nivel", () => {
    expect(ROLES).toEqual([
      "Cliente",
      "Obrero",
      "Seguridad e Higiene",
      "Capataz",
      "Administrativo",
      "Director",
    ]);
  });

  test("PERMISOS solo referencia roles y permisos del catálogo", () => {
    for (const [permiso, roles] of Object.entries(PERMISOS)) {
      expect(PERMISO_LABELS[permiso]).toBeString();
      for (const rol of roles) expect(ROLES).toContain(rol);
    }
    for (const permiso of Object.values(ENDPOINT_PERMISOS)) {
      expect(PERMISO_LABELS[permiso]).toBeString();
    }
  });
});

describe("matriz bot (docs/roles-permisos.md)", () => {
  test("Cliente no tiene ningún permiso de WhatsApp", () => {
    expect(claves("Cliente")).toEqual([]);
  });

  test("Obrero registra el día a día pero no ajusta stock ni maneja pedidos", () => {
    expect(claves("Obrero")).toEqual([
      "alerta.crear",
      "foto.subir",
      "gasto.crear",
      "retraso.registrar",
      "stock.registrar",
      "tarea.completar",
      "tarea.crear",
    ]);
    expect(puede("Obrero", "stock.ajustar")).toBe(false);
    expect(puede("Obrero", "pedido.crear")).toBe(false);
    expect(puede("Obrero", "pedido.entregar")).toBe(false);
  });

  test("Seguridad e Higiene: solo tareas, retrasos, alertas y fotos", () => {
    expect(claves("Seguridad e Higiene")).toEqual([
      "alerta.crear",
      "foto.subir",
      "retraso.registrar",
      "tarea.crear",
    ]);
  });

  test("Capataz puede todo lo del bot", () => {
    expect(claves("Capataz")).toEqual(Object.keys(PERMISOS).sort());
    expect(puede("Capataz", "stock.ajustar")).toBe(true);
    expect(puede("Capataz", "pedido.entregar")).toBe(true);
  });

  test("Administrativo ajusta stock y compra, pero no entrega pedidos", () => {
    expect(claves("Administrativo")).toEqual([
      "foto.subir",
      "gasto.crear",
      "pedido.crear",
      "stock.ajustar",
    ]);
    expect(puede("Administrativo", "pedido.crear")).toBe(true);
    expect(puede("Administrativo", "pedido.entregar")).toBe(false);
    // No reporta el día a día desde el campo.
    expect(puede("Administrativo", "stock.registrar")).toBe(false);
    expect(puede("Administrativo", "tarea.completar")).toBe(false);
  });

  test("Director puede todo", () => {
    expect(claves("Director")).toEqual(Object.keys(PERMISOS).sort());
  });
});

describe("puedeConPermisos", () => {
  test("usa la lista efectiva del Backend cuando viene (override dinámico)", () => {
    expect(puedeConPermisos(["pedido.crear"], "pedido.crear", "Obrero")).toBe(true);
    // Un rol personalizado puede tener permisos que su equivalente no tiene.
    expect(puedeConPermisos(["stock.ajustar"], "stock.ajustar", "Cliente")).toBe(true);
    // Y al revés: un permiso que la matriz del rol da por defecto se puede quitar.
    expect(puedeConPermisos([], "stock.registrar", "Capataz")).toBe(false);
    expect(puedeConPermisos(["foto.subir"], "stock.registrar", "Capataz")).toBe(false);
  });

  test("cae a la matriz estática si el Backend no manda permisos", () => {
    expect(puedeConPermisos(undefined, "pedido.crear", "Obrero")).toBe(false);
    expect(puedeConPermisos(undefined, "pedido.crear", "Capataz")).toBe(true);
    // Un rol libre viejo se normaliza antes de mirar la matriz.
    expect(puedeConPermisos(undefined, "pedido.crear", "Director de obra")).toBe(true);
    expect(puedeConPermisos(undefined, "pedido.crear", "Rey de la obra")).toBe(false);
  });
});

describe("puedeOperar / puedeOperarConPermisos", () => {
  test("endpoint permitido/bloqueado por rol", () => {
    expect(puedeOperar("Obrero", "/bot/pedidos/entregar")).toBe(false);
    expect(puedeOperar("Capataz", "/bot/pedidos/entregar")).toBe(true);
    expect(puedeOperar("Obrero", "/bot/alertas")).toBe(true);
  });

  test("la lista efectiva manda sobre la matriz por defecto", () => {
    expect(puedeOperarConPermisos(["pedido.entregar"], "/bot/pedidos/entregar", "Obrero")).toBe(true);
    expect(puedeOperarConPermisos([], "/bot/pedidos/entregar", "Director")).toBe(false);
    expect(puedeOperarConPermisos(undefined, "/bot/pedidos/entregar", "Obrero")).toBe(false);
    expect(puedeOperarConPermisos(undefined, "/bot/pedidos/entregar", "Director")).toBe(true);
  });

  test("fail closed con endpoint sin mapear", () => {
    expect(puedeOperar("Director", "/bot/nuevo")).toBe(false);
    expect(permisoDeEndpoint("/bot/nuevo")).toBeNull();
    expect(puedeOperarConPermisos(["pedido.crear"], "/bot/nuevo", "Director")).toBe(false);
    expect(puedeOperarConPermisos(undefined, "/bot/nuevo", "Director")).toBe(false);
  });
});

describe("ENDPOINT_PERMISOS", () => {
  test("POST /bot/galeria exige foto.subir (espejo del Backend)", () => {
    // Si el Backend mapea un endpoint nuevo y el espejo del bot no lo acompaña,
    // el bot avisa mal antes de confirmar: este test fija la paridad de /bot/galeria.
    expect(ENDPOINT_PERMISOS["/bot/galeria"]).toBe("foto.subir");
    expect(permisoDeEndpoint("/bot/galeria")).toEqual({
      permiso: "foto.subir",
      label: "subir fotos a la galería",
    });
    expect(puedeOperar("Obrero", "/bot/galeria")).toBe(true);
    expect(puedeOperar("Capataz", "/bot/galeria")).toBe(true);
    expect(puedeOperar("Administrativo", "/bot/galeria")).toBe(true);
    expect(puedeOperar("Director", "/bot/galeria")).toBe(true);
    // Cliente no opera desde WhatsApp.
    expect(puedeOperar("Cliente", "/bot/galeria")).toBe(false);
  });
});

describe("permisosDeObra (!rol)", () => {
  test("usa los permisos efectivos de la obra cuando vienen", () => {
    const permisos = permisosDeObra({
      rol: "Paisajista",
      permisos: ["foto.subir", "tarea.crear"],
    });
    // Orden del catálogo, no el de la lista que manda el Backend.
    expect(permisos.map((p) => p.permiso)).toEqual(["tarea.crear", "foto.subir"]);
    expect(permisos[0].label).toBe("reportar tareas");
  });

  test("cae a la matriz estática si el Backend no manda la lista", () => {
    const permisos = permisosDeObra({ rol: "Capataz" })
      .map((p) => p.permiso)
      .sort();
    expect(permisos).toEqual(claves("Capataz"));
  });

  test("un array vacío no inventa permisos", () => {
    expect(permisosDeObra({ rol: "Director", permisos: [] })).toEqual([]);
  });

  test("ignora las keys que el bot no conoce", () => {
    const permisos = permisosDeObra({
      rol: "Rol del futuro",
      permisos: ["tarea.crear", "permiso.nuevo"],
    });
    expect(permisos.map((p) => p.permiso)).toEqual(["tarea.crear"]);
  });
});

describe("origenPermisosDeObra (!rol)", () => {
  test("distingue los permisos configurados en la obra de la matriz por defecto", () => {
    expect(origenPermisosDeObra({ permisos: [] })).toBe("obra");
    expect(origenPermisosDeObra({ permisos: ["tarea.crear"] })).toBe("obra");
    expect(origenPermisosDeObra({})).toBe("matriz");
    expect(origenPermisosDeObra(undefined)).toBe("matriz");
    expect(origenPermisosDeObra(null)).toBe("matriz");
  });
});

describe("nombreRolVisible", () => {
  test("muestra el rol tal cual cuando el Backend manda permisos", () => {
    expect(nombreRolVisible("Paisajista", [])).toBe("Paisajista");
    expect(nombreRolVisible("Seguridad e Higiene", ["alerta.crear"])).toBe(
      "Seguridad e Higiene",
    );
    expect(nombreRolVisible("  Capataz  ", ["pedido.crear"])).toBe("Capataz");
  });

  test("normaliza el texto libre de un backend viejo", () => {
    expect(nombreRolVisible("Director de obra")).toBe("Director");
    expect(nombreRolVisible("Compras")).toBe("Administrativo");
    expect(nombreRolVisible("Capataz", undefined)).toBe("Capataz");
    expect(nombreRolVisible(undefined)).toBe("Obrero");
    expect(nombreRolVisible("")).toBe("Obrero");
  });
});

describe("puedeAprobar (compat)", () => {
  test("solo supervisión aprueba", () => {
    // Compat: la política real es el permiso web `bandeja.aprobar` del Backend.
    expect(puedeAprobar("Obrero")).toBe(false);
    expect(puedeAprobar("Capataz")).toBe(true);
    expect(puedeAprobar("Director de obra")).toBe(true);
  });
});
