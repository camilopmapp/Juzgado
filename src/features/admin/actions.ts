"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { festivosColombia } from "@/domain/calendario/festivos-colombia";
import { suspensionesSugeridas } from "@/domain/calendario/suspensiones";
import { requerirAdmin } from "@/features/despachos/contexto";
import { recalcularTerminos } from "@/features/terminos/servicio";
import { type EstadoFormulario, errorDeValidacion, fechaCivil, texto } from "@/lib/formularios";
import { crearClienteAdmin } from "@/lib/supabase/admin";
import { crearClienteServidor } from "@/lib/supabase/server";

/**
 * Recalcula los términos de todos los despachos verificados tras un cambio del calendario general.
 * Usa la clave secreta porque el administrador no es miembro de los despachos.
 */
async function recalcularTodo(): Promise<string> {
  const admin = crearClienteAdmin();
  const { data: despachos, error } = await admin.from("despachos").select("id, seccional, vacancia_colectiva").eq("verificado", true);
  if (error) return ` No se pudieron recalcular los términos: ${error.message}`;
  let actualizados = 0;
  const errores: string[] = [];
  for (const d of despachos) {
    const r = await recalcularTerminos(admin, d);
    actualizados += r.actualizados;
    errores.push(...r.errores);
  }
  return ` Se recalcularon ${actualizados} términos.${errores.length ? ` Errores: ${errores.slice(0, 3).join("; ")}` : ""}`;
}

export async function verificarDespacho(_previo: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  await requerirAdmin();
  const id = z.uuid().safeParse(formData.get("despacho_id"));
  if (!id.success) return { ok: false, mensaje: "Despacho inválido." };
  const supabase = await crearClienteServidor();
  const { error } = await supabase.rpc("verificar_despacho", { p_despacho: id.data });
  if (error) return { ok: false, mensaje: error.message };
  revalidatePath("/admin");
  return { ok: true, mensaje: "Despacho verificado. Su juez ya puede usar el sistema." };
}

const esquemaAnio = z.object({
  anio: z.coerce.number({ message: "Escriba un año" }).int().min(1984).max(2100),
});

/** Carga los festivos (Ley 51 de 1983) y las suspensiones sugeridas de un año. */
export async function cargarCalendarioAnual(_previo: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const { usuario } = await requerirAdmin();
  const datos = esquemaAnio.safeParse(Object.fromEntries(formData));
  if (!datos.success) return errorDeValidacion(datos.error, formData);
  const { anio } = datos.data;
  const supabase = await crearClienteServidor();

  // Un día puede tener dos festivos (p. ej. 30-jun-2025): se unen los nombres.
  const porFecha = new Map<string, string[]>();
  for (const f of festivosColombia(anio)) porFecha.set(f.fecha, [...(porFecha.get(f.fecha) ?? []), f.nombre]);
  const filas = [...porFecha].map(([fecha, nombres]) => ({ fecha, nombre: nombres.join(" y "), norma: "Ley 51 de 1983" }));
  const festivos = await supabase.from("festivos").upsert(filas, { onConflict: "fecha", ignoreDuplicates: true });
  if (festivos.error) return { ok: false, mensaje: `No se pudieron guardar los festivos: ${festivos.error.message}` };

  let nuevas = 0;
  for (const s of suspensionesSugeridas(anio)) {
    const { count } = await supabase
      .from("suspensiones_terminos")
      .select("id", { count: "exact", head: true })
      .eq("tipo", s.tipo)
      .eq("alcance", "nacional")
      .eq("fecha_inicio", s.fechaInicio);
    if (count) continue;
    const { error } = await supabase.from("suspensiones_terminos").insert({
      tipo: s.tipo,
      alcance: "nacional",
      fecha_inicio: s.fechaInicio,
      fecha_fin: s.fechaFin,
      motivo: s.motivo,
      soporte: s.soporte,
      creado_por: usuario.id,
    });
    if (error) return { ok: false, mensaje: `No se pudo guardar "${s.motivo}": ${error.message}` };
    nuevas++;
  }

  const aviso = await recalcularTodo();
  revalidatePath("/admin");
  return { ok: true, mensaje: `Calendario ${anio}: ${filas.length} festivos y ${nuevas} suspensiones nuevas.${aviso}` };
}

const esquemaSuspensionGeneral = z
  .object({
    tipo: z.enum(["vacancia_colectiva", "semana_santa", "acuerdo_csj", "otro"]),
    alcance: z.enum(["nacional", "seccional"]),
    seccional: z.preprocess((v) => (v === "" ? undefined : v), z.string().trim().min(2).max(100).optional()),
    fecha_inicio: fechaCivil("Fecha de inicio"),
    fecha_fin: fechaCivil("Fecha de fin"),
    motivo: texto(3, 300, "El motivo"),
    soporte: texto(3, 300, "El soporte"),
  })
  .refine((d) => d.fecha_fin >= d.fecha_inicio, { message: "La fecha de fin no puede ser anterior al inicio", path: ["fecha_fin"] })
  .refine((d) => d.alcance !== "seccional" || d.seccional, { message: "Indique la seccional", path: ["seccional"] });

export async function registrarSuspensionGeneral(_previo: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const { usuario } = await requerirAdmin();
  const datos = esquemaSuspensionGeneral.safeParse(Object.fromEntries(formData));
  if (!datos.success) return errorDeValidacion(datos.error, formData);
  const d = datos.data;

  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("suspensiones_terminos").insert({
    ...d,
    seccional: d.alcance === "seccional" ? d.seccional : null,
    creado_por: usuario.id,
  });
  if (error) return { ok: false, mensaje: `No se pudo registrar: ${error.message}` };
  const aviso = await recalcularTodo();
  revalidatePath("/admin");
  return { ok: true, mensaje: `Suspensión registrada.${aviso}` };
}

export async function eliminarSuspensionGeneral(_previo: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  await requerirAdmin();
  const id = z.uuid().safeParse(formData.get("suspension_id"));
  if (!id.success) return { ok: false, mensaje: "Suspensión inválida." };
  const supabase = await crearClienteServidor();
  const { error, count } = await supabase
    .from("suspensiones_terminos")
    .delete({ count: "exact" })
    .eq("id", id.data)
    .neq("alcance", "despacho");
  if (error || !count) return { ok: false, mensaje: "No se pudo eliminar la suspensión." };
  const aviso = await recalcularTodo();
  revalidatePath("/admin");
  return { ok: true, mensaje: `Suspensión eliminada.${aviso}` };
}

const esquemaValidacion = z.object({
  codigo: z.string().min(1),
  estado: z.enum(["validado", "pendiente_validacion"]),
});

/** Marca un tipo de término como validado (después de la revisión jurídica) o lo devuelve a pendiente. */
export async function cambiarValidacionTermino(_previo: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  await requerirAdmin();
  const datos = esquemaValidacion.safeParse(Object.fromEntries(formData));
  if (!datos.success) return { ok: false, mensaje: "Datos inválidos." };
  const supabase = await crearClienteServidor();
  const { error } = await supabase
    .from("tipos_termino")
    .update({ estado_validacion: datos.data.estado })
    .eq("codigo", datos.data.codigo);
  if (error) return { ok: false, mensaje: error.message };
  revalidatePath("/admin");
  return { ok: true, mensaje: datos.data.estado === "validado" ? "Término marcado como validado." : "Término devuelto a pendiente." };
}
