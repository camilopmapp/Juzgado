import { z } from "zod";

export const esquemaLogin = z.object({
  correo: z.email({ message: "Escriba un correo válido" }),
  contrasena: z.string().min(1, "Escriba su contraseña"),
  siguiente: z.string().optional(),
});

export const esquemaRecuperar = z.object({
  correo: z.email({ message: "Escriba un correo válido" }),
});

export const esquemaNuevaContrasena = z
  .object({
    nombre: z.string().trim().max(200).optional(),
    contrasena: z.string().min(12, "Use al menos 12 caracteres").max(72, "Máximo 72 caracteres"),
    confirmacion: z.string(),
  })
  .refine((d) => d.contrasena === d.confirmacion, {
    message: "Las contraseñas no coinciden",
    path: ["confirmacion"],
  });

/** Solo permite redirigir a rutas internas (evita redirecciones abiertas). */
export function rutaSegura(siguiente: string | null | undefined, porDefecto = "/tablero"): string {
  if (!siguiente) return porDefecto;
  if (!siguiente.startsWith("/") || siguiente.startsWith("//") || siguiente.includes("\\")) return porDefecto;
  return siguiente;
}
