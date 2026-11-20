import { z } from "zod";
import { normalizarRadicado, parsearRadicado } from "@/domain/radicado";
import { LISTA_ESPECIALIDADES } from "@/features/despachos/catalogos";
import { casilla, fechaOpcional, texto, textoOpcional } from "@/lib/formularios";

const asignado = z.preprocess((v) => (v === "" ? undefined : v), z.uuid().optional());

export const esquemaNuevoProceso = z.object({
  radicado: z
    .string()
    .transform(normalizarRadicado)
    .refine((r) => parsearRadicado(r) !== null, "El radicado debe tener 23 dígitos válidos"),
  clase: texto(2, 100, "La clase de proceso"),
  especialidad: z.enum(LISTA_ESPECIALIDADES, { message: "Elija una especialidad" }),
  instancia: z.enum(["primera", "segunda", "unica"], { message: "Elija la instancia" }),
  fecha_reparto: fechaOpcional("Fecha de reparto"),
  reservado: casilla,
  asignado_a: asignado,
  observaciones: textoOpcional(2000),
});

export const esquemaActualizarProceso = z.object({
  proceso_id: z.uuid(),
  estado: z.enum(["activo", "terminado", "archivado"]),
  reservado: casilla,
  asignado_a: asignado,
  observaciones: textoOpcional(2000),
});
