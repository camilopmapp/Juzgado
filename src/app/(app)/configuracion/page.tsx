import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ESPECIALIDADES, ROLES } from "@/features/despachos/catalogos";
import { requerirDespacho } from "@/features/despachos/contexto";
import { miembrosDelDespacho } from "@/features/procesos/queries";
import { formatearFecha } from "@/lib/formato";
import { crearClienteServidor } from "@/lib/supabase/server";
import {
  BotonEliminarSuspension,
  FormularioConfiguracion,
  FormularioInvitacion,
  FormularioMiembro,
  FormularioSuspensionLocal,
} from "./formularios";

export const metadata: Metadata = { title: "Configuración" };

export default async function PaginaConfiguracion() {
  const { activa, usuario } = await requerirDespacho();
  const d = activa.despacho;
  const esJuez = activa.rol === "juez";
  const puedeSuspender = activa.rol !== "sustanciador";
  const supabase = await crearClienteServidor();
  const [miembros, { data: suspensiones }] = await Promise.all([
    miembrosDelDespacho(supabase, d.id),
    supabase
      .from("suspensiones_terminos")
      .select("id, tipo, fecha_inicio, fecha_fin, motivo, soporte")
      .eq("alcance", "despacho")
      .eq("despacho_id", d.id)
      .order("fecha_inicio", { ascending: false }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Configuración</h1>

      <Card>
        <CardHeader>
          <CardTitle>Despacho</CardTitle>
          <CardDescription>
            Código <span className="font-mono">{d.codigo}</span> · verificado el {formatearFecha(d.verificado_en)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {esJuez ? (
            <FormularioConfiguracion despacho={d} />
          ) : (
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
              <dt className="text-muted-foreground">Nombre</dt>
              <dd>{d.nombre}</dd>
              <dt className="text-muted-foreground">Especialidad</dt>
              <dd>{ESPECIALIDADES[d.especialidad]}</dd>
              <dt className="text-muted-foreground">Seccional</dt>
              <dd>{d.seccional}</dd>
              <dt className="text-muted-foreground">Vacancia colectiva</dt>
              <dd>{d.vacancia_colectiva ? "Sí" : "No"}</dd>
              <dt className="text-muted-foreground">Semáforo</dt>
              <dd>
                Amarillo desde {d.umbral_amarillo_pct} %, rojo desde {d.umbral_rojo_pct} %
              </dd>
            </dl>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Equipo</CardTitle>
          <CardDescription>
            {esJuez ? "Invite a su equipo por correo. Recibirán un enlace para crear su contraseña." : "Solo el juez administra el equipo."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {esJuez && <FormularioInvitacion />}
          <ul className="divide-y">
            {miembros.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <p className="font-medium">
                    {m.usuario?.nombre_completo || m.usuario?.correo}
                    {m.usuario_id === usuario.id && <span className="text-muted-foreground"> (usted)</span>}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {m.usuario?.correo} · {ROLES[m.rol]}
                    {!m.activo && (
                      <Badge variant="outline" className="ml-2">
                        Inactivo
                      </Badge>
                    )}
                  </p>
                </div>
                {esJuez && <FormularioMiembro membresiaId={m.id} rol={m.rol} activo={m.activo} />}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cierres del despacho</CardTitle>
          <CardDescription>
            Días en que no corren términos solo en este despacho. Los festivos, la vacancia y los acuerdos generales los carga el
            administrador.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {puedeSuspender && <FormularioSuspensionLocal />}
          {(suspensiones ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay cierres registrados.</p>
          ) : (
            <ul className="divide-y text-sm">
              {(suspensiones ?? []).map((s) => (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span>
                    {formatearFecha(s.fecha_inicio)} – {formatearFecha(s.fecha_fin)} · {s.motivo}{" "}
                    <span className="text-muted-foreground">({s.soporte})</span>
                  </span>
                  {puedeSuspender && <BotonEliminarSuspension suspensionId={s.id} />}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
