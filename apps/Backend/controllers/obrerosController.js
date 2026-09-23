import { pool } from "../db.js";

// GET /obreros/:obra_id — obreros de una obra
export async function getObreros(req, res) {
  const { obra_id } = req.params;
  try {
    const result = await pool.query(
      `SELECT p.id, p.nombre, p.telefono, p.auth_user_id, mo.rol, mo.joined_at
       FROM personas p
       JOIN miembros_obra mo ON p.id = mo.persona_id
       WHERE mo.obra_id = $1
       ORDER BY p.nombre ASC`,
      [obra_id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}

// POST /bot/obreros/registrar — el bot crea un obrero y opcionalmente lo asigna a una obra
export async function registrarObrero(req, res) {
  const { nombre, telefono, obra_id, rol } = req.body;
  if (!nombre) return res.status(400).json({ code: "VALIDATION_ERROR", message: "nombre es requerido" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const obrero = await client.query(
      `INSERT INTO personas (nombre, telefono) VALUES ($1, $2)
       ON CONFLICT (telefono) DO UPDATE SET nombre = $1
       RETURNING *`,
      [nombre, telefono]
    );

    if (obra_id) {
      await client.query(
        `INSERT INTO miembros_obra (persona_id, obra_id, rol) VALUES ($1, $2, $3)`,
        [obrero.rows[0].id, obra_id, rol || null]
      );
    }

    await client.query("COMMIT");
    res.status(201).json(obrero.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ code: "SERVER_ERROR", message: error.message });
  } finally {
    client.release();
  }
}

// POST /obreros/asignar-obra — vincular obrero a una obra con rol
export async function asignarObraObrero(req, res) {
  const { obrero_id, obra_id, rol } = req.body;
  if (!obrero_id || !obra_id) return res.status(400).json({ error: "obrero_id y obra_id son requeridos" });
  try {
    const result = await pool.query(
      `INSERT INTO miembros_obra (persona_id, obra_id, rol)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [obrero_id, obra_id, rol]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}

// DELETE /obreros/:obrero_id/obra/:obra_id — quitar obrero de una obra
export async function quitarObreroDeObra(req, res) {
  const { obrero_id, obra_id } = req.params;
  try {
    await pool.query(
      `DELETE FROM miembros_obra WHERE persona_id = $1 AND obra_id = $2`,
      [obrero_id, obra_id]
    );
    res.json({ mensaje: "Obrero quitado de la obra" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}

export async function getUserByPhone(req, res) {
  const { phone } = req.params;
  try {
    const result = await pool.query(
      `SELECT p.id, p.nombre, p.telefono, mo.obra_id, mo.rol, ob.nombre AS obra_nombre, ob.direccion
       FROM personas p
       JOIN miembros_obra mo ON p.id = mo.persona_id
       JOIN obras ob ON ob.id = mo.obra_id
       WHERE p.telefono = $1`,
      [phone]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Obrero no encontrado" });

    const obreroData = {
      id: result.rows[0].id,
      nombre: result.rows[0].nombre,
      telefono: result.rows[0].telefono,
      obras: result.rows.map(row => ({ obra_id: row.obra_id, obra_nombre: row.obra_nombre, direccion: row.direccion, rol: row.rol }))
    };
    res.json(obreroData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}