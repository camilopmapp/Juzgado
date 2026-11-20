import { z } from "zod";

/** Estado que devuelven las Server Actions a los formularios (useActionState). */
export interface EstadoFormulario {
  ok?: boolean;
  mensaje?: string;
  errores?: Record<string, string[] | undefined>;
  /** Valores enviados, para no perderlos si hay errores. */
  valores?: Record<string, string>;
}

export const ESTADO_INICIAL: EstadoFormulario = {};

export function valoresDe(formData: FormData): Record<string, string> {
  const valores: Record<string, string> = {};
  for (const [clave, valor] of formData.entries()) {
    if (typeof valor === "string" && !clave.startsWith("$")) valores[clave] = valor;
  }
  return valores;
}

export function errorDeValidacion(error: z.ZodError, formData: FormData): EstadoFormulario {
  return {
    ok: false,
    mensaje: "Revise los campos marcados.",
    errores: z.flattenError(error).fieldErrors as Record<string, string[]>,
    valores: valoresDe(formData),
  };
}

// ---- Piezas de esquema reutilizables ----

/** Texto obligatorio, sin espacios sobrantes. */
export const texto = (min: number, max: number, campo: string) =>
  z
    .string({ message: `${campo} es obligatorio` })
    .trim()
    .min(min, `${campo}: mínimo ${min} caracteres`)
    .max(max, `${campo}: máximo ${max} caracteres`);

/** Texto opcional: cadena vacía → undefined. */
export const textoOpcional = (max: number) =>
  z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v), z.string().trim().max(max).optional());

/** Casilla de verificación HTML: presente ("on") = true, ausente = false. */
export const casilla = z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean());

/** Fecha 'AAAA-MM-DD' real. */
export const fechaCivil = (campo: string) =>
  z.iso.date({ message: `${campo}: fecha inválida` });

export const fechaOpcional = (campo: string) =>
  z.preprocess((v) => (v === "" ? undefined : v), fechaCivil(campo).optional());

export const enteroOpcional = (min: number, max: number) =>
  z.preprocess(
    (v) => (v === "" || v == null ? undefined : Number(v)),
    z.number().int("Debe ser un número entero").min(min).max(max).optional(),
  );

export const uuid = z.uuid({ message: "Identificador inválido" });
