import { randomUUID } from "node:crypto";
import { pool } from "../db.js";
import { supabaseAdmin } from "../supabaseClient.js";
import { esMiembroDeObra } from "../services/obraAccess.service.js";
import { perfilEnObra } from "../services/roles.service.js";
import { registrarActividad } from "../services/actividad.service.js";
import { resolvePersonaIdByTelefono } from "../services/personaService.js";

const BUCKET_GALERIA = "galeria";
const MAX_BYTES = 10 * 1024 * 1024; // mismo límite que el bucket y el express.raw de las rutas
const EXT_POR_MIME = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const sinAcceso = (res) => res.status(403).json({ error: "No pertenecés a esta obra" });

const SELECT_FOTO = `
  SELECT f.id, f.url, f.tarea_id, t.titulo AS task, COALESCE(f.rubro_id, t.rubro_id) AS rubro_id,
         r.nombre AS rubro, r.color AS tone, COALESCE(p.nombre, 'Sistema') AS who,
         f.nota AS note, f.flag, f.origen, f.nombre_archivo, f.created_at
  FROM fotos_obra f
  LEFT JOIN tareas t ON t.id = f.tarea_id
  LEFT JOIN rubros r ON r.id = COALESCE(f.rubro_id, t.rubro_id)
  LEFT JOIN personas p ON p.id = f.usuario_id`;

function textoQuery(valor, max) {
  return typeof valor === "string" && valor.trim() ? valor.trim().slice(0, max) : null;
}

