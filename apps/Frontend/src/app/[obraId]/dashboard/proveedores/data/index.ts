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
