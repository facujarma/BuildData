import { DEMO_ACTIVO } from "./demo";

export const pricingCardsYearly = [
  {
    planLabel: "Inicio",
    labelColor: "#0F4395",
    title: "Para probar BuildData o para una sola obra chica.",
    price: "Gratis",
    priceSub: "14 días sin tarjeta · luego AR$ 0 / mes",
    idealFor: "Profesionales independientes que arrancan con BuildData.",
    ctaText: "Empezar gratis",
    ctaHref: "/login",
    features: [
      { text: "1 obra activa", included: true },
      { text: "Hasta 5 personas en el equipo", included: true },
      { text: "Bot de WhatsApp con 100 mensajes/mes", included: true },
      { text: "Cronograma y alertas básicas", included: true },
      { text: "Almacenamiento 1 GB", included: true },
      { text: "Análisis IA y resúmenes diarios", included: false },
      { text: "Reportes exportables (PDF/XLSX)", included: false },
      { text: "Integraciones con ERP", included: false },
    ],
  },
  {
    planLabel: "Profesional",
    labelColor: "#F59E0B",
    title: "Lo más elegido — para constructoras pequeñas y medianas.",
    price: "AR$ 71.000",
    priceSub: "Facturado anualmente · ahorrás AR$ 216.000 al año",
    idealFor: "Constructoras con 2 a 5 obras simultáneas.",
    ctaText: "Probar 14 días gratis",
    ctaHref: "/login?plan=pro?facturation=yearly",
    isFeatured: true,
    badge: "★ Más elegido",
    features: [
      { text: "Hasta 3 obras activas", included: true, bold: true },
      { text: "Hasta 20 personas por obra", included: true, bold: true },
      { text: "Bot de WhatsApp con mensajes ilimitados", included: true },
      { text: "Cronograma, alertas y pedidos completos", included: true },
      { text: "Análisis IA y resúmenes diarios", included: true, bold: true },
      { text: "Reportes exportables (PDF/XLSX)", included: true },
      { text: "Almacenamiento 20 GB", included: true },
      { text: "Soporte prioritario por WhatsApp", included: true },
      { text: "Integraciones con ERP (Tango, SAP)", included: false },
    ],
  },
  {
    planLabel: "Empresa",
    labelColor: "#0F4395",
    title: "Para constructoras que gestionan muchas obras a la vez.",
    price: "AR$ 151.000",
    priceSub: "Facturado anualmente · ahorrás AR$ 456.000 al año",
    idealFor: "Constructoras con 6+ obras o gerencias multi-proyecto.",
    ctaText: "Probar 14 días gratis",
    ctaHref: "/login?plan=empresa?facturation=yearly",
    features: [
      { text: "Obras ilimitadas", included: true, bold: true },
      { text: "Equipos ilimitados", included: true, bold: true },
      { text: "Bot de WhatsApp con mensajes ilimitados", included: true },
      { text: "Todo lo del plan Profesional", included: true },
      {
        text: "Integraciones con ERP (Tango, SAP, custom)",
        included: true,
        bold: true,
      },
      { text: "Dashboard consolidado multi-obra", included: true, bold: true },
      { text: "Almacenamiento 200 GB", included: true },
      { text: "Manager de cuenta dedicado", included: true },
      { text: "Onboarding con tu equipo", included: true },
    ],
  },
];

