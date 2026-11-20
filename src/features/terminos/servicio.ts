import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { type CalendarioJudicial, crearCalendario } from "@/domain/calendario/calendario-judicial";
import { type Suspension, periodosAplicables } from "@/domain/calendario/suspensiones";
import type { Fecha } from "@/domain/fechas";
import { type ResultadoVencimiento, calcularVencimiento } from "@/domain/terminos/calcular-vencimiento";
import type { Database } from "@/types/database";
import { type DatosTermino, aNovedades } from "./evaluacion";

type Cliente = SupabaseClient<Database>;

export interface DespachoCalendario {
  id: string;
  seccional: string;
  vacancia_colectiva: boolean;
}

/** Calendario judicial del despacho: festivos y suspensiones guardados en la base de datos. */
export async function cargarCalendario(cliente: Cliente, despacho: DespachoCalendario): Promise<CalendarioJudicial> {
  const [festivos, suspensiones] = await Promise.all([
    cliente.from("festivos").select("fecha"),
    cliente
      .from("suspensiones_terminos")
      .select("tipo, alcance, seccional, despacho_id, fecha_inicio, fecha_fin, motivo, soporte"),
  ]);
  if (festivos.error) throw new Error(`No se pudieron leer los festivos: ${festivos.error.message}`);
  if (suspensiones.error) throw new Error(`No se pudieron leer las suspensiones: ${suspensiones.error.message}`);

  const lista: Suspension[] = suspensiones.data.map((s) => ({
    tipo: s.tipo,
    alcance: s.alcance,
    seccional: s.seccional,
    despachoId: s.despacho_id,
    fechaInicio: s.fecha_inicio as Fecha,
    fechaFin: s.fecha_fin as Fecha,
    motivo: s.motivo,
    soporte: s.soporte,
  }));

  return crearCalendario({
    festivos: festivos.data.map((f) => f.fecha as Fecha),
    periodosInhabiles: periodosAplicables(lista, {
      id: despacho.id,
      seccional: despacho.seccional,
      vacanciaColectiva: despacho.vacancia_colectiva,
    }),
  });
}

export function calcularTermino(t: Omit<DatosTermino, "fecha_vencimiento" | "estado">, cal: CalendarioJudicial): ResultadoVencimiento {
  return calcularVencimiento(
    {
      unidad: t.unidad,
      cantidad: t.cantidad,
      fechaEvento: t.fecha_evento as Fecha,
      horaEvento: t.hora_evento?.slice(0, 5) ?? null,
      novedades: aNovedades(t.novedades),
    },
    cal,
  );
}

/** Campos a guardar según el resultado del cálculo. */
export function camposCalculados(resultado: ResultadoVencimiento, estadoActual: DatosTermino["estado"]) {
  const calculado_en = new Date().toISOString();
  if (resultado.estado === "suspendido") {
    return { fecha_vencimiento: null, hora_vencimiento: null, estado: "suspendido" as const, calculado_en };
  }
  return {
    fecha_vencimiento: resultado.fechaVencimiento,
    hora_vencimiento: resultado.horaVencimiento,
    estado: estadoActual === "suspendido" ? ("en_curso" as const) : estadoActual,
    calculado_en,
  };
}

const COLUMNAS_TERMINO =
  "id, unidad, cantidad, fecha_evento, hora_evento, fecha_vencimiento, hora_vencimiento, estado, novedades:novedades_termino(tipo, fecha_inicio, fecha_fin, cantidad, unidad)";

/**
 * Recalcula los términos en curso o suspendidos de un despacho (o uno solo).
 * Se llama cuando cambian el calendario, la configuración del despacho o las novedades.
 */
export async function recalcularTerminos(
  cliente: Cliente,
  despacho: DespachoCalendario,
  soloTerminoId?: string,
): Promise<{ actualizados: number; errores: string[] }> {
  const cal = await cargarCalendario(cliente, despacho);
  let consulta = cliente
    .from("terminos")
    .select(COLUMNAS_TERMINO)
    .eq("despacho_id", despacho.id)
    .in("estado", ["en_curso", "suspendido"]);
  if (soloTerminoId) consulta = consulta.eq("id", soloTerminoId);
  const { data, error } = await consulta;
  if (error) throw new Error(`No se pudieron leer los términos: ${error.message}`);

  let actualizados = 0;
  const errores: string[] = [];
  for (const t of data) {
    try {
      const campos = camposCalculados(calcularTermino(t, cal), t.estado);
      const igual =
        campos.fecha_vencimiento === t.fecha_vencimiento &&
        (campos.hora_vencimiento ?? null) === (t.hora_vencimiento?.slice(0, 5) ?? null) &&
        campos.estado === t.estado;
      if (igual) continue;
      const { error: e } = await cliente.from("terminos").update(campos).eq("id", t.id);
      if (e) errores.push(`Término ${t.id}: ${e.message}`);
      else actualizados++;
    } catch (e) {
      errores.push(`Término ${t.id}: ${(e as Error).message}`);
    }
  }
  return { actualizados, errores };
}
