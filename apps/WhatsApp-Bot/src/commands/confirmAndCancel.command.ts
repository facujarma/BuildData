import { Command } from "./index";
import {
  clearPending,
  hasPending,
  clearEntityPending,
  hasEntityPending,
  clearClarification,
  hasClarification,
} from "../handlers/pendingQuery.store";
import { MSG } from "../shared/responses";

export const cancelCommand: Command = {
  name: "!cancel",
  description: "Cancela la carga de datos pendiente",
  execute: async (message) => {
    const phone = (await message.getContact()).number;

    const hasAnything =
      hasPending(phone) || hasEntityPending(phone) || hasClarification(phone);

    if (!hasAnything) {
      await message.reply(MSG.ERROR_NO_PENDING);
      return;
    }

    clearPending(phone);
    clearEntityPending(phone);
    clearClarification(phone);
    await message.reply(MSG.SUCCESS_DATA_CANCELLED);
  },
};
