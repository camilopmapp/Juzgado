import { z } from "zod";
import { LISTA_ROLES } from "@/features/despachos/catalogos";

const rol = z.enum(LISTA_ROLES, { message: "Elija un rol" });

export const esquemaInvitacion = z.object({
  correo: z.email({ message: "Escriba un correo válido" }).transform((c) => c.toLowerCase()),
  rol,
});

export const esquemaCambioMiembro = z.object({
  membresia_id: z.uuid(),
  rol,
  activo: z.enum(["true", "false"]).transform((v) => v === "true"),
});
