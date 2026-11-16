// La landing no publica testimonios, citas atribuidas a personas ni prueba
// social inventada: se sacaron la sección "Historias reales de obra", el
// "+120 constructoras y estudios", los logos de "equipos que ya trabajan así"
// y la cita de Beneficios.
//
// Se montan las secciones por separado: la landing entera (con los bloques de
// framer-motion) no monta en happy-dom, y lo que interesa acá es el copy.
import { afterEach, describe, expect, test } from "bun:test";

const { cleanup, render } = await import("@testing-library/react");

const { default: Hero } = await import("./sections/Hero");
const { default: Problema } = await import("./sections/Problema");
const { default: Beneficios } = await import("./sections/Beneficios");

function texto() {
  return document.body.textContent ?? "";
}

afterEach(() => cleanup());

describe("landing sin prueba social inventada", () => {
  test("el hero no repite el claim de las 120 constructoras ni los logos", () => {
    render(<Hero />);
    expect(texto()).not.toContain("120");
    expect(texto()).not.toContain("Equipos de obra que ya trabajan así");
    expect(texto()).not.toContain("ESTUDIO MARCÁ");
    expect(texto()).not.toContain("CONSTRUCTORA LARIO");
  });

  test("la sección de problema no tiene citas con avatar", () => {
    render(<Problema />);
    expect(texto()).not.toContain("Me entero de los problemas");
    expect(texto()).not.toContain("La información llega tarde");
    expect(texto()).not.toContain("Las cifras no reflejan");
  });

  test("beneficios no tiene el testimonio del director de obra", () => {
    render(<Beneficios />);
    expect(texto()).not.toContain("Martín Rivera");
    expect(texto()).not.toContain("Constructora Larío");
    expect(texto()).not.toContain("Antes pasaba dos horas");
  });
});
