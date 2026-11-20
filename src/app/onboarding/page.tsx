import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/marca/logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { obtenerContexto } from "@/features/despachos/contexto";
import { FormularioDespacho } from "./formulario-despacho";

export const metadata: Metadata = { title: "Registrar despacho" };

export default async function PaginaOnboarding() {
  const { activa, esAdmin } = await obtenerContexto();
  if (activa) redirect(activa.despacho.verificado ? "/tablero" : "/pendiente");
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 px-4 py-10">
      <Logo />
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>Registre su despacho</CardTitle>
          <CardDescription>
            Quedará como juez del despacho. Un administrador verificará los datos antes de activarlo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormularioDespacho />
          {esAdmin && (
            <p className="mt-4 text-sm">
              Es administrador de la plataforma:{" "}
              <a href="/admin" className="underline underline-offset-4">
                ir a Administración
              </a>
              .
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
