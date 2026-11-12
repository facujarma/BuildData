// Administración de roles por obra (Configuración → Roles y permisos).
//
// Todos los endpoints exigen membresía y el permiso web `roles.administrar`
// (por defecto solo el rol Director lo tiene). La política fina vive en
// roles.service.js; acá solo se valida la entrada y se traducen los errores.

import {
  CATALOGO_PERMISOS,
  actualizarRol,
  crearRol,
  eliminarRol,
  listarRoles,
  perfilEnObra,
  serializarRol,
} from "../services/roles.service.js";

function respuestaError(res, error, mensajeGenerico) {
  if (error.status) {
    return res.status(error.status).json({
      code: error.code || "ERROR",
      message: error.message,
    });
  }
  console.error("[roles]", error);
  return res.status(500).json({ code: "SERVER_ERROR", message: mensajeGenerico });
}

// Devuelve { perfil } si puede administrar roles; si no, ya respondió 403.
async function exigirAdministrarRoles(req, res, obraId) {
  const perfil = await perfilEnObra(req.personaId, obraId);
  if (!perfil) {
    res.status(403).json({
      code: "SIN_PERMISO",
      message: "No pertenecés a esta obra",
      permiso: "roles.administrar",
      rol: null,
    });
    return { perfil: null };
  }
  if (perfil.permisos.web["roles.administrar"] !== true) {
    res.status(403).json({
      code: "SIN_PERMISO",
      message: "No tenés permiso para administrar roles en esta obra",
      permiso: "roles.administrar",
      rol: perfil.rol.nombre,
    });
    return { perfil: null };
  }
  return { perfil };
}

// GET /roles/:obra_id
export async function getRoles(req, res) {
  const { obra_id } = req.params;
  try {
    const { perfil } = await exigirAdministrarRoles(req, res, obra_id);
    if (!perfil) return;

    const roles = await listarRoles(obra_id);
    res.json({ roles: roles.map(serializarRol), catalogo: CATALOGO_PERMISOS });
  } catch (error) {
    respuestaError(res, error, "No se pudieron obtener los roles de la obra");
  }
}

// POST /roles/:obra_id
export async function crearRolWeb(req, res) {
  const { obra_id } = req.params;
  try {
    const { perfil } = await exigirAdministrarRoles(req, res, obra_id);
    if (!perfil) return;

    const { nombre, descripcion, nivel, permisos } = req.body || {};
    const rol = await crearRol({ obraId: obra_id, nombre, descripcion, nivel, permisos });
    res.status(201).json({ rol: serializarRol(rol) });
  } catch (error) {
    respuestaError(res, error, "No se pudo crear el rol");
  }
}

// PATCH /roles/:obra_id/:rol_id
export async function actualizarRolWeb(req, res) {
  const { obra_id, rol_id } = req.params;
  try {
    const { perfil } = await exigirAdministrarRoles(req, res, obra_id);
    if (!perfil) return;

    const { nombre, descripcion, nivel, permisos } = req.body || {};
    const cambios = {};
    if (nombre !== undefined) cambios.nombre = nombre;
    if (descripcion !== undefined) cambios.descripcion = descripcion;
    if (nivel !== undefined) cambios.nivel = nivel;
    if (permisos !== undefined) cambios.permisos = permisos;

    const rol = await actualizarRol({ obraId: obra_id, rolId: rol_id, cambios });
    res.json({ rol: serializarRol(rol) });
  } catch (error) {
    respuestaError(res, error, "No se pudo actualizar el rol");
  }
}

// DELETE /roles/:obra_id/:rol_id
export async function eliminarRolWeb(req, res) {
  const { obra_id, rol_id } = req.params;
  try {
    const { perfil } = await exigirAdministrarRoles(req, res, obra_id);
    if (!perfil) return;

    await eliminarRol({ obraId: obra_id, rolId: rol_id });
    res.status(204).send();
  } catch (error) {
    respuestaError(res, error, "No se pudo eliminar el rol");
  }
}
