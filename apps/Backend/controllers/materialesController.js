import { pool } from "../db.js";
import { supabaseAdmin } from "../supabaseClient.js";
import { guardarEmbedding } from "../services/embeddings.service.js";
import { aplicarMovimientoStock } from "../services/stock.service.js";
import { esMiembroDeObra, obraDeMaterial } from "../services/obraAccess.service.js";

const BUCKET_FOTOS = "materiales";
const EXT_POR_MIME = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

const sinAcceso = (res) => res.status(403).json({ error: "No pertenecés a esta obra" });

// Número >= 0, null si viene vacío/undefined, NaN si es inválido
function numeroNoNegativo(valor) {
  if (valor === undefined || valor === null || valor === "") return null;
  const n = Number(valor);
  return Number.isFinite(n) && n >= 0 ? n : NaN;
}

function textoLimpio(valor) {
  return typeof valor === "string" ? valor.trim() : undefined;
}

// Crea la categoría en la tabla si no existía (unique por obra, sin distinguir mayúsculas)
async function asegurarCategoria(client, obraId, nombre) {
  if (!nombre) return;
  await client.query(
    `INSERT INTO categorias_materiales (obra_id, nombre) VALUES ($1, $2)
     ON CONFLICT (obra_id, lower(nombre)) DO NOTHING`,
    [obraId, nombre]
  );
}

