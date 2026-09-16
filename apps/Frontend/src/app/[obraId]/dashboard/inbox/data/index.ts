import type { InboxMessage } from "@/types/inbox";

export const INBOX_SEED: InboxMessage[] = [
  {
    id: "IN-2214", dir: "in", kind: "audio", from: "C. Ríos", role: "Capataz", time: "hace 4 min",
    dur: "0:18",
    raw: "Che, llegaron ciento veinte bolsas de cemento, las bajamos en el depósito grande. Faltan las doce que quedaron en la fábrica. Ojo que el camión rompió un pedazo del cordón al entrar.",
    conf: 0.94, state: "pending", note: "",
    mapped: ["ciento veinte bolsas de cemento", "depósito grande", "doce que quedaron en la fábrica"],
    loose: [{ txt: "el camión rompió un pedazo del cordón al entrar", why: "Posible incidente — no corresponde a esta entrega" }],
    parse: { tipo: "Entrega de material", destino: "Pedidos + Stock", campos: [
      ["Pedido", "PED-0142 · Cemento Portland"], ["Cantidad recibida", "120 bolsas"],
      ["Pendiente", "12 bolsas"], ["Lugar", "Depósito grande"], ["Recibió", "C. Ríos"],
    ]},
  },
  {
    id: "IN-2213", dir: "in", kind: "audio", from: "P. Salas", role: "Capataz", time: "hace 22 min",
    dur: "0:31",
    raw: "Se cortó la luz en el sector de arriba y no podemos seguir con el tendido. Va a haber que llamar al electricista, no sé si vamos a llegar con lo de hoy. Igual aproveché y mandé a los pibes a limpiar la planta baja.",
    conf: 0.71, state: "pending", note: "",
    mapped: ["Se cortó la luz", "no podemos seguir con el tendido", "llamar al electricista"],
    parse: { tipo: "Alerta", destino: "Alertas", campos: [
      ["Nivel sugerido", "Importante"], ["Categoría", "Equipos"],
      ["Tarea afectada", "Tendido eléctrico"], ["Acción sugerida", ""],
    ]},
  },
  {
    id: "IN-2212", dir: "in", kind: "photo", from: "C. Ríos", role: "Capataz", time: "hace 1 h",
    raw: "4 fotos · armado de columnas eje 4-6", photos: 4,
    conf: 0.88, state: "pending", note: "", mapped: [], loose: [],
    parse: { tipo: "Avance con foto", destino: "Galería + Cronograma", campos: [
      ["Tarea", "Columnas eje 4-6"], ["Avance detectado", "35%"], ["Fotos", "4 imágenes"],
    ]},
  },
  {
    id: "IN-2211", dir: "in", kind: "text", from: "L. Benítez", role: "Compras", time: "hace 2 h",
    raw: "Pedile 200 ladrillos huecos del 18 a San Pedro para el martes que viene",
    conf: 0.96, state: "confirmed", by: "J. Méndez", at: "hoy 11:04", note: "Confirmado con el proveedor por teléfono.",
    mapped: ["200 ladrillos huecos del 18", "San Pedro", "martes que viene"], loose: [],
    parse: { tipo: "Pedido de material", destino: "Pedidos", campos: [
      ["Material", "Ladrillo hueco 18×18"], ["Cantidad", "200 u"],
      ["Proveedor", "Cerámica San Pedro"], ["Llegada", "martes"],
    ]},
    applied: ["PED-0143 creado en Pedidos"],
  },
  {
    id: "IN-2210", dir: "in", kind: "audio", from: "M. Ortiz", role: "Capataz", time: "ayer 18:40",
    dur: "0:09", raw: "Nada, todo bien por acá, mañana seguimos.",
    conf: 0.42, state: "discarded", note: "", mapped: [], loose: [],
    parse: { tipo: "Sin dato accionable", destino: "—", campos: [] },
    warn: "La IA no encontró información estructurable en este mensaje.",
  },
  {
    id: "OUT-881", dir: "out", kind: "text", to: "M. Ortiz", role: "Capataz", time: "ayer 19:05",
    raw: "Hola Marcos, no registramos el cierre de jornada de hoy. ¿Podés mandarlo cuando puedas?",
    trigger: "Recordatorio automático · sin reporte a las 19:00", state: "sent",
  },
  {
    id: "OUT-880", dir: "out", kind: "text", to: "L. Benítez", role: "Compras", time: "ayer 17:32",
    raw: "El pedido PED-0142 (Cemento · 120 bolsas) fue aprobado por J. Méndez.",
    trigger: "Notificación · pedido aprobado", state: "sent",
  },
];