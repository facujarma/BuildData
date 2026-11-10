"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CircleCheck, Envelope } from "@gravity-ui/icons";
import { useAuth } from "@/contexts/AuthContext";
import FormInput from "@/components/ui/FormInput";
import Button from "@/components/ui/Button";

interface SignInFormProps {
  showSocial: boolean;
  onSwitch: () => void;
  successMessage?: string | null;
}

export default function SignInForm({
  showSocial,
  onSwitch,
  successMessage,
}: SignInFormProps) {
  const { login } = useAuth();
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Error al iniciar sesión";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col p-8 lg:p-12 overflow-y-auto">
      <div className="flex justify-end gap-4 text-[12px] text-slate-500">
        <Link href="/" className="hover:text-primary font-semibold">
          ← Volver al sitio
        </Link>
      </div>

      <div className="m-auto w-full max-w-[400px] py-10">
        <div className="text-[10px] tracking-[0.18em] uppercase font-bold text-primary mb-3">
          Iniciar sesión
        </div>
        <h2 className="text-[28px] font-extrabold tracking-tight leading-tight">
          ¡Bienvenido de nuevo!
        </h2>
        <p className="text-[13px] text-slate-500 mt-2 leading-snug">
          Entrá para ver el estado de tus obras en curso.
        </p>

        {successMessage && (
          <div className="mt-4 bg-success/10 border border-success/30 text-success-700 text-[12px] rounded-md p-3">
            {successMessage}
          </div>
        )}

        {showSocial && (
          <>
            <div className="flex gap-2 mt-7 w-full">
              <Button variant="outline" className="w-full" type="button">
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path
                    d="M22.5 12.27c0-.79-.07-1.55-.2-2.27H12v4.3h5.9a5.05 5.05 0 0 1-2.19 3.31v2.75h3.54c2.07-1.91 3.25-4.72 3.25-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.95 0 5.42-.98 7.23-2.64l-3.54-2.75c-.98.66-2.23 1.05-3.69 1.05-2.84 0-5.25-1.92-6.11-4.5H2.23v2.83A11 11 0 0 0 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.89 14.17a6.6 6.6 0 0 1 0-4.34V7H2.23a11 11 0 0 0 0 9.9l3.66-2.83z"
                    fill="#FBBC04"
                  />
                  <path
                    d="M12 5.38c1.6 0 3.04.55 4.17 1.62l3.13-3.13C17.42 2.09 14.95 1 12 1 7.7 1 4 3.48 2.23 7l3.66 2.83C6.75 7.3 9.16 5.38 12 5.38z"
                    fill="#EA4335"
                  />
                </svg>
                Google
              </Button>
              <Button variant="outline" className="w-full" type="button">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366">
                  <path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 0 1 8.413 3.488 11.824 11.824 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
                </svg>
                WhatsApp
              </Button>
            </div>
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-[10px] tracking-[0.08em] uppercase font-bold text-slate-500">
                o con email
              </span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>
          </>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-[12px] rounded-md p-3">
              {error}
            </div>
          )}

          <FormInput
            label="Email"
            icon={<Envelope className="w-[15px] h-[15px]" />}
            placeholder="juan.mendez@constructora-norte.com.ar"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <FormInput
            label="Contraseña"
            type={showPw ? "text" : "password"}
            icon={<CircleCheck className="w-[15px] h-[15px]" />}
            placeholder="••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            rightLabel={
              <a
                href="#"
                className="text-[11px] font-bold text-primary hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </a>
            }
            rightElement={
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="focus:outline-none"
              >
                {showPw ? "Ocultar" : "Mostrar"}
              </button>
            }
          />

          <Button type="submit" className="w-full mt-2" disabled={isLoading}>
            {isLoading
              ? "Entrando..."
              : "Iniciar sesión"}{" "}
            {!isLoading && <ArrowRight className="w-[14px] h-[14px]" />}
          </Button>
        </form>

        <div className="text-center mt-6 text-[12px] text-slate-500">
          ¿Primera vez en BuildData?{" "}
          <button
            onClick={onSwitch}
            className="text-primary font-bold hover:underline"
            type="button"
          >
            Crear cuenta gratis
          </button>
        </div>
      </div>

      <div className="text-center text-[11px] text-slate-400 mt-4">
        © 2026 BuildData ·{" "}
        <a href="#" className="hover:text-slate-600">
          Soporte
        </a>{" "}
        ·{" "}
        <a href="#" className="hover:text-slate-600">
          Estado del sistema
        </a>
      </div>
    </div>
  );
}
