// Enforcement de la matriz `web.*` en las rutas del Backend.
//
// Cada ruta web se protege con `exigirPermiso(permiso, resolverObra)`:
//   1. el resolver saca la obra del pedido (param, body/query o el propio recurso);
//   2. `perfilEnObra` resuelve el rol del que llama en esa obra (roles_obra);
//   3. sin membresía → 403 SIN_MEMBRESIA; con membresía pero sin permiso → 403
//      SIN_PERMISO con `permiso` y `rol` (contrato de docs/roles-permisos.md).
//
// Los controllers siguen haciendo su chequeo de membresía (defensa en profundidad),
// pero este middleware corre antes: ningún rechazo por rol se arma en el controller.
//
// Los resolvers son funciones puras respecto de `req` salvo las que consultan el
// recurso (`obraDePedido`, `obraDeMaterial`, …). Distinguen dos casos:
// - el pedido no trae el contexto obligatorio (body/query) → 400;
// - el recurso no existe (o el id no es un uuid) → null → 404 en el middleware.

import { pool } from "../db.js";
import { CATALOGO_PERMISOS, perfilEnObra } from "../services/roles.service.js";

// Catálogo cerrado: un permiso que no existe revienta al montar la ruta en vez de
// bloquearla en silencio para siempre.
const CLAVES_WEB = new Set(CATALOGO_PERMISOS.web.map((permiso) => permiso.key));
const ETIQUETAS = Object.fromEntries(
  CATALOGO_PERMISOS.web.map((permiso) => [permiso.key, permiso.label])
);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Texto legible del permiso, para el mensaje del 403 ("…no puede aprobar pedidos").
export function labelDePermiso(permiso) {
  return ETIQUETAS[permiso] ?? permiso;
}

// Error con status HTTP que el middleware traduce a JSON (400 por contexto faltante).
function errorHttp(status, code, message) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

function esUuid(valor) {
  return typeof valor === "string" && UUID_RE.test(valor);
}

// Cuerpo del 403 por falta de permiso. Es un contrato con el frontend (cartel de
// sección bloqueada) y con docs/roles-permisos.md §API, así que viajan las dos
// nomenclaturas: `capacidad`/`mensaje` del issue #8 y `permiso`/`message`/`rol`
// de la spec. `rol` permite mostrar "Tu rol X no puede …" sin otra llamada.
function cuerpoSinPermiso({ permiso, rol }) {
  const mensaje = `Tu rol ${rol} no puede ${labelDePermiso(permiso)}`;
  return {
    code: "SIN_PERMISO",
    capacidad: permiso,
    mensaje,
    permiso,
    message: mensaje,
    rol,
  };
}

// ─────────────────────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────────────────────

export function exigirPermiso(permiso, resolverObra) {
  if (!CLAVES_WEB.has(permiso)) {
    throw new Error(`Permiso web desconocido: ${permiso}`);
  }
  if (typeof resolverObra !== "function") {
    throw new Error(`exigirPermiso(${permiso}) necesita un resolver de obra`);
  }

  const middleware = async function permisosWeb(req, res, next) {
    let obraId;
    let perfil;
    try {
      obraId = await resolverObra(req);
      if (!obraId) {
        return res.status(404).json({ code: "NOT_FOUND", message: "Obra no encontrada" });
      }
      perfil = await perfilEnObra(req.personaId, obraId);
    } catch (error) {
      if (error?.status) {
        return res
          .status(error.status)
          .json({ code: error.code || "ERROR", message: error.message });
      }
      console.error("[permisosWeb]", error);
      return res.status(500).json({ code: "SERVER_ERROR", message: "Error validando permisos" });
    }

    if (!perfil) {
      return res.status(403).json({
        code: "SIN_MEMBRESIA",
        message: "No pertenecés a esta obra",
      });
    }

    // Disponible para los controllers y para diagnosticar un 403 (el perfil se
    // resuelve haya o no permiso; sin membresía no hay perfil que dejar).
    req.obraId = obraId;
    req.perfilObra = perfil;

    // Fail closed: solo `true` habilita (un rol sin resolver o un permiso
    // desconocido quedan afuera).
    if (perfil.permisos?.web?.[permiso] !== true) {
      return res.status(403).json(cuerpoSinPermiso({ permiso, rol: perfil.rol.nombre }));
    }

    return next();
  };

  // Metadatos para el test de cobertura de rutas (routes/permisosRutas.test.js):
  // permite verificar que cada ruta web exige la capacidad que dicta la spec.
  middleware.permiso = permiso;
  return middleware;
}

