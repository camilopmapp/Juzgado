import { type Fecha, fechaDesdePartes, sumarDias } from "../fechas";
import type { PeriodoInhabil } from "./calendario-judicial";
import { domingoDePascua } from "./festivos-colombia";

export type TipoSuspension = "vacancia_colectiva" | "semana_santa" | "acuerdo_csj" | "cierre_despacho" | "otro";
export type AlcanceSuspension = "nacional" | "seccional" | "despacho";

export interface Suspension {
  tipo: TipoSuspension;
  alcance: AlcanceSuspension;
  seccional: string | null;
  despachoId: string | null;
  fechaInicio: Fecha;
  fechaFin: Fecha;
  motivo: string;
  soporte: string;
}

export interface DespachoCalendario {
  id: string;
  seccional: string;
  vacanciaColectiva: boolean;
}

const ETIQUETAS: Record<TipoSuspension, string> = {
  vacancia_colectiva: "Vacancia judicial",
  semana_santa: "Semana Santa",
  acuerdo_csj: "Suspensión de términos (CSJ)",
  cierre_despacho: "Cierre del despacho",
  otro: "Suspensión de términos",
};

/**
 * Periodos inhábiles que aplican a un despacho.
 * PENDIENTE DE VALIDACIÓN JURÍDICA (J4): la Semana Santa se trata igual que la
 * vacancia colectiva (no aplica a despachos sin vacancia colectiva).
 */
export function periodosAplicables(suspensiones: readonly Suspension[], despacho: DespachoCalendario): PeriodoInhabil[] {
  return suspensiones
    .filter((s) => {
      if ((s.tipo === "vacancia_colectiva" || s.tipo === "semana_santa") && !despacho.vacanciaColectiva) return false;
      if (s.alcance === "nacional") return true;
      if (s.alcance === "seccional") return s.seccional === despacho.seccional;
      return s.despachoId === despacho.id;
    })
    .map((s) => ({ inicio: s.fechaInicio, fin: s.fechaFin, motivo: ETIQUETAS[s.tipo] }));
}

export interface SuspensionSugerida {
  tipo: "vacancia_colectiva" | "semana_santa";
  fechaInicio: Fecha;
  fechaFin: Fecha;
  motivo: string;
  soporte: string;
}

/**
 * Vacancia colectiva (20-dic a 10-ene) y lunes a miércoles santo de un año.
 * PENDIENTE DE VALIDACIÓN JURÍDICA (J4) antes de cargarlas en producción.
 */
export function suspensionesSugeridas(anio: number): SuspensionSugerida[] {
  const pascua = domingoDePascua(anio);
  return [
    {
      tipo: "semana_santa",
      fechaInicio: sumarDias(pascua, -6),
      fechaFin: sumarDias(pascua, -4),
      motivo: `Semana Santa ${anio} (lunes a miércoles santo)`,
      soporte: "Decreto 546 de 1971, art. 146",
    },
    {
      tipo: "vacancia_colectiva",
      fechaInicio: fechaDesdePartes(anio, 12, 20),
      fechaFin: fechaDesdePartes(anio + 1, 1, 10),
      motivo: `Vacancia judicial ${anio}-${anio + 1}`,
      soporte: "Decreto 546 de 1971, art. 146",
    },
  ];
}
