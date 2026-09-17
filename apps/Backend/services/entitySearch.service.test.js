import { describe, expect, test } from "bun:test";
import {
  similitudTexto,
  combinarSimilitudes,
  clasificarCandidatos,
} from "./entitySearch.service.js";

describe("similitudTexto", () => {
  test("normaliza antes de comparar", () => {
    expect(similitudTexto("  Cemento   PORTLAND ", "cemento portland")).toBe(1);
  });

  test("detecta typos", () => {
    const sim = similitudTexto("semento", "cemento");
    expect(sim).toBeGreaterThan(0.8);
    expect(sim).toBeLessThan(1);
  });

  test("plurales", () => {
    expect(similitudTexto("ladrillos", "ladrillo")).toBeGreaterThan(0.85);
  });

  test("palabras no relacionadas dan bajo", () => {
    expect(similitudTexto("hierro", "pintura")).toBeLessThan(0.5);
  });

  test("vacíos", () => {
    expect(similitudTexto("", "")).toBe(1);
    expect(similitudTexto("cemento", "")).toBe(0);
  });
});

describe("combinarSimilitudes", () => {
  test("devuelve el máximo", () => {
    expect(combinarSimilitudes(0.4, 0.9)).toBe(0.9);
    expect(combinarSimilitudes(0.7, 0.3)).toBe(0.7);
  });

  test("ignora null/NaN", () => {
    expect(combinarSimilitudes(null, 0.5)).toBe(0.5);
    expect(combinarSimilitudes(0.5, Number.NaN)).toBe(0.5);
    expect(combinarSimilitudes(null, null)).toBe(0);
  });
});

describe("clasificarCandidatos", () => {
  test("alta con margen claro", () => {
    const r = clasificarCandidatos([{ similitud: 0.9 }, { similitud: 0.5 }]);
    expect(r.confianza).toBe("alta");
    expect(r.candidatos[0].similitud).toBe(0.9);
  });

  test("alta degradada a baja por margen chico", () => {
    expect(clasificarCandidatos([{ similitud: 0.9 }, { similitud: 0.88 }]).confianza).toBe("baja");
  });

  test("baja", () => {
    expect(clasificarCandidatos([{ similitud: 0.7 }, { similitud: 0.2 }]).confianza).toBe("baja");
  });

  test("ninguna", () => {
    expect(clasificarCandidatos([{ similitud: 0.4 }]).confianza).toBe("ninguna");
  });

  test("vacío", () => {
    expect(clasificarCandidatos([])).toEqual({ confianza: "ninguna", candidatos: [] });
  });

  test("ordena descendente", () => {
    const r = clasificarCandidatos([
      { similitud: 0.3 },
      { similitud: 0.95 },
      { similitud: 0.5 },
    ]);
    expect(r.candidatos.map((c) => c.similitud)).toEqual([0.95, 0.5, 0.3]);
  });
});
