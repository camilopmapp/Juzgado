import { z } from "zod";
import { casilla, texto } from "@/lib/formularios";
import { LISTA_ESPECIALIDADES } from "./catalogos";

const especialidad = z.enum(LISTA_ESPECIALIDADES, { message: "Elija una especialidad" });

export const esquemaNuevoDespacho = z.object({
  nombre: texto(3, 200, "El nombre"),
  codigo: z
    .string()
    .transform((v) => v.replace(/[\s.\-]/g, ""))
    .pipe(z.string().regex(/^\d{12}$/, "El código del despacho tiene 12 dígitos")),
  departamento: texto(2, 100, "El departamento"),
  municipio: texto(2, 100, "El municipio"),
  seccional: texto(2, 100, "La seccional"),
  especialidad,
});

const porcentaje = (campo: string) =>
  z.coerce.number({ message: `${campo}: escriba un número` }).int().min(1, `${campo}: mínimo 1`).max(100, `${campo}: máximo 100`);

export const esquemaConfiguracionDespacho = z
  .object({
    nombre: texto(3, 200, "El nombre"),
    departamento: texto(2, 100, "El departamento"),
    municipio: texto(2, 100, "El municipio"),
    seccional: texto(2, 100, "La seccional"),
    especialidad,
    vacancia_colectiva: casilla,
    umbral_amarillo_pct: porcentaje("Umbral amarillo"),
    umbral_rojo_pct: porcentaje("Umbral rojo"),
  })
  .refine((d) => d.umbral_amarillo_pct < d.umbral_rojo_pct, {
    message: "El umbral amarillo debe ser menor que el rojo",
    path: ["umbral_amarillo_pct"],
  });
