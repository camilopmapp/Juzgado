import { describe, expect, it } from "vitest";
import { fecha } from "../fechas";
import {
  contarDiasHabiles,
  crearCalendario,
  esDiaHabil,
  motivoInhabil,
  primerDiaHabilDesde,
  sumarDiasHabiles,
} from "./calendario-judicial";
import { festivosColombia } from "./festivos-colombia";

const cal = crearCalendario({
  festivos: [...festivosColombia(2026), ...festivosColombia(2027)].map((f) => f.fecha),
  periodosInhabiles: [
    { inicio: fecha("2026-12-20"), fin: fecha("2027-01-10"), motivo: "Vacancia judicial" },
    { inicio: fecha("2026-03-30"), fin: fecha("2026-04-01"), motivo: "Semana Santa" },
  ],
});

describe("calendario judicial", () => {
  it("fines de semana, festivos y periodos inhábiles", () => {
    expect(esDiaHabil(cal, fecha("2026-11-20"))).toBe(true);
    expect(motivoInhabil(cal, fecha("2026-11-21"))).toBe("Sábado");
    expect(motivoInhabil(cal, fecha("2026-11-22"))).toBe("Domingo");
    expect(motivoInhabil(cal, fecha("2026-11-16"))).toBe("Festivo");
    expect(motivoInhabil(cal, fecha("2026-12-28"))).toBe("Vacancia judicial");
    expect(motivoInhabil(cal, fecha("2027-01-11"))).toBe("Festivo"); // Reyes 2027 trasladado
    expect(esDiaHabil(cal, fecha("2027-01-12"))).toBe(true);
  });

  it("primer día hábil desde una fecha (inclusive)", () => {
    expect(primerDiaHabilDesde(cal, fecha("2026-11-20"))).toBe("2026-11-20");
    expect(primerDiaHabilDesde(cal, fecha("2026-11-14"))).toBe("2026-11-17"); // sáb → lunes festivo → martes
    expect(primerDiaHabilDesde(cal, fecha("2026-12-19"))).toBe("2027-01-12");
  });

  it("suma días hábiles empezando el día siguiente", () => {
    // Notificado viernes 13-nov-2026: lun 16 es festivo → 17,18,19,20,23
    expect(sumarDiasHabiles(cal, fecha("2026-11-13"), 5)).toBe("2026-11-23");
    // Tutela presentada el 15-dic-2026: 16,17,18 hábiles; vacancia hasta 10-ene; 11-ene festivo
    expect(sumarDiasHabiles(cal, fecha("2026-12-15"), 10)).toBe("2027-01-20");
    // Semana Santa 2026: lun 30-mar a vie 3-abr inhábiles
    expect(sumarDiasHabiles(cal, fecha("2026-03-27"), 1)).toBe("2026-04-06");
  });

  it("cuenta días hábiles en un rango (desde exclusivo, hasta inclusivo)", () => {
    expect(contarDiasHabiles(cal, fecha("2026-11-13"), fecha("2026-11-23"))).toBe(5);
    expect(contarDiasHabiles(cal, fecha("2026-11-23"), fecha("2026-11-13"))).toBe(-5);
    expect(contarDiasHabiles(cal, fecha("2026-11-20"), fecha("2026-11-20"))).toBe(0);
  });

  it("falla en vez de quedar en un ciclo infinito si no hay días hábiles", () => {
    const todoCerrado = crearCalendario({
      festivos: [],
      periodosInhabiles: [{ inicio: fecha("2026-01-01"), fin: fecha("2060-12-31"), motivo: "Cierre" }],
    });
    expect(() => sumarDiasHabiles(todoCerrado, fecha("2026-01-01"), 1)).toThrow();
  });
});
