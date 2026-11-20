import type { ColorSemaforo } from "@/domain/terminos/semaforo";
import type { UnidadTermino } from "@/domain/terminos/calcular-vencimiento";

export const UNIDADES: Record<UnidadTermino, string> = {
  horas: "horas",
  dias_habiles: "días hábiles",
  dias_calendario: "días calendario",
  meses: "meses",
  anios: "años",
};

export const NOVEDADES = {
  suspension: "Suspensión",
  interrupcion: "Interrupción",
  prorroga: "Prórroga",
} as const;

export const COLORES: Record<ColorSemaforo, { etiqueta: string; clase: string; orden: number }> = {
  vencido: { etiqueta: "Vencido", clase: "bg-red-700 text-white border-red-800", orden: 0 },
  rojo: { etiqueta: "Crítico", clase: "bg-red-100 text-red-900 border-red-300", orden: 1 },
  amarillo: { etiqueta: "Atención", clase: "bg-amber-100 text-amber-950 border-amber-300", orden: 2 },
  verde: { etiqueta: "A tiempo", clase: "bg-emerald-100 text-emerald-900 border-emerald-300", orden: 3 },
  suspendido: { etiqueta: "Suspendido", clase: "bg-slate-100 text-slate-800 border-slate-300", orden: 4 },
  cumplido: { etiqueta: "Cumplido", clase: "bg-sky-100 text-sky-900 border-sky-300", orden: 5 },
  cancelado: { etiqueta: "Cancelado", clase: "bg-zinc-100 text-zinc-600 border-zinc-300", orden: 6 },
};
