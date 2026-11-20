import "server-only";
import type { CalendarioJudicial } from "@/domain/calendario/calendario-judicial";
import { type Fecha, hoyEnColombia } from "@/domain/fechas";
import type { ResultadoSemaforo } from "@/domain/terminos/semaforo";
import type { Despacho } from "@/features/despachos/contexto";
import type { ClienteSupabase } from "@/lib/supabase/server";
import { COLORES } from "./catalogos";
import { semaforoDe } from "./evaluacion";
import { cargarCalendario } from "./servicio";

const COLUMNAS = "id, tipo_codigo, unidad, cantidad, fecha_evento, hora_evento, fecha_vencimiento, hora_vencimiento, estado, cumplido_en, observaciones, proceso_id, proceso:procesos(id, radicado, clase, reservado), tipo:tipos_termino(codigo, nombre, norma, estado_validacion), novedades:novedades_termino(id, tipo, fecha_inicio, fecha_fin, cantidad, unidad, soporte, creado_en)" as const;

async function consultar(supabase: ClienteSupabase, despachoId: string, filtro: { procesoId?: string; activos?: boolean }) {
  let q = supabase.from("terminos").select(COLUMNAS).eq("despacho_id", despachoId);
  if (filtro.procesoId) q = q.eq("proceso_id", filtro.procesoId);
  if (filtro.activos) q = q.in("estado", ["en_curso", "suspendido"]);
  const { data, error } = await q.order("fecha_vencimiento", { ascending: true, nullsFirst: false });
  if (error) throw new Error(`No se pudieron leer los términos: ${error.message}`);
  return data;
}

export type TerminoConSemaforo = Awaited<ReturnType<typeof consultar>>[number] & { semaforo: ResultadoSemaforo };

/** Años sin festivos cargados entre hoy y el último vencimiento: los cálculos serían incorrectos. */
function aniosSinCalendario(cal: CalendarioJudicial, hoy: Fecha, vencimientos: (string | null)[]): number[] {
  const desde = Number(hoy.slice(0, 4));
  const hasta = Math.max(desde, ...vencimientos.filter(Boolean).map((v) => Number((v as string).slice(0, 4))));
  const cargados = new Set([...cal.festivos].map((f) => Number(f.slice(0, 4))));
  const faltan: number[] = [];
  for (let a = desde; a <= hasta; a++) if (!cargados.has(a)) faltan.push(a);
  return faltan;
}

export async function terminosConSemaforo(
  supabase: ClienteSupabase,
  despacho: Despacho,
  filtro: { procesoId?: string; activos?: boolean },
) {
  const [cal, filas] = await Promise.all([cargarCalendario(supabase, despacho), consultar(supabase, despacho.id, filtro)]);
  const hoy = hoyEnColombia();
  const umbrales = { amarillo: despacho.umbral_amarillo_pct, rojo: despacho.umbral_rojo_pct };
  const terminos: TerminoConSemaforo[] = filas
    .map((t) => ({ ...t, semaforo: semaforoDe(t, cal, hoy, umbrales) }))
    .sort(
      (a, b) =>
        COLORES[a.semaforo.color].orden - COLORES[b.semaforo.color].orden ||
        (a.fecha_vencimiento ?? "9999").localeCompare(b.fecha_vencimiento ?? "9999"),
    );
  return {
    hoy,
    cal,
    terminos,
    aniosFaltantes: aniosSinCalendario(
      cal,
      hoy,
      filas.map((f) => f.fecha_vencimiento),
    ),
  };
}
