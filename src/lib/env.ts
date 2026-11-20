import { z } from "zod";

const publico = z.object({
  url: z.url({ message: "NEXT_PUBLIC_SUPABASE_URL no es una URL válida" }),
  clave: z.string().min(1, "Falta NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
});

/** Variables públicas (se leen al usarse, no al compilar). */
export function envPublico() {
  return publico.parse({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    clave: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
}

/** URL pública del sitio, usada en los enlaces de invitación y recuperación. */
export function urlDelSitio(): string {
  const url = z.url({ message: "Falta SITIO_URL (p. ej. https://copiloto.vercel.app)" }).parse(process.env.SITIO_URL);
  return url.replace(/\/+$/, "");
}
