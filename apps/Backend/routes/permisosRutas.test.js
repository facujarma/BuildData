// Cobertura del enforcement web: ninguna ruta del CRUD por obra puede quedar sin
// `exigirPermiso`, y cada una tiene que exigir la capacidad que dicta
// docs/roles-permisos.md §Enforcement web.
//
// Se inspecciona el router real de Express (no el texto del archivo): si mañana
// alguien agrega una ruta y no la clasifica acá, el test falla. Las rutas de la
// whitelist son las únicas que se autentican sin permiso (membresía en el
// controller o catálogo del usuario).

import { describe, expect, mock, test } from "bun:test";

mock.module("../db.js", () => ({
  pool: {
    query: async () => ({ rows: [] }),
    connect: async () => ({ query: async () => ({ rows: [] }), release() {} }),
  },
}));

mock.module("../supabaseClient.js", () => ({ supabase: {}, supabaseAdmin: {} }));

// Prefijo con el que server.js monta cada router.
const ROUTERS = [
  ["/", "./obras.js"],
  ["/", "./rubros.js"],
  ["/dashboard", "./dashboard.js"],
  ["/tareas", "./tareas.js"],
  ["/alertas", "./alertas.js"],
  ["/presupuestos", "./presupuestos.js"],
  ["/proveedores", "./proveedores.js"],
  ["/usuarios", "./usuarios.js"],
  ["/materiales", "./materiales.js"],
  ["/gastos", "./gastos.js"],
  ["/actividad", "./actividad.js"],
  ["/reportes", "./reportes.js"],
  ["/obreros", "./obreros.js"],
  ["/pedidos", "./pedidos.js"],
  ["/mensajes", "./mensajes.js"],
  ["/operaciones", "./operaciones.js"],
  ["/galeria", "./galeria.js"],
  ["/chat", "./chatbot.js"],
  ["/roles", "./roles.js"],
];

// `false` = ruta autenticada sin permiso de sección (whitelist explícita).
const ESPERADO = {
  // obras: el catálogo y el alta son de cualquier autenticado; la lectura y
  // `mi-rol` validan membresía en el controller (docs §Enforcement web).
  "GET /obras": false,
  "POST /obras": false,
  "GET /obras/:obraId/mi-rol": false,
  "GET /obras/:obraId": false,
  "PATCH /obras/:obraId/starred": false,
  "PATCH /obras/:obraId": "configuracion.editar",
  "DELETE /obras/:obraId": "configuracion.editar",
  "GET /obras/:obraId/rubros": "cronograma.ver",
  "POST /obras/:obraId/rubros": "configuracion.editar",
  "PATCH /obras/:obraId/rubros/:rubroId": "configuracion.editar",
  "DELETE /obras/:obraId/rubros/:rubroId": "configuracion.editar",

  "GET /dashboard/:obraId": "dashboard.ver",
  "POST /chat/consultar": "dashboard.ver",

  "GET /mensajes/:obraId": "bandeja.ver",
  "PATCH /operaciones/:id/aprobar": "bandeja.aprobar",
  "PATCH /operaciones/:id/rechazar": "bandeja.aprobar",
  "PATCH /operaciones/:id/reintentar": "bandeja.aprobar",

  "GET /tareas/:obra_id": "cronograma.ver",
  "POST /tareas": "cronograma.editar",
  "POST /tareas/:id/completar": "cronograma.editar",
  "PATCH /tareas/:id": "cronograma.editar",

  "GET /alertas/:obra_id": "alertas.ver",
  "POST /alertas": "alertas.gestionar",
  "PATCH /alertas/:id/resolver": "alertas.gestionar",

  "GET /presupuestos/:obra_id": "presupuesto.ver",
  "PUT /presupuestos/:obra_id/rubros": "presupuesto.editar",

  "GET /proveedores": "proveedores.ver",
  "POST /proveedores": "proveedores.gestionar",
  "POST /proveedores/vincular": "proveedores.gestionar",
  "PATCH /proveedores/:id": "proveedores.gestionar",
  "PATCH /proveedores/:id/favorito": "proveedores.gestionar",
  "POST /proveedores/:id/promover": "proveedores.gestionar",
  "DELETE /proveedores/:id": "proveedores.gestionar",

  "GET /usuarios/:obra_id": "equipo.ver",
  "POST /usuarios": "equipo.administrar",
  "POST /usuarios/asignar-obra": "equipo.administrar",
  "GET /obreros/:obra_id": "equipo.ver",
  "POST /obreros/asignar-obra": "equipo.administrar",
  "POST /obreros/invitacion": "equipo.administrar",
  "DELETE /obreros/:obrero_id/obra/:obra_id": "equipo.administrar",

  "GET /materiales/:obra_id": "stock.ver",
  "GET /materiales/:obra_id/categorias": "stock.ver",
  "POST /materiales": "stock.ajustar",
  "POST /materiales/categorias": "stock.ajustar",
  "POST /materiales/:id/ajuste": "stock.ajustar",
  "POST /materiales/:id/foto": "stock.ajustar",
  "PATCH /materiales/:id": "stock.ajustar",
  "DELETE /materiales/:id": "stock.ajustar",

  "GET /gastos/:obra_id": "recibos.ver",
  "POST /gastos": "recibos.gestionar",
  "PATCH /gastos/:id": "recibos.gestionar",
  "POST /gastos/:id/archivo": "recibos.gestionar",

  "GET /actividad/:obra_id": "actividad.ver",
  "POST /actividad": "actividad.registrar",

  "GET /reportes/:obra_id": "reportes.ver",
  "GET /reportes/:obra_id/snapshot": "reportes.ver",
  "POST /reportes/:obra_id/generar": "reportes.exportar",
  "POST /reportes": "reportes.exportar",

  "GET /pedidos/:obra_id": "pedidos.ver",
  "POST /pedidos": "pedidos.crear",
  "PATCH /pedidos/:id/aprobar": "pedidos.aprobar",
  "PATCH /pedidos/:id/rechazar": "pedidos.aprobar",
  "PATCH /pedidos/:id/estado": "pedidos.entregar",
  "PATCH /pedidos/:id/entregar": "pedidos.entregar",

  "GET /galeria/:obra_id": "galeria.ver",
  "POST /galeria/:obra_id": "galeria.gestionar",
  "DELETE /galeria/:id": "galeria.gestionar",

  "GET /roles/:obra_id": "roles.administrar",
  "POST /roles/:obra_id": "roles.administrar",
  "PATCH /roles/:obra_id/:rol_id": "roles.administrar",
  "DELETE /roles/:obra_id/:rol_id": "roles.administrar",
};

