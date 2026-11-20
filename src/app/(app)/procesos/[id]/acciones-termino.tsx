"use client";

import { useActionState, useState } from "react";
import { BotonEnviar, ErrorCampo, MensajeFormulario, propsCampo } from "@/components/formulario";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { cambiarEstadoTermino, cerrarNovedad, registrarNovedad } from "@/features/terminos/actions";
import { NOVEDADES, UNIDADES } from "@/features/terminos/catalogos";
import { ESTADO_INICIAL } from "@/lib/formularios";

export function FormularioNovedad({ terminoId }: { terminoId: string }) {
  const [estado, accion] = useActionState(registrarNovedad, ESTADO_INICIAL);
  const [tipo, setTipo] = useState(estado.valores?.tipo ?? "suspension");
  const p = (campo: string) => ({ ...propsCampo(estado, campo), id: `${campo}-${terminoId}` });
  return (
    <form action={accion} noValidate>
      <FieldGroup className="gap-3">
        <MensajeFormulario estado={estado} />
        <input type="hidden" name="termino_id" value={terminoId} />
        <div className="grid gap-3 sm:grid-cols-3">
          <Field>
            <FieldLabel htmlFor={`tipo-${terminoId}`}>Novedad</FieldLabel>
            <NativeSelect className="w-full" {...p("tipo")} defaultValue={undefined} value={tipo} onChange={(e) => setTipo(e.target.value)}>
              {Object.entries(NOVEDADES).map(([v, e]) => (
                <NativeSelectOption key={v} value={v}>
                  {e}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>
          <Field>
            <FieldLabel htmlFor={`fecha_inicio-${terminoId}`}>Desde</FieldLabel>
            <Input type="date" required {...p("fecha_inicio")} />
            <ErrorCampo estado={estado} campo="fecha_inicio" />
          </Field>
          {tipo === "prorroga" ? (
            <Field>
              <FieldLabel htmlFor={`cantidad-${terminoId}`}>Prórroga</FieldLabel>
              <div className="flex gap-2">
                <Input type="number" min={1} className="w-20" {...p("cantidad")} />
                <NativeSelect {...p("unidad")} defaultValue={estado.valores?.unidad ?? "meses"} aria-label="Unidad">
                  {Object.entries(UNIDADES).map(([v, e]) => (
                    <NativeSelectOption key={v} value={v}>
                      {e}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
              <ErrorCampo estado={estado} campo="cantidad" />
            </Field>
          ) : (
            <Field>
              <FieldLabel htmlFor={`fecha_fin-${terminoId}`}>Hasta (vacío si sigue)</FieldLabel>
              <Input type="date" {...p("fecha_fin")} />
              <ErrorCampo estado={estado} campo="fecha_fin" />
            </Field>
          )}
        </div>
        <Field>
          <FieldLabel htmlFor={`soporte-${terminoId}`}>Soporte</FieldLabel>
          <Input placeholder="Auto del 17-nov-2026 que decreta la suspensión" required {...p("soporte")} />
          <ErrorCampo estado={estado} campo="soporte" />
        </Field>
        <BotonEnviar size="sm" variant="outline" className="w-fit">
          Registrar novedad
        </BotonEnviar>
      </FieldGroup>
    </form>
  );
}

export function FormularioCerrarNovedad({ terminoId, novedadId }: { terminoId: string; novedadId: string }) {
  const [estado, accion] = useActionState(cerrarNovedad, ESTADO_INICIAL);
  return (
    <form action={accion} noValidate className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="termino_id" value={terminoId} />
      <input type="hidden" name="novedad_id" value={novedadId} />
      <Field className="w-auto">
        <FieldLabel htmlFor={`fin-${novedadId}`}>Reanudar: último día suspendido</FieldLabel>
        <Input type="date" id={`fin-${novedadId}`} name="fecha_fin" required />
      </Field>
      <BotonEnviar size="sm" variant="outline">
        Reanudar
      </BotonEnviar>
      <div className="w-full">
        <MensajeFormulario estado={estado} />
        <ErrorCampo estado={estado} campo="fecha_fin" />
      </div>
    </form>
  );
}

export function AccionesEstado({
  terminoId,
  estado: estadoTermino,
  puedeCancelar,
}: {
  terminoId: string;
  estado: string;
  puedeCancelar: boolean;
}) {
  const [estado, accion, pendiente] = useActionState(cambiarEstadoTermino, ESTADO_INICIAL);
  const cerrado = estadoTermino === "cumplido" || estadoTermino === "cancelado";
  return (
    <form action={accion} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="termino_id" value={terminoId} />
      {cerrado ? (
        <BotonEnviar size="sm" variant="outline" name="accion" value="reabrir" pendiente={pendiente}>
          Reabrir
        </BotonEnviar>
      ) : (
        <>
          <Field className="w-auto">
            <FieldLabel htmlFor={`fecha-${terminoId}`}>Fecha de cumplimiento</FieldLabel>
            <Input type="date" id={`fecha-${terminoId}`} name="fecha" />
          </Field>
          <BotonEnviar size="sm" name="accion" value="cumplir" pendiente={pendiente}>
            Marcar cumplido
          </BotonEnviar>
          {puedeCancelar && (
            <BotonEnviar size="sm" variant="destructive" name="accion" value="cancelar" pendiente={pendiente}>
              Cancelar término
            </BotonEnviar>
          )}
        </>
      )}
      <div className="w-full">
        <MensajeFormulario estado={estado} />
      </div>
    </form>
  );
}
