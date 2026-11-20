import { describe, expect, it } from "vitest";
import { crearCalendario } from "../calendario/calendario-judicial";
import { festivosColombia } from "../calendario/festivos-colombia";
import { fecha } from "../fechas";
import { calcularVencimiento, type EntradaTermino } from "./calcular-vencimiento";

const cal = crearCalendario({
  festivos: [2025, 2026, 2027].flatMap((a) => festivosColombia(a).map((f) => f.fecha)),
  periodosInhabiles: [
    { inicio: fecha("2025-12-20"), fin: fecha("2026-01-10"), motivo: "Vacancia judicial" },
    { inicio: fecha("2026-12-20"), fin: fecha("2027-01-10"), motivo: "Vacancia judicial" },
  ],
});

function vence(entrada: EntradaTermino) {
  const r = calcularVencimiento(entrada, cal);
  if (r.estado !== "calculado") throw new Error(`se esperaba un vencimiento, se obtuvo ${r.estado}`);
  return r;
}

describe("días hábiles", () => {
  it("tutela de 10 días con festivo en medio", () => {
    expect(vence({ unidad: "dias_habiles", cantidad: 10, fechaEvento: fecha("2026-11-13") }).fechaVencimiento).toBe("2026-11-30");
  });

  it("salta la vacancia judicial y el festivo de Reyes", () => {
    expect(vence({ unidad: "dias_habiles", cantidad: 10, fechaEvento: fecha("2026-12-15") }).fechaVencimiento).toBe("2027-01-20");
  });

  it("no cuenta los días de una suspensión del término", () => {
    const r = vence({
      unidad: "dias_habiles", cantidad: 5, fechaEvento: fecha("2026-11-13"),
      novedades: [{ tipo: "suspension", fechaInicio: fecha("2026-11-18"), fechaFin: fecha("2026-11-19") }],
    });
    expect(r.fechaVencimiento).toBe("2026-11-25");
  });

  it("una interrupción reinicia el conteo desde su fin", () => {
    const r = vence({
      unidad: "dias_habiles", cantidad: 10, fechaEvento: fecha("2026-11-13"),
      novedades: [{ tipo: "interrupcion", fechaInicio: fecha("2026-11-18"), fechaFin: fecha("2026-11-20") }],
    });
    expect(r.fechaVencimiento).toBe("2026-12-04");
  });
});

describe("días calendario", () => {
  it("si vence en día inhábil se corre al siguiente hábil", () => {
    expect(vence({ unidad: "dias_calendario", cantidad: 3, fechaEvento: fecha("2026-11-12") }).fechaVencimiento).toBe("2026-11-17");
  });
});

describe("meses y años (art. 118 CGP)", () => {
  it("art. 121 CGP: un año desde la notificación", () => {
    expect(vence({ unidad: "anios", cantidad: 1, fechaEvento: fecha("2026-03-02") }).fechaVencimiento).toBe("2027-03-02");
  });

  it("si el último día es inhábil se extiende al primer hábil siguiente", () => {
    // 26-dic-2026 es sábado y está en vacancia; 11-ene-2027 es festivo
    expect(vence({ unidad: "anios", cantidad: 1, fechaEvento: fecha("2025-12-26") }).fechaVencimiento).toBe("2027-01-12");
  });

  it("una suspensión del proceso corre el vencimiento tantos días como duró", () => {
    const r = vence({
      unidad: "meses", cantidad: 6, fechaEvento: fecha("2026-03-02"),
      novedades: [{ tipo: "suspension", fechaInicio: fecha("2026-04-01"), fechaFin: fecha("2026-04-10") }],
    });
    // 2-sep-2026 + 10 días = sábado 12-sep → lunes 14-sep
    expect(r.fechaVencimiento).toBe("2026-09-14");
  });

  it("la prórroga se suma al vencimiento original", () => {
    const r = vence({
      unidad: "anios", cantidad: 1, fechaEvento: fecha("2026-03-02"),
      novedades: [{ tipo: "prorroga", fechaInicio: fecha("2027-02-15"), fechaFin: null, cantidad: 6, unidad: "meses" }],
    });
    expect(r.fechaVencimiento).toBe("2027-09-02");
  });
});

describe("horas", () => {
  it("48 horas corridas desde la hora del evento", () => {
    const r = vence({ unidad: "horas", cantidad: 48, fechaEvento: fecha("2026-11-20"), horaEvento: "10:30" });
    expect(r.fechaVencimiento).toBe("2026-11-22");
    expect(r.horaVencimiento).toBe("10:30");
  });

  it("exige la hora del evento", () => {
    expect(() => calcularVencimiento({ unidad: "horas", cantidad: 48, fechaEvento: fecha("2026-11-20") }, cal)).toThrow();
  });
});

describe("casos especiales", () => {
  it("una suspensión sin fecha de fin deja el término suspendido", () => {
    const r = calcularVencimiento({
      unidad: "dias_habiles", cantidad: 10, fechaEvento: fecha("2026-11-13"),
      novedades: [{ tipo: "suspension", fechaInicio: fecha("2026-11-18"), fechaFin: null }],
    }, cal);
    expect(r).toMatchObject({ estado: "suspendido", desde: "2026-11-18" });
  });

  it("rechaza cantidades no positivas", () => {
    expect(() => calcularVencimiento({ unidad: "dias_habiles", cantidad: 0, fechaEvento: fecha("2026-11-13") }, cal)).toThrow();
  });

  it("deja la memoria de cálculo paso a paso", () => {
    const r = vence({ unidad: "dias_habiles", cantidad: 10, fechaEvento: fecha("2026-11-13") });
    expect(r.pasos.length).toBeGreaterThan(1);
    expect(r.pasos.join(" ")).toContain("2026-11-30");
  });
});
