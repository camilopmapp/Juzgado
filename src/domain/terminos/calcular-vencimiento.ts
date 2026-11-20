import {
  type CalendarioJudicial,
  type PeriodoInhabil,
  conPeriodosAdicionales,
  esDiaHabil,
  motivoInhabil,
  primerDiaHabilDesde,
  sumarDiasHabiles,
} from "../calendario/calendario-judicial";
import { type Fecha, diferenciaDias, maxFecha, minFecha, sumarDias, sumarMeses } from "../fechas";

export type UnidadTermino = "horas" | "dias_habiles" | "dias_calendario" | "meses" | "anios";
export type TipoNovedad = "suspension" | "interrupcion" | "prorroga";

export interface NovedadTermino {
  tipo: TipoNovedad;
  fechaInicio: Fecha;
  fechaFin: Fecha | null;
  cantidad?: number | null; // solo prórroga
  unidad?: UnidadTermino | null; // solo prórroga
}

export interface EntradaTermino {
  unidad: UnidadTermino;
  cantidad: number;
  /** Hecho que inicia el término (notificación, reparto, presentación…). */
  fechaEvento: Fecha;
  /** 'HH:MM', obligatoria para términos en horas. */
  horaEvento?: string | null;
  novedades?: readonly NovedadTermino[];
}

export type ResultadoVencimiento =
  | { estado: "calculado"; fechaVencimiento: Fecha; horaVencimiento: string | null; pasos: string[] }
  | { estado: "suspendido"; desde: Fecha; pasos: string[] };

const NOMBRE_UNIDAD: Record<UnidadTermino, [string, string]> = {
  horas: ["hora", "horas"],
  dias_habiles: ["día hábil", "días hábiles"],
  dias_calendario: ["día calendario", "días calendario"],
  meses: ["mes", "meses"],
  anios: ["año", "años"],
};

function describir(cantidad: number, unidad: UnidadTermino): string {
  const [singular, plural] = NOMBRE_UNIDAD[unidad];
  return `${cantidad} ${cantidad === 1 ? singular : plural}`;
}

function validarCantidad(cantidad: number, contexto: string): void {
  if (!Number.isInteger(cantidad) || cantidad < 1) {
    throw new Error(`${contexto}: la cantidad debe ser un entero positivo (recibido: ${cantidad})`);
  }
}

/** Avanza una fecha según la unidad. Los días hábiles cuentan desde el día siguiente. */
function avanzar(cal: CalendarioJudicial, desde: Fecha, cantidad: number, unidad: UnidadTermino): Fecha {
  switch (unidad) {
    case "dias_habiles":
      return sumarDiasHabiles(cal, desde, cantidad);
    case "dias_calendario":
      return sumarDias(desde, cantidad);
    case "meses":
      return sumarMeses(desde, cantidad);
    case "anios":
      return sumarMeses(desde, cantidad * 12);
    case "horas":
      throw new Error("Las horas no se pueden sumar a una fecha sin hora");
  }
}

/** Días de calendario de la suspensión que caen dentro de (desde, hasta]. */
function diasSuspendidos(periodos: readonly PeriodoInhabil[], desde: Fecha, hasta: Fecha): number {
  let total = 0;
  for (const p of periodos) {
    const inicio = maxFecha(p.inicio, sumarDias(desde, 1));
    const fin = minFecha(p.fin, hasta);
    if (fin >= inicio) total += diferenciaDias(inicio, fin) + 1;
  }
  return total;
}

function calcularEnHoras(entrada: EntradaTermino, horas: number, pasos: string[]): ResultadoVencimiento {
  const hora = entrada.horaEvento ?? "";
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(hora)) {
    throw new Error("Los términos en horas exigen la hora del evento en formato HH:MM");
  }
  const inicio = new Date(`${entrada.fechaEvento}T${hora}:00Z`);
  const fin = new Date(inicio.getTime() + horas * 3_600_000);
  const fechaVencimiento = fin.toISOString().slice(0, 10) as Fecha;
  const horaVencimiento = fin.toISOString().slice(11, 16);
  pasos.push(
    `Se cuentan ${horas} horas corridas desde el ${entrada.fechaEvento} a las ${hora} (PENDIENTE DE VALIDACIÓN JURÍDICA: corridas o hábiles).`,
    `Vence el ${fechaVencimiento} a las ${horaVencimiento}.`,
  );
  return { estado: "calculado", fechaVencimiento, horaVencimiento, pasos };
}

/**
 * Calcula el vencimiento de un término judicial.
 *
 * Reglas (art. 118 CGP y novedades del proceso):
 * - Días hábiles: se cuentan desde el día siguiente al evento; no cuentan fines de semana,
 *   festivos, periodos inhábiles del calendario ni días de suspensión del término.
 * - Días calendario, meses y años: se cuentan sobre el calendario; las suspensiones del término
 *   corren el vencimiento tantos días como duraron; si el último día es inhábil, se extiende
 *   al primer día hábil siguiente.
 * - Interrupción: el término vuelve a correr completo desde el fin de la última interrupción.
 * - Prórroga: se suma al vencimiento.
 * - Suspensión o interrupción sin fecha de fin: el término queda suspendido.
 */