const METODOS = ["get", "post", "put", "patch", "delete"];

function unirRuta(montaje, ruta) {
  const completa = montaje === "/" ? ruta : `${montaje}${ruta}`;
  return completa.length > 1 && completa.endsWith("/") ? completa.slice(0, -1) : completa;
}

// Recorre los routers reales y devuelve { "METHOD /ruta": [handles] }.
async function rutasMontadas() {
  const rutas = {};
  for (const [montaje, archivo] of ROUTERS) {
    const { default: router } = await import(archivo);
    for (const capa of router.stack) {
      if (!capa.route) continue;
      const clave = unirRuta(montaje, capa.route.path);
      for (const metodo of METODOS) {
        if (capa.route.methods?.[metodo] !== true) continue;
        rutas[`${metodo.toUpperCase()} ${clave}`] = (capa.route.stack ?? []).map(
          (layer) => layer.handle
        );
      }
    }
  }
  return rutas;
}

describe("enforcement web: cobertura de rutas", () => {
  test("toda ruta web está clasificada y exige el permiso de la spec", async () => {
    const rutas = await rutasMontadas();

    // 1) Ninguna ruta descubierta queda sin clasificar (falla si se agrega una).
    for (const clave of Object.keys(rutas)) {
      expect({ ruta: clave, clasificada: clave in ESPERADO }).toEqual({
        ruta: clave,
        clasificada: true,
      });
    }

    // 2) Cada ruta clasificada existe y tiene el gate correcto.
    for (const [clave, permiso] of Object.entries(ESPERADO)) {
      const handles = rutas[clave];
      expect({ ruta: clave, existe: Array.isArray(handles) }).toEqual({
        ruta: clave,
        existe: true,
      });

      const primero = handles?.[0];
      if (permiso === false) {
        expect({ ruta: clave, gate: primero?.name }).toEqual({ ruta: clave, gate: expect.not.stringMatching(/^permisosWeb$/) });
      } else {
        expect({ ruta: clave, gate: primero?.name, permiso: primero?.permiso }).toEqual({
          ruta: clave,
          gate: "permisosWeb",
          permiso,
        });
      }
    }
  });
});
