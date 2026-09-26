import { Command, getAllCommands } from "./index";

export const ayudaCommand: Command = {
  name: "!ayuda",
  description: "Muestra los comandos disponibles",
  execute: async (message) => {
    const lista = getAllCommands()
      .map((c) => `• *${c.name}* — ${c.description}`)
      .join("\n");
    await message.reply(`🛠️ *Comandos disponibles*\n\n${lista}`);
  },
};
