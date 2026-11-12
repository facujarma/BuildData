import { Command } from "./index";
import { getUserObras } from "../services/user.service";
import {
  nombreRolVisible,
  origenPermisosDeObra,
  permisosDeObra,
} from "../services/permissions.service";

export const rolCommand: Command = {
  name: "!rol",
  description: "Muestra tu rol y permisos en cada obra",
  execute: async (message) => {
    const contact = await message.getContact();
    const user = await getUserObras(contact.number);
    if (!user || user.obras.length === 0) {
      await message.reply("⚠️ No tenés ninguna obra asociada a este número.");
      return;
    }

    const bloques = user.obras.map((obra) => {
      // Rol y permisos tal como los resuelve el Backend para esa obra (incluye
      // roles personalizados y permisos editados desde la web). La matriz
      // estática solo se usa si el Backend todavía no manda `permisos`.
      const rol = nombreRolVisible(obra.rol, obra.permisos);
      const permisos = permisosDeObra(obra);
      const detalle = permisos.length
        ? permisos.map((p) => `  • ${p.label}`).join("\n")
        : "  • Sin permisos de WhatsApp en esta obra.";
      // De dónde salen las capacidades: roles_obra o la matriz por defecto.
      const origen =
        origenPermisosDeObra(obra) === "obra"
          ? "ℹ️ Permisos configurados en la obra."
          : "ℹ️ Permisos por defecto del rol.";
      return `🏗️ *${obra.obra_nombre}*\n👤 Rol: *${rol}*\n${detalle}\n${origen}`;
    });

    await message.reply(
      `🪪 *Tus roles y permisos*\n\n${bloques.join("\n\n")}`,
    );
  },
};