// GET /materiales/:obra_id
export async function getMateriales(req, res) {
  const { obra_id } = req.params;
  try {
    if (!(await esMiembroDeObra(req.personaId, obra_id))) return sinAcceso(res);
    const result = await pool.query(
      `SELECT * FROM materiales WHERE obra_id = $1 AND activo ORDER BY nombre ASC`,
      [obra_id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}

// GET /materiales/:obra_id/categorias
export async function getCategorias(req, res) {
  const { obra_id } = req.params;
  try {
    if (!(await esMiembroDeObra(req.personaId, obra_id))) return sinAcceso(res);
    const result = await pool.query(
      `SELECT id, nombre FROM categorias_materiales WHERE obra_id = $1 ORDER BY nombre ASC`,
      [obra_id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}

// POST /materiales/categorias   Body: { obra_id, nombre }
export async function crearCategoria(req, res) {
  const { obra_id } = req.body;
  const nombre = textoLimpio(req.body.nombre);
  if (!obra_id || !nombre) return res.status(400).json({ error: "obra_id y nombre son requeridos" });
  try {
    if (!(await esMiembroDeObra(req.personaId, obra_id))) return sinAcceso(res);
    const result = await pool.query(
      `INSERT INTO categorias_materiales (obra_id, nombre) VALUES ($1, $2)
       ON CONFLICT (obra_id, lower(nombre)) DO NOTHING
       RETURNING id, nombre`,
      [obra_id, nombre]
    );
    if (!result.rows[0]) return res.status(409).json({ error: "Esa categoría ya existe" });
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}

// POST /materiales
export async function crearMaterial(req, res) {
  const { obra_id, unidad, costo_unitario } = req.body;
  const nombre = textoLimpio(req.body.nombre);
  const categoria = textoLimpio(req.body.categoria) || null;
  const ubicacion = textoLimpio(req.body.ubicacion) || null;
  if (!obra_id || !nombre) return res.status(400).json({ error: "obra_id y nombre son requeridos" });

  const stock_actual = numeroNoNegativo(req.body.stock_actual);
  const stock_minimo = numeroNoNegativo(req.body.stock_minimo);
  if (Number.isNaN(stock_actual) || Number.isNaN(stock_minimo)) {
    return res.status(400).json({ error: "stock_actual y stock_minimo deben ser números >= 0" });
  }

  let client;
  try {
    if (!(await esMiembroDeObra(req.personaId, obra_id))) return sinAcceso(res);

    client = await pool.connect();
    await client.query("BEGIN");
    const result = await client.query(
      `INSERT INTO materiales (obra_id, nombre, categoria, unidad, ubicacion, stock_actual, stock_minimo, costo_unitario)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [obra_id, nombre, categoria, unidad, ubicacion, stock_actual, stock_minimo, costo_unitario]
    );
    await asegurarCategoria(client, obra_id, categoria);
    await client.query("COMMIT");

    await guardarEmbedding("material", result.rows[0].id, result.rows[0].nombre);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (client) await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ error: error.message });
  } finally {
    if (client) client.release();
  }
}

// PATCH /materiales/:id
// Body (todo opcional): { nombre, categoria, unidad, ubicacion, stock_actual, stock_minimo, costo_unitario }
// Si cambia stock_actual se registra el movimiento (entrada/salida por la diferencia).
export async function actualizarMaterial(req, res) {
  const { id } = req.params;
  const nombre = textoLimpio(req.body.nombre);
  const categoria = textoLimpio(req.body.categoria) || undefined; // vacío = sin cambios
  const unidad = textoLimpio(req.body.unidad);
  const ubicacion = textoLimpio(req.body.ubicacion);
  const { costo_unitario } = req.body;

  if (nombre === "") return res.status(400).json({ error: "nombre no puede estar vacío" });
  const stock_actual = numeroNoNegativo(req.body.stock_actual);
  const stock_minimo = numeroNoNegativo(req.body.stock_minimo);
  if (Number.isNaN(stock_actual) || Number.isNaN(stock_minimo)) {
    return res.status(400).json({ error: "stock_actual y stock_minimo deben ser números >= 0" });
  }

  let client;
  try {
    const dueno = await obraDeMaterial(id);
    if (!dueno) return res.status(404).json({ error: "Material no encontrado" });
    if (!(await esMiembroDeObra(req.personaId, dueno.obra_id))) return sinAcceso(res);

    client = await pool.connect();
    await client.query("BEGIN");

    const actual = await client.query(`SELECT * FROM materiales WHERE id = $1 AND activo FOR UPDATE`, [id]);
    if (!actual.rows[0]) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Material no encontrado" });
    }

    let material = (
      await client.query(
        `UPDATE materiales
         SET nombre = COALESCE($1, nombre),
             categoria = COALESCE($2, categoria),
             unidad = COALESCE($3, unidad),
             ubicacion = COALESCE($4, ubicacion),
             stock_minimo = COALESCE($5, stock_minimo),
             costo_unitario = COALESCE($6, costo_unitario)
         WHERE id = $7 RETURNING *`,
        [nombre, categoria, unidad, ubicacion, stock_minimo, costo_unitario, id]
      )
    ).rows[0];

    if (categoria) await asegurarCategoria(client, material.obra_id, categoria);

    if (stock_actual !== null) {
      const delta = stock_actual - Number(actual.rows[0].stock_actual || 0);
      if (delta !== 0) {
        material = await aplicarMovimientoStock(client, {
          materialId: id,
          obraId: material.obra_id,
          usuarioId: req.personaId || null,
          tipo: delta > 0 ? "entrada" : "salida",
          cantidad: Math.abs(delta),
          observacion: "Ajuste manual",
          soloAlCruzar: true,
        });
      }
    }

    await client.query("COMMIT");

    if (nombre && nombre !== actual.rows[0].nombre) {
      await guardarEmbedding("material", id, nombre);
    }
    res.json(material);
  } catch (error) {
    if (client) await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ error: error.message });
  } finally {
    if (client) client.release();
  }
}

// POST /materiales/:id/ajuste   Body: { delta, observacion? }
// Suma (delta > 0) o resta (delta < 0) stock y registra el movimiento.
// El stock puede quedar negativo: no se bloquea por falta de stock.
export async function ajustarStock(req, res) {
  const { id } = req.params;
  const delta = Number(req.body.delta);
  if (!Number.isFinite(delta) || delta === 0) {
    return res.status(400).json({ error: "delta debe ser un número distinto de 0" });
  }
  const observacion = textoLimpio(req.body.observacion) || "Ajuste manual";

  let client;
  try {
    const dueno = await obraDeMaterial(id);
    if (!dueno) return res.status(404).json({ error: "Material no encontrado" });
    if (!(await esMiembroDeObra(req.personaId, dueno.obra_id))) return sinAcceso(res);

    client = await pool.connect();
    await client.query("BEGIN");

    const material = await aplicarMovimientoStock(client, {
      materialId: id,
      obraId: dueno.obra_id,
      usuarioId: req.personaId || null,
      tipo: delta > 0 ? "entrada" : "salida",
      cantidad: Math.abs(delta),
      observacion,
      soloAlCruzar: true,
    });
    if (!material) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Material no encontrado" });
    }

    await client.query("COMMIT");
    res.json(material);
  } catch (error) {
    if (client) await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ error: error.message });
  } finally {
    if (client) client.release();
  }
}

// POST /materiales/:id/foto   Body: imagen cruda (Content-Type image/jpeg|png|webp, máx 5 MB)
// Sube la foto al bucket público y guarda la URL en materiales.foto_url.
export async function subirFotoMaterial(req, res) {
  const { id } = req.params;
  const contentType = (req.headers["content-type"] || "").split(";")[0];
  const ext = EXT_POR_MIME[contentType];
  if (!ext || !Buffer.isBuffer(req.body) || req.body.length === 0) {
    return res.status(400).json({ error: "Enviá una imagen JPEG, PNG o WebP" });
  }

  try {
    const material = (await pool.query(`SELECT obra_id, foto_url FROM materiales WHERE id = $1 AND activo`, [id])).rows[0];
    if (!material) return res.status(404).json({ error: "Material no encontrado" });
    if (!(await esMiembroDeObra(req.personaId, material.obra_id))) return sinAcceso(res);

    const path = `${material.obra_id}/${id}-${Date.now()}.${ext}`;
    const subida = await supabaseAdmin.storage.from(BUCKET_FOTOS).upload(path, req.body, { contentType });
    if (subida.error) throw new Error(subida.error.message);

    const { publicUrl } = supabaseAdmin.storage.from(BUCKET_FOTOS).getPublicUrl(path).data;
    const result = await pool.query(`UPDATE materiales SET foto_url = $1 WHERE id = $2 RETURNING *`, [publicUrl, id]);

    // Limpieza best-effort de la foto anterior
    const marcador = `/${BUCKET_FOTOS}/`;
    if (material.foto_url && material.foto_url.includes(marcador)) {
      const anterior = material.foto_url.split(marcador)[1];
      await supabaseAdmin.storage.from(BUCKET_FOTOS).remove([anterior]).catch(() => {});
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}

// DELETE /materiales/:id — soft delete (pedidos_items y movimientos_stock conservan su historial)
export async function eliminarMaterial(req, res) {
  const { id } = req.params;
  try {
    const dueno = await obraDeMaterial(id);
    if (!dueno) return res.status(404).json({ error: "Material no encontrado" });
    if (!(await esMiembroDeObra(req.personaId, dueno.obra_id))) return sinAcceso(res);

    const result = await pool.query(`UPDATE materiales SET activo = false WHERE id = $1 AND activo RETURNING id`, [id]);
    if (!result.rows[0]) return res.status(404).json({ error: "Material no encontrado" });
    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
