import { Command } from "./index";
import { ApiError, consumirInvitacion } from "../services/api.service";
import {
  descifrarInvitacion,
  normalizarTelefono,
} from "../services/invitaciones.service";
import { invalidateUserCache } from "../services/user.service";
import { MSG, MSG_BIENVENIDA } from "../shared/responses";

export const invitacionCommand: Command = {
  name: "!invitacion",
  description: "Vincula tu WhatsApp a una obra con el link que te compartieron",
  execute: async (message, args) => {
    const token = (args[0] || "").trim();

    // El link trae los datos cifrados: si el token fue alterado, esto devuelve null.
    const payload = token ? descifrarInvitacion(token) : null;
    if (!payload) {
      await message.reply(MSG.ERROR_INVITACION_INVALIDA);
      return;
    }

    if (!payload.exp || payload.exp * 1000 < Date.now()) {
      await message.reply(MSG.ERROR_INVITACION_VENCIDA);
      return;
    }

    const phone = (await message.getContact()).number;
    if (
      payload.tel &&
      normalizarTelefono(payload.tel) !== normalizarTelefono(phone)
    ) {
      await message.reply(MSG.ERROR_INVITACION_OTRO_TELEFONO);
      return;
    }

    try {
      const { obra } = await consumirInvitacion(token, phone);
      invalidateUserCache(phone);
      await message.reply(MSG_BIENVENIDA(payload.nom, obra.nombre));
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        await message.reply(MSG.ERROR_INVITACION_USADA);
      } else if (error instanceof ApiError && error.status === 410) {
        await message.reply(MSG.ERROR_INVITACION_VENCIDA);
      } else if (error instanceof ApiError && error.status === 403) {
        await message.reply(MSG.ERROR_INVITACION_OTRO_TELEFONO);
      } else {
        console.error("[invitacion] no se pudo consumir el link:", error);
        await message.reply(MSG.ERROR_INVITACION_FALLO);
      }
    }
  },
};
