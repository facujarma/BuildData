import { pool } from "../db.js";
import { resolvePersonaIdByTelefono } from "../services/personaService.js";

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
// real (rechaza 2026-02-30) y devolvemos null si no matchea (la columna usa CURRENT_DATE).
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

// GET /gastos/:obra_id
export async function getGastos(req, res) {
  const { obra_id } = req.params;
  try {
    const result = await pool.query(
      `SELECT * FROM gastos WHERE obra_id = $1 ORDER BY fecha DESC`,
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
export async function crearGasto(req, res) {
  const { obra_id, rubro_id, descripcion, monto, pedido_id } = req.body;
  if (!obra_id || !monto) return res.status(400).json({ error: "obra_id y monto son requeridos" });
  try {
    const result = await pool.query(
      `INSERT INTO gastos (obra_id, usuario_id, rubro_id, descripcion, monto, pedido_id, origen, revisado)
       VALUES ($1, $2, $3, $4, $5, $6, 'manual', true) RETURNING *`,
      [obra_id, req.personaId || null, rubro_id || null, descripcion, monto, pedido_id]
    );
    res.status(201).json(result.rows[0]);
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
       VALUES ($1, $2, $3, $4, $5, COALESCE($6, 'ARS'), $7, $8, COALESCE($9, CURRENT_DATE))
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
