import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/marca/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cerrarSesion } from "@/features/auth/actions";
import { ESPECIALIDADES } from "@/features/despachos/catalogos";
import { obtenerContexto } from "@/features/despachos/contexto";

export const metadata: Metadata = { title: "Verificación pendiente" };

export default async function PaginaPendiente() {
  const { activa, esAdmin } = await obtenerContexto();
  if (!activa) redirect(esAdmin ? "/admin" : "/onboarding");
  if (activa.despacho.verificado) redirect("/tablero");
  const d = activa.despacho;
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 px-4 py-10">
      <Logo />
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Verificación pendiente</CardTitle>
          <CardDescription>
            Un administrador está revisando los datos del despacho. Podrá usar el sistema cuando lo verifique.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <dt className="text-muted-foreground">Despacho</dt>
            <dd>{d.nombre}</dd>
            <dt className="text-muted-foreground">Código</dt>
            <dd className="font-mono">{d.codigo}</dd>
            <dt className="text-muted-foreground">Especialidad</dt>
            <dd>{ESPECIALIDADES[d.especialidad]}</dd>
          </dl>
          <div className="flex gap-2">
            {esAdmin && (
              <a href="/admin" className="text-sm underline underline-offset-4">
                Ir a administración
              </a>
            )}
            <form action={cerrarSesion} className="ml-auto">
              <Button variant="outline" type="submit">
                Cerrar sesión
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
