"use client";

import { useActionState } from "react";
import { BotonEnviar, MensajeFormulario } from "@/components/formulario";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { actualizarProceso } from "@/features/procesos/actions";
import { ESTADO_INICIAL } from "@/lib/formularios";

export function FormularioEditarProceso({
  proceso,
  miembros,
}: {
  proceso: { id: string; estado: string; reservado: boolean; asignado_a: string | null; observaciones: string | null };
  miembros: { id: string; nombre: string }[];
}) {
  const [estado, accion] = useActionState(actualizarProceso, ESTADO_INICIAL);
  return (
    <form action={accion}>
      <FieldGroup className="gap-3">
        <MensajeFormulario estado={estado} />
        <input type="hidden" name="proceso_id" value={proceso.id} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="estado">Estado</FieldLabel>
            <NativeSelect id="estado" name="estado" className="w-full" defaultValue={proceso.estado}>
              <NativeSelectOption value="activo">Activo</NativeSelectOption>
              <NativeSelectOption value="terminado">Terminado</NativeSelectOption>
              <NativeSelectOption value="archivado">Archivado</NativeSelectOption>
            </NativeSelect>
          </Field>
          <Field>
            <FieldLabel htmlFor="asignado_a">Sustanciador asignado</FieldLabel>
            <NativeSelect id="asignado_a" name="asignado_a" className="w-full" defaultValue={proceso.asignado_a ?? ""}>
              <NativeSelectOption value="">Sin asignar</NativeSelectOption>
              {miembros.map((m) => (
                <NativeSelectOption key={m.id} value={m.id}>
                  {m.nombre}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>
        </div>
        <Field orientation="horizontal">
          <Checkbox id="reservado" name="reservado" defaultChecked={proceso.reservado} />
          <FieldLabel htmlFor="reservado">Proceso con reserva legal</FieldLabel>
        </Field>
        <Field>
          <FieldLabel htmlFor="observaciones">Observaciones</FieldLabel>
          <Textarea id="observaciones" name="observaciones" rows={2} defaultValue={proceso.observaciones ?? ""} />
        </Field>
        <BotonEnviar size="sm" className="w-fit">
          Guardar cambios
        </BotonEnviar>
      </FieldGroup>
    </form>
  );
}
