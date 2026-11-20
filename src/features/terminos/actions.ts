"use server";

import { revalidatePath } from "next/cache";
import { requerirDespacho } from "@/features/despachos/contexto";
import { type EstadoFormulario, errorDeValidacion } from "@/lib/formularios";
import { hoyEnColombia } from "@/domain/fechas";
import { crearClienteServidor } from "@/lib/supabase/server";
import { esquemaCerrarNovedad, esquemaEstadoTermino, esquemaNovedad, esquemaNuevoTermino } from "./schemas";
import { calcularTermino, camposCalculados, cargarCalendario, recalcularTerminos } from "./servicio";

function refrescar(procesoId?: string) {
  revalidatePath("/tablero");
  if (procesoId) revalidatePath(`/procesos/${procesoId}`);
}

export async function crearTermino(_previo: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const { usuario, activa } = await requerirDespacho();
  const datos = esquemaNuevoTermino.safeParse(Object.fromEntries(formData));
  if (!datos.success) return errorDeValidacion(datos.error, formData);
  const d = datos.data;
  const supabase = await crearClienteServidor();

  const [{ data: proceso }, { data: tipo }] = await Promise.all([
    supabase.from("procesos").select("id, especialidad, despacho_id").eq("id", d.proceso_id).maybeSingle(),
    supabase.from("tipos_termino").select("*").eq("codigo", d.tipo_codigo).eq("activo", true).maybeSingle(),
  ]);
  if (!proceso || proceso.despacho_id !== activa.despacho.id) return { ok: false, mensaje: "Proceso no encontrado." };
  if (!tipo) return { ok: false, mensaje: "Tipo de término no encontrado." };
  if (tipo.especialidades && !tipo.especialidades.includes(proceso.especialidad)) {
    return { ok: false, mensaje: "Ese término no aplica a la especialidad del proceso." };
  }
  if (tipo.unidad === "horas" && !d.hora_evento) {
    return { ok: false, errores: { hora_evento: ["Este término se cuenta en horas: indique la hora del evento"] } };
  }

  const cantidad = d.cantidad ?? tipo.cantidad;
  let campos;
  try {
    const cal = await cargarCalendario(supabase, activa.despacho);
    const resultado = calcularTermino(
      { unidad: tipo.unidad, cantidad, fecha_evento: d.fecha_evento, hora_evento: d.hora_evento ?? null, novedades: [] },
      cal,
    );
    campos = camposCalculados(resultado, "en_curso");
  } catch (e) {
    return { ok: false, mensaje: `No se pudo calcular el vencimiento: ${(e as Error).message}` };
  }

  const { error } = await supabase.from("terminos").insert({
    proceso_id: proceso.id,
    despacho_id: activa.despacho.id,
    tipo_codigo: tipo.codigo,
    unidad: tipo.unidad,
    cantidad,
    fecha_evento: d.fecha_evento,
    hora_evento: d.hora_evento ?? null,
    fecha_vencimiento: campos.fecha_vencimiento,
    hora_vencimiento: campos.hora_vencimiento,
    calculado_en: campos.calculado_en,
    observaciones: d.observaciones ?? null,
    creado_por: usuario.id,
  });
  if (error) return { ok: false, mensaje: `No se pudo guardar el término: ${error.message}` };

  refrescar(proceso.id);
  return { ok: true, mensaje: campos.fecha_vencimiento ? `Término registrado. Vence el ${campos.fecha_vencimiento}.` : "Término registrado." };
}

async function terminoDelDespacho(terminoId: string, despachoId: string) {
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("terminos")
    .select("id, proceso_id, despacho_id, estado")
    .eq("id", terminoId)
    .maybeSingle();
  return data && data.despacho_id === despachoId ? { supabase, termino: data } : null;
}