export const pricingCardsMonthly = [
  {
    planLabel: "Inicio",
    labelColor: "#0F4395",
    title: "Para probar BuildData o para una sola obra chica.",
    price: "Gratis",
    priceSub: "14 días sin tarjeta · luego AR$ 0 / mes",
    idealFor: "Profesionales independientes que arrancan con BuildData.",
    ctaText: "Empezar gratis",
    ctaHref: "/login",
    features: [
      { text: "1 obra activa", included: true },
      { text: "Hasta 5 personas en el equipo", included: true },
      { text: "Bot de WhatsApp con 100 mensajes/mes", included: true },
      { text: "Cronograma y alertas básicas", included: true },
      { text: "Almacenamiento 1 GB", included: true },
      { text: "Análisis IA y resúmenes diarios", included: false },
      { text: "Reportes exportables (PDF/XLSX)", included: false },
      { text: "Integraciones con ERP", included: false },
    ],
  },
  {
    planLabel: "Profesional",
    labelColor: "#F59E0B",
    title: "Lo más elegido — para constructoras pequeñas y medianas.",
    price: "AR$ 88.750",
    priceSub: "Facturado mensualmente",
    idealFor: "Constructoras con 2 a 5 obras simultáneas.",
    ctaText: "Probar 14 días gratis",
    ctaHref: "/login?plan=pro?facturation=monthly",
    isFeatured: true,
    badge: "★ Más elegido",
    features: [
      { text: "Hasta 3 obras activas", included: true, bold: true },
      { text: "Hasta 20 personas por obra", included: true, bold: true },
      { text: "Bot de WhatsApp con mensajes ilimitados", included: true },
      { text: "Cronograma, alertas y pedidos completos", included: true },
      { text: "Análisis IA y resúmenes diarios", included: true, bold: true },
      { text: "Reportes exportables (PDF/XLSX)", included: true },
      { text: "Almacenamiento 20 GB", included: true },
      { text: "Soporte prioritario por WhatsApp", included: true },
      { text: "Integraciones con ERP (Tango, SAP)", included: false },
    ],
  },
  {
    planLabel: "Empresa",
    labelColor: "#0F4395",
    title: "Para constructoras que gestionan muchas obras a la vez.",
    price: "AR$ 188.750",
    priceSub: "Facturado mensualmente",
    idealFor: "Constructoras con 6+ obras o gerencias multi-proyecto.",
    ctaText: "Probar 14 días gratis",
    ctaHref: "/login?plan=empresa?facturation=monthly",
    features: [
      { text: "Obras ilimitadas", included: true, bold: true },
      { text: "Equipos ilimitados", included: true, bold: true },
      { text: "Bot de WhatsApp con mensajes ilimitados", included: true },
      { text: "Todo lo del plan Profesional", included: true },
      {
        text: "Integraciones con ERP (Tango, SAP, custom)",
        included: true,
        bold: true,
      },
      { text: "Dashboard consolidado multi-obra", included: true, bold: true },
      { text: "Almacenamiento 200 GB", included: true },
      { text: "Manager de cuenta dedicado", included: true },
      { text: "Onboarding con tu equipo", included: true },
    ],
  },
];

export const comparisonCategories = [
  {
    name: "Equipo y obras",
    features: [
      { name: "Obras simultáneas", values: ["1", "3", "Ilimitadas"] },
      { name: "Personas por obra", values: ["5", "20", "Ilimitadas"] },
      { name: "Roles personalizados", values: [false, true, true] },
      { name: "Sectores por obra", values: ["3", "10", "Ilimitados"] },
    ],
  },
  {
    name: "Bot de WhatsApp",
    features: [
      { name: "Mensajes al mes", values: ["100", "Ilimitados", "Ilimitados"] },
      { name: "Transcripción de audios", values: [true, true, true] },
      {
        name: "Clasificación automática por IA",
        values: ["Básica", "Completa", "Completa + custom"],
      },
      { name: "Múltiples números de WhatsApp", values: [false, false, true] },
    ],
  },
  {
    name: "Análisis e IA",
    features: [
      { name: "Resumen diario por IA", values: [false, true, true] },
      { name: "Predicción de retrasos", values: [false, true, true] },
      { name: "Consultas en lenguaje natural", values: [false, true, true] },
      {
        name: "Modelos entrenados con tus datos",
        values: [false, false, true],
      },
    ],
  },
  {
    name: "Reportes y exportación",
    features: [
      { name: "Reportes en pantalla", values: [true, true, true] },
      { name: "Exportar PDF / XLSX", values: [false, true, true] },
      { name: "Reportes programados por email", values: [false, true, true] },
      { name: "API y webhooks", values: [false, false, true] },
    ],
  },
  {
    name: "Integraciones",
    features: [
      { name: "Excel / Google Sheets", values: [true, true, true] },
      { name: "Slack / Microsoft Teams", values: [false, true, true] },
      { name: "ERP (Tango, SAP, etc.)", values: [false, false, true] },
      { name: "Integraciones a medida", values: [false, false, true] },
    ],
  },
  {
    name: "Soporte",
    features: [
      { name: "Centro de ayuda", values: [true, true, true] },
      { name: "Soporte por email", values: ["48 hs", "24 hs", "4 hs"] },
      { name: "Soporte por WhatsApp", values: [false, true, true] },
      { name: "Manager de cuenta dedicado", values: [false, false, true] },
    ],
  },
];