// GET /galeria/:obra_id — fotos de la obra, más nuevas primero
export async function getGaleria(req, res) {
  const { obra_id } = req.params;
  try {
    if (!(await esMiembroDeObra(req.personaId, obra_id))) return sinAcceso(res);
    const { rows } = await pool.query(`${SELECT_FOTO} WHERE f.obra_id = $1 ORDER BY f.created_at DESC`, [obra_id]);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}

// La bitácora muestra una entrada por subida (lote), no una por foto: la primera foto
// del lote la crea y las siguientes actualizan el contador. Best-effort.
async function registrarLote({ obraId, usuarioId, loteId, tareaTitulo, rubroId }) {
  const sujeto = tareaTitulo ? ` de "${tareaTitulo}"` : "";
  try {
    const { rows } = await pool.query(`SELECT count(*)::int AS n FROM fotos_obra WHERE lote_id = $1`, [loteId]);
    const n = rows[0].n;
    const texto = `Subió ${n === 1 ? "una foto" : `${n} fotos`}${sujeto}`;
    const upd = await pool.query(
      `UPDATE actividad SET texto = $1 WHERE obra_id = $2 AND entidad_tipo = 'foto_lote' AND entidad_id = $3`,
      [texto, obraId, loteId]
    );
    if (upd.rowCount > 0) return;
  } catch (error) {
    console.error("[galeria] no se pudo actualizar la actividad del lote:", error.message);
    return;
  }
  await registrarActividad(pool, {
    obraId,
    usuarioId,
    tipo: "foto",
    accion: "subió fotos",
    texto: `Subió una foto${sujeto}`,
    entidadTipo: "foto_lote",
    entidadId: loteId,
    rubroId,
    tags: ["Foto"],
  });
}

// Núcleo compartido por la web (POST /galeria/:obra_id) y el bot (POST /bot/galeria):
// valida la tarea de la obra, sube la imagen al bucket, inserta la fila y registra
// la actividad del lote. La membresía la valida cada caller (web por JWT, bot por
// teléfono). Devuelve { foto } o { error: { status, message } }.
export async function guardarFoto({
  obraId,
  personaId,
  buffer,
  contentType,
  nombre,
  tareaId,
  loteId,
  nota,
  flag,
  origen,
}) {
  const ext = EXT_POR_MIME[contentType];
  if (!ext || !Buffer.isBuffer(buffer) || buffer.length === 0) {
    return { error: { status: 400, message: "Enviá una imagen JPG, PNG o WebP" } };
  }
  if (buffer.length > MAX_BYTES) {
    return { error: { status: 413, message: "La imagen supera los 10 MB" } };
  }

  let tarea = null;
  if (tareaId) {
    tarea = (
      await pool.query(`SELECT id, titulo, rubro_id FROM tareas WHERE id = $1 AND obra_id = $2`, [
        tareaId,
        obraId,
      ])
    ).rows[0];
    if (!tarea) {
      return { error: { status: 400, message: "tarea_id inválido para esta obra" } };
    }
  }

  const path = `${obraId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const subida = await supabaseAdmin.storage.from(BUCKET_GALERIA).upload(path, buffer, { contentType });
  if (subida.error) throw new Error(subida.error.message);
  const { publicUrl } = supabaseAdmin.storage.from(BUCKET_GALERIA).getPublicUrl(path).data;

  // El lote tiene que existir antes del INSERT: si el cliente no lo manda (bot),
  // se genera acá y se usa el mismo valor en la fila y en la actividad. Si no,
  // la fila queda con lote_id NULL y registrarLote cuenta 0 fotos.
  const lote = loteId || randomUUID();

  let insertado;
  try {
    insertado = await pool.query(
      `INSERT INTO fotos_obra (obra_id, tarea_id, rubro_id, usuario_id, url, storage_path, nombre_archivo, nota, flag, origen, lote_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id`,
      [
        obraId,
        tarea?.id || null,
        tarea?.rubro_id || null,
        personaId || null,
        publicUrl,
        path,
        nombre,
        nota,
        flag,
        origen,
        lote,
      ]
    );
  } catch (error) {
    // No dejar el objeto huérfano en el bucket si falló el registro
    await supabaseAdmin.storage.from(BUCKET_GALERIA).remove([path]).catch(() => {});
    throw error;
  }

  const foto = (await pool.query(`${SELECT_FOTO} WHERE f.id = $1`, [insertado.rows[0].id])).rows[0];
  await registrarLote({
    obraId,
    usuarioId: personaId || null,
    loteId: lote,
    tareaTitulo: tarea?.titulo || null,
    rubroId: foto.rubro_id,
  });
  return { foto };
}

// POST /galeria/:obra_id?tarea_id=&nota=&flag=&lote=
// Body: imagen cruda (image/jpeg | image/png | image/webp, máx 10 MB). Una foto por request;
// las fotos de una misma subida comparten `lote` (uuid generado por el cliente).
// Header opcional X-File-Name (URI-encoded). Si viene tarea_id, el rubro sale de la tarea.
export async function subirFoto(req, res) {
  const { obra_id } = req.params;
  const contentType = (req.headers["content-type"] || "").split(";")[0];
  const ext = EXT_POR_MIME[contentType];
  if (!ext || !Buffer.isBuffer(req.body) || req.body.length === 0) {
    return res.status(400).json({ error: "Enviá una imagen JPG, PNG o WebP" });
  }
  const tareaId = textoQuery(req.query.tarea_id, 36);
  const loteId = textoQuery(req.query.lote, 36);
  if ((tareaId && !UUID_RE.test(tareaId)) || (loteId && !UUID_RE.test(loteId))) {
    return res.status(400).json({ error: "tarea_id y lote deben ser UUID" });
  }
  const nota = textoQuery(req.query.nota, 1000);
  const flag = textoQuery(req.query.flag, 80);
  let nombre = `foto.${ext}`;
  try {
    const crudo = req.headers["x-file-name"];
    if (typeof crudo === "string" && crudo.trim()) nombre = decodeURIComponent(crudo).slice(0, 200);
  } catch {
    // nombre mal codificado: queda el genérico
  }

  try {
    if (!(await esMiembroDeObra(req.personaId, obra_id))) return sinAcceso(res);
    const { foto, error } = await guardarFoto({
      obraId: obra_id,
      personaId: req.personaId || null,
      buffer: req.body,
      contentType,
      nombre,
      tareaId,
      loteId,
      nota,
      flag,
      origen: "web",
    });
    if (error) return res.status(error.status).json({ error: error.message });
    res.status(201).json(foto);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}

// POST /bot/galeria?obra_id=&telefono=&nota=&tarea_id=&lote=
// Misma foto cruda que la web, pero la identidad sale del teléfono del obrero.
// Las imágenes que el bot no reconoce como comprobante/factura se guardan acá
// con origen='whatsapp'.
export async function subirFotoDesdeBot(req, res) {
  const obraId = textoQuery(req.query.obra_id, 36);
  const telefono = textoQuery(req.query.telefono, 30);
  const contentType = (req.headers["content-type"] || "").split(";")[0];
  const ext = EXT_POR_MIME[contentType];

  if (!obraId || !UUID_RE.test(obraId)) {
    return res.status(400).json({ error: "obra_id debe ser UUID" });
  }
  if (!telefono) return res.status(400).json({ error: "telefono es requerido" });
  if (!ext || !Buffer.isBuffer(req.body) || req.body.length === 0) {
    return res.status(400).json({ error: "Enviá una imagen JPG, PNG o WebP" });
  }

  const tareaId = textoQuery(req.query.tarea_id, 36);
  const loteId = textoQuery(req.query.lote, 36);
  if ((tareaId && !UUID_RE.test(tareaId)) || (loteId && !UUID_RE.test(loteId))) {
    return res.status(400).json({ error: "tarea_id y lote deben ser UUID" });
  }
  const nota = textoQuery(req.query.nota, 1000);
  const flag = textoQuery(req.query.flag, 80);
  let nombre = `whatsapp.${ext}`;
  try {
    const crudo = req.headers["x-file-name"];
    if (typeof crudo === "string" && crudo.trim()) nombre = decodeURIComponent(crudo).slice(0, 200);
  } catch {
    // nombre mal codificado: queda el genérico
  }

  try {
    const personaId = await resolvePersonaIdByTelefono(telefono);
    if (!personaId) {
      return res.status(404).json({ error: "telefono no resuelve a ningún obrero" });
    }
    // Obra inexistente → 404 (sin esto esMiembroDeObra la rechazaría como 403)
    const obra = await pool.query(`SELECT 1 FROM obras WHERE id = $1`, [obraId]);
    if (obra.rows.length === 0) {
      return res.status(404).json({ error: "obra no encontrada" });
    }
    // Membresía y permisos efectivos salen de roles_obra: el endpoint directo no
    // pasa por /bot/operaciones (que es donde el lote se valida), así que se
    // chequea acá la matriz dinámica del rol. Fail closed.
    const perfil = await perfilEnObra(personaId, obraId);
    if (!perfil) return sinAcceso(res);
    if (perfil.permisos.bot["foto.subir"] !== true) {
      return res.status(403).json({
        error: `tu rol ${perfil.rol.nombre} no puede subir fotos a la galería`,
      });
    }

    const { foto, error } = await guardarFoto({
      obraId,
      personaId,
      buffer: req.body,
      contentType,
      nombre,
      tareaId,
      loteId,
      nota,
      flag,
      origen: "whatsapp",
    });
    if (error) return res.status(error.status).json({ error: error.message });
    res.status(201).json(foto);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}

// DELETE /galeria/:id — borra el registro y el objeto del bucket (best-effort)
export async function eliminarFoto(req, res) {
  const { id } = req.params;
  try {
    const foto = (await pool.query(`SELECT id, obra_id, storage_path FROM fotos_obra WHERE id = $1`, [id])).rows[0];
    if (!foto) return res.status(404).json({ error: "Foto no encontrada" });
    if (!(await esMiembroDeObra(req.personaId, foto.obra_id))) return sinAcceso(res);

    await pool.query(`DELETE FROM fotos_obra WHERE id = $1`, [id]);
    if (foto.storage_path) {
      const { error } = await supabaseAdmin.storage.from(BUCKET_GALERIA).remove([foto.storage_path]);
      if (error) console.error("[galeria] no se pudo borrar el objeto del bucket:", error.message);
    }
    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
