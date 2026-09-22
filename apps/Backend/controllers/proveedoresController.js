import { pool } from "../db.js";
import { guardarEmbedding } from "../services/embeddings.service.js";
import { esMiembroDeObra } from "../services/obraAccess.service.js";

const sinAcceso = (res) =>
  res.status(403).json({ error: "No pertenecés a esta obra" });
const noEncontrado = (res) =>
  res.status(404).json({ error: "Proveedor no encontrado" });

// Postgres: 23505 = unique_violation, 23514 = check_violation
const esViolacionUnica = (error) => error.code === "23505";
const esViolacionCheck = (error) => error.code === "23514";

function textoLimpio(valor) {
  return typeof valor === "string" ? valor.trim() : undefined;
}

// scope='obra' requiere membresía; scope='global' alcanza con estar autenticado
// (ya lo garantiza authMiddleware). Devuelve true/false.
async function tieneAcceso(req, proveedor) {
  if (proveedor.scope === "obra") return esMiembroDeObra(req.personaId, proveedor.obra_id);
  return true;
}

async function buscarProveedor(id) {
  const { rows } = await pool.query(
    `SELECT id, scope, obra_id, nombre, activo FROM proveedores WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
}

// GET /proveedores?obra_id=<uuid>&scope=global|obra&q=<texto>
// obra_id es requerido: define la obra "actual" para membresía y para las
// métricas de pedidos/gasto (que siempre son relativas a una obra).
export async function getProveedores(req, res) {
  const { obra_id } = req.query;
  const scope = req.query.scope === "obra" ? "obra" : "global";
  const q = textoLimpio(req.query.q);
  if (!obra_id) return res.status(400).json({ error: "obra_id es requerido" });

  try {
    if (!(await esMiembroDeObra(req.personaId, obra_id))) return sinAcceso(res);

    // $1 = obra_id (stats), $2 = persona_id (fav, puede ser null), $3 = scope=obra ? obra_id : null
    const params = [obra_id, req.personaId || null, scope === "obra" ? obra_id : null];
    const filtroScope = scope === "obra" ? `p.scope = 'obra' AND p.obra_id = $3` : `p.scope = 'global'`;

    let filtroQ = "";
    if (q) {
      params.push(`%${q}%`);
      filtroQ = ` AND (p.nombre ILIKE $${params.length} OR p.rubro ILIKE $${params.length} OR p.contacto_nombre ILIKE $${params.length} OR p.descripcion ILIKE $${params.length})`;
    }

    const result = await pool.query(
      `SELECT
         p.*,
         fav.persona_id IS NOT NULL AS fav,
         COALESCE(stats.pedidos_count, 0) AS pedidos_count,
         COALESCE(stats.spent, 0) AS spent
       FROM proveedores p
       LEFT JOIN proveedores_favoritos fav
         ON fav.proveedor_id = p.id AND fav.persona_id = $2
       LEFT JOIN (
         SELECT pm.proveedor_id, COUNT(DISTINCT pm.id) AS pedidos_count,
                SUM(i.cantidad * i.precio_unitario) AS spent
         FROM pedidos_materiales pm
         LEFT JOIN pedidos_items i ON i.pedido_id = pm.id
         WHERE pm.obra_id = $1
         GROUP BY pm.proveedor_id
       ) stats ON stats.proveedor_id = p.id
       WHERE p.activo AND ${filtroScope}${filtroQ}
       ORDER BY p.nombre ASC`,
      params
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}

// POST /proveedores
// Body: { scope, obra_id? (requerido si scope=obra), nombre, rubro?, cuit?,
//         contacto_nombre?, contacto_puesto?, telefono?, whatsapp?, email?,
//         web?, direccion?, condicion_pago?, plazo_entrega?, descripcion? }
export async function crearProveedor(req, res) {
  const scope = req.body.scope === "obra" ? "obra" : "global";
  const obra_id = scope === "obra" ? req.body.obra_id : null;
  const nombre = textoLimpio(req.body.nombre);
  if (!nombre) return res.status(400).json({ error: "nombre es requerido" });
  if (scope === "obra" && !obra_id) {
    return res.status(400).json({ error: "obra_id es requerido para un proveedor de obra" });
  }

  try {
    if (scope === "obra" && !(await esMiembroDeObra(req.personaId, obra_id))) return sinAcceso(res);

    const result = await pool.query(
      `INSERT INTO proveedores
         (scope, obra_id, nombre, rubro, cuit, contacto_nombre, contacto_puesto,
          telefono, whatsapp, email, web, direccion, condicion_pago, plazo_entrega, descripcion)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING *`,
      [
        scope, obra_id, nombre,
        textoLimpio(req.body.rubro) || null,
        textoLimpio(req.body.cuit) || null,
        textoLimpio(req.body.contacto_nombre) || null,
        textoLimpio(req.body.contacto_puesto) || null,
        textoLimpio(req.body.telefono) || null,
        textoLimpio(req.body.whatsapp) || null,
        textoLimpio(req.body.email) || null,
        textoLimpio(req.body.web) || null,
        textoLimpio(req.body.direccion) || null,
        textoLimpio(req.body.condicion_pago) || "30 días",
        textoLimpio(req.body.plazo_entrega) || null,
        textoLimpio(req.body.descripcion) || null,
      ]
    );
    const proveedor = result.rows[0];
    await guardarEmbedding("proveedor", proveedor.id, proveedor.nombre);
    res.status(201).json({ ...proveedor, fav: false, pedidos_count: 0, spent: 0 });
  } catch (error) {
    if (esViolacionUnica(error)) {
      return res.status(409).json({ error: "Ya existe un proveedor con ese nombre en este ámbito" });
    }
    if (esViolacionCheck(error)) {
      return res.status(400).json({ error: "Datos inválidos" });
    }
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}

// PATCH /proveedores/:id
// No cambia scope/obra_id (eso lo hace únicamente POST /:id/promover).
export async function actualizarProveedor(req, res) {
  const { id } = req.params;
  const nombre = textoLimpio(req.body.nombre);
  if (nombre === "") return res.status(400).json({ error: "nombre no puede estar vacío" });

  try {
    const actual = await buscarProveedor(id);
    if (!actual || !actual.activo) return noEncontrado(res);
    if (!(await tieneAcceso(req, actual))) return sinAcceso(res);

    const result = await pool.query(
      `UPDATE proveedores
       SET nombre = COALESCE($1, nombre),
           rubro = COALESCE($2, rubro),
           cuit = COALESCE($3, cuit),
           contacto_nombre = COALESCE($4, contacto_nombre),
           contacto_puesto = COALESCE($5, contacto_puesto),
           telefono = COALESCE($6, telefono),
           whatsapp = COALESCE($7, whatsapp),
           email = COALESCE($8, email),
           web = COALESCE($9, web),
           direccion = COALESCE($10, direccion),
           condicion_pago = COALESCE($11, condicion_pago),
           plazo_entrega = COALESCE($12, plazo_entrega),
           descripcion = COALESCE($13, descripcion),
           updated_at = now()
       WHERE id = $14
       RETURNING *`,
      [
        nombre,
        textoLimpio(req.body.rubro),
        textoLimpio(req.body.cuit),
        textoLimpio(req.body.contacto_nombre),
        textoLimpio(req.body.contacto_puesto),
        textoLimpio(req.body.telefono),
        textoLimpio(req.body.whatsapp),
        textoLimpio(req.body.email),
        textoLimpio(req.body.web),
        textoLimpio(req.body.direccion),
        textoLimpio(req.body.condicion_pago),
        textoLimpio(req.body.plazo_entrega),
        textoLimpio(req.body.descripcion),
        id,
      ]
    );

    if (nombre && nombre !== actual.nombre) {
      await guardarEmbedding("proveedor", id, nombre);
    }
    res.json(result.rows[0]);
  } catch (error) {
    if (esViolacionUnica(error)) {
      return res.status(409).json({ error: "Ya existe un proveedor con ese nombre en este ámbito" });
    }
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}

// POST /proveedores/:id/promover — de la agenda de una obra al catálogo global
export async function promoverProveedor(req, res) {
  const { id } = req.params;
  try {
    const actual = await buscarProveedor(id);
    if (!actual || !actual.activo) return noEncontrado(res);
    if (actual.scope !== "obra") {
      return res.status(400).json({ error: "El proveedor ya es del catálogo global" });
    }
    if (!(await esMiembroDeObra(req.personaId, actual.obra_id))) return sinAcceso(res);

    const choque = await pool.query(
      `SELECT id FROM proveedores WHERE scope = 'global' AND lower(nombre) = lower($1) AND activo LIMIT 1`,
      [actual.nombre]
    );
    if (choque.rows[0]) {
      return res.status(409).json({ error: "Ya existe un proveedor con ese nombre en el catálogo global" });
    }

    const result = await pool.query(
      `UPDATE proveedores SET scope = 'global', obra_id = NULL, updated_at = now() WHERE id = $1 RETURNING *`,
      [id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    if (esViolacionUnica(error)) {
      return res.status(409).json({ error: "Ya existe un proveedor con ese nombre en el catálogo global" });
    }
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}

// PATCH /proveedores/:id/favorito   Body: { fav: boolean }
// Favorito es por persona ("tu agenda"), no global al proveedor.
export async function marcarFavorito(req, res) {
  const { id } = req.params;
  const fav = req.body.fav === true;
  if (!req.personaId) return res.status(401).json({ error: "No se pudo identificar al usuario" });

  try {
    const actual = await buscarProveedor(id);
    if (!actual || !actual.activo) return noEncontrado(res);
    if (!(await tieneAcceso(req, actual))) return sinAcceso(res);

    if (fav) {
      await pool.query(
        `INSERT INTO proveedores_favoritos (persona_id, proveedor_id) VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [req.personaId, id]
      );
    } else {
      await pool.query(
        `DELETE FROM proveedores_favoritos WHERE persona_id = $1 AND proveedor_id = $2`,
        [req.personaId, id]
      );
    }
    res.json({ id, fav });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}

// DELETE /proveedores/:id — soft delete (los pedidos históricos conservan el nombre)
export async function eliminarProveedor(req, res) {
  const { id } = req.params;
  try {
    const actual = await buscarProveedor(id);
    if (!actual || !actual.activo) return noEncontrado(res);
    if (!(await tieneAcceso(req, actual))) return sinAcceso(res);

    await pool.query(`UPDATE proveedores SET activo = false, updated_at = now() WHERE id = $1`, [id]);
    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}

// POST /proveedores/vincular — vincular proveedor con material
export async function vincularProveedor(req, res) {
  const { material_id, proveedor_id } = req.body;
  if (!material_id || !proveedor_id) return res.status(400).json({ error: "material_id y proveedor_id son requeridos" });
  try {
    const result = await pool.query(
      `INSERT INTO materiales_proveedores (material_id, proveedor_id) VALUES ($1, $2) RETURNING *`,
      [material_id, proveedor_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
