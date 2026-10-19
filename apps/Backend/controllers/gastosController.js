import { pool } from "../db.js";
import { resolvePersonaIdByTelefono } from "../services/personaService.js";
import { registrarActividad } from "../services/actividad.service.js";
import { esMiembroDeObra } from "../services/obraAccess.service.js";
import { supabaseAdmin } from "../supabaseClient.js";

// "AR$ 1.234" / "US$ 50" para el texto de la bitácora
function montoTexto(monto, moneda) {
  const sym = moneda === "USD" ? "US$" : "AR$";
  return `${sym} ${Number(monto).toLocaleString("es-AR", { maximumFractionDigits: 2 })}`;
}

// vision.service.ts entrega fecha en formato DD/MM/YYYY (o "" si no la detectó) — la convertimos
// a YYYY-MM-DD para las columnas DATE. Devuelve null si no matchea (columna queda sin valor).
function parseFechaDocumento(raw) {
  if (!raw) return null;
  const m = String(raw).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
}

// El LLM de texto libre emite la fecha en YYYY-MM-DD (ISO). Validamos que sea una fecha
// real (rechaza 2026-02-30) y devolvemos null si no matchea (default: hoy en TZ Argentina).
function parseFechaISO(raw) {
  if (typeof raw !== "string") return null;
  const m = raw.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const fecha = `${m[1]}-${m[2]}-${m[3]}`;
  const parsed = new Date(`${fecha}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== fecha
    ? null
    : fecha;
}

// vision.service.ts entrega montos como "$1.234,56" (formato argentino) — los convertimos a number
// para las columnas NUMERIC. Devuelve null si no hay nada parseable.
function parseMontoDocumento(raw) {
  if (!raw) return null;
  const normalized = String(raw).replace(/[^0-9,.-]/g, "").replace(/\./g, "").replace(",", ".");
  const n = parseFloat(normalized);
  return Number.isFinite(n) ? n : null;
}

// Fila de recibo para el panel (GET/POST/PATCH devuelven la misma forma).
// Un gasto del bot puede no tener proveedor/categoría/archivo propios: se completan
// con el comprobante asociado (comprobantes_facturas) y el rubro.
const SELECT_RECIBO = `
  SELECT
    g.id,
    g.obra_id,
    COALESCE(NULLIF(btrim(g.descripcion), ''),
             NULLIF(btrim(concat_ws(' ', cf.tipo_documento, cf.numero)), ''),
             'Gasto') AS descripcion,
    COALESCE(NULLIF(btrim(g.proveedor), ''), cf.emisor, cf.destino, 'Sin especificar') AS proveedor,
    COALESCE(g.categoria, r.nombre, 'Materiales') AS categoria,
    g.rubro_id,
    r.nombre AS rubro_nombre,
    to_char(g.fecha, 'YYYY-MM-DD') AS fecha,
    g.monto,
    COALESCE(g.moneda, 'ARS') AS moneda,
    g.estado_pago,
    g.origen,
    COALESCE(g.archivo_url, cf.imagen_url) AS archivo_url,
    COALESCE(g.archivo_nombre, CASE WHEN cf.imagen_url IS NOT NULL THEN 'comprobante' END) AS archivo_nombre
  FROM gastos g
  LEFT JOIN rubros r ON r.id = g.rubro_id
  LEFT JOIN LATERAL (
    SELECT c.tipo_documento, c.numero, c.emisor, c.destino, c.imagen_url
    FROM comprobantes_facturas c WHERE c.gasto_id = g.id
    ORDER BY c.created_at DESC LIMIT 1
  ) cf ON true`;

const ESTADOS_PAGO = ["pagado", "pendiente"];
const MIME_ARCHIVO = { "application/pdf": "pdf", "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const BUCKET_COMPROBANTES = "comprobantes";

const sinAcceso = (res) => res.status(403).json({ error: "No pertenecés a esta obra" });

function textoLimpio(valor) {
  return typeof valor === "string" ? valor.trim() : undefined;
}

async function reciboPorId(id) {
  const { rows } = await pool.query(`${SELECT_RECIBO} WHERE g.id = $1`, [id]);
  return rows[0] || null;
}

async function gastoAccesible(req, id) {
  const { rows } = await pool.query(`SELECT id, obra_id, descripcion, monto, moneda, estado_pago, archivo_url FROM gastos WHERE id = $1`, [id]);
  const gasto = rows[0];
  if (!gasto) return { error: 404 };
  if (!(await esMiembroDeObra(req.personaId, gasto.obra_id))) return { error: 403 };
  return { gasto };
}

// Valida que el rubro sea de la obra (null/undefined = sin rubro)
async function rubroDeLaObra(rubroId, obraId) {
  if (!rubroId) return true;
  const { rowCount } = await pool.query(`SELECT 1 FROM rubros WHERE id = $1 AND obra_id = $2`, [rubroId, obraId]);
  return rowCount > 0;
}

// GET /gastos/:obra_id — recibos/comprobantes de la obra
export async function getGastos(req, res) {
  const { obra_id } = req.params;
  try {
    if (!(await esMiembroDeObra(req.personaId, obra_id))) return sinAcceso(res);
    const result = await pool.query(
      `${SELECT_RECIBO} WHERE g.obra_id = $1 ORDER BY g.fecha DESC NULLS LAST, g.created_at DESC`,
      [obra_id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}

// POST /gastos — carga manual desde el panel. origen/revisado se setean explícitos porque
// un humano lo tipeó acá mismo: no hay incertidumbre de OCR que revisar.
// Body: { obra_id, descripcion, proveedor?, categoria?, rubro_id?, monto, fecha?, pagado?, pedido_id? }
export async function crearGasto(req, res) {
  const { obra_id, rubro_id, pedido_id } = req.body;
  const monto = Number(req.body.monto);
  const fecha = req.body.fecha ? parseFechaISO(req.body.fecha) : null;
  if (!obra_id || !Number.isFinite(monto) || monto <= 0) {
    return res.status(400).json({ error: "obra_id y un monto mayor a 0 son requeridos" });
  }
  if (req.body.fecha && !fecha) return res.status(400).json({ error: "fecha debe tener formato YYYY-MM-DD" });
  const estadoPago = req.body.pagado === false ? "pendiente" : "pagado";

  try {
    if (!(await esMiembroDeObra(req.personaId, obra_id))) return sinAcceso(res);
    if (!(await rubroDeLaObra(rubro_id, obra_id))) return res.status(400).json({ error: "rubro_id inválido para esta obra" });

    const result = await pool.query(
      `INSERT INTO gastos (obra_id, usuario_id, rubro_id, descripcion, monto, pedido_id, origen, revisado,
                           categoria, proveedor, estado_pago, fecha)
       VALUES ($1, $2, $3, $4, $5, $6, 'manual', true, $7, $8, $9,
               COALESCE($10, (now() AT TIME ZONE 'America/Argentina/Buenos_Aires')::date))
       RETURNING id, rubro_id`,
      [
        obra_id, req.personaId || null, rubro_id || null, textoLimpio(req.body.descripcion) || null, monto,
        pedido_id || null, textoLimpio(req.body.categoria) || "Materiales", textoLimpio(req.body.proveedor) || null,
        estadoPago, fecha,
      ]
    );
    const recibo = await reciboPorId(result.rows[0].id);
    await registrarActividad(pool, {
      obraId: obra_id,
      usuarioId: req.personaId || null,
      tipo: "pedido",
      accion: "cargó un gasto",
      texto: `Cargó un gasto de ${montoTexto(recibo.monto, recibo.moneda)}: ${recibo.descripcion}${recibo.proveedor !== "Sin especificar" ? ` (${recibo.proveedor})` : ""}`,
      entidadTipo: "gasto",
      entidadId: recibo.id,
      rubroId: recibo.rubro_id,
      tags: estadoPago === "pendiente" ? ["Gasto", "Pendiente de pago"] : ["Gasto"],
    });
    res.status(201).json(recibo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}

// PATCH /gastos/:id — toggle de estado de pago y edición de campos.
// Body (todo opcional): { estado_pago, descripcion, proveedor, categoria, rubro_id, monto, fecha }
export async function actualizarGasto(req, res) {
  const { id } = req.params;
  const { estado_pago, rubro_id } = req.body;
  if (estado_pago !== undefined && !ESTADOS_PAGO.includes(estado_pago)) {
    return res.status(400).json({ error: "estado_pago debe ser 'pagado' o 'pendiente'" });
  }
  const monto = req.body.monto === undefined ? null : Number(req.body.monto);
  if (monto !== null && (!Number.isFinite(monto) || monto <= 0)) {
    return res.status(400).json({ error: "monto debe ser un número mayor a 0" });
  }
  const fecha = req.body.fecha === undefined ? null : parseFechaISO(req.body.fecha);
  if (req.body.fecha !== undefined && !fecha) return res.status(400).json({ error: "fecha debe tener formato YYYY-MM-DD" });

  try {
    const { gasto, error } = await gastoAccesible(req, id);
    if (error === 404) return res.status(404).json({ error: "Gasto no encontrado" });
    if (error === 403) return sinAcceso(res);
    if (rubro_id !== undefined && !(await rubroDeLaObra(rubro_id, gasto.obra_id))) {
      return res.status(400).json({ error: "rubro_id inválido para esta obra" });
    }

    await pool.query(
      `UPDATE gastos SET
         estado_pago = COALESCE($1, estado_pago),
         descripcion = COALESCE($2, descripcion),
         proveedor = COALESCE($3, proveedor),
         categoria = COALESCE($4, categoria),
         rubro_id = CASE WHEN $5::boolean THEN $6::uuid ELSE rubro_id END,
         monto = COALESCE($7, monto),
         fecha = COALESCE($8::date, fecha),
         updated_at = now()
       WHERE id = $9`,
      [
        estado_pago ?? null,
        textoLimpio(req.body.descripcion) || null,
        textoLimpio(req.body.proveedor) || null,
        textoLimpio(req.body.categoria) || null,
        rubro_id !== undefined,
        rubro_id || null,
        monto,
        fecha,
        id,
      ]
    );
    const recibo = await reciboPorId(id);

    if (estado_pago && estado_pago !== gasto.estado_pago) {
      await registrarActividad(pool, {
        obraId: gasto.obra_id,
        usuarioId: req.personaId || null,
        tipo: "pedido",
        accion: estado_pago === "pagado" ? "marcó un gasto como pagado" : "marcó un gasto como pendiente",
        texto: `Marcó como ${estado_pago} ${recibo.descripcion} (${montoTexto(recibo.monto, recibo.moneda)})`,
        entidadTipo: "gasto",
        entidadId: id,
        rubroId: recibo.rubro_id,
        tags: ["Gasto"],
      });
    }
    res.json(recibo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}

// POST /gastos/:id/archivo — Body: archivo crudo (application/pdf | image/jpeg | image/png | image/webp, máx 10 MB)
// Header opcional X-File-Name (URI-encoded) con el nombre original para mostrarlo.
// Sube al bucket 'comprobantes' y guarda archivo_url / archivo_nombre en el gasto.
export async function subirArchivoGasto(req, res) {
  const { id } = req.params;
  const contentType = (req.headers["content-type"] || "").split(";")[0];
  const ext = MIME_ARCHIVO[contentType];
  if (!ext || !Buffer.isBuffer(req.body) || req.body.length === 0) {
    return res.status(400).json({ error: "Enviá un PDF o una imagen JPG, PNG o WebP" });
  }
  let nombre = `comprobante.${ext}`;
  try {
    const crudo = req.headers["x-file-name"];
    if (typeof crudo === "string" && crudo.trim()) nombre = decodeURIComponent(crudo).slice(0, 200);
  } catch {
    // nombre mal codificado: queda el genérico
  }

  try {
    const { gasto, error } = await gastoAccesible(req, id);
    if (error === 404) return res.status(404).json({ error: "Gasto no encontrado" });
    if (error === 403) return sinAcceso(res);

    const path = `${gasto.obra_id}/${id}-${Date.now()}.${ext}`;
    const subida = await supabaseAdmin.storage.from(BUCKET_COMPROBANTES).upload(path, req.body, { contentType });
    if (subida.error) throw new Error(subida.error.message);

    const { publicUrl } = supabaseAdmin.storage.from(BUCKET_COMPROBANTES).getPublicUrl(path).data;
    await pool.query(
      `UPDATE gastos SET archivo_url = $1, archivo_nombre = $2, updated_at = now() WHERE id = $3`,
      [publicUrl, nombre, id]
    );

    // Limpieza best-effort del archivo anterior
    const marcador = `/${BUCKET_COMPROBANTES}/`;
    if (gasto.archivo_url && gasto.archivo_url.includes(marcador)) {
      const anterior = gasto.archivo_url.split(marcador)[1];
      await supabaseAdmin.storage.from(BUCKET_COMPROBANTES).remove([anterior]).catch(() => {});
    }

    res.json(await reciboPorId(id));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}

// POST /bot/gastos
// Un mismo endpoint para los dos orígenes posibles de un gasto desde el bot:
// (A) texto/audio libre (ej: "gastamos 500 pesos en carpintería") vía textToOperation, o
// (B) imagen de comprobante/factura ya procesada por vision.service.ts — pollConfirmation.service.ts
//     arma comprobante_detalle con los campos de ComprobanteData/FacturaData tal cual (todo string,
//     igual que llegan del OCR) y calcula el monto numérico antes de llamar acá.
// origen ('bot_texto' | 'bot_imagen') decide si se inserta también el detalle en comprobantes_facturas.
export async function crearGastoDesdeBot(req, res) {
  const {
    obra_id,
    telefono,
    monto,
    moneda,
    rubro_id,
    descripcion,
    fecha,
    origen,
    comprobante_detalle,
  } = req.body;

  if (!obra_id || monto === undefined || monto === null) {
    return res.status(400).json({ error: "obra_id y monto son requeridos" });
  }

  // El LLM puede mandar el monto como string ("500") — lo coercionamos antes de validar.
  const montoNumerico = typeof monto === "number" ? monto : Number(monto);
  if (!Number.isFinite(montoNumerico) || montoNumerico <= 0) {
    return res.status(400).json({ error: "monto debe ser un número mayor a 0" });
  }

  const client = await pool.connect();
  try {
    const obra = await client.query(`SELECT id FROM obras WHERE id = $1`, [obra_id]);
    if (obra.rows.length === 0) {
      return res.status(404).json({ error: "obra_id no encontrada" });
    }

    const usuarioId = telefono ? await resolvePersonaIdByTelefono(telefono) : null;
    if (!usuarioId) {
      return res.status(404).json({ error: "telefono no resuelve a ningún obrero" });
    }

    const esImagen = origen === "bot_imagen" && comprobante_detalle;
    const d = esImagen ? comprobante_detalle : null;
    const fechaDocumento = d ? parseFechaDocumento(d.fecha) : null;

    // Moneda: el OCR la saca del documento y el texto libre del LLM. Normalizamos a
    // ARS/USD; cualquier otra cosa cae al default de la columna vía COALESCE.
    const monedaNormalizada = moneda ? String(moneda).trim().toUpperCase() : null;
    const monedaFinal = ["ARS", "USD"].includes(monedaNormalizada) ? monedaNormalizada : null;

    // La fecha del documento tiene prioridad; si no hay, la que mencionó el usuario.
    const fechaGasto = fechaDocumento ?? parseFechaISO(fecha);

    // rubro_id ya viene resuelto por el pipeline de resolución de entidades. Si no matchea
    // (o no existe), no bloqueamos la creación del gasto por esto — se guarda sin categoría.
    let rubroId = rubro_id || null;
    if (rubroId) {
      const rubro = await client.query(`SELECT id FROM rubros WHERE id = $1`, [rubroId]);
      if (rubro.rows.length === 0) rubroId = null;
    }

    await client.query("BEGIN");

    const gasto = await client.query(
      `INSERT INTO gastos (obra_id, usuario_id, rubro_id, descripcion, monto, moneda, origen, revisado, fecha)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6, 'ARS'), $7, $8, COALESCE($9, (now() AT TIME ZONE 'America/Argentina/Buenos_Aires')::date))
       RETURNING id, obra_id, monto, moneda, rubro_id, descripcion, origen, revisado, fecha, created_at`,
      [obra_id, usuarioId, rubroId, descripcion || null, montoNumerico, monedaFinal, origen || "bot_texto", !esImagen, fechaGasto]
    );
    const gastoRow = gasto.rows[0];

    if (esImagen) {
      const esFactura = Array.isArray(d.items);

      const detalle = await client.query(
        `INSERT INTO comprobantes_facturas
          (gasto_id, tipo_documento, obra_id, tipo, fecha, monto, moneda, origen, destino, numero_operacion, entidad,
           tipo_factura, numero, fecha_vencimiento, emisor, cuit_emisor, receptor, cuit_receptor, subtotal, iva, total)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
         RETURNING id`,
        [
          gastoRow.id,
          esFactura ? "factura" : "comprobante",
          obra_id,
          d.tipo || null,
          fechaDocumento,
          parseMontoDocumento(d.monto),
          d.moneda || null,
          d.origen || null,
          d.destino || null,
          d.numeroOperacion || null,
          d.entidad || null,
          d.tipoFactura || null,
          d.numero || null,
          parseFechaDocumento(d.fechaVencimiento),
          d.emisor || null,
          d.cuitEmisor || null,
          d.receptor || null,
          d.cuitReceptor || null,
          parseMontoDocumento(d.subtotal),
          parseMontoDocumento(d.iva),
          parseMontoDocumento(d.total),
        ]
      );

      if (esFactura) {
        for (const item of d.items) {
          await client.query(
            `INSERT INTO factura_items (factura_id, descripcion, cantidad, precio_unitario, subtotal)
             VALUES ($1,$2,$3,$4,$5)`,
            [
              detalle.rows[0].id,
              item.descripcion || null,
              parseMontoDocumento(item.cantidad),
              parseMontoDocumento(item.precioUnitario),
              parseMontoDocumento(item.subtotal),
            ]
          );
        }
      }
    }

    await registrarActividad(client, {
      obraId: obra_id,
      usuarioId,
      tipo: "pedido",
      accion: esImagen ? "cargó un comprobante" : "cargó un gasto",
      texto: `${esImagen ? "Cargó un comprobante" : "Cargó un gasto"} de ${montoTexto(gastoRow.monto, gastoRow.moneda)}${gastoRow.descripcion ? `: ${gastoRow.descripcion}` : ""} por WhatsApp`,
      entidadTipo: "gasto",
      entidadId: gastoRow.id,
      rubroId: gastoRow.rubro_id,
      tags: esImagen ? ["Gasto", "Comprobante"] : ["Gasto"],
    });

    await client.query("COMMIT");
    res.status(201).json(gastoRow);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ error: "Error creando gasto desde bot" });
  } finally {
    client.release();
  }
}
