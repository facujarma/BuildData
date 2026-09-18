import { describe, expect, test } from "bun:test";
import { mapearResultadoBusqueda } from "./entityMatch.service";

describe("mapearResultadoBusqueda", () => {
  test("alta aplica el top y lo conserva para el display", () => {
    const r = mapearResultadoBusqueda({
      confianza: "alta",
      candidatos: [
        { id: "a", nombre: "Cemento Portland", similitud: 0.94 },
        { id: "b", nombre: "Cal", similitud: 0.5 },
      ],
    });
    expect(r).toEqual({
      match_id: "a",
      confianza: "alta",
      candidatos: [{ id: "a", nombre: "Cemento Portland" }],
    });
  });

  test("baja deja candidatos para la encuesta y sin match", () => {
    const r = mapearResultadoBusqueda({
      confianza: "baja",
      candidatos: [
        { id: "a", nombre: "Cemento Portland", similitud: 0.78 },
        { id: "b", nombre: "Cemento Onix", similitud: 0.7 },
      ],
    });
    expect(r).toEqual({
      match_id: null,
      confianza: "baja",
      candidatos: [
        { id: "a", nombre: "Cemento Portland" },
        { id: "b", nombre: "Cemento Onix" },
      ],
    });
  });

  test("ninguna conserva los candidatos flojos para la encuesta", () => {
    const r = mapearResultadoBusqueda({
      confianza: "ninguna",
      candidatos: [
        { id: "a", nombre: "X", similitud: 0.3 },
        { id: "b", nombre: "Y", similitud: 0.2 },
      ],
    });
    expect(r).toEqual({
      match_id: null,
      confianza: "ninguna",
      candidatos: [
        { id: "a", nombre: "X" },
        { id: "b", nombre: "Y" },
      ],
    });
  });

  test("alta sin candidatos cae a ninguna", () => {
    expect(mapearResultadoBusqueda({ confianza: "alta", candidatos: [] })).toEqual({
      match_id: null,
      confianza: "ninguna",
      candidatos: [],
    });
  });

  test("filtra candidatos inválidos", () => {
    const r = mapearResultadoBusqueda({
      confianza: "baja",
      candidatos: [
        { id: "a", nombre: "Ok" },
        { id: 123 as unknown as string, nombre: "Mal" },
      ],
    });
    expect(r.candidatos).toEqual([{ id: "a", nombre: "Ok" }]);
  });
});
