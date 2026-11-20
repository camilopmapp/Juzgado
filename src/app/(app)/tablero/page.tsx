import type { Metadata } from "next";
import Link from "next/link";
import { AvisoCalendario } from "@/components/app/aviso-calendario";
import { DiasRestantes, IndicadorSemaforo } from "@/components/semaforo";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ColorSemaforo } from "@/domain/terminos/semaforo";
import { formatearRadicado } from "@/domain/radicado";
import { requerirDespacho } from "@/features/despachos/contexto";
import { COLORES } from "@/features/terminos/catalogos";
import { terminosConSemaforo } from "@/features/terminos/queries";
import { formatearFecha, formatearHora } from "@/lib/formato";
import { crearClienteServidor } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Tablero de términos" };

const RESUMEN: ColorSemaforo[] = ["vencido", "rojo", "amarillo", "verde", "suspendido"];

export default async function PaginaTablero({ searchParams }: PageProps<"/tablero">) {
  const { activa } = await requerirDespacho();
  const { color } = await searchParams;
  const supabase = await crearClienteServidor();
  const { hoy, terminos, aniosFaltantes } = await terminosConSemaforo(supabase, activa.despacho, { activos: true });

  const filtro = RESUMEN.find((c) => c === color);
  const visibles = filtro ? terminos.filter((t) => t.semaforo.color === filtro) : terminos;
  const pendientesValidacion = terminos.some((t) => t.tipo?.estado_validacion === "pendiente_validacion");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tablero de términos</h1>
          <p className="text-sm text-muted-foreground">
            {activa.despacho.nombre} · hoy {formatearFecha(hoy)} · amarillo desde {activa.despacho.umbral_amarillo_pct} %, rojo
            desde {activa.despacho.umbral_rojo_pct} % del término
          </p>
        </div>
        <Link href="/procesos" className={buttonVariants({ variant: "outline" })}>
          Registrar un término
        </Link>
      </div>

      <AvisoCalendario anios={aniosFaltantes} />

      <nav aria-label="Filtrar por estado" className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {RESUMEN.map((c) => {
          const total = terminos.filter((t) => t.semaforo.color === c).length;
          const activo = filtro === c;
          return (
            <Link
              key={c}
              href={activo ? "/tablero" : `/tablero?color=${c}`}
              aria-current={activo ? "true" : undefined}
              className={cn(
                "rounded-xl border bg-background p-4 transition-shadow hover:shadow-sm",
                activo && "ring-2 ring-primary",
              )}
            >
              <IndicadorSemaforo color={c} />
              <p className="mt-2 text-3xl font-semibold tabular-nums">{total}</p>
            </Link>
          );
        })}
      </nav>

      <Card>
        <CardHeader>
          <CardTitle>{filtro ? `Términos: ${COLORES[filtro].etiqueta.toLowerCase()}` : "Términos activos"}</CardTitle>
          <CardDescription>
            {visibles.length} {visibles.length === 1 ? "término" : "términos"}
            {pendientesValidacion && " · algunos tipos de término están pendientes de validación jurídica"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {visibles.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {terminos.length === 0 ? "No hay términos activos. Regístrelos desde la ficha de cada proceso." : "No hay términos en este estado."}
            </p>
          ) : (
            <ul className="divide-y">
              {visibles.map((t) => (
                <li key={t.id} className="grid gap-2 py-3 md:grid-cols-[7rem_1fr_9rem_10rem] md:items-center md:gap-4">
                  <IndicadorSemaforo color={t.semaforo.color} className="w-fit" />
                  <div className="min-w-0">
                    <Link href={`/procesos/${t.proceso_id}`} className="font-medium underline-offset-4 hover:underline">
                      {t.tipo?.nombre ?? t.tipo_codigo}
                    </Link>
                    <p className="truncate text-sm text-muted-foreground">
                      <span className="font-mono">{t.proceso ? formatearRadicado(t.proceso.radicado) : ""}</span>
                      {t.proceso && ` · ${t.proceso.clase}`}
                      {t.proceso?.reservado && " · reservado"}
                    </p>
                    {t.tipo?.estado_validacion === "pendiente_validacion" && (
                      <Badge variant="outline" className="mt-1 text-xs">
                        Pendiente de validación jurídica
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground md:hidden">Vence: </span>
                    {t.fecha_vencimiento ? (
                      <>
                        {formatearFecha(t.fecha_vencimiento)} {formatearHora(t.hora_vencimiento)}
                      </>
                    ) : (
                      "Suspendido"
                    )}
                  </div>
                  <div className="text-sm">
                    <DiasRestantes dias={t.semaforo.diasRestantes} habiles={t.unidad === "dias_habiles"} />
                    {t.semaforo.porcentaje !== null && (
                      <div
                        className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted"
                        role="progressbar"
                        aria-valuenow={t.semaforo.porcentaje}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label="Porcentaje del término transcurrido"
                      >
                        <div className={cn("h-full", COLORES[t.semaforo.color].barra)} style={{ width: `${t.semaforo.porcentaje}%` }} />
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
