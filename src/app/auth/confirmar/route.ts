import type { EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { rutaSegura } from "@/features/auth/schemas";
import { crearClienteServidor } from "@/lib/supabase/server";

const TIPOS: EmailOtpType[] = ["invite", "recovery", "email", "email_change", "magiclink", "signup"];

/**
 * Destino de los enlaces de los correos de invitación y recuperación.
 * Las plantillas de correo de Supabase deben apuntar aquí con token_hash y type.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const tipo = searchParams.get("type") as EmailOtpType | null;
  const siguiente = rutaSegura(searchParams.get("siguiente"), "/cuenta/contrasena");

  if (tokenHash && tipo && TIPOS.includes(tipo)) {
    const supabase = await crearClienteServidor();
    const { error } = await supabase.auth.verifyOtp({ type: tipo, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(new URL(siguiente, request.url));
  }
  return NextResponse.redirect(new URL("/login?error=enlace", request.url));
}
