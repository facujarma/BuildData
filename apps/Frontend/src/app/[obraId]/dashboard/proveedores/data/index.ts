export interface Proveedor {
  id: string;
  scope: "global" | "obra";
  fav: boolean;
  name: string;
  rubro: string;
  cuit: string;
  contact: string;
  role: string;
  phone: string;
  wa: string;
  email: string;
  web: string;
  address: string;
  pay: string;
  lead: string;
  desc: string;
  orders: number;
  spent: number;
}

export const SUPPLIERS_SEED: Proveedor[] = [
  { id: "PV-01", scope: "global", fav: true, name: "Cementos del Plata", rubro: "Hormigón armado", cuit: "30-71234567-4",
    contact: "Marta Ruiz", role: "Ventas", phone: "+54 11 4788 2210", wa: "+54 9 11 4788 2210",
    email: "ventas@cementosdelplata.com.ar", web: "cementosdelplata.com.ar",
    address: "Ruta 9 km 42, Escobar", pay: "30 días", lead: "3 días",
    desc: "Cemento Portland y cal. Entregan con camión propio y descarga incluida.",
    orders: 8, spent: 3.1 },
  { id: "PV-02", scope: "global", fav: true, name: "Aceros Norte", rubro: "Hormigón armado", cuit: "30-70998877-1",
    contact: "Diego Sosa", role: "Comercial", phone: "+54 11 4312 7788", wa: "+54 9 11 4312 7788",
    email: "pedidos@acerosnorte.com", web: "acerosnorte.com",
    address: "Av. Mitre 3420, San Martín", pay: "60 días", lead: "7 días",
    desc: "Hierro del 6 al 25, mallas y estribos. Corte y doblado a pedido.",
    orders: 5, spent: 4.8 },
  { id: "PV-03", scope: "global", fav: false, name: "Cerámica San Pedro", rubro: "Mampostería", cuit: "30-68112233-9",
    contact: "Laura Giménez", role: "Atención al cliente", phone: "+54 11 5566 1190", wa: "+54 9 11 5566 1190",
    email: "hola@ceramicasanpedro.com.ar", web: "ceramicasanpedro.com.ar",
    address: "Camino Centenario 1200, La Plata", pay: "Contado", lead: "10 días",
    desc: "Ladrillo hueco y cerámico. Pedido mínimo 2.000 unidades.",
    orders: 3, spent: 1.9 },
  { id: "PV-04", scope: "global", fav: false, name: "Áridos Río", rubro: "Movimiento de suelos", cuit: "30-65443322-7",
    contact: "Hernán Paz", role: "Logística", phone: "+54 11 4901 3355", wa: "+54 9 11 4901 3355",
    email: "logistica@aridosrio.com.ar", web: "",
    address: "Camino a Punta Lara s/n, Ensenada", pay: "15 días", lead: "2 días",
    desc: "Arena, piedra partida y granza. Cobran flete aparte según distancia.",
    orders: 4, spent: 1.2 },
  { id: "PV-05", scope: "global", fav: false, name: "Eléctrica Plaza", rubro: "Instalaciones", cuit: "30-71887766-3",
    contact: "Cecilia Viale", role: "Ventas técnicas", phone: "+54 11 4383 9021", wa: "",
    email: "ventas@electricaplaza.com.ar", web: "electricaplaza.com.ar",
    address: "Perón 1877, CABA", pay: "30 días", lead: "5 días",
    desc: "Cable, caños, tableros y llaves térmicas. Asesoramiento técnico.",
    orders: 2, spent: 0.4 },
  { id: "PV-06", scope: "obra", fav: true, name: "Hormigonera Sur", rubro: "Hormigón armado", cuit: "30-70554433-2",
    contact: "Raúl Ibáñez", role: "Dueño", phone: "+54 11 4667 8820", wa: "+54 9 11 4667 8820",
    email: "raul@hormigonerasur.com.ar", web: "",
    address: "Colectora Oeste 2280, Boulogne", pay: "Contado", lead: "1 día",
    desc: "Conseguido para esta obra. Hormigón elaborado para urgencias, responde fuera de horario.",
    orders: 0, spent: 0 },
  { id: "PV-07", scope: "obra", fav: false, name: "Carpintería Lomas", rubro: "Terminaciones", cuit: "",
    contact: "Sergio Duarte", role: "Titular", phone: "+54 11 5520 7734", wa: "+54 9 11 5520 7734",
    email: "", web: "",
    address: "Lomas de Zamora", pay: "50% anticipo", lead: "20 días",
    desc: "Aberturas y muebles a medida. Todavía no trabajamos con ellos en esta obra.",
    orders: 0, spent: 0 },
];

// "Cementos del Plata" → "CP" (ignora conectores y sufijos societarios).
const SUP_SKIP = /^(de|del|la|las|los|el|y|e|s\.?a\.?|s\.?r\.?l\.?|sas|ltda)$/i;

export function supInitials(name: string): string {
  return (name || "")
    .split(/\s+/)
    .filter((w) => w && !SUP_SKIP.test(w))
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
