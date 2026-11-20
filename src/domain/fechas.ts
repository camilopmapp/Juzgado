/**
 * Fechas civiles ('AAAA-MM-DD') sin hora ni zona horaria.
 * Todo el cálculo interno usa UTC para evitar saltos por zona horaria.
 */
export type Fecha = string & { readonly __marca: "Fecha" };

const PATRON = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_DIA = 86_400_000;

export function esFechaValida(valor: string): boolean {
  const m = PATRON.exec(valor);
  if (!m) return false;
  const [anio, mes, dia] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const d = new Date(Date.UTC(anio, mes - 1, dia));
  return d.getUTCFullYear() === anio && d.getUTCMonth() === mes - 1 && d.getUTCDate() === dia;
}

export function fecha(valor: string): Fecha {
  if (!esFechaValida(valor)) throw new Error(`Fecha inválida: ${valor}`);
  return valor as Fecha;
}

function aUtc(f: Fecha): Date {
  return new Date(`${f}T00:00:00Z`);
}

function desdeUtc(d: Date): Fecha {
  return d.toISOString().slice(0, 10) as Fecha;
}

export function fechaDesdePartes(anio: number, mes: number, dia: number): Fecha {
  return desdeUtc(new Date(Date.UTC(anio, mes - 1, dia)));
}

export function partes(f: Fecha): { anio: number; mes: number; dia: number } {
  const [anio, mes, dia] = f.split("-").map(Number);
  return { anio, mes, dia };
}

export function sumarDias(f: Fecha, dias: number): Fecha {
  return desdeUtc(new Date(aUtc(f).getTime() + dias * MS_DIA));
}

/** Suma meses de calendario; si el día no existe en el mes destino, usa el último día del mes. */
export function sumarMeses(f: Fecha, meses: number): Fecha {
  const { anio, mes, dia } = partes(f);
  const indice = anio * 12 + (mes - 1) + meses;
  const anioDestino = Math.floor(indice / 12);
  const mesDestino = (indice % 12) + 1;
  const ultimoDia = new Date(Date.UTC(anioDestino, mesDestino, 0)).getUTCDate();
  return fechaDesdePartes(anioDestino, mesDestino, Math.min(dia, ultimoDia));
}

/** 0 = domingo … 6 = sábado */
export function diaSemana(f: Fecha): number {
  return aUtc(f).getUTCDay();
}

/** Días de calendario de `desde` a `hasta` (positivo si `hasta` es posterior). */
export function diferenciaDias(desde: Fecha, hasta: Fecha): number {
  return Math.round((aUtc(hasta).getTime() - aUtc(desde).getTime()) / MS_DIA);
}

export function compararFechas(a: Fecha, b: Fecha): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function maxFecha(a: Fecha, b: Fecha): Fecha {
  return a > b ? a : b;
}

export function minFecha(a: Fecha, b: Fecha): Fecha {
  return a < b ? a : b;
}

/** Fecha actual en Colombia (UTC-5 todo el año, sin horario de verano). */
export function hoyEnColombia(ahora: Date = new Date()): Fecha {
  return desdeUtc(new Date(ahora.getTime() - 5 * 3_600_000));
}
