import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { hoyEnColombia } from "@/domain/fechas";
import { ESPECIALIDADES } from "@/features/despachos/catalogos";
import { requerirAdmin } from "@/features/despachos/contexto";
import { UNIDADES } from "@/features/terminos/catalogos";
import { formatearFecha } from "@/lib/formato";
import { crearClienteServidor } from "@/lib/supabase/server";
import {
  BotonEliminarSuspensionGeneral,
  BotonValidacion,
  BotonVerificar,
  FormularioCalendario,
  FormularioSuspensionGeneral,
} from "./formularios";

export const metadata: Metadata = { title: "Administración" };

export default async function PaginaAdmin() {
  await requerirAdmin();
  const supabase = await crearClienteServidor();
  const hoy = hoyEnColombia();
  const anio = Number(hoy.slice(0, 4));

  const [pendientes, festivos, suspensiones, tipos] = await Promise.all([
    supabase
      .from("despachos")
      .select("id, nombre, codigo, seccional, especialidad, creado_en, solicitante:perfiles!despachos_creado_por_fkey(nombre_completo, correo)")
      .eq("verificado", false)
      .order("creado_en"),
    supabase.from("festivos").select("fecha").gte("fecha", `${anio - 1}-01-01`),
    supabase
      .from("suspensiones_terminos")
      .select("id, tipo, alcance, seccional, fecha_inicio, fecha_fin, motivo, soporte")
      .neq("alcance", "despacho")
      .gte("fecha_fin", `${anio - 1}-01-01`)
      .order("fecha_inicio"),
    supabase.from("tipos_termino").select("*").order("nombre"),
  ]);

  const porAnio = new Map<number, number>();
  for (const f of festivos.data ?? []) {
    const a = Number(f.fecha.slice(0, 4));
    porAnio.set(a, (porAnio.get(a) ?? 0) + 1);
  }
  const anios = [anio - 1, anio, anio + 1, anio + 2];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Administración de la plataforma</h1>

      <Card>
        <CardHeader>
          <CardTitle>Despachos pendientes de verificación</CardTitle>
          <CardDescription>Confirme con el Consejo Seccional que el código y el juez corresponden antes de verificar.</CardDescription>
        </CardHeader>
        <CardContent>
          {(pendientes.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay solicitudes pendientes.</p>
          ) : (
            <ul className="divide-y">
              {(pendientes.data ?? []).map((d) => (
                <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="text-sm">
                    <p className="font-medium">{d.nombre}</p>
                    <p className="text-muted-foreground">
                      <span className="font-mono">{d.codigo}</span> · {ESPECIALIDADES[d.especialidad]} · {d.seccional}
                    </p>
                    <p className="text-muted-foreground">
                      Solicitó: {d.solicitante?.nombre_completo || "—"} ({d.solicitante?.correo}) el {formatearFecha(d.creado_en)}
                    </p>
                  </div>
                  <BotonVerificar despachoId={d.id} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Calendario judicial</CardTitle>
          <CardDescription>
            Carga los festivos de la Ley 51 de 1983, la vacancia colectiva (20 dic – 10 ene) y la Semana Santa (lunes a miércoles
            santo). Las vacancias están pendientes de validación jurídica.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {anios.map((a) => (
              <Badge key={a} variant={porAnio.get(a) ? "secondary" : "destructive"}>
                {a}: {porAnio.get(a) ? `${porAnio.get(a)} festivos` : "sin cargar"}
              </Badge>
            ))}
          </div>
          <FormularioCalendario anioSugerido={anios.find((a) => !porAnio.get(a)) ?? anio + 1} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Suspensiones generales de términos</CardTitle>
          <CardDescription>Nacionales o por seccional. Al guardar se recalculan los términos de todos los despachos.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <FormularioSuspensionGeneral />
          <ul className="divide-y text-sm">
            {(suspensiones.data ?? []).map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span>
                  {formatearFecha(s.fecha_inicio)} – {formatearFecha(s.fecha_fin)} · {s.motivo}{" "}
                  <span className="text-muted-foreground">
                    ({s.alcance === "seccional" ? `Seccional ${s.seccional}` : "Nacional"} · {s.soporte})
                  </span>
                </span>
                <BotonEliminarSuspensionGeneral suspensionId={s.id} />
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Catálogo de términos</CardTitle>
          <CardDescription>Marque cada término como validado solo después de la revisión de un jurista.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {(tipos.data ?? []).map((t) => (
              <li key={t.codigo} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <div>
                  <p className="font-medium">
                    {t.nombre}{" "}
                    <Badge variant={t.estado_validacion === "validado" ? "secondary" : "outline"}>
                      {t.estado_validacion === "validado" ? "Validado" : "Pendiente de validación"}
                    </Badge>
                  </p>
                  <p className="text-muted-foreground">
                    {t.cantidad} {UNIDADES[t.unidad]} · {t.norma}
                  </p>
                </div>
                <BotonValidacion codigo={t.codigo} validado={t.estado_validacion === "validado"} />
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
