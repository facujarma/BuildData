import { describe, expect, test } from "bun:test";
import {
  normalizarTextoEntidad,
  aVectorLiteral,
  ENTIDADES,
  modeloEmbeddings,
} from "./embeddings.service.js";

describe("normalizarTextoEntidad", () => {
  test("recorta, colapsa espacios y pasa a minúsculas", () => {
    expect(normalizarTextoEntidad("  Cemento   Portland ")).toBe("cemento portland");
    expect(normalizarTextoEntidad(null)).toBe("");
    expect(normalizarTextoEntidad(undefined)).toBe("");
  });
});

describe("aVectorLiteral", () => {
  test("serializa el vector como literal de pgvector", () => {
    expect(aVectorLiteral([0.1, 2, -3])).toBe("[0.1,2,-3]");
    expect(aVectorLiteral([])).toBe("[]");
  });
});

describe("ENTIDADES", () => {
  test("mapea cada tipo a su tabla y columna de nombre", () => {
    expect(ENTIDADES.tarea).toEqual({ tabla: "tareas", columnaNombre: "titulo" });
    expect(Object.keys(ENTIDADES).sort()).toEqual([
      "material",
      "proveedor",
      "rubro",
      "tarea",
    ]);
  });
});

describe("modeloEmbeddings", () => {
  test("usa text-embedding-3-small por defecto y respeta el env", () => {
    delete process.env.OPENAI_EMBEDDING_MODEL;
    expect(modeloEmbeddings()).toBe("text-embedding-3-small");

    process.env.OPENAI_EMBEDDING_MODEL = "otro-modelo";
    expect(modeloEmbeddings()).toBe("otro-modelo");

    delete process.env.OPENAI_EMBEDDING_MODEL;
  });
});
