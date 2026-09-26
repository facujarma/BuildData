import {
  aprobarOperacion,
  esEndpointPermitido,
  obraDeOperacion,
  rechazarOperacion,
  registrarOperaciones,
} from "../services/operaciones.service.js";
import { esMiembroDeObra } from "../services/obraAccess.service.js";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// POST /bot/operaciones — el bot registra el lote de operaciones de un mensaje.
// Las automáticas se ejecutan acá; las que requieren aprobación quedan pendientes.
export async function registrarOperacionesBot(req, res) {
  const { obra_id, mensaje_id, telefono, operaciones } = req.body;

  if (!obra_id || !telefono) {
    return res.status(400).json({ error: "obra_id y telefono son requeridos" });
  }
  if (!Array.isArray(operaciones)) {
    return res.status(400).json({ error: "operaciones debe ser un array" });
  }
  for (const op of operaciones) {
    if (
      !op ||
      typeof op !== "object" ||
      !esEndpointPermitido(op.endpoint, op.method) ||
      !op.payload ||
      typeof op.payload !== "object"
    ) {
      return res.status(400).json({
        error: `operación no permitida: ${op?.endpoint ?? "?"}`,
      });
    }
  }

  try {
    const resultado = await registrarOperaciones({
      obra_id,
      mensaje_id,
      telefono,
      operaciones,
    });
    res.status(201).json({ operaciones: resultado });
  } catch (error) {
    console.error(error);
    res
      .status(error.status || 500)
      .json({ error: error.message || "Error registrando operaciones" });
  }
}

async function resolverAcceso(req, res, id) {
  if (!UUID_RE.test(id)) {
    res.status(400).json({ error: "id inválido" });
    return null;
  }
  const obraId = await obraDeOperacion(id);
  if (!obraId) {
    res.status(404).json({ error: "operación no encontrada" });
    return null;
  }
  if (!(await esMiembroDeObra(req.personaId, obraId))) {
    res.status(403).json({ error: "No pertenecés a esta obra" });
    return null;
  }
  return obraId;
}

// PATCH /operaciones/:id/aprobar — ejecuta la operación registrada.
export async function aprobarOperacionWeb(req, res) {
  const { id } = req.params;
  if (!(await resolverAcceso(req, res, id))) return;

  try {
    const resultado = await aprobarOperacion(id, req.personaId || null);
    if (resultado.notFound) {
      return res.status(404).json({ error: "operación no encontrada" });
    }
    if (resultado.conflict) {
      return res
        .status(409)
        .json({ error: `la operación ya está ${resultado.estado}` });
    }
    res.json(resultado.operacion);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error aprobando operación" });
  }
}

// PATCH /operaciones/:id/reintentar — reintenta una operación que quedó en error.
export async function reintentarOperacionWeb(req, res) {
  return aprobarOperacionWeb(req, res);
}

// PATCH /operaciones/:id/rechazar — descarta la operación sin ejecutarla.
export async function rechazarOperacionWeb(req, res) {
  const { id } = req.params;
  if (!(await resolverAcceso(req, res, id))) return;

  try {
    const resultado = await rechazarOperacion(id, req.personaId || null);
    if (resultado.notFound) {
      return res.status(404).json({ error: "operación no encontrada" });
    }
    if (resultado.conflict) {
      return res
        .status(409)
        .json({ error: `la operación ya está ${resultado.estado}` });
    }
    res.json(resultado.operacion);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error rechazando operación" });
  }
}
