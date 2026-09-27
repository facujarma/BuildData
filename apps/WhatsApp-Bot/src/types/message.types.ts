export enum MessageTypes {
  TEXT = "text",
  VOICE = "voice",
  AUDIO = "audio",
  IMAGE = "image",
}

export interface DownloadedMedia {
  data: string;
  mimetype: string;
  filename?: string;
  filesize?: number;
}

export interface MessageContact {
  number: string;
}

export interface Message {
  body: string;
  from: string;
  type: string;
  hasMedia: boolean;
  reply(text: string): Promise<void>;
  getContact(): Promise<MessageContact>;
  downloadMedia(): Promise<DownloadedMedia | undefined>;
}
