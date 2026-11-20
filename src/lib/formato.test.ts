import { describe, expect, it } from "vitest";
import { formatearFecha, formatearHora } from "./formato";

describe("formato", () => {
  it("muestra fechas sin correrse por zona horaria", () => {
    expect(formatearFecha("2026-01-01")).toBe("1 ene 2026");
    expect(formatearFecha("2026-12-31T23:00:00Z")).toBe("31 dic 2026");
    expect(formatearFecha(null)).toBe("—");
  });

  it("recorta la hora a HH:MM", () => {
    expect(formatearHora("10:30:00")).toBe("10:30");
  });
});
