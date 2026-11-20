import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatearRadicado } from "@/domain/radicado";
import { ESPECIALIDADES } from "@/features/despachos/catalogos";
import { requerirDespacho } from "@/features/despachos/contexto";
import { listarProcesos } from "@/features/procesos/queries";
import { crearClienteServidor } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Procesos" };

export default async function PaginaProcesos({ searchParams }: PageProps<"/procesos">) {
  const { activa } = await requerirDespacho();
  const { q } = await searchParams;
  const busqueda = typeof q === "string" ? q : "";
  const supabase = await crearClienteServidor();
  const procesos = await listarProcesos(supabase, activa.despacho.id, busqueda);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Procesos</h1>
          <p className="text-sm text-muted-foreground">Los procesos reservados solo aparecen a quien tiene acceso.</p>
        </div>
        <Link href="/procesos/nuevo" className={buttonVariants()}>
          Nuevo proceso
        </Link>
      </div>

      <form role="search" className="flex max-w-md gap-2">
        <label htmlFor="q" className="sr-only">
          Buscar por radicado o clase
        </label>
        <Input id="q" name="q" defaultValue={busqueda} placeholder="Radicado o clase de proceso" />
        <Button type="submit" variant="outline">
          Buscar
        </Button>
      </form>

      <Card>
        <CardContent>
          {procesos.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {busqueda ? "No hay procesos que coincidan." : "Aún no hay procesos registrados."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Radicado</TableHead>
                    <TableHead>Clase</TableHead>
                    <TableHead className="hidden sm:table-cell">Especialidad</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {procesos.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono">
                        <Link href={`/procesos/${p.id}`} className="underline-offset-4 hover:underline">
                          {formatearRadicado(p.radicado)}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {p.clase}
                        {p.reservado && (
                          <Badge variant="outline" className="ml-2">
                            Reservado
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{ESPECIALIDADES[p.especialidad]}</TableCell>
                      <TableCell className="capitalize">{p.estado}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {procesos.length === 100 && (
            <p className="pt-3 text-xs text-muted-foreground">Se muestran los 100 más recientes. Use la búsqueda para encontrar otros.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
