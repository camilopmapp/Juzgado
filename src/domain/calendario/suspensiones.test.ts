import { describe, expect, it } from "vitest";
import { fecha } from "../fechas";
import { periodosAplicables, suspensionesSugeridas, type Suspension } from "./suspensiones";

const base = { motivo: "x", soporte: "y" };
const suspensiones: Suspension[] = [
  { ...base, tipo: "vacancia_colectiva", alcance: "nacional", seccional: null, despachoId: null, fechaInicio: fecha("2026-12-20"), fechaFin: fecha("2027-01-10") },
  { ...base, tipo: "semana_santa", alcance: "nacional", seccional: null, despachoId: null, fechaInicio: fecha("2026-03-30"), fechaFin: fecha("2026-04-01") },
  { ...base, tipo: "acuerdo_csj", alcance: "seccional", seccional: "Bogotá", despachoId: null, fechaInicio: fecha("2026-06-01"), fechaFin: fecha("2026-06-02") },
  { ...base, tipo: "acuerdo_csj", alcance: "seccional", seccional: "Antioquia", despachoId: null, fechaInicio: fecha("2026-07-01"), fechaFin: fecha("2026-07-02") },
  { ...base, tipo: "cierre_despacho", alcance: "despacho", seccional: null, despachoId: "d1", fechaInicio: fecha("2026-08-03"), fechaFin: fecha("2026-08-03") },
  { ...base, tipo: "cierre_despacho", alcance: "despacho", seccional: null, despachoId: "d2", fechaInicio: fecha("2026-08-04"), fechaFin: fecha("2026-08-04") },
];

describe("suspensiones aplicables a un despacho", () => {
  it("toma las nacionales, las de su seccional y las propias", () => {
    const r = periodosAplicables(suspensiones, { id: "d1", seccional: "Bogotá", vacanciaColectiva: true });
    expect(r.map((p) => p.inicio)).toEqual(["2026-12-20", "2026-03-30", "2026-06-01", "2026-08-03"]);
  });

  it("omite vacancia colectiva y Semana Santa si el despacho no las tiene", () => {
    const r = periodosAplicables(suspensiones, { id: "d1", seccional: "Bogotá", vacanciaColectiva: false });
    expect(r.map((p) => p.inicio)).toEqual(["2026-06-01", "2026-08-03"]);
  });
});

describe("suspensiones sugeridas para un año", () => {
  it("vacancia del 20 de diciembre al 10 de enero y lunes a miércoles santo", () => {
    const r = suspensionesSugeridas(2026);
    expect(r).toContainEqual(expect.objectContaining({ tipo: "vacancia_colectiva", fechaInicio: "2026-12-20", fechaFin: "2027-01-10" }));
    expect(r).toContainEqual(expect.objectContaining({ tipo: "semana_santa", fechaInicio: "2026-03-30", fechaFin: "2026-04-01" }));
  });
});
