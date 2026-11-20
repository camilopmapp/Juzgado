/**
 * Radicado judicial de 23 dígitos:
 * municipio DANE (5) + entidad (2) + especialidad (2) + despacho (3) + año (4) + consecutivo (5) + recurso (2).
 */
export interface Radicado {
  codigoMunicipio: string;
  entidad: string;
  especialidad: string;
  despacho: string;
  /** Primeros 12 dígitos: código del despacho. */
  codigoDespacho: string;
  anio: number;
  consecutivo: string;
  recurso: string;
}

export function normalizarRadicado(valor: string): string {
  return valor.replace(/[\s.\-]/g, "");
}

export function parsearRadicado(valor: string): Radicado | null {
  const r = normalizarRadicado(valor);
  if (!/^\d{23}$/.test(r)) return null;
  const anio = Number(r.slice(12, 16));
  if (anio < 1900 || anio > 2100) return null;
  return {
    codigoMunicipio: r.slice(0, 5),
    entidad: r.slice(5, 7),
    especialidad: r.slice(7, 9),
    despacho: r.slice(9, 12),
    codigoDespacho: r.slice(0, 12),
    anio,
    consecutivo: r.slice(16, 21),
    recurso: r.slice(21, 23),
  };
}

export function formatearRadicado(valor: string): string {
  const p = parsearRadicado(valor);
  if (!p) return valor;
  return [p.codigoMunicipio, p.entidad, p.especialidad, p.despacho, p.anio, p.consecutivo, p.recurso].join("-");
}
