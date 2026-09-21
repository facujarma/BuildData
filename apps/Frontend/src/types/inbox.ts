type InboxDir = "in" | "out";
export type InboxKind = "audio" | "photo" | "text";
export type InboxState = "pending" | "confirmed" | "discarded" | "sent";

export interface InboxLooseFragment {
  txt: string;
  why: string;
}

interface InboxParse {
  tipo: string;
  destino: string;
  campos: [string, string][];
}

export interface InboxMessage {
  id: string;
  dir: InboxDir;
  kind: InboxKind;
  from?: string;
  to?: string;
  role: string;
  time: string;
  dur?: string;
  photos?: number;
  raw: string;
  conf?: number;
  state: InboxState;
  by?: string;
  at?: string;
  note?: string;
  mapped?: string[];
  loose?: InboxLooseFragment[];
  parse?: InboxParse;
  applied?: string[];
  trigger?: string;
  warn?: string;
}