export function calcularVencimiento(entrada: EntradaTermino, calendario: CalendarioJudicial): ResultadoVencimiento {
  validarCantidad(entrada.cantidad, "Término");
  const novedades = [...(entrada.novedades ?? [])].sort((a, b) => (a.fechaInicio < b.fechaInicio ? -1 : 1));
  const pasos: string[] = [
    `Término de ${describir(entrada.cantidad, entrada.unidad)} desde el evento del ${entrada.fechaEvento}.`,
  ];

  for (const n of novedades) {
    if (n.fechaFin && n.fechaFin < n.fechaInicio) {
      throw new Error(`La novedad del ${n.fechaInicio} termina antes de empezar`);
    }
    if (n.tipo === "prorroga") {
      if (!n.unidad || n.cantidad == null) throw new Error("La prórroga exige cantidad y unidad");
      validarCantidad(n.cantidad, "Prórroga");
    }
  }

  const abierta = novedades.find((n) => n.tipo !== "prorroga" && n.fechaFin === null);
  if (abierta) {
    pasos.push(`El término está ${abierta.tipo === "suspension" ? "suspendido" : "interrumpido"} desde el ${abierta.fechaInicio}, sin fecha de reanudación.`);
    return { estado: "suspendido", desde: abierta.fechaInicio, pasos };
  }

  const prorrogas = novedades.filter((n) => n.tipo === "prorroga");

  if (entrada.unidad === "horas") {
    if (novedades.some((n) => n.tipo !== "prorroga") || prorrogas.some((p) => p.unidad !== "horas")) {
      throw new Error("Los términos en horas solo admiten prórrogas en horas");
    }
    const extra = prorrogas.reduce((s, p) => s + (p.cantidad ?? 0), 0);
    if (extra > 0) pasos.push(`Prórroga de ${describir(extra, "horas")}.`);
    return calcularEnHoras(entrada, entrada.cantidad + extra, pasos);
  }

  let inicio = entrada.fechaEvento;
  const interrupciones = novedades.filter((n) => n.tipo === "interrupcion");
  if (interrupciones.length > 0) {
    inicio = interrupciones.map((n) => n.fechaFin as Fecha).reduce(maxFecha);
    pasos.push(`Interrupción: el término vuelve a correr completo desde el ${inicio}.`);
  }

  const suspensiones: PeriodoInhabil[] = novedades
    .filter((n) => n.tipo === "suspension" && (n.fechaFin as Fecha) > inicio)
    .map((n) => ({ inicio: n.fechaInicio, fin: n.fechaFin as Fecha, motivo: "Suspensión del término" }));
  const cal = conPeriodosAdicionales(calendario, suspensiones);

  let vencimiento = avanzar(cal, inicio, entrada.cantidad, entrada.unidad);
  pasos.push(
    entrada.unidad === "dias_habiles"
      ? `Contando días hábiles desde el día siguiente (sin fines de semana, festivos, vacancia ni suspensiones), el día ${entrada.cantidad} es el ${vencimiento}.`
      : `Sumando ${describir(entrada.cantidad, entrada.unidad)} al ${inicio} se llega al ${vencimiento}.`,
  );

  for (const p of prorrogas) {
    const anterior = vencimiento;
    vencimiento = avanzar(cal, vencimiento, p.cantidad as number, p.unidad as UnidadTermino);
    pasos.push(`Prórroga de ${describir(p.cantidad as number, p.unidad as UnidadTermino)} sobre el ${anterior}: ${vencimiento}.`);
  }

  if (entrada.unidad !== "dias_habiles" && suspensiones.length > 0) {
    const base = vencimiento;
    let dias = 0;
    for (let i = 0; i < 50; i++) {
      const nuevos = diasSuspendidos(suspensiones, inicio, sumarDias(base, dias));
      if (nuevos === dias) break;
      dias = nuevos;
    }
    if (dias > 0) {
      vencimiento = sumarDias(base, dias);
      pasos.push(`Se agregan ${dias} días de suspensión del término: ${vencimiento}.`);
    }
  }

  if (!esDiaHabil(cal, vencimiento)) {
    const motivo = motivoInhabil(cal, vencimiento);
    const anterior = vencimiento;
    vencimiento = primerDiaHabilDesde(cal, vencimiento);
    pasos.push(`El ${anterior} es inhábil (${motivo}); se extiende al primer día hábil siguiente.`);
  }

  pasos.push(`Vence el ${vencimiento}.`);
  return { estado: "calculado", fechaVencimiento: vencimiento, horaVencimiento: null, pasos };
}
