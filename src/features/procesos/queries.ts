import "server-only";
import { normalizarRadicado } from "@/domain/radicado";
import type { ClienteSupabase } from "@/lib/supabase/server";

export async function listarProcesos(supabase: ClienteSupabase, despachoId: string, busqueda?: string) {
  let q = supabase
    .from("procesos")
    .select("id, radicado, clase, especialidad, instancia, estado, reservado, creado_en")
    .eq("despacho_id", despachoId);
  const digitos = busqueda ? normalizarRadicado(busqueda).replace(/\D/g, "") : "";
  if (digitos) q = q.like("radicado", `%${digitos}%`);
  else if (busqueda?.trim()) q = q.ilike("clase", `%${busqueda.trim().replace(/[%_]/g, "")}%`);
  const { data, error } = await q.order("creado_en", { ascending: false }).limit(100);
  if (error) throw new Error(`No se pudieron leer los procesos: ${error.message}`);
  return data;
}

export async function obtenerProceso(supabase: ClienteSupabase, id: string, despachoId: string) {
  const { data, error } = await supabase
    .from("procesos")
    .select("*, asignado:perfiles!procesos_asignado_a_fkey(nombre_completo, correo)")
    .eq("id", id)
    .eq("despacho_id", despachoId)
    .maybeSingle();
  if (error) throw new Error(`No se pudo leer el proceso: ${error.message}`);
  return data;
}

export async function miembrosDelDespacho(supabase: ClienteSupabase, despachoId: string) {
  const { data, error } = await supabase
    .from("membresias")
    .select("id, rol, activo, usuario_id, usuario:perfiles!membresias_usuario_id_fkey(nombre_completo, correo)")
    .eq("despacho_id", despachoId)
    .order("rol");
  if (error) throw new Error(`No se pudo leer el equipo: ${error.message}`);
  return data;
}
