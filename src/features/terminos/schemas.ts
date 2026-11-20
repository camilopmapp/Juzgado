import { z } from "zod";
import { enteroOpcional, fechaCivil, fechaOpcional, texto, textoOpcional, uuid } from "@/lib/formularios";

const hora = z.preprocess(
  (v) => (v === "" ? undefined : v),
  z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Hora inválida (HH:MM)").optional(),
);

export const esquemaNuevoTermino = z.object({
  proceso_id: uuid,
  tipo_codigo: z.string().min(1, "Elija el tipo de término"),
  fecha_evento: fechaCivil("Fecha del evento"),
  hora_evento: hora,
  cantidad: enteroOpcional(1, 3650),
  observaciones: textoOpcional(1000),
});

const unidad = z.enum(["horas", "dias_habiles", "dias_calendario", "meses", "anios"]);

export const esquemaNovedad = z
  .object({
    termino_id: uuid,
    tipo: z.enum(["suspension", "interrupcion", "prorroga"], { message: "Elija el tipo de novedad" }),
    fecha_inicio: fechaCivil("Fecha de inicio"),
    fecha_fin: fechaOpcional("Fecha de fin"),
    cantidad: enteroOpcional(1, 3650),
    unidad: z.preprocess((v) => (v === "" ? undefined : v), unidad.optional()),
    soporte: texto(3, 300, "El soporte (auto que la decreta)"),
  })
  .refine((d) => !d.fecha_fin || d.fecha_fin >= d.fecha_inicio, {
    message: "La fecha de fin no puede ser anterior al inicio",
    path: ["fecha_fin"],
  })
  .refine((d) => d.tipo !== "prorroga" || (d.cantidad !== undefined && d.unidad !== undefined), {
    message: "La prórroga exige cantidad y unidad",
    path: ["cantidad"],
  });

export const esquemaCerrarNovedad = z.object({
  novedad_id: uuid,
  termino_id: uuid,
  fecha_fin: fechaCivil("Fecha de fin"),
});

export const esquemaEstadoTermino = z.object({
  termino_id: uuid,
  accion: z.enum(["cumplir", "cancelar", "reabrir"]),
  fecha: fechaOpcional("Fecha"),
});
