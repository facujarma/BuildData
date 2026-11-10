import type { PedidoPendiente } from "../handlers/pendingQuery.store";

// Palabras que no aportan a la búsqueda: el usuario dice "llegó el pedido de
// cemento" y lo único que distingue es "cemento".
const PEDIDO_STOPWORDS = new Set([
  "pedido",
  "pedidos",
  "de",
  "del",
  "la",
  "el",
  "los",
  "las",
  "un",
  "una",
  "que",
  "llego",
  "llegaron",
  "trajeron",
  "recibi",
  "recibimos",
  "recibio",
  "material",
  "materiales",
  "bolsa",
  "bolsas",
  "unidad",
  "unidades",
  "caja",
  "cajas",
  "kilos",
  "litros",
  "hoy",
  "ayer",
  "para",
  "en",
  "con",
  "y",
]);

// Minúsculas y sin tildes, para comparar "cemento" con "Cementó".
function normalizarTexto(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

// Filtra los pedidos pendientes por las palabras útiles de la referencia.
// Todos los tokens tienen que aparecer (every) en proveedor + materiales.
// Si nada coincide, devuelve todos para que el usuario elija.
export function filtrarPedidos(
  pedidos: PedidoPendiente[],
  ref: string,
): PedidoPendiente[] {
  const tokens = normalizarTexto(ref)
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 3 && !PEDIDO_STOPWORDS.has(token));
  if (tokens.length === 0) return pedidos;

  const coinciden = pedidos.filter((pedido) => {
    const texto = normalizarTexto(
      `${pedido.proveedor ?? ""} ${pedido.materiales ?? ""}`,
    );
    return tokens.every((token) => texto.includes(token));
  });
  return coinciden.length > 0 ? coinciden : pedidos;
}

// Etiqueta de una opción de la encuesta: proveedor — materiales, acotada para
// que la opción del poll no se corte a lo bruto.
export function pedidoLabel(pedido: PedidoPendiente): string {
  const base = `${pedido.proveedor || "Sin proveedor"}${
    pedido.materiales ? ` — ${pedido.materiales}` : ""
  }`;
  return base.length > 90 ? `${base.slice(0, 87)}…` : base;
}
