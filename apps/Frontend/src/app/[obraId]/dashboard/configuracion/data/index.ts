export type ObraTipo = "edificio" | "vivienda" | "refaccion" | "comercial";
export type ObraEstado = "planificacion" | "en-curso" | "pausada" | "finalizada";

export interface ObraSettings {
  nombre: string;
  codigo: string;
  tipo: ObraTipo;
  estado: ObraEstado;
  descripcion: string;
  direccion: string;
  localidad: string;
  provincia: string;
  cp: string;
  pais: string;
  inicio: string;
  fin: string;
}

export interface IntegracionItem {
  id: string;
  name: string;
  sub: string;
  status: "connected" | "pending" | "none";
  logo: { bg: string; fg: string };
}

export interface SesionActiva {
  device: string;
  browser: string;
  location: string;
  current: boolean;
}

export interface ConfiguracionPlan {
  nombre: string;
  precioMensual: number;
  detalle: string;
  proximoCobro: string;
  tarjeta: string;
  tarjetaVence: string;
  facturas: { fecha: string; concepto: string; monto: string }[];
}

export const OBRA_SETTINGS: ObraSettings = {
  nombre: "Edificio Belgrano",
  codigo: "OBR-2025-014",
  tipo: "edificio",
  estado: "en-curso",
  descripcion: "Edificio residencial de 12 plantas con 48 unidades funcionales, locales comerciales en planta baja y dos subsuelos de cocheras.",
  direccion: "Av. Belgrano 1842",
  localidad: "CABA",
  provincia: "Buenos Aires",
  cp: "C1093",
  pais: "ar",
  inicio: "2025-03-15",
  fin: "2026-08-30",
};

export const INTEGRACIONES_SEED: IntegracionItem[] = [
  { id: "excel", name: "Microsoft Excel", sub: "Exportá reportes y planillas en formato .xlsx.", status: "connected", logo: { bg: "#107C41", fg: "#fff" } },
  { id: "tango", name: "Tango Gestión", sub: "Sincronizá pedidos de materiales con tu ERP.", status: "pending", logo: { bg: "#0F4395", fg: "#fff" } },
  { id: "drive", name: "Google Drive", sub: "Guardá fotos y documentos de obra en tu Drive corporativo.", status: "none", logo: { bg: "#1A2238", fg: "#F59E0B" } },
  { id: "calendar", name: "Google Calendar", sub: "Mostrá hitos del cronograma en tu calendario.", status: "none", logo: { bg: "#EA4335", fg: "#fff" } },
  { id: "slack", name: "Slack", sub: "Reenviá alertas críticas al canal de tu equipo.", status: "none", logo: { bg: "#5865F2", fg: "#fff" } },
];

export const SESIONES_SEED: SesionActiva[] = [
  { device: "MacBook Pro", browser: "Chrome", location: "Buenos Aires · ahora", current: true },
  { device: "iPhone 14", browser: "App", location: "Buenos Aires · hace 3 h", current: false },
  { device: "iPad", browser: "Safari", location: "Mar del Plata · hace 5 días", current: false },
];

export const PLAN_FIXTURE: ConfiguracionPlan = {
  nombre: "Profesional",
  precioMensual: 89000,
  detalle: "Hasta 3 obras simultáneas · 20 personas por obra · IA ilimitada",
  proximoCobro: "15 Jun 2026",
  tarjeta: "•••• •••• •••• 4242",
  tarjetaVence: "08/27",
  facturas: [
    { fecha: "15 May 2026", concepto: "Plan Profesional · Mayo", monto: "AR$ 89.000" },
    { fecha: "15 Abr 2026", concepto: "Plan Profesional · Abril", monto: "AR$ 89.000" },
    { fecha: "15 Mar 2026", concepto: "Plan Profesional · Marzo", monto: "AR$ 89.000" },
    { fecha: "15 Feb 2026", concepto: "Plan Profesional · Febrero", monto: "AR$ 89.000" },
  ],
};