export const MSG = {
  ERROR_PENDING_CANCELLED:   "⚠️ Ahí cancelé lo que teníamos pendiente.",
  ERROR_PARSE_FAILED:        "❌ No te entendí bien, ¿podés decirlo de otra forma?",
  ERROR_OPERATION_INCOMPLETE:"❌ Me falta información para armar la operación. Probá de nuevo.",
  ERROR_NO_PENDING:          "⚠️ No hay nada pendiente para confirmar o cancelar.",
  ERROR_IMAGE_DOWNLOAD:      "❌ No pude leer la imagen, mandala de nuevo.",
  ERROR_AUDIO_DOWNLOAD:      "❌ No pude descargar el audio, grabálo de nuevo.",
  ERROR_TRANSCRIPTION:       "❌ No entendí el audio, ¿podés repetirlo?",
  ERROR_UNKNOWN_DOCUMENT:    "❌ No reconocí el documento. Mandá una foto más clara del comprobante o factura.",
  ERROR_UNKNOWN_COMMAND:     "🤔 Ese comando no lo conozco. Escribí *!ayuda* para ver los que tengo.",
  ERROR_CANCELLED_BAD_CMD:   "❌ No entendí el comando, así que cancelé lo que teníamos. Escribí *!ayuda* para ver los disponibles.",
  ERROR_NO_OBRA:            "⚠️ No tenés ninguna obra asociada a este número. Usá *!iniciar* para registrarte.",
  ERROR_INVITACION_INVALIDA: "❌ El link no es válido o fue alterado. Pedí uno nuevo.",
  ERROR_INVITACION_USADA:   "⚠️ Este link ya fue usado.",
  ERROR_INVITACION_VENCIDA: "⌛ Este link ya venció. Pedí uno nuevo.",
  ERROR_INVITACION_OTRO_TELEFONO: "⚠️ Este link fue generado para otro número de teléfono.",
  ERROR_INVITACION_FALLO:   "❌ No pude usar el link. Probá de nuevo o pedí uno nuevo.",
  ERROR_PROCESSING:          "❌ Algo salió mal, probá de nuevo.",
  ERROR_MISSING_FIELDS:      "❌ Me falta información para completar eso. ¿Podés darme más detalles?",

  SUCCESS_DATA_SAVED:        "✅ ¡Listo! Ya quedó guardado.",
  SUCCESS_DATA_PENDING_APPROVAL: "✅ Lo registré. Queda pendiente de aprobación en la bandeja de la app.",
  SUCCESS_DATA_CANCELLED:    "❌ Dale, lo cancelé.",

  PROMPT_CONFIRM: "¿Todo bien? Mandá *!confirm* si está OK o *!cancel* para cancelar.",
} as const;

export function MSG_LLM_ERROR(msg: string): string {
  return `❌ ${msg}`;
}

export function MSG_OPERATION_GENERATED(json: string): string {
  return `✅ Entendido! Esto es lo que voy a hacer:\n\`\`\`json\n${json}\n\`\`\``;
}

export function MSG_BIENVENIDA(nombre: string, obra: string): string {
  return `🎉 ¡Bienvenido, ${nombre}! Quedaste vinculado a la obra *${obra}*. Ya podés reportar avances y movimientos por acá.`;
}

export function MSG_TRANSCRIPTION(text: string): string {
  return `🎤 Escuché esto: "${text}"`;
}
