import { getUserByPhone } from "../services/api.service";
import { Command } from "./index";

export const buildingsCommand: Command = {
  name: "!obras",
  description: "Muestra las obras en las que formas parte",
  execute: async (message) => {
    const phone = (await message.getContact()).number;
    const obras = await getUserByPhone(phone);

    if (!obras) {
      await message.reply("🏗️ Todavía no formás parte de ninguna obra.");
      return;
    }

    const lista = obras.obras
      .map((o) => `• *${o.obra_nombre}*\n   ID: \`${o.obra_id}\``)
      .join("\n");
    await message.reply(`🏗️ *Tus obras*\n\n${lista}`);
  },
};
