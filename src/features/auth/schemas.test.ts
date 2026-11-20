import { describe, expect, it } from "vitest";
import { esquemaNuevaContrasena, rutaSegura } from "./schemas";

describe("rutaSegura", () => {
  it.each([
    [undefined, "/tablero"],
    ["/procesos/1", "/procesos/1"],
    ["https://malicioso.com", "/tablero"],
    ["//malicioso.com", "/tablero"],
    ["/\\malicioso.com", "/tablero"],
    ["tablero", "/tablero"],
  ])("%s → %s", (entrada, esperado) => {
    expect(rutaSegura(entrada)).toBe(esperado);
  });
});

describe("nueva contraseña", () => {
  it("exige 12 caracteres y que coincidan", () => {
    expect(esquemaNuevaContrasena.safeParse({ contrasena: "corta", confirmacion: "corta" }).success).toBe(false);
    expect(esquemaNuevaContrasena.safeParse({ contrasena: "una-clave-larga", confirmacion: "otra-clave-larga" }).success).toBe(false);
    expect(esquemaNuevaContrasena.safeParse({ contrasena: "una-clave-larga", confirmacion: "una-clave-larga" }).success).toBe(true);
  });
});
