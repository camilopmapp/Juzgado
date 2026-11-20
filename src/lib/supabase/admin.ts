import "server-only";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { envPublico } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Cliente con la clave secreta: omite RLS. Usar solo en el servidor y solo después
 * de comprobar los permisos del usuario con el cliente normal.
 */
export function crearClienteAdmin() {
  const { url } = envPublico();
  const secreta = z.string().min(1, "Falta SUPABASE_SECRET_KEY").parse(process.env.SUPABASE_SECRET_KEY);
  return createClient<Database>(url, secreta, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
