import type { Fecha } from "../fechas";

export type EstadoTermino = "en_curso" | "suspendido" | "cumplido" | "cancelado";
export type ColorSemaforo = "verde" | "amarillo" | "rojo" | "vencido" | "suspendido" | "cumplido" | "cancelado";

export interface EntradaSemaforo {
  inicio: Fecha;
  vencimiento: Fecha | null;
  hoy: Fecha;
  umbralAmarilloPct: number;
  umbralRojoPct: number;
  estado: EstadoTermino;
  /** Cuenta días entre dos fechas: calendario o hábiles, según el término. */
  medir: (desde: Fecha, hasta: Fecha) => number;
}

export interface ResultadoSemaforo {
  color: ColorSemaforo;
  porcentaje: number | null;
  diasRestantes: number | null;
}

export function evaluarSemaforo(e: EntradaSemaforo): ResultadoSemaforo {
  if (e.estado !== "en_curso") return { color: e.estado, porcentaje: null, diasRestantes: null };
  if (!e.vencimiento) return { color: "suspendido", porcentaje: null, diasRestantes: null };

  const diasRestantes = e.medir(e.hoy, e.vencimiento);
  if (e.hoy > e.vencimiento) return { color: "vencido", porcentaje: 100, diasRestantes };

  const total = e.medir(e.inicio, e.vencimiento);
  const transcurrido = e.medir(e.inicio, e.hoy);
  const porcentaje = total <= 0 ? 100 : Math.min(100, Math.max(0, Math.round((transcurrido / total) * 100)));
  const color = porcentaje >= e.umbralRojoPct ? "rojo" : porcentaje >= e.umbralAmarilloPct ? "amarillo" : "verde";
  return { color, porcentaje, diasRestantes };
}
