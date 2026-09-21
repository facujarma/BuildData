import { supabase } from "@/lib/supabaseClient";
import type { ChatRespuesta } from "@/types/chatbot";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export async function consultarChat(
  pregunta: string,
  obraId: string
): Promise<ChatRespuesta> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const res = await fetch(`${API_URL}/chat/consultar`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.access_token || ""}`,
    },
    body: JSON.stringify({ pregunta, obra_id: obraId }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || `Request failed: ${res.status}`);
  }

  return res.json();
}
