import type { WAMessage } from "@whiskeysockets/baileys";

const TTL_MS = 24 * 60 * 60 * 1000;
const MAX_ENTRIES = 1000;

interface StoredPoll {
  message: WAMessage;
  expiresAt: number;
}

const polls = new Map<string, StoredPoll>();

export function storePollMessage(message: WAMessage): void {
  const id = message.key?.id;
  if (!id) return;

  pruneExpired();
  if (polls.size >= MAX_ENTRIES) {
    const oldest = polls.keys().next().value;
    if (oldest) polls.delete(oldest);
  }

  polls.set(id, { message, expiresAt: Date.now() + TTL_MS });
}

export function getPollMessage(id: string | null | undefined): WAMessage | undefined {
  if (!id) return undefined;

  const entry = polls.get(id);
  if (!entry) return undefined;

  if (entry.expiresAt < Date.now()) {
    polls.delete(id);
    return undefined;
  }

  return entry.message;
}

export function removePollMessage(id: string | null | undefined): void {
  if (!id) return;
  polls.delete(id);
}

function pruneExpired(): void {
  const now = Date.now();
  for (const [id, entry] of polls) {
    if (entry.expiresAt < now) polls.delete(id);
  }
}
