import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { crearClienteServidor } from "@/lib/supabase/server";

export interface Usuario {
  id: string;
  correo: string | null;
}

/** Usuario autenticado (JWT verificado con getClaims), o null. */
export const obtenerUsuario = cache(async (): Promise<Usuario | null> => {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) return null;
  return { id: data.claims.sub, correo: typeof data.claims.email === "string" ? data.claims.email : null };
});

export async function requerirUsuario(): Promise<Usuario> {
  const usuario = await obtenerUsuario();
  if (!usuario) redirect("/login");
  return usuario;
}
