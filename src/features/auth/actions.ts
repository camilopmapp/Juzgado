"use server";

import { redirect } from "next/navigation";
import { type EstadoFormulario, errorDeValidacion, valoresDe } from "@/lib/formularios";
import { urlDelSitio } from "@/lib/env";
import { crearClienteServidor } from "@/lib/supabase/server";
import { esquemaLogin, esquemaNuevaContrasena, esquemaRecuperar, rutaSegura } from "./schemas";
import { requerirUsuario } from "./sesion";

export async function iniciarSesion(_previo: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const datos = esquemaLogin.safeParse(Object.fromEntries(formData));
  if (!datos.success) return errorDeValidacion(datos.error, formData);

  const supabase = await crearClienteServidor();
  const { error } = await supabase.auth.signInWithPassword({
    email: datos.data.correo,
    password: datos.data.contrasena,
  });
  if (error) {
    // Mensaje genérico: no revela si el correo existe.
    return { ok: false, mensaje: "Correo o contraseña incorrectos.", valores: { correo: datos.data.correo } };
  }
  redirect(rutaSegura(datos.data.siguiente));
}

export async function cerrarSesion(): Promise<void> {
  const supabase = await crearClienteServidor();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function solicitarRecuperacion(_previo: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const datos = esquemaRecuperar.safeParse(Object.fromEntries(formData));
  if (!datos.success) return errorDeValidacion(datos.error, formData);

  const supabase = await crearClienteServidor();
  await supabase.auth.resetPasswordForEmail(datos.data.correo, {
    redirectTo: `${urlDelSitio()}/cuenta/contrasena`,
  });
  // Misma respuesta exista o no la cuenta.
  return {
    ok: true,
    mensaje: "Si el correo está registrado, recibirá un enlace para crear una nueva contraseña.",
  };
}

export async function cambiarContrasena(_previo: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const usuario = await requerirUsuario();
  const datos = esquemaNuevaContrasena.safeParse(Object.fromEntries(formData));
  if (!datos.success) return { ...errorDeValidacion(datos.error, formData), valores: { nombre: valoresDe(formData).nombre ?? "" } };

  const supabase = await crearClienteServidor();
  const { error } = await supabase.auth.updateUser({ password: datos.data.contrasena });
  if (error) {
    return { ok: false, mensaje: "No se pudo cambiar la contraseña. Use una distinta a la anterior e intente de nuevo." };
  }
  if (datos.data.nombre) {
    await supabase.from("perfiles").update({ nombre_completo: datos.data.nombre }).eq("id", usuario.id);
  }
  redirect("/tablero");
}
