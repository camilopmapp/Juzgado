import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AvisoCalendario } from "@/components/app/aviso-calendario";
import { DiasRestantes, IndicadorSemaforo } from "@/components/semaforo";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatearRadicado } from "@/domain/radicado";
import { ESPECIALIDADES } from "@/features/despachos/catalogos";
import { requerirDespacho } from "@/features/despachos/contexto";
import { miembrosDelDespacho, obtenerProceso } from "@/features/procesos/queries";
import { NOVEDADES, describirCantidad } from "@/features/terminos/catalogos";
import { terminosConSemaforo } from "@/features/terminos/queries";
import { calcularTermino } from "@/features/terminos/servicio";
import { formatearFecha, formatearHora } from "@/lib/formato";
import { crearClienteServidor } from "@/lib/supabase/server";
import { AccionesEstado, FormularioCerrarNovedad, FormularioNovedad } from "./acciones-termino";
import { FormularioEditarProceso } from "./formulario-editar";
import { FormularioTermino, type TipoDisponible } from "./formulario-termino";

export const metadata: Metadata = { title: "Proceso" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function PaginaProceso({ params }: PageProps<"/procesos/[id]">) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const { activa } = await requerirDespacho();
  const supabase = await crearClienteServidor();

  const proceso = await obtenerProceso(supabase, id, activa.despacho.id);
  if (!proceso) notFound();

  const esDirectivo = activa.rol !== "sustanciador";
  const [{ cal, terminos, aniosFaltantes }, { data: tipos }, miembros] = await Promise.all([
    terminosConSemaforo(supabase, activa.despacho, { procesoId: id }),
    supabase.from("tipos_termino").select("*").eq("activo", true).order("nombre"),
    esDirectivo ? miembrosDelDespacho(supabase, activa.despacho.id) : Promise.resolve([]),
  ]);

  const disponibles: TipoDisponible[] = (tipos ?? [])
    .filter((t) => !t.especialidades || t.especialidades.includes(proceso.especialidad))
    .map((t) => ({
      codigo: t.codigo,
      nombre: t.nombre,
      unidad: t.unidad,
      cantidad: t.cantidad,
      norma: t.norma,
      descripcion: t.descripcion,
      validado: t.estado_validacion === "validado",
    }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm text-muted-foreground">Proceso</p>
        <h1 className="font-mono text-xl font-semibold tracking-tight sm:text-2xl">{formatearRadicado(proceso.radicado)}</h1>
        <div className="mt-2 flex flex-wrap gap-2 text-sm">
          <Badge variant="secondary">{proceso.clase}</Badge>
          <Badge variant="secondary">{ESPECIALIDADES[proceso.especialidad]}</Badge>
          <Badge variant="secondary" className="capitalize">
            {proceso.instancia} instancia
          </Badge>
          <Badge variant="outline" className="capitalize">
            {proceso.estado}
          </Badge>
          {proceso.reservado && <Badge variant="destructive">Reservado</Badge>}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Reparto: {formatearFecha(proceso.fecha_reparto)} · Asignado a:{" "}
          {proceso.asignado?.nombre_completo || proceso.asignado?.correo || "nadie"}
        </p>
      </div>

      <AvisoCalendario anios={aniosFaltantes} />

      <Card>
        <CardHeader>
          <CardTitle>Términos</CardTitle>
          <CardDescription>El vencimiento se calcula con el calendario judicial del despacho.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {terminos.length === 0 && <p className="text-sm text-muted-foreground">Este proceso no tiene términos registrados.</p>}
          {terminos.map((t) => {
            let memoria: string[];
            try {
              memoria = calcularTermino(t, cal).pasos;
            } catch (e) {
              memoria = [`No se pudo recalcular: ${(e as Error).message}`];
            }
            const abiertas = t.novedades.filter((n) => n.tipo !== "prorroga" && !n.fecha_fin);
            return (
              <article key={t.id} className="rounded-lg border p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="font-medium">{t.tipo?.nombre ?? t.tipo_codigo}</h3>
                    <p className="text-sm text-muted-foreground">
                      {describirCantidad(t.cantidad, t.unidad)} desde {formatearFecha(t.fecha_evento)} {formatearHora(t.hora_evento)} ·{" "}
                      {t.tipo?.norma}
                    </p>
                    {t.tipo?.estado_validacion === "pendiente_validacion" && (
                      <Badge variant="outline" className="mt-1 text-xs">
                        Pendiente de validación jurídica
                      </Badge>
                    )}
                  </div>
                  <div className="text-right text-sm">
                    <IndicadorSemaforo color={t.semaforo.color} />
                    <p className="mt-1">
                      {t.estado === "cumplido"
                        ? `Cumplido el ${formatearFecha(t.cumplido_en)}`
                        : t.fecha_vencimiento
                          ? `Vence el ${formatearFecha(t.fecha_vencimiento)} ${formatearHora(t.hora_vencimiento)}`
                          : "Sin vencimiento (suspendido)"}
                    </p>
                    {t.estado === "en_curso" && <DiasRestantes dias={t.semaforo.diasRestantes} habiles={t.unidad === "dias_habiles"} />}
                  </div>
                </div>
                {t.observaciones && <p className="mt-2 text-sm">{t.observaciones}</p>}

                {t.novedades.length > 0 && (
                  <ul className="mt-3 flex flex-col gap-2 text-sm">
                    {t.novedades.map((n) => (
                      <li key={n.id} className="rounded-md bg-muted/50 p-2">
                        <strong>{NOVEDADES[n.tipo]}</strong>{" "}
                        {n.tipo === "prorroga"
                          ? `de ${n.cantidad && n.unidad ? describirCantidad(n.cantidad, n.unidad) : ""} (${formatearFecha(n.fecha_inicio)})`
                          : `del ${formatearFecha(n.fecha_inicio)} al ${n.fecha_fin ? formatearFecha(n.fecha_fin) : "—"}`}{" "}
                        · {n.soporte}
                        {abiertas.some((a) => a.id === n.id) && (
                          <div className="mt-2">
                            <FormularioCerrarNovedad terminoId={t.id} novedadId={n.id} />
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}

                <details className="mt-3 text-sm">
                  <summary className="cursor-pointer text-muted-foreground">Memoria de cálculo</summary>
                  <ol className="mt-2 list-decimal space-y-1 pl-5">
                    {memoria.map((paso, i) => (
                      <li key={i}>{paso}</li>
                    ))}
                  </ol>
                </details>

                <div className="mt-3 flex flex-col gap-3">
                  {(t.estado === "en_curso" || t.estado === "suspendido") && (
                    <details className="text-sm">
                      <summary className="cursor-pointer text-muted-foreground">Registrar suspensión, interrupción o prórroga</summary>
                      <div className="mt-3">
                        <FormularioNovedad terminoId={t.id} />
                      </div>
                    </details>
                  )}
                  <AccionesEstado terminoId={t.id} estado={t.estado} puedeCancelar={esDirectivo} />
                </div>
              </article>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Registrar un término</CardTitle>
        </CardHeader>
        <CardContent>
          {disponibles.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay tipos de término para esta especialidad.</p>
          ) : (
            <FormularioTermino procesoId={proceso.id} tipos={disponibles} />
          )}
        </CardContent>
      </Card>

      {esDirectivo && (
        <Card>
          <CardHeader>
            <CardTitle>Datos del proceso</CardTitle>
            <CardDescription>Solo el juez y el secretario cambian la reserva y la asignación.</CardDescription>
          </CardHeader>
          <CardContent>
            <FormularioEditarProceso
              proceso={proceso}
              miembros={miembros
                .filter((m) => m.activo)
                .map((m) => ({ id: m.usuario_id, nombre: m.usuario?.nombre_completo || m.usuario?.correo || "Sin nombre" }))}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
