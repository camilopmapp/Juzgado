import { describe, expect, it } from "vitest";
import { domingoDePascua, festivosColombia } from "./festivos-colombia";

const fechas = (anio: number) => festivosColombia(anio).map((f) => f.fecha);

describe("domingo de Pascua", () => {
  it.each([
    [2024, "2024-03-31"],
    [2025, "2025-04-20"],
    [2026, "2026-04-05"],
    [2027, "2027-03-28"],
    [2038, "2038-04-25"],
  ])("%i → %s", (anio, esperado) => {
    expect(domingoDePascua(anio)).toBe(esperado);
  });
});

describe("festivos de Colombia (Ley 51 de 1983)", () => {
  it("2026 tiene los 18 festivos trasladados correctamente", () => {
    expect(fechas(2026)).toEqual([
      "2026-01-01", "2026-01-12", "2026-03-23", "2026-04-02", "2026-04-03",
      "2026-05-01", "2026-05-18", "2026-06-08", "2026-06-15", "2026-06-29",
      "2026-07-20", "2026-08-07", "2026-08-17", "2026-10-12", "2026-11-02",
      "2026-11-16", "2026-12-08", "2026-12-25",
    ]);
  });

  it("2025: Sagrado Corazón y San Pedro coinciden el 30 de junio", () => {
    const lista = festivosColombia(2025);
    const junio30 = lista.filter((f) => f.fecha === "2025-06-30");
    expect(junio30).toHaveLength(2);
    expect(new Set(fechas(2025)).size).toBe(17);
    expect(fechas(2025)).toContain("2025-01-06"); // Reyes cae lunes: no se traslada
    expect(fechas(2025)).toContain("2025-06-02"); // Ascensión
  });

  it("todo festivo trasladable cae en lunes", () => {
    for (const anio of [2024, 2025, 2026, 2027, 2028]) {
      for (const f of festivosColombia(anio)) {
        if (f.trasladable) {
          expect(new Date(`${f.fecha}T00:00:00Z`).getUTCDay(), `${f.nombre} ${f.fecha}`).toBe(1);
        }
      }
    }
  });

  it("rechaza años anteriores a la ley", () => {
    expect(() => festivosColombia(1983)).toThrow();
  });
});
