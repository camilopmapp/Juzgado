import { type Fecha, diaSemana, sumarDias } from "../fechas";

export interface PeriodoInhabil {
  inicio: Fecha;
  fin: Fecha; // inclusive
  motivo: string;
}

export interface CalendarioJudicial {
  readonly festivos: ReadonlySet<string>;
  readonly periodosInhabiles: readonly PeriodoInhabil[];
}

/** Tope de iteraciones: ningún término real recorre más de 20 años de días. */
const LIMITE_DIAS = 7_400;

export function crearCalendario(datos: {
  festivos: readonly Fecha[];
  periodosInhabiles: readonly PeriodoInhabil[];
}): CalendarioJudicial {
  return { festivos: new Set(datos.festivos), periodosInhabiles: [...datos.periodosInhabiles] };
}

export function conPeriodosAdicionales(cal: CalendarioJudicial, extra: readonly PeriodoInhabil[]): CalendarioJudicial {
  return { festivos: cal.festivos, periodosInhabiles: [...cal.periodosInhabiles, ...extra] };
}

/** Motivo por el que el día es inhábil, o null si es hábil. */
export function motivoInhabil(cal: CalendarioJudicial, f: Fecha): string | null {
  const dia = diaSemana(f);
  if (dia === 6) return "Sábado";
  if (dia === 0) return "Domingo";
  if (cal.festivos.has(f)) return "Festivo";
  const periodo = cal.periodosInhabiles.find((p) => p.inicio <= f && f <= p.fin);
  return periodo ? periodo.motivo : null;
}

export function esDiaHabil(cal: CalendarioJudicial, f: Fecha): boolean {
  return motivoInhabil(cal, f) === null;
}

/** El mismo día si es hábil; si no, el siguiente hábil. */
export function primerDiaHabilDesde(cal: CalendarioJudicial, f: Fecha): Fecha {
  let actual = f;
  for (let i = 0; i < LIMITE_DIAS; i++) {
    if (esDiaHabil(cal, actual)) return actual;
    actual = sumarDias(actual, 1);
  }
  throw new Error(`No hay días hábiles en los ${LIMITE_DIAS} días siguientes a ${f}`);
}

/** Día en que se completan `n` días hábiles contados desde el día siguiente a `desde`. */
export function sumarDiasHabiles(cal: CalendarioJudicial, desde: Fecha, n: number): Fecha {
  if (!Number.isInteger(n) || n < 1) throw new Error(`Cantidad de días inválida: ${n}`);
  let actual = desde;
  let contados = 0;
  for (let i = 0; i < LIMITE_DIAS; i++) {
    actual = sumarDias(actual, 1);
    if (esDiaHabil(cal, actual)) {
      contados++;
      if (contados === n) return actual;
    }
  }
  throw new Error(`No se completaron ${n} días hábiles desde ${desde}`);
}

/** Días hábiles en (desde, hasta]. Negativo si `hasta` es anterior a `desde`. */
export function contarDiasHabiles(cal: CalendarioJudicial, desde: Fecha, hasta: Fecha): number {
  if (hasta < desde) return -contarDiasHabiles(cal, hasta, desde);
  let total = 0;
  let actual = desde;
  for (let i = 0; i < LIMITE_DIAS && actual < hasta; i++) {
    actual = sumarDias(actual, 1);
    if (esDiaHabil(cal, actual)) total++;
  }
  return total;
}
