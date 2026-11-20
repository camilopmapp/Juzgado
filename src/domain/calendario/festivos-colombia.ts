import { type Fecha, diaSemana, fechaDesdePartes, sumarDias } from "../fechas";

export interface Festivo {
  fecha: Fecha;
  nombre: string;
  /** true si la Ley 51 de 1983 lo traslada al lunes siguiente. */
  trasladable: boolean;
}

/** Domingo de Pascua (algoritmo anónimo gregoriano, Meeus/Jones/Butcher). */
export function domingoDePascua(anio: number): Fecha {
  const a = anio % 19;
  const b = Math.floor(anio / 100);
  const c = anio % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return fechaDesdePartes(anio, mes, dia);
}

/** Si la fecha no es lunes, la lleva al lunes siguiente. */
function aLunes(f: Fecha): Fecha {
  const dias = (8 - diaSemana(f)) % 7;
  return sumarDias(f, dias);
}

/**
 * Festivos nacionales según la Ley 51 de 1983 (Ley Emiliani).
 * Sirve para generar y verificar los datos de la tabla `festivos`;
 * el motor de términos siempre lee los festivos de la base de datos.
 */
export function festivosColombia(anio: number): Festivo[] {
  if (!Number.isInteger(anio) || anio < 1984 || anio > 2200) {
    throw new Error(`Año fuera del rango soportado: ${anio}`);
  }
  const pascua = domingoDePascua(anio);
  const fijo = (mes: number, dia: number, nombre: string): Festivo => ({
    fecha: fechaDesdePartes(anio, mes, dia),
    nombre,
    trasladable: false,
  });
  const trasladado = (f: Fecha, nombre: string): Festivo => ({ fecha: aLunes(f), nombre, trasladable: true });

  const lista: Festivo[] = [
    fijo(1, 1, "Año Nuevo"),
    trasladado(fechaDesdePartes(anio, 1, 6), "Día de los Reyes Magos"),
    trasladado(fechaDesdePartes(anio, 3, 19), "Día de San José"),
    { fecha: sumarDias(pascua, -3), nombre: "Jueves Santo", trasladable: false },
    { fecha: sumarDias(pascua, -2), nombre: "Viernes Santo", trasladable: false },
    fijo(5, 1, "Día del Trabajo"),
    trasladado(sumarDias(pascua, 39), "Ascensión del Señor"),
    trasladado(sumarDias(pascua, 60), "Corpus Christi"),
    trasladado(sumarDias(pascua, 68), "Sagrado Corazón de Jesús"),
    trasladado(fechaDesdePartes(anio, 6, 29), "San Pedro y San Pablo"),
    fijo(7, 20, "Día de la Independencia"),
    fijo(8, 7, "Batalla de Boyacá"),
    trasladado(fechaDesdePartes(anio, 8, 15), "Asunción de la Virgen"),
    trasladado(fechaDesdePartes(anio, 10, 12), "Día de la Raza"),
    trasladado(fechaDesdePartes(anio, 11, 1), "Todos los Santos"),
    trasladado(fechaDesdePartes(anio, 11, 11), "Independencia de Cartagena"),
    fijo(12, 8, "Inmaculada Concepción"),
    fijo(12, 25, "Navidad"),
  ];
  return lista.sort((x, y) => (x.fecha < y.fecha ? -1 : x.fecha > y.fecha ? 1 : 0));
}
