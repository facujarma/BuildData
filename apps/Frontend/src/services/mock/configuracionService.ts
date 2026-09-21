import {
  OBRA_SETTINGS,
  INTEGRACIONES_SEED,
  SESIONES_SEED,
  PLAN_FIXTURE,
} from "@/app/[obraId]/dashboard/configuracion/data";
import type {
  ObraSettings,
  IntegracionItem,
  SesionActiva,
  ConfiguracionPlan,
} from "@/app/[obraId]/dashboard/configuracion/data";

interface ConfiguracionData {
  obra: ObraSettings;
  integraciones: IntegracionItem[];
  sesiones: SesionActiva[];
  plan: ConfiguracionPlan;
}

export async function getConfiguracion(): Promise<ConfiguracionData> {
  await new Promise((r) => setTimeout(r, 250));
  return {
    obra: { ...OBRA_SETTINGS },
    integraciones: JSON.parse(JSON.stringify(INTEGRACIONES_SEED)),
    sesiones: JSON.parse(JSON.stringify(SESIONES_SEED)),
    plan: JSON.parse(JSON.stringify(PLAN_FIXTURE)),
  };
}