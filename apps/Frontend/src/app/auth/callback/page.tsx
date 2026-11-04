"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { syncProfile } from "@/services/authService";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function completeSignIn() {
      try {
        const params = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(
          window.location.hash.replace(/^#/, "")
        );
        const oauthErrorCode = params.get("error") || hashParams.get("error");

        if (oauthErrorCode === "access_denied") {
          throw new Error("Cancelaste el inicio de sesión con Google.");
        }

        const oauthError =
          params.get("error_description") ||
          hashParams.get("error_description") ||
          oauthErrorCode;
        if (oauthError) throw new Error(oauthError);

        // El cliente de Supabase procesa el token que viene en la URL
        // al inicializarse; getSession espera a que termine.
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!data.session) {
          throw new Error(
            "No pudimos completar el inicio de sesión. Probá de nuevo."
          );
        }

        // Crea la fila de `personas` si el usuario entró por primera vez con Google.
        try {
          await syncProfile(data.session.access_token);
        } catch (syncError) {
          console.error("No se pudo sincronizar el perfil:", syncError);
        }

        if (!active) return;
        router.replace("/projects");
      } catch (err: unknown) {
        if (!active) return;
        setError(
          err instanceof Error
            ? err.message
            : "No pudimos iniciar sesión con Google."
        );
      }
    }

    completeSignIn();

    return () => {
      active = false;
    };
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper p-6">
      <div className="w-full max-w-[420px] bg-white border border-slate-200 rounded-xl p-8 text-center shadow-sm">
        <div className="text-[10px] tracking-[0.18em] uppercase font-bold text-primary mb-2">
          BuildData
        </div>

        {error ? (
          <>
            <h1 className="text-[22px] font-extrabold tracking-tight">
              No pudimos entrar
            </h1>
            <p className="text-[13px] text-slate-500 mt-2 leading-snug">
              {error}
            </p>
            <a
              href="/login"
              className="inline-block mt-6 text-[13px] font-bold text-primary hover:underline"
            >
              Volver a iniciar sesión
            </a>
          </>
        ) : (
          <>
            <div className="mx-auto mt-4 w-9 h-9 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <h1 className="text-[22px] font-extrabold tracking-tight mt-5">
              Conectando con Google…
            </h1>
            <p className="text-[13px] text-slate-500 mt-2">
              Estamos preparando tu cuenta.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
