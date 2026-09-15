import { redirect } from "next/navigation";

export default async function ActividadPage({ params }: { params: Promise<{ obraId: string }> }) {
  const { obraId } = await params;
  redirect(`/${obraId}/dashboard/registro?v=actividad`);
}