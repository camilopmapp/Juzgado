import { describe, expect, it } from "vitest";
import { diferenciaDias, fecha } from "../fechas";
import { evaluarSemaforo } from "./semaforo";

const base = {
  inicio: fecha("2026-11-01"),
  vencimiento: fecha("2026-11-11"),
  umbralAmarilloPct: 50,
  umbralRojoPct: 80,
  estado: "en_curso" as const,
  medir: diferenciaDias,
};

describe("semáforo de términos", () => {
  it.each([
    ["2026-10-30", "verde", 0, 12],
    ["2026-11-03", "verde", 20, 8],
    ["2026-11-06", "amarillo", 50, 5],
    ["2026-11-09", "rojo", 80, 2],
    ["2026-11-11", "rojo", 100, 0],
    ["2026-11-12", "vencido", 100, -1],
  ] as const)("hoy %s → %s (%i %%, %i días)", (hoy, color, porcentaje, diasRestantes) => {
    expect(evaluarSemaforo({ ...base, hoy: fecha(hoy) })).toEqual({ color, porcentaje, diasRestantes });
  });

  it("término que vence el mismo día que inicia", () => {
    const r = evaluarSemaforo({ ...base, vencimiento: base.inicio, hoy: base.inicio });
    expect(r.color).toBe("rojo");
  });

  it("los términos cumplidos, suspendidos o cancelados no se colorean por tiempo", () => {
    for (const estado of ["cumplido", "suspendido", "cancelado"] as const) {
      expect(evaluarSemaforo({ ...base, estado, hoy: fecha("2026-11-20") }).color).toBe(estado);
    }
  });

  it("sin vencimiento calculado queda como suspendido", () => {
    expect(evaluarSemaforo({ ...base, vencimiento: null, hoy: fecha("2026-11-05") }).color).toBe("suspendido");
  });
});
