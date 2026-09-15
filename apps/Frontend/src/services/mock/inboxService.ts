import { INBOX_SEED } from "@/app/[obraId]/dashboard/inbox/data";
import type { InboxMessage } from "@/types/inbox";

export interface InboxData {
  items: InboxMessage[];
}

export async function getInbox(): Promise<InboxData> {
  await new Promise((r) => setTimeout(r, 250));
  return { items: JSON.parse(JSON.stringify(INBOX_SEED)) };
}