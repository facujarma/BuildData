import { Message } from "whatsapp-web.js";
import { transcribeAudio } from "../services/transcription.service";
import { handleFreeText } from "./freetext.handler";
import { MSG, MSG_TRANSCRIPTION } from "../shared/responses";

export async function handleAudio(phone: string, message: Message): Promise<void> {
  const media = await message.downloadMedia();

  if (!media) {
    await message.reply(MSG.ERROR_AUDIO_DOWNLOAD);
    return;
  }

  const transcripcion = await transcribeAudio(media.data, media.mimetype);

  if (!transcripcion) {
    await message.reply(MSG.ERROR_TRANSCRIPTION);
    return;
  }

  console.log(`Transcripción de ${phone}: ${transcripcion}`);

  await message.reply(MSG_TRANSCRIPTION(transcripcion));
  message.body = transcripcion;
  await handleFreeText(phone, message, "audio");
}
