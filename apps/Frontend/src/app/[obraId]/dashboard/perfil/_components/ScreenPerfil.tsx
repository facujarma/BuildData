"use client";

import { DPageHeader } from "../../_components/DPageHeader";
import { SectionComingSoon } from "../../_components/SectionBlocked";

/**
 * Mi perfil todavía no tiene backend: nombre, contacto, preferencias y
 * actividad salían de un fixture. Hasta que exista el endpoint real la
 * pantalla queda bloqueada, sin datos de ejemplo.
 */
export function ScreenPerfil() {
  return (
    <>
      <DPageHeader
        title="Mi perfil"
        subtitle="Tu información personal y cómo te ve el resto del equipo."
      />
      <SectionComingSoon
        title="Mi perfil"
        detalle="Va a mostrar y editar tu nombre, email, teléfono, foto y preferencias, y tu actividad reciente en la obra."
      />
    </>
  );
}
