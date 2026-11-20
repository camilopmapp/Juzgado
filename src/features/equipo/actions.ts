"use server";

import { revalidatePath } from "next/cache";
import { requerirDespacho } from "@/features/despachos/contexto";
import { urlDelSitio } from "@/lib/env";
import { type EstadoFormulario, errorDeValidacion } from "@/lib/formularios";
import { crearClienteAdmin } from "@/lib/supabase/admin";
import { crearClienteServidor } from "@/lib/supabase/server";
import { esquemaCambioMiembro, esquemaInvitacion } from "./schemas";

/**
 * El juez invita a una persona por correo. Si no tiene cuenta, Supabase le envía la
 * invitación; si ya la tiene (p. ej. trabaja en otro despacho), solo se agrega la membresía.
 */
export async function invitarMiembro(_previo: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const { activa } = await requerirDespacho(["juez"]);
  const datos = esquemaInvitacion.safeParse(Object.fromEntries(formData));
  if (!datos.success) return errorDeValidacion(datos.error, formData);
  const { correo, rol } = datos.data;

  // La clave secreta solo se usa para buscar o invitar la cuenta; la membresía se crea
  // con la sesión del juez, así RLS confirma que tiene permiso en este despacho.
  const admin = crearClienteAdmin();
  const { data: existente } = await admin.from("perfiles").select("id").eq("correo", correo).maybeSingle();
  let usuarioId = existente?.id;
  let invitado = false;
  if (!usuarioId) {
    const { data, error } = await admin.auth.admin.inviteUserByEmail(correo, {
      redirectTo: `${urlDelSitio()}/cuenta/contrasena`,
    });
    if (error || !data.user) return { ok: false, mensaje: `No se pudo enviar la invitación: ${error?.message ?? "error desconocido"}` };
    usuarioId = data.user.id;
    invitado = true;
  }

  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("membresias").insert({ despacho_id: activa.despacho.id, usuario_id: usuarioId, rol });
  if (error) {
    if (error.code === "23505") return { ok: false, mensaje: "Esa persona ya pertenece al despacho. Puede reactivarla o cambiar su rol en la lista." };
    return { ok: false, mensaje: `No se pudo agregar al despacho: ${error.message}` };
  }

  revalidatePath("/configuracion");
  return {
    ok: true,
    mensaje: invitado
      ? `Invitación enviada a ${correo}. Al aceptarla creará su contraseña.`
      : `${correo} ya tenía cuenta: quedó agregado al despacho.`,
  };
}

export async function actualizarMiembro(_previo: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const { activa } = await requerirDespacho(["juez"]);
  const datos = esquemaCambioMiembro.safeParse(Object.fromEntries(formData));
  if (!datos.success) return errorDeValidacion(datos.error, formData);

  const supabase = await crearClienteServidor();
  const { error, count } = await supabase
    .from("membresias")
    .update({ rol: datos.data.rol, activo: datos.data.activo }, { count: "exact" })
    .eq("id", datos.data.membresia_id)
    .eq("despacho_id", activa.despacho.id);
  if (error) {
    return { ok: false, mensaje: error.message.includes("juez activo") ? "El despacho debe conservar al menos un juez activo." : `No se pudo actualizar: ${error.message}` };
  }
  if (!count) return { ok: false, mensaje: "Miembro no encontrado." };
  revalidatePath("/configuracion");
  return { ok: true, mensaje: "Cambios guardados." };
}
