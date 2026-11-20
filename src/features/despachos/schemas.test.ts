import { describe, expect, it } from "vitest";
import { esquemaConfiguracionDespacho, esquemaNuevoDespacho } from "./schemas";

const valido = {
  nombre: "Juzgado 1 Civil Municipal",
  codigo: "11001-40-03-001",
  departamento: "Bogotá D.C.",
  municipio: "Bogotá",
  seccional: "Bogotá",
  especialidad: "civil",
};

describe("nuevo despacho", () => {
  it("normaliza el código de 12 dígitos", () => {
    const r = esquemaNuevoDespacho.parse(valido);
    expect(r.codigo).toBe("110014003001");
  });

  it("rechaza códigos incompletos y especialidades desconocidas", () => {
    expect(esquemaNuevoDespacho.safeParse({ ...valido, codigo: "1100140030" }).success).toBe(false);
    expect(esquemaNuevoDespacho.safeParse({ ...valido, especialidad: "comercial" }).success).toBe(false);
  });
});

describe("configuración del despacho", () => {
  const base = { ...valido, umbral_amarillo_pct: "50", umbral_rojo_pct: "80" };

  it("convierte la casilla de vacancia", () => {
    expect(esquemaConfiguracionDespacho.parse({ ...base, vacancia_colectiva: "on" }).vacancia_colectiva).toBe(true);
    expect(esquemaConfiguracionDespacho.parse(base).vacancia_colectiva).toBe(false);
  });

  it("exige amarillo menor que rojo", () => {
    expect(esquemaConfiguracionDespacho.safeParse({ ...base, umbral_amarillo_pct: "80" }).success).toBe(false);
  });
});
