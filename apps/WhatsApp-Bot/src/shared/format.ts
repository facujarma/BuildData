// Emojis numéricos para las listas que el usuario responde con un número.
const EMOJI_NUMEROS = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];

export function emojiNumero(n: number): string {
  if (n === 0) return "0️⃣";
  return EMOJI_NUMEROS[n - 1] ?? `${n}.`;
}

// Lista numerada con emojis (1️⃣, 2️⃣, ...) para las encuestas de WhatsApp.
export function listaNumerada(items: string[]): string {
  return items.map((texto, i) => `${emojiNumero(i + 1)} ${texto}`).join("\n");
}
