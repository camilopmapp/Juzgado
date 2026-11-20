import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requerirDespacho } from "@/features/despachos/contexto";
import { miembrosDelDespacho } from "@/features/procesos/queries";
import { crearClienteServidor } from "@/lib/supabase/server";
import { FormularioProceso } from "./formulario-proceso";

export const metadata: Metadata = { title: "Nuevo proceso" };

export default async function PaginaNuevoProceso() {
  const { activa } = await requerirDespacho();
  const puedeAsignar = activa.rol !== "sustanciador";
  const miembros = puedeAsignar ? await miembrosDelDespacho(await crearClienteServidor(), activa.despacho.id) : [];
  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Nuevo proceso</CardTitle>
        <CardDescription>Use datos ficticios mientras dure el piloto.</CardDescription>
      </CardHeader>
      <CardContent>
        <FormularioProceso
          especialidad={activa.despacho.especialidad}
          puedeAsignar={puedeAsignar}
          miembros={miembros
            .filter((m) => m.activo)
            .map((m) => ({ id: m.usuario_id, nombre: m.usuario?.nombre_completo || m.usuario?.correo || "Sin nombre" }))}
        />
      </CardContent>
    </Card>
  );
}
