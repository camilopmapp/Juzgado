import { describe, expect, it } from "vitest";
import { esquemaNuevoProceso } from "./schemas";

const base = { clase: "Ejecutivo singular", especialidad: "civil", instancia: "primera" };

describe("nuevo proceso", () => {
  it("normaliza el radicado escrito con guiones", () => {
    const r = esquemaNuevoProceso.parse({ ...base, radicado: "11001-40-03-001-2026-00123-00" });
    expect(r.radicado).toBe("11001400300120260012300");
    expect(r.reservado).toBe(false);
  });

  it("rechaza radicados inválidos", () => {
    expect(esquemaNuevoProceso.safeParse({ ...base, radicado: "123" }).success).toBe(false);
  });
});
