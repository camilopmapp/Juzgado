import type { Metadata } from "next";
import { Logo } from "@/components/marca/logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { obtenerContexto } from "@/features/despachos/contexto";
import { FormularioContrasena } from "./formulario-contrasena";

export const metadata: Metadata = { title: "Contraseña" };

export default async function PaginaContrasena() {
  const { nombre, usuario } = await obtenerContexto();
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 px-4 py-10">
      <Logo />
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Cree su contraseña</CardTitle>
          <CardDescription>Cuenta: {usuario.correo}</CardDescription>
        </CardHeader>
        <CardContent>
          <FormularioContrasena nombre={nombre === usuario.correo ? "" : nombre} />
        </CardContent>
      </Card>
    </main>
  );
}
