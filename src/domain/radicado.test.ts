import { describe, expect, it } from "vitest";
import { formatearRadicado, normalizarRadicado, parsearRadicado } from "./radicado";

describe("radicado de 23 dígitos", () => {
  it("descompone sus partes", () => {
    expect(parsearRadicado("11001400300120260012300")).toEqual({
      codigoMunicipio: "11001",
      entidad: "40",
      especialidad: "03",
      despacho: "001",
      codigoDespacho: "110014003001",
      anio: 2026,
      consecutivo: "00123",
      recurso: "00",
    });
  });

  it("acepta espacios, guiones y puntos al escribirlo", () => {
    expect(normalizarRadicado(" 11001-40-03-001-2026-00123-00 ")).toBe("11001400300120260012300");
    expect(normalizarRadicado("11001 40 03 001 2026 00123 00")).toBe("11001400300120260012300");
  });

  it("lo muestra agrupado", () => {
    expect(formatearRadicado("11001400300120260012300")).toBe("11001-40-03-001-2026-00123-00");
  });

  it.each([
    ["1100140030012026001230", "longitud"],
    ["1100140030012026001230A", "letras"],
    ["11001400300118000012300", "año fuera de rango"],
  ])("rechaza %s (%s)", (valor) => {
    expect(parsearRadicado(valor)).toBeNull();
  });
});
