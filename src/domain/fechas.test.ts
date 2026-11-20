import { describe, expect, it } from "vitest";
import {
  compararFechas,
  diaSemana,
  diferenciaDias,
  esFechaValida,
  fecha,
  hoyEnColombia,
  sumarDias,
  sumarMeses,
} from "./fechas";

describe("fechas civiles", () => {
  it("valida fechas reales", () => {
    expect(esFechaValida("2026-02-28")).toBe(true);
    expect(esFechaValida("2024-02-29")).toBe(true);
    expect(esFechaValida("2026-02-29")).toBe(false);
    expect(esFechaValida("2026-13-01")).toBe(false);
    expect(esFechaValida("26-01-01")).toBe(false);
    expect(() => fecha("2026-04-31")).toThrow();
  });

  it("suma días cruzando meses y años", () => {
    expect(sumarDias(fecha("2026-12-31"), 1)).toBe("2027-01-01");
    expect(sumarDias(fecha("2024-02-28"), 1)).toBe("2024-02-29");
    expect(sumarDias(fecha("2026-03-01"), -1)).toBe("2026-02-28");
  });

  it("suma meses ajustando al último día del mes", () => {
    expect(sumarMeses(fecha("2026-01-31"), 1)).toBe("2026-02-28");
    expect(sumarMeses(fecha("2024-01-31"), 1)).toBe("2024-02-29");
    expect(sumarMeses(fecha("2024-02-29"), 12)).toBe("2025-02-28");
    expect(sumarMeses(fecha("2026-03-02"), 12)).toBe("2027-03-02");
    expect(sumarMeses(fecha("2026-08-15"), 6)).toBe("2027-02-15");
  });

  it("calcula día de la semana (0 = domingo)", () => {
    expect(diaSemana(fecha("2026-11-20"))).toBe(5); // viernes
    expect(diaSemana(fecha("2026-11-22"))).toBe(0);
  });

  it("compara y mide diferencias", () => {
    expect(diferenciaDias(fecha("2026-01-01"), fecha("2026-12-31"))).toBe(364);
    expect(compararFechas(fecha("2026-01-02"), fecha("2026-01-01"))).toBeGreaterThan(0);
  });

  it("toma la fecha de hoy en hora de Colombia (UTC-5)", () => {
    // 20-nov-2026 03:00 UTC = 19-nov-2026 22:00 en Bogotá
    expect(hoyEnColombia(new Date("2026-11-20T03:00:00Z"))).toBe("2026-11-19");
    expect(hoyEnColombia(new Date("2026-11-20T05:00:00Z"))).toBe("2026-11-20");
  });
});
