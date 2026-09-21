import { planificar } from "./planner.service.js";
import { generarSQL } from "./sqlGenerator.service.js";
import { ejecutarSQL, mensajeErrorPG } from "./sqlGuard.service.js";
import { narrar } from "./narrator.service.js";
import { pool } from "../../db.js";

// Orquestador del ChatBot AI: planner → SQL por subpregunta → ejecución → narrativa.
// El controller (HTTP) valida auth/membresía; acá solo se consulta la obra indicada.

const MAX_FILAS_AUDITORIA = 50;

async function auditar({ pregunta, obraId, personaId, plan, subpreguntas, respuesta, error, ms }) {
  try {
    const recorte = subpreguntas?.map((s) => ({
      id: s.id,
      descripcion: s.descripcion,
      tipo: s.tipo,
      periodo: s.periodo ?? null,
      sql: s.sql ?? null,
      error: s.error ?? null,
      filas: s.filas ? s.filas.slice(0, MAX_FILAS_AUDITORIA) : null,
      filas_totales: s.filas?.length ?? 0,
      ms: s.ms ?? null,
    }));
    await pool.query(
      `INSERT INTO chat_consultas (obra_id, persona_id, pregunta, plan, subpreguntas, respuesta, error, duracion_ms)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        obraId,
        personaId,
        pregunta,
        plan ? JSON.stringify(plan) : null,
        recorte ? JSON.stringify(recorte) : null,
        respuesta ?? null,
        error ?? null,
        ms ?? null,
      ]
    );
  } catch (e) {
    console.error("[chatbot] no se pudo auditar la consulta:", e.message);
  }
}

export async function consultar({ pregunta, obra = null, obraId, personaId = null }) {
  const inicio = Date.now();
  try {
    const { plan, usage: usagePlanner, reintento: reintentoPlanner } = await planificar(pregunta, { obra });

    if (plan.necesita_aclaracion) {
      const resultado = {
        respuesta: plan.necesita_aclaracion,
        interpretacion: plan.interpretacion,
        necesita_aclaracion: true,
        subpreguntas: [],
        usage: { planner: usagePlanner, sql: 0, narrator: 0 },
        ms: Date.now() - inicio,
      };
      await auditar({ pregunta, obraId, personaId, plan, subpreguntas: [], respuesta: resultado.respuesta, error: null, ms: resultado.ms });
      return resultado;
    }

    const generaciones = await Promise.all(
      plan.subpreguntas.map((sub) => generarSQL(sub, { obra, obraId }))
    );

    const subpreguntas = await Promise.all(
      generaciones.map(async (gen, i) => {
        const sub = plan.subpreguntas[i];
        const base = {
          id: sub.id,
          descripcion: sub.descripcion,
          tipo: sub.tipo,
          periodo: sub.periodo ?? null,
          agrupar_por: sub.agrupar_por ?? null,
          limite: sub.limite ?? null,
        };
        if (!gen.ok) {
          return { ...base, sql: gen.sql, explicacion: gen.explicacion, error: gen.errores.join("; ") };
        }
        const t0 = Date.now();
        try {
          const filas = await ejecutarSQL(gen.sql, gen.params);
          return { ...base, sql: gen.sql, explicacion: gen.explicacion, filas, ms: Date.now() - t0 };
        } catch (e) {
          return { ...base, sql: gen.sql, explicacion: gen.explicacion, error: mensajeErrorPG(e), ms: Date.now() - t0 };
        }
      })
    );

    const { respuesta, usage: usageNarrator } = await narrar({
      pregunta,
      obra,
      interpretacion: plan.interpretacion,
      subpreguntas,
    });

    const resultado = {
      respuesta,
      interpretacion: plan.interpretacion,
      necesita_aclaracion: false,
      subpreguntas,
      usage: {
        planner: usagePlanner,
        sql: generaciones.reduce((total, g) => total + (g.usage ?? 0), 0),
        narrator: usageNarrator,
      },
      reintentos: {
        planner: Boolean(reintentoPlanner),
        sql: generaciones.filter((g) => g.reintento).length,
      },
      ms: Date.now() - inicio,
    };

    await auditar({ pregunta, obraId, personaId, plan, subpreguntas, respuesta, error: null, ms: resultado.ms });
    return resultado;
  } catch (error) {
    await auditar({
      pregunta,
      obraId,
      personaId,
      plan: null,
      subpreguntas: null,
      respuesta: null,
      error: error.message,
      ms: Date.now() - inicio,
    });
    throw error;
  }
}
