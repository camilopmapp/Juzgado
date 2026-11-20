import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { envPublico } from "@/lib/env";
import type { Database } from "@/types/database";

/** Cliente con la sesión del usuario: todas las consultas pasan por RLS. */
export async function crearClienteServidor() {
  const almacen = await cookies();
  const { url, clave } = envPublico();
  return createServerClient<Database>(url, clave, {
    cookies: {
      getAll() {
        return almacen.getAll();
      },
      setAll(lista) {
        try {
          for (const { name, value, options } of lista) almacen.set(name, value, options);
        } catch {
          // En un Server Component no se pueden escribir cookies; el proxy renueva la sesión.
        }
      },
    },
  });
}

export type ClienteSupabase = Awaited<ReturnType<typeof crearClienteServidor>>;
