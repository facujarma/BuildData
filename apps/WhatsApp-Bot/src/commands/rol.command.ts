import { Command } from "./index";
import { getUserObras } from "../services/user.service";
import { normalizarRol, permisosDe } from "../services/permissions.service";

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
      const rol = normalizarRol(obra.rol);
      const permisos = permisosDe(rol)
        .map((p) => `  • ${p.label}`)
        .join("\n");
      return `🏗️ *${obra.obra_nombre}*\n👤 Rol: *${rol}*\n${permisos}`;
    });

    await message.reply(
      `🪪 *Tus roles y permisos*\n\n${bloques.join("\n\n")}`,
    );
  },
};
