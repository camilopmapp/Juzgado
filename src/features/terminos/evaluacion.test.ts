import { describe, expect, it } from "vitest";
import { crearCalendario } from "@/domain/calendario/calendario-judicial";
import { festivosColombia } from "@/domain/calendario/festivos-colombia";
import { fecha } from "@/domain/fechas";
import { type DatosTermino, inicioEfectivo, semaforoDe } from "./evaluacion";

const cal = crearCalendario({ festivos: festivosColombia(2026).map((f) => f.fecha), periodosInhabiles: [] });
const umbrales = { amarillo: 50, rojo: 80 };

const tutela: DatosTermino = {
  unidad: "dias_habiles",
  cantidad: 10,
  fecha_evento: "2026-11-13",
  hora_evento: null,
  fecha_vencimiento: "2026-11-30",
  estado: "en_curso",
  novedades: [],
};

describe("semáforo de un término guardado", () => {
  it("mide en días hábiles los términos de días hábiles", () => {
    // Del 13 al 20 de nov: 4 días hábiles de 10 (el 16 es festivo) → 40 %
    const r = semaforoDe(tutela, cal, fecha("2026-11-20"), umbrales);
    expect(r).toEqual({ color: "verde", porcentaje: 40, diasRestantes: 6 });
  });

  it("pasa a amarillo y a rojo según los umbrales del despacho", () => {
    expect(semaforoDe(tutela, cal, fecha("2026-11-23"), umbrales).color).toBe("amarillo");
    expect(semaforoDe(tutela, cal, fecha("2026-11-26"), umbrales).color).toBe("rojo");
    expect(semaforoDe(tutela, cal, fecha("2026-12-01"), umbrales).color).toBe("vencido");
  });

  it("después de una interrupción mide desde su fin", () => {
    const t: DatosTermino = {
      ...tutela,
      fecha_vencimiento: "2026-12-04",
      novedades: [{ tipo: "interrupcion", fecha_inicio: "2026-11-18", fecha_fin: "2026-11-20", cantidad: null, unidad: null }],
    };
    expect(inicioEfectivo(t)).toBe("2026-11-20");
    expect(semaforoDe(t, cal, fecha("2026-11-20"), umbrales).porcentaje).toBe(0);
  });
});
