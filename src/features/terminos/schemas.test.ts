import { describe, expect, it } from "vitest";
import { esquemaNovedad, esquemaNuevoTermino } from "./schemas";

const id = "6f1c1f7e-8a3b-4c56-9d2e-1a2b3c4d5e6f";

describe("nuevo término", () => {
  it("acepta campos opcionales vacíos", () => {
    const r = esquemaNuevoTermino.parse({ proceso_id: id, tipo_codigo: "tutela_fallo", fecha_evento: "2026-11-13", hora_evento: "", cantidad: "", observaciones: "" });
    expect(r.hora_evento).toBeUndefined();
    expect(r.cantidad).toBeUndefined();
  });

  it("rechaza fechas y horas imposibles", () => {
    expect(esquemaNuevoTermino.safeParse({ proceso_id: id, tipo_codigo: "x", fecha_evento: "2026-02-30" }).success).toBe(false);
    expect(esquemaNuevoTermino.safeParse({ proceso_id: id, tipo_codigo: "x", fecha_evento: "2026-02-03", hora_evento: "25:00" }).success).toBe(false);
  });
});

describe("novedad de un término", () => {
  const base = { termino_id: id, fecha_inicio: "2026-11-18", soporte: "Auto del 17-nov-2026" };

  it("la prórroga exige cantidad y unidad", () => {
    expect(esquemaNovedad.safeParse({ ...base, tipo: "prorroga" }).success).toBe(false);
    expect(esquemaNovedad.safeParse({ ...base, tipo: "prorroga", cantidad: "6", unidad: "meses" }).success).toBe(true);
  });

  it("el fin no puede ser anterior al inicio", () => {
    expect(esquemaNovedad.safeParse({ ...base, tipo: "suspension", fecha_fin: "2026-11-10" }).success).toBe(false);
  });
});