export async function registrarNovedad(_previo: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const { usuario, activa } = await requerirDespacho();
  const datos = esquemaNovedad.safeParse(Object.fromEntries(formData));
  if (!datos.success) return errorDeValidacion(datos.error, formData);
  const d = datos.data;

  const encontrado = await terminoDelDespacho(d.termino_id, activa.despacho.id);
  if (!encontrado) return { ok: false, mensaje: "Término no encontrado." };
  const { supabase, termino } = encontrado;
  if (termino.estado === "cumplido" || termino.estado === "cancelado") {
    return { ok: false, mensaje: "El término ya está cerrado. Reábralo para registrar novedades." };
  }

  const { error } = await supabase.from("novedades_termino").insert({
    termino_id: termino.id,
    despacho_id: activa.despacho.id,
    tipo: d.tipo,
    fecha_inicio: d.fecha_inicio,
    fecha_fin: d.tipo === "prorroga" ? null : (d.fecha_fin ?? null),
    cantidad: d.tipo === "prorroga" ? d.cantidad : null,
    unidad: d.tipo === "prorroga" ? d.unidad : null,
    soporte: d.soporte,
    creado_por: usuario.id,
  });
  if (error) return { ok: false, mensaje: `No se pudo registrar la novedad: ${error.message}` };

  const r = await recalcularTerminos(supabase, activa.despacho, termino.id);
  refrescar(termino.proceso_id);
  if (r.errores.length) return { ok: false, mensaje: `Novedad guardada, pero el recálculo falló: ${r.errores.join("; ")}` };
  return { ok: true, mensaje: "Novedad registrada y vencimiento recalculado." };
}

export async function cerrarNovedad(_previo: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const { activa } = await requerirDespacho();
  const datos = esquemaCerrarNovedad.safeParse(Object.fromEntries(formData));
  if (!datos.success) return errorDeValidacion(datos.error, formData);

  const encontrado = await terminoDelDespacho(datos.data.termino_id, activa.despacho.id);
  if (!encontrado) return { ok: false, mensaje: "Término no encontrado." };
  const { supabase, termino } = encontrado;

  const { data: novedad } = await supabase
    .from("novedades_termino")
    .select("id, fecha_inicio, fecha_fin")
    .eq("id", datos.data.novedad_id)
    .eq("termino_id", termino.id)
    .maybeSingle();
  if (!novedad || novedad.fecha_fin) return { ok: false, mensaje: "La novedad no existe o ya tiene fecha de fin." };
  if (datos.data.fecha_fin < novedad.fecha_inicio) {
    return { ok: false, errores: { fecha_fin: ["No puede ser anterior al inicio de la novedad"] } };
  }

  const { error } = await supabase.from("novedades_termino").update({ fecha_fin: datos.data.fecha_fin }).eq("id", novedad.id);
  if (error) return { ok: false, mensaje: `No se pudo cerrar la novedad: ${error.message}` };

  const r = await recalcularTerminos(supabase, activa.despacho, termino.id);
  refrescar(termino.proceso_id);
  if (r.errores.length) return { ok: false, mensaje: `Novedad cerrada, pero el recálculo falló: ${r.errores.join("; ")}` };
  return { ok: true, mensaje: "Término reanudado y vencimiento recalculado." };
}

export async function cambiarEstadoTermino(_previo: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const { activa } = await requerirDespacho();
  const datos = esquemaEstadoTermino.safeParse(Object.fromEntries(formData));
  if (!datos.success) return errorDeValidacion(datos.error, formData);
  const { accion, termino_id, fecha } = datos.data;

  if (accion === "cancelar" && activa.rol === "sustanciador") {
    return { ok: false, mensaje: "Solo el juez o el secretario pueden cancelar un término." };
  }
  const encontrado = await terminoDelDespacho(termino_id, activa.despacho.id);
  if (!encontrado) return { ok: false, mensaje: "Término no encontrado." };
  const { supabase, termino } = encontrado;

  const cambios =
    accion === "cumplir"
      ? { estado: "cumplido" as const, cumplido_en: fecha ?? hoyEnColombia() }
      : accion === "cancelar"
        ? { estado: "cancelado" as const, cumplido_en: null }
        : { estado: "en_curso" as const, cumplido_en: null };

  const { error } = await supabase.from("terminos").update(cambios).eq("id", termino.id);
  if (error) return { ok: false, mensaje: `No se pudo actualizar el término: ${error.message}` };
  if (accion === "reabrir") await recalcularTerminos(supabase, activa.despacho, termino.id);

  refrescar(termino.proceso_id);
  return { ok: true, mensaje: accion === "cumplir" ? "Término marcado como cumplido." : accion === "cancelar" ? "Término cancelado." : "Término reabierto." };
}
