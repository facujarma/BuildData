import { describe, expect, test } from "bun:test";
import { parseSimpleAnswer, applySimpleAnswer } from "./answerParser.service";
import type { MissingField } from "./endpointSchema";
import type { ApiCall } from "../handlers/pendingQuery.store";

function field(over: Partial<MissingField>): MissingField {
  return {
    opIndex: 0,
    path: "dias_retraso",
    name: "dias_retraso",
    type: "number",
    prompt: "¿Cuántos días de atraso?",
    dataKey: null,
    itemIndex: 0,
    ...over,
  };
}

describe("parseSimpleAnswer", () => {
  test("números simples y formato argentino", () => {
    expect(parseSimpleAnswer(field({}), "10")).toEqual({ ok: true, value: 10 });
    expect(parseSimpleAnswer(field({}), "10,5")).toEqual({ ok: true, value: 10.5 });
    expect(parseSimpleAnswer(field({}), "1.500")).toEqual({ ok: true, value: 1500 });
    expect(parseSimpleAnswer(field({}), "1.500,50")).toEqual({
      ok: true,
      value: 1500.5,
    });
  });

  test("números en palabras o evasivas no se interpretan", () => {
    expect(parseSimpleAnswer(field({}), "diez").ok).toBe(false);
    expect(parseSimpleAnswer(field({}), "no sé").ok).toBe(false);
    expect(parseSimpleAnswer(field({}), "").ok).toBe(false);
    expect(parseSimpleAnswer(field({}), "!cancel").ok).toBe(false);
  });

  test("booleanos", () => {
    const bool = field({ name: "completada", path: "completada", type: "boolean" });
    expect(parseSimpleAnswer(bool, "sí")).toEqual({ ok: true, value: true });
    expect(parseSimpleAnswer(bool, "dale")).toEqual({ ok: true, value: true });
    expect(parseSimpleAnswer(bool, "no")).toEqual({ ok: true, value: false });
    expect(parseSimpleAnswer(bool, "tal vez").ok).toBe(false);
  });

  test("strings: solo una palabra y no evasiva", () => {
    const str = field({ name: "tarea", path: "tarea", type: "string" });
    expect(parseSimpleAnswer(str, "cemento")).toEqual({ ok: true, value: "cemento" });
    expect(parseSimpleAnswer(str, "Pintura")).toEqual({ ok: true, value: "Pintura" });
    expect(parseSimpleAnswer(str, "cemento y arena").ok).toBe(false);
    expect(parseSimpleAnswer(str, "no").ok).toBe(false);
    expect(parseSimpleAnswer(str, "sí").ok).toBe(false);
  });

  test("strings con allowedValues: solo acepta valores válidos", () => {
    const tipo = field({
      name: "tipo",
      path: "tipo",
      type: "string",
      allowedValues: ["entrada", "salida"],
    });
    expect(parseSimpleAnswer(tipo, "entrada")).toEqual({ ok: true, value: "entrada" });
    expect(parseSimpleAnswer(tipo, "SALIDA")).toEqual({ ok: true, value: "salida" });
    expect(parseSimpleAnswer(tipo, "llegó").ok).toBe(false);
  });

  test("arrays y objetos nunca se responden determinísticamente", () => {
    const arr = field({ name: "items", path: "items", type: "array" });
    expect(parseSimpleAnswer(arr, "cemento").ok).toBe(false);
  });
});

describe("applySimpleAnswer", () => {
  test("escribe en la raíz del data", () => {
    const op: ApiCall = { endpoint: "/bot/retraso", method: "POST", data: {} };
    expect(applySimpleAnswer(op, field({}), 3)).toBe(true);
    expect(op.data).toEqual({ dias_retraso: 3 });
  });

  test("escribe en un item del array", () => {
    const op: ApiCall = {
      endpoint: "/bot/stock",
      method: "POST",
      data: { movimientos: [{ nombre: "cemento" }] },
    };
    const sub = field({
      name: "cantidad",
      path: "movimientos[0].cantidad",
      type: "number",
      dataKey: "movimientos",
      itemIndex: 0,
    });
    expect(applySimpleAnswer(op, sub, 10)).toBe(true);
    expect(op.data).toEqual({ movimientos: [{ nombre: "cemento", cantidad: 10 }] });
  });

  test("devuelve false si el contenedor no existe", () => {
    const op: ApiCall = { endpoint: "/bot/stock", method: "POST", data: {} };
    const sub = field({
      name: "cantidad",
      path: "movimientos[0].cantidad",
      type: "number",
      dataKey: "movimientos",
      itemIndex: 0,
    });
    expect(applySimpleAnswer(op, sub, 10)).toBe(false);
  });
});
