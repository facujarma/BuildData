import { redirect } from "next/navigation";

export default async function ReportesPage({ params }: { params: Promise<{ obraId: string }> }) {
  const { obraId } = await params;
  redirect(`/${obraId}/dashboard/registro?v=reportes`);
}