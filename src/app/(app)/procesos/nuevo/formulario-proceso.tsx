"use client";

import { useActionState } from "react";
import { BotonEnviar, ErrorCampo, MensajeFormulario, propsCampo } from "@/components/formulario";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { ESPECIALIDADES, type Especialidad } from "@/features/despachos/catalogos";
import { crearProceso } from "@/features/procesos/actions";
import { ESTADO_INICIAL } from "@/lib/formularios";

export function FormularioProceso({
  especialidad,
  puedeAsignar,
  miembros,
}: {
  especialidad: Especialidad;
  puedeAsignar: boolean;
  miembros: { id: string; nombre: string }[];
}) {
  const [estado, accion] = useActionState(crearProceso, ESTADO_INICIAL);
  return (
    <form action={accion} noValidate>
      <FieldGroup>
        <MensajeFormulario estado={estado} />
        <Field>
          <FieldLabel htmlFor="radicado">Radicado (23 dígitos)</FieldLabel>
          <Input inputMode="numeric" className="font-mono" placeholder="11001-40-03-001-2026-00123-00" required {...propsCampo(estado, "radicado")} />
          <ErrorCampo estado={estado} campo="radicado" id="radicado-error" />
        </Field>
        <Field>
          <FieldLabel htmlFor="clase">Clase de proceso</FieldLabel>
          <Input placeholder="Tutela, ejecutivo, verbal…" required {...propsCampo(estado, "clase")} />
          <ErrorCampo estado={estado} campo="clase" id="clase-error" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field>
            <FieldLabel htmlFor="especialidad">Especialidad</FieldLabel>
            <NativeSelect className="w-full" {...propsCampo(estado, "especialidad")} defaultValue={estado.valores?.especialidad ?? especialidad}>
              {Object.entries(ESPECIALIDADES).map(([v, e]) => (
                <NativeSelectOption key={v} value={v}>
                  {e}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>
          <Field>
            <FieldLabel htmlFor="instancia">Instancia</FieldLabel>
            <NativeSelect className="w-full" {...propsCampo(estado, "instancia")} defaultValue={estado.valores?.instancia ?? "primera"}>
              <NativeSelectOption value="primera">Primera</NativeSelectOption>
              <NativeSelectOption value="segunda">Segunda</NativeSelectOption>
              <NativeSelectOption value="unica">Única</NativeSelectOption>
            </NativeSelect>
          </Field>
          <Field>
            <FieldLabel htmlFor="fecha_reparto">Fecha de reparto</FieldLabel>
            <Input type="date" {...propsCampo(estado, "fecha_reparto")} />
            <ErrorCampo estado={estado} campo="fecha_reparto" id="fecha_reparto-error" />
          </Field>
        </div>
        <Field orientation="horizontal">
          <Checkbox id="reservado" name="reservado" defaultChecked={estado.valores?.reservado === "on"} />
          <FieldLabel htmlFor="reservado">Proceso con reserva legal</FieldLabel>
        </Field>
        <FieldDescription className="-mt-4">
          Menores de edad, delitos sexuales, familia. Solo lo verán el juez, el secretario y el sustanciador asignado.
        </FieldDescription>
        {puedeAsignar && (
          <Field>
            <FieldLabel htmlFor="asignado_a">Sustanciador asignado</FieldLabel>
            <NativeSelect className="w-full" {...propsCampo(estado, "asignado_a")} defaultValue={estado.valores?.asignado_a ?? ""}>
              <NativeSelectOption value="">Sin asignar</NativeSelectOption>
              {miembros.map((m) => (
                <NativeSelectOption key={m.id} value={m.id}>
                  {m.nombre}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>
        )}
        <Field>
          <FieldLabel htmlFor="observaciones">Observaciones</FieldLabel>
          <Textarea rows={3} {...propsCampo(estado, "observaciones")} />
        </Field>
        <BotonEnviar>Crear proceso</BotonEnviar>
      </FieldGroup>
    </form>
  );
}
