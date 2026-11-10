// Reglas de teléfono para WhatsApp, en un solo lugar de la feature.
//
// `sinNueveAR` es espejo de `normalizarTelefono` del Backend
// (apps/Backend/services/invitaciones.service.js): compara números ignorando el
// 9 de los celulares argentinos (54 9 <área> <número> == 54 <área> <número>).
// Si el Backend cambia esa regla, hay que cambiar también esta.
// `aWaMe` es la inversa: los links wa.me a celulares AR necesitan el 9.

function soloDigitos(telefono: string): string {
  return telefono.replace(/\D/g, "");
}

export function sinNueveAR(telefono: string): string {
  const digitos = soloDigitos(telefono);
  if (digitos.startsWith("54") && digitos[2] === "9") {
    return `54${digitos.slice(3)}`;
  }
  return digitos;
}

export function aWaMe(telefono: string): string {
  const digitos = soloDigitos(telefono);
  if (digitos.startsWith("54") && digitos[2] !== "9") {
    return `549${digitos.slice(2)}`;
  }
  return digitos;
}

export function esMismoTelefono(a: string, b: string): boolean {
  const normalizado = sinNueveAR(a);
  return normalizado !== "" && normalizado === sinNueveAR(b);
}
