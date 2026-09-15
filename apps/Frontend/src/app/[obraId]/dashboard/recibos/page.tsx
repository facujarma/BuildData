import { redirect } from "next/navigation";

export default async function RecibosPage({ params }: { params: Promise<{ obraId: string }> }) {
  const { obraId } = await params;
  redirect(`/${obraId}/dashboard/costos?v=recibos`);
}