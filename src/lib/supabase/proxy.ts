import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { envPublico } from "@/lib/env";
import type { Database } from "@/types/database";

const RUTAS_PUBLICAS = ["/login", "/recuperar", "/auth"];

function esPublica(ruta: string) {
  return RUTAS_PUBLICAS.some((r) => ruta === r || ruta.startsWith(`${r}/`));
}

/** Renueva la sesión de Supabase en cada petición y protege las rutas privadas. */
export async function actualizarSesion(request: NextRequest) {
  let respuesta = NextResponse.next({ request });
  const { url, clave } = envPublico();

  const supabase = createServerClient<Database>(url, clave, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(lista, cabeceras) {
        for (const { name, value } of lista) request.cookies.set(name, value);
        respuesta = NextResponse.next({ request });
        for (const { name, value, options } of lista) respuesta.cookies.set(name, value, options);
        for (const [nombre, valor] of Object.entries(cabeceras ?? {})) respuesta.headers.set(nombre, valor);
      },
    },
  });

  // No poner código entre createServerClient y getClaims: puede cerrar sesiones al azar.
  const { data } = await supabase.auth.getClaims();
  const ruta = request.nextUrl.pathname;

  if (!data?.claims && !esPublica(ruta)) {
    const destino = request.nextUrl.clone();
    destino.pathname = "/login";
    destino.search = ruta === "/" ? "" : `?siguiente=${encodeURIComponent(ruta)}`;
    const redireccion = NextResponse.redirect(destino);
    for (const c of respuesta.cookies.getAll()) redireccion.cookies.set(c);
    return redireccion;
  }
  return respuesta;
}
