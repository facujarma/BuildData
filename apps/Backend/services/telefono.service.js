// Normalización de teléfonos, en un solo lugar del Backend.
//
// WhatsApp manda los celulares argentinos como 54 9 <area> <numero>; la web
// suele guardar +54 <area> <numero> sin el 9. Para comparar identidades el 9 no
// cuenta, pero para guardar se conservan los dígitos tal como llegaron.

export function normalizarTelefono(telefono) {
  let digitos = String(telefono ?? "").replace(/\D/g, "");
  if (digitos.startsWith("54") && digitos[2] === "9") {
    digitos = `54${digitos.slice(3)}`;
  }
  return digitos;
}

export function normalizarTelefonoPersona(telefono) {
  return normalizarTelefono(telefono);
}

// Variantes que se comparan contra la DB: con y sin el 9 de AR. El match nunca
// se hace por igualdad exacta de string.
export function variantesTelefono(telefono) {
  const digitos = String(telefono ?? "").replace(/\D/g, "");
  if (!digitos) return [];
  const variantes = new Set([digitos]);
  if (digitos.startsWith("549")) variantes.add(`54${digitos.slice(3)}`);
  else if (digitos.startsWith("54")) variantes.add(`549${digitos.slice(2)}`);
  variantes.add(normalizarTelefonoPersona(digitos));
  return [...variantes];
}

export function enmascararTelefono(telefono) {
  const digitos = String(telefono ?? "").replace(/\D/g, "");
  return digitos ? `***${digitos.slice(-4)}` : null;
}
