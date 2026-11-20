const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

/** '2026-11-20' → '20 nov 2026' (sin depender de la zona horaria ni de la versión de ICU). */
export function formatearFecha(fecha: string | null | undefined): string {
  if (!fecha) return "—";
  const [anio, mes, dia] = fecha.slice(0, 10).split("-").map(Number);
  if (!anio || !mes || !dia) return fecha;
  return `${dia} ${MESES[mes - 1]} ${anio}`;
}

export function formatearHora(hora: string | null | undefined): string {
  return hora ? hora.slice(0, 5) : "";
}
