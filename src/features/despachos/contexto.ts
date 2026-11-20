import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { requerirUsuario } from "@/features/auth/sesion";
import { crearClienteServidor } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import type { Rol } from "./catalogos";

export const COOKIE_DESPACHO = "despacho_activo";

export type Despacho = Database["public"]["Tables"]["despachos"]["Row"];

export interface MembresiaActiva {
  rol: Rol;
  despacho: Despacho;
}

/** Usuario, sus despachos, el despacho activo y si es administrador de plataforma. */
export const obtenerContexto = cache(async () => {
  const usuario = await requerirUsuario();
  const supabase = await crearClienteServidor();

  const [{ data: filas }, { data: esAdmin }, { data: perfil }] = await Promise.all([
    supabase
      .from("membresias")
      .select("rol, despacho:despachos(*)")
      .eq("usuario_id", usuario.id)
      .eq("activo", true),
    supabase.rpc("es_admin_plataforma"),
    supabase.from("perfiles").select("nombre_completo").eq("id", usuario.id).maybeSingle(),
  ]);

  const membresias: MembresiaActiva[] = (filas ?? [])
    .filter((f): f is { rol: Rol; despacho: Despacho } => f.despacho !== null)
    .sort((a, b) => a.despacho.nombre.localeCompare(b.despacho.nombre, "es"));

  const elegido = (await cookies()).get(COOKIE_DESPACHO)?.value;
  const activa = membresias.find((m) => m.despacho.id === elegido) ?? membresias[0] ?? null;

  return {
    usuario,
    nombre: perfil?.nombre_completo || usuario.correo || "Usuario",
    membresias,
    activa,
    esAdmin: esAdmin === true,
  };
});

/**
 * Exige un despacho activo y verificado. Si se indican roles, exige además uno de ellos.
 * Úsese en páginas y en cada Server Action.
 */
export async function requerirDespacho(roles?: readonly Rol[]) {
  const contexto = await obtenerContexto();
  if (!contexto.activa) redirect("/onboarding");
  if (!contexto.activa.despacho.verificado) redirect("/pendiente");
  if (roles && !roles.includes(contexto.activa.rol)) {
    throw new Error("No tiene permiso para esta acción en el despacho.");
  }
  return { ...contexto, activa: contexto.activa };
}

export async function requerirAdmin() {
  const contexto = await obtenerContexto();
  if (!contexto.esAdmin) redirect("/tablero");
  return contexto;
}
