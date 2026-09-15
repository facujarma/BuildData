import { redirect } from "next/navigation";

export default async function StockPage({ params }: { params: Promise<{ obraId: string }> }) {
  const { obraId } = await params;
  redirect(`/${obraId}/dashboard/materiales?v=stock`);
}