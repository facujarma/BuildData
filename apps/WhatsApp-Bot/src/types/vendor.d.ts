// Tipos mínimos para dependencias sin @types instalados.
// - qrcode-terminal: solo se usa para imprimir el QR de Baileys.
// - express: solo se usa para el keep-alive del bot (server.ts).
// Si se agregan @types/express o @types/qrcode-terminal, borrar este archivo.
declare module "qrcode-terminal" {
  const qrcode: any;
  export default qrcode;
}

declare module "express" {
  const express: any;
  export default express;
  export type Request = any;
  export type Response = any;
}
