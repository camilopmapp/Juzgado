import { type CalendarioJudicial, contarDiasHabiles } from "@/domain/calendario/calendario-judicial";
import { type Fecha, diferenciaDias, maxFecha } from "@/domain/fechas";
import type { NovedadTermino, UnidadTermino } from "@/domain/terminos/calcular-vencimiento";
import { type EstadoTermino, type ResultadoSemaforo, evaluarSemaforo } from "@/domain/terminos/semaforo";

export interface DatosNovedad {
  tipo: NovedadTermino["tipo"];
  fecha_inicio: string;
  fecha_fin: string | null;
  cantidad: number | null;
  unidad: UnidadTermino | null;
}

export interface DatosTermino {
  unidad: UnidadTermino;
  cantidad: number;
  fecha_evento: string;
  hora_evento: string | null;
  fecha_vencimiento: string | null;
  estado: EstadoTermino;
  novedades: DatosNovedad[];
}

export function aNovedades(filas: readonly DatosNovedad[]): NovedadTermino[] {
  return filas.map((n) => ({
    tipo: n.tipo,
    fechaInicio: n.fecha_inicio as Fecha,
    fechaFin: n.fecha_fin as Fecha | null,
    cantidad: n.cantidad,
    unidad: n.unidad,
  }));
}

/** Fecha desde la que corre el término: el evento o el fin de la última interrupción. */
export function inicioEfectivo(t: DatosTermino): Fecha {
  return t.novedades
    .filter((n) => n.tipo === "interrupcion" && n.fecha_fin)
    .map((n) => n.fecha_fin as Fecha)
    .reduce(maxFecha, t.fecha_evento as Fecha);
}

/** Semáforo de un término guardado. Los días hábiles se miden con el calendario del despacho. */
export function semaforoDe(
  t: DatosTermino,
  cal: CalendarioJudicial,
  hoy: Fecha,
  umbrales: { amarillo: number; rojo: number },
): ResultadoSemaforo {
  const medir =
    t.unidad === "dias_habiles" ? (a: Fecha, b: Fecha) => contarDiasHabiles(cal, a, b) : diferenciaDias;
  return evaluarSemaforo({
    inicio: inicioEfectivo(t),
    vencimiento: t.fecha_vencimiento as Fecha | null,
    hoy,
    umbralAmarilloPct: umbrales.amarillo,
    umbralRojoPct: umbrales.rojo,
    estado: t.estado,
    medir,
  });
}