// ─────────────────────────────────────────────────────────────
// Resolvers: la obra viene en la URL
// ─────────────────────────────────────────────────────────────

// GET /dashboard/:obraId, GET /materiales/:obra_id, …
export function obraDeParam(campo = "obra_id") {
  return async (req) => (esUuid(req.params?.[campo]) ? req.params[campo] : null);
}

// ─────────────────────────────────────────────────────────────
// Resolvers: la obra viene en el body / query
// ─────────────────────────────────────────────────────────────

function obraDeCampo(campo, origen) {
  return async (req) => {
    const valor = req[origen]?.[campo];
    if (valor === undefined || valor === null || valor === "") {
      throw errorHttp(400, "OBRA_REQUERIDA", `${campo} es requerido`);
    }
    if (!esUuid(valor)) {
      throw errorHttp(400, "OBRA_INVALIDA", `${campo} inválido`);
    }
    return valor;
  };
}

// POST /pedidos, POST /gastos, POST /chat/consultar, …
export function obraDeBody(campo = "obra_id") {
  return obraDeCampo(campo, "body");
}

// GET /proveedores?obra_id=…
export function obraDeQuery(campo = "obra_id") {
  return obraDeCampo(campo, "query");
}

// ─────────────────────────────────────────────────────────────
// Resolvers: la obra sale del recurso (:id)
// ─────────────────────────────────────────────────────────────

// El nombre de la tabla es un literal del módulo (nunca input del usuario).
function obraDeTabla(tabla) {
  return async (req) => {
    const id = req.params?.id;
    if (!esUuid(id)) return null;
    const { rows } = await pool.query(`SELECT obra_id FROM ${tabla} WHERE id = $1`, [id]);
    return rows[0]?.obra_id ?? null;
  };
}

export const obraDePedido = obraDeTabla("pedidos_materiales");
export const obraDeMaterial = obraDeTabla("materiales");
export const obraDeGasto = obraDeTabla("gastos");
export const obraDeTarea = obraDeTabla("tareas");
export const obraDeAlerta = obraDeTabla("alertas");
export const obraDeFoto = obraDeTabla("fotos_obra");
export const obraDeOperacion = obraDeTabla("operaciones_bot");

// Proveedores: uno de obra se autoriza en su propia obra; uno global (catálogo de
// la empresa) no tiene obra, así que el frontend manda `obra_id` como contexto
// (body o query) y el permiso se evalúa ahí.
export async function obraDeProveedor(req) {
  const id = req.params?.id;
  if (!esUuid(id)) return null;

  const { rows } = await pool.query(`SELECT obra_id, scope FROM proveedores WHERE id = $1`, [id]);
  const proveedor = rows[0];
  if (!proveedor) return null;
  if (proveedor.scope === "obra") return proveedor.obra_id ?? null;

  const contexto = req.body?.obra_id || req.query?.obra_id;
  if (!contexto) {
    throw errorHttp(
      400,
      "OBRA_REQUERIDA",
      "obra_id es requerido como contexto para operar sobre un proveedor global"
    );
  }
  if (!esUuid(contexto)) {
    throw errorHttp(400, "OBRA_INVALIDA", "obra_id inválido");
  }
  return contexto;
}

// POST /proveedores/vincular — la obra es la del material que se vincula.
export async function obraDeMaterialVinculo(req) {
  const materialId = req.body?.material_id;
  if (!materialId) {
    throw errorHttp(400, "MATERIAL_REQUERIDO", "material_id es requerido");
  }
  if (!esUuid(materialId)) {
    throw errorHttp(400, "MATERIAL_INVALIDO", "material_id inválido");
  }
  const { rows } = await pool.query(`SELECT obra_id FROM materiales WHERE id = $1`, [materialId]);
  return rows[0]?.obra_id ?? null;
}
