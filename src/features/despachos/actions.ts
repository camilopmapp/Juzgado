"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requerirUsuario } from "@/features/auth/sesion";
import { recalcularTerminos } from "@/features/terminos/servicio";
import { type EstadoFormulario, errorDeValidacion, fechaCivil, texto, valoresDe } from "@/lib/formularios";
import { crearClienteServidor } from "@/lib/supabase/server";
import { COOKIE_DESPACHO, obtenerContexto, requerirDespacho } from "./contexto";
import { esquemaConfiguracionDespacho, esquemaNuevoDespacho } from "./schemas";

const OPCIONES_COOKIE = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 365 };

export async function crearDespacho(_previo: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  await requerirUsuario();
  const datos = esquemaNuevoDespacho.safeParse(Object.fromEntries(formData));
  if (!datos.success) return errorDeValidacion(datos.error, formData);
  const d = datos.data;

  const supabase = await crearClienteServidor();
  const { data: id, error } = await supabase.rpc("crear_despacho", {
    p_nombre: d.nombre,
    p_codigo: d.codigo,
    p_departamento: d.departamento,
    p_municipio: d.municipio,
    p_seccional: d.seccional,
    p_especialidad: d.especialidad,
  });
  if (error) {
    if (error.code === "23505") {
      return { ok: false, errores: { codigo: ["Ya hay un despacho registrado con ese código. Si es el suyo, contacte al administrador."] }, valores: valoresDe(formData) };
    }
    return { ok: false, mensaje: `No se pudo crear el despacho: ${error.message}`, valores: valoresDe(formData) };
  }
  (await cookies()).set(COOKIE_DESPACHO, id, OPCIONES_COOKIE);
  redirect("/pendiente");
}

export async function actualizarDespacho(_previo: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const { activa } = await requerirDespacho(["juez"]);
  const datos = esquemaConfiguracionDespacho.safeParse(Object.fromEntries(formData));
  if (!datos.success) return errorDeValidacion(datos.error, formData);
  const d = datos.data;

  const supabase = await crearClienteServidor();
  const { data: actualizado, error } = await supabase
    .from("despachos")
    .update(d)
    .eq("id", activa.despacho.id)
    .select("id, seccional, vacancia_colectiva")
    .single();
  if (error) return { ok: false, mensaje: `No se pudo guardar: ${error.message}` };

  // La vacancia y la seccional cambian el calendario: se recalculan los términos.
  let aviso = "";
  if (d.vacancia_colectiva !== activa.despacho.vacancia_colectiva || d.seccional !== activa.despacho.seccional) {
    const r = await recalcularTerminos(supabase, actualizado);
    aviso = ` Se recalcularon ${r.actualizados} términos.${r.errores.length ? ` Errores: ${r.errores.join("; ")}` : ""}`;
  }
  revalidatePath("/", "layout");
  return { ok: true, mensaje: `Datos del despacho guardados.${aviso}` };
}

export async function cambiarDespachoActivo(formData: FormData): Promise<void> {
  const { membresias } = await obtenerContexto();
  const id = String(formData.get("despacho_id") ?? "");
  if (membresias.some((m) => m.despacho.id === id)) {
    (await cookies()).set(COOKIE_DESPACHO, id, OPCIONES_COOKIE);
  }
  redirect("/tablero");
}

// ---- Suspensiones locales (cierres del despacho) ----

const esquemaSuspensionLocal = z
  .object({
    tipo: z.enum(["cierre_despacho", "otro"]),
    fecha_inicio: fechaCivil("Fecha de inicio"),
    fecha_fin: fechaCivil("Fecha de fin"),
    motivo: texto(3, 300, "El motivo"),
    soporte: texto(3, 300, "El soporte"),
  })
  .refine((d) => d.fecha_fin >= d.fecha_inicio, { message: "La fecha de fin no puede ser anterior al inicio", path: ["fecha_fin"] });

export async function registrarSuspensionLocal(_previo: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const { usuario, activa } = await requerirDespacho(["juez", "secretario"]);
  const datos = esquemaSuspensionLocal.safeParse(Object.fromEntries(formData));
  if (!datos.success) return errorDeValidacion(datos.error, formData);

  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("suspensiones_terminos").insert({
    ...datos.data,
    alcance: "despacho",
    despacho_id: activa.despacho.id,
    creado_por: usuario.id,
  });
  if (error) return { ok: false, mensaje: `No se pudo registrar: ${error.message}` };

  const r = await recalcularTerminos(supabase, activa.despacho);
  revalidatePath("/configuracion");
  revalidatePath("/tablero");
  return { ok: true, mensaje: `Suspensión registrada. Se recalcularon ${r.actualizados} términos.` };
}

export async function eliminarSuspensionLocal(_previo: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const { activa } = await requerirDespacho(["juez", "secretario"]);
  const id = z.uuid().safeParse(formData.get("suspension_id"));
  if (!id.success) return { ok: false, mensaje: "Suspensión inválida." };

  const supabase = await crearClienteServidor();
  const { error, count } = await supabase
    .from("suspensiones_terminos")
    .delete({ count: "exact" })
    .eq("id", id.data)
    .eq("alcance", "despacho")
    .eq("despacho_id", activa.despacho.id);
  if (error || !count) return { ok: false, mensaje: "No se pudo eliminar la suspensión." };

  const r = await recalcularTerminos(supabase, activa.despacho);
  revalidatePath("/configuracion");
  revalidatePath("/tablero");
  return { ok: true, mensaje: `Suspensión eliminada. Se recalcularon ${r.actualizados} términos.` };
}
