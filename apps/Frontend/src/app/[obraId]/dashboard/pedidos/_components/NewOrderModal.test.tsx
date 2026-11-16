// Regresión: el modal de "Nuevo pedido" abierto desde el menú "Nuevo" del
// dashboard monta antes de que el padre termine de traer rubros, proveedores y
// materiales. El componente copiaba `rubros`/`proveedores` a su useState inicial,
// así que las props que llegaban después se ignoraban y los selects quedaban
// vacíos para siempre. Ahora las listas se derivan de las props.

import { afterAll, describe, expect, mock, test } from "bun:test";

mock.module("@/lib/supabaseClient", () => ({
  supabase: { auth: { getSession: async () => ({ data: { session: null } }) } },
}));

const { cleanup, render, screen } = await import("@testing-library/react");
const { NewOrderModal } = await import("./NewOrderModal");

afterAll(() => {
  cleanup();
  mock.restore();
});

const BASE = {
  obraId: "0b7c1f5e-1a2b-4c3d-8e9f-0123456789ab",
  onClose: () => {},
  onSubmit: async () => {},
  members: [],
};

const RUBROS = [
  { id: "rubro-2", nombre: "Mampostería" },
  { id: "rubro-1", nombre: "Hormigón armado" },
];

const PROVEEDORES = [
  {
    id: "prov-1",
    scope: "global" as const,
    fav: false,
    name: "Cementos del Plata",
    rubro: "",
    cuit: "",
    contact: "",
    role: "",
    phone: "",
    wa: "",
    email: "",
    web: "",
    address: "",
    pay: "",
    lead: "",
    desc: "",
    orders: 0,
    spent: 0,
  },
];

const MATERIALES = [
  { id: "mat-1", name: "Cemento Portland 50 kg", unit: "bolsas", cost: 15000 },
];

// Los selects del modal, en orden: material, proveedor, rubro, solicitante.
const opciones = (indice: number) => {
  const selects = [...document.querySelectorAll("select")];
  const select = selects[indice];
  if (!select) throw new Error(`No existe el select ${indice}`);
  return [...select.options].map((opcion) => opcion.textContent);
};

describe("NewOrderModal — listas que llegan después del montaje", () => {
  test("sin datos todavía muestra los avisos de vacío", () => {
    render(<NewOrderModal {...BASE} rubros={[]} proveedores={[]} materiales={[]} />);

    expect(screen.getByText("Sin materiales cargados en stock")).toBeTruthy();
    expect(screen.getByText("Sin proveedores cargados")).toBeTruthy();
    expect(screen.getByText("Sin rubros")).toBeTruthy();

    cleanup();
  });

  test("al llegar las props llena rubros, proveedores y materiales", () => {
    const { rerender } = render(
      <NewOrderModal {...BASE} rubros={[]} proveedores={[]} materiales={[]} />,
    );

    rerender(
      <NewOrderModal
        {...BASE}
        rubros={RUBROS}
        proveedores={PROVEEDORES}
        materiales={MATERIALES}
      />,
    );

    // Ordenadas alfabéticamente, sin perder ninguna.
    expect(opciones(2)).toEqual(["Sin rubro", "Hormigón armado", "Mampostería"]);
    expect(opciones(1)).toEqual(["Elegí un proveedor…", "Cementos del Plata"]);
    expect(opciones(0)).toEqual(["Elegí un material…", "Cemento Portland 50 kg"]);
    // El aviso de "cargá el material desde Stock" ya no corresponde.
    expect(screen.queryByText("Sin materiales cargados en stock")).toBeNull();

    cleanup();
  });

  test("mientras loading está en true los selects avisan y quedan deshabilitados", () => {
    render(<NewOrderModal {...BASE} rubros={[]} proveedores={[]} materiales={[]} loading />);

    expect(screen.getByText("Cargando materiales…")).toBeTruthy();
    expect(screen.getByText("Cargando proveedores…")).toBeTruthy();
    expect(screen.getByText("Cargando rubros…")).toBeTruthy();

    const selects = [...document.querySelectorAll("select")];
    // Material, proveedor, rubro y solicitante: los tres primeros esperan datos.
    expect(selects.slice(0, 3).every((select) => (select as HTMLSelectElement).disabled)).toBe(true);
    expect((selects[3] as HTMLSelectElement).disabled).toBe(false);

    cleanup();
  });
});