export const faqItemsPagos = [
  {
    question: "¿Puedo cambiar de plan en cualquier momento?",
    answer:
      "Sí. Subir de plan es instantáneo y solo pagás la diferencia prorrateada hasta el próximo ciclo. Bajar de plan se aplica al inicio del siguiente período. Cancelar también lo podés hacer cuando quieras desde Configuración.",
  },
  {
    question: "¿Qué pasa cuando termina la prueba gratis de 14 días?",
    answer:
      "Si no elegís un plan pago, tu cuenta pasa automáticamente al plan Inicio (gratuito) con todas sus funcionalidades. Nunca perdés tu información. Siempre podés actualizar a un plan pago cuando lo necesites.",
  },
  {
    question: "¿Cobran por persona del equipo?",
    answer:
      "No. Todos nuestros planes tienen costo fijo por obra, sin importar cuántas personas agregues al equipo. Podés invitar a tu capataz, ingenieros, clientes y proveedores sin costos adicionales.",
  },
  {
    question: "¿Cómo funciona la facturación anual?",
    answer:
      "Elegís facturación anual y te ahorrás el equivalente a 2 meses de facturación. El cobro es una vez al año, al inicio del período. Podés cambiar a facturación mensual en cualquier renovación.",
  },
  // { TODO: revisar
  //   question: "¿Mis datos están seguros?",
  //   answer:
  //     "Sí. Usamos encriptación de extremo a extremo, servidores en la nube con certificaciones ISO 27001, y hacemos backups diarios. Tus datos nunca se comparten con terceros.",
  // },
  // {
  //   question: "¿Tienen descuentos para estudios chicos o cooperativas?",
  //   answer:
  //     "Sí. Tenemos planes especiales para cooperativas de trabajo, estudios pequeños y organizaciones sin fines de lucro. Escribinos a info@builddata.com.ar y te armamos una propuesta.",
  // },
];

// Preguntas de la demo: no hay precios publicados, así que la FAQ habla de la
// prueba sin costo, sus límites y cómo pedir acceso/asistencia.
export const faqItemsDemo = [
  {
    question: "¿Cuánto cuesta BuildData?",
    answer:
      "Todavía no publicamos precios. Estamos sumando obras piloto sin costo: probás la app con algunos límites de uso y nos contás cómo te fue. Cuando salgan los planes te pasamos las opciones y qué incluye cada una.",
  },
  {
    question: "¿Qué límites tiene la demo?",
    answer:
      "1 obra activa, hasta 5 personas en el equipo y 100 mensajes del bot por mes. Son los mismos límites para todos para que la prueba sea pareja; si necesitás más para probarla en serio, escribinos y lo vemos.",
  },
  {
    question: "¿Necesito tarjeta de crédito?",
    answer:
      "No. La demo no pide tarjeta ni contrato: nos escribís, te damos acceso y empezás a usarla en tu obra.",
  },
  {
    question: "¿Cómo pido acceso o asistencia?",
    answer:
      "Escribinos a info@builddata.com.ar o a facundojarma@gmail.com. Te ayudamos a cargar la obra, materiales, rubros y tareas, y a invitar al equipo por WhatsApp.",
  },
  {
    question: "¿Puedo invitar a mi equipo a probar?",
    answer:
      "Sí. Desde Configuración → Equipo generás un link de invitación de WhatsApp con el rol de cada persona (Obrero, Capataz o Director). La demo permite hasta 5 personas por obra.",
  },
];

export const faqItems = DEMO_ACTIVO ? faqItemsDemo : faqItemsPagos;
