"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requerirDespacho } from "@/features/despachos/contexto";
import { type EstadoFormulario, errorDeValidacion, valoresDe } from "@/lib/formularios";
import { crearClienteServidor } from "@/lib/supabase/server";
import { esquemaActualizarProceso, esquemaNuevoProceso } from "./schemas";

export async function crearProceso(_previo: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const { usuario, activa } = await requerirDespacho();
  const datos = esquemaNuevoProceso.safeParse(Object.fromEntries(formData));
  if (!datos.success) return errorDeValidacion(datos.error, formData);
  const d = datos.data;
  const puedeReservar = activa.rol !== "sustanciador";

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("procesos")
    .insert({
      despacho_id: activa.despacho.id,
      radicado: d.radicado,
      clase: d.clase,
      especialidad: d.especialidad,
      instancia: d.instancia,
      fecha_reparto: d.fecha_reparto ?? null,
      // El sustanciador que crea un proceso reservado queda asignado para no perder acceso.
      reservado: d.reservado,
      asignado_a: puedeReservar ? (d.asignado_a ?? null) : d.reservado ? usuario.id : null,
      observaciones: d.observaciones ?? null,
      creado_por: usuario.id,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { ok: false, errores: { radicado: ["Ya existe un proceso con ese radicado en el despacho"] }, valores: valoresDe(formData) };
    }
    return { ok: false, mensaje: `No se pudo crear el proceso: ${error.message}` };
  }
  revalidatePath("/procesos");
  redirect(`/procesos/${data.id}`);
}

export async function actualizarProceso(_previo: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const { activa } = await requerirDespacho(["juez", "secretario"]);
  const datos = esquemaActualizarProceso.safeParse(Object.fromEntries(formData));
  if (!datos.success) return errorDeValidacion(datos.error, formData);
  const d = datos.data;

  const supabase = await crearClienteServidor();
  const { error, count } = await supabase
    .from("procesos")
    .update(
      { estado: d.estado, reservado: d.reservado, asignado_a: d.asignado_a ?? null, observaciones: d.observaciones ?? null },
      { count: "exact" },
    )
    .eq("id", d.proceso_id)
    .eq("despacho_id", activa.despacho.id);
  if (error) return { ok: false, mensaje: error.message.includes("asignado") ? "El usuario asignado no es miembro activo del despacho." : `No se pudo actualizar: ${error.message}` };
  if (!count) return { ok: false, mensaje: "Proceso no encontrado." };

  revalidatePath(`/procesos/${d.proceso_id}`);
  revalidatePath("/procesos");
  return { ok: true, mensaje: "Proceso actualizado." };
}
