"use client";

import { useActionState, useState } from "react";
import { BotonEnviar, ErrorCampo, MensajeFormulario, propsCampo } from "@/components/formulario";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { crearTermino } from "@/features/terminos/actions";
import { UNIDADES } from "@/features/terminos/catalogos";
import { ESTADO_INICIAL } from "@/lib/formularios";
import type { UnidadTermino } from "@/domain/terminos/calcular-vencimiento";

export interface TipoDisponible {
  codigo: string;
  nombre: string;
  unidad: UnidadTermino;
  cantidad: number;
  norma: string;
  descripcion: string | null;
  validado: boolean;
}

export function FormularioTermino({ procesoId, tipos }: { procesoId: string; tipos: TipoDisponible[] }) {
  const [estado, accion] = useActionState(crearTermino, ESTADO_INICIAL);
  const [codigo, setCodigo] = useState(estado.valores?.tipo_codigo ?? "");
  const tipo = tipos.find((t) => t.codigo === codigo);

  return (
    <form action={accion} noValidate>
      <FieldGroup>
        <MensajeFormulario estado={estado} />
        <input type="hidden" name="proceso_id" value={procesoId} />
        <Field>
          <FieldLabel htmlFor="tipo_codigo">Tipo de término</FieldLabel>
          <NativeSelect
            className="w-full"
            {...propsCampo(estado, "tipo_codigo")}
            defaultValue={undefined}
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            required
          >
            <NativeSelectOption value="" disabled>
              Elija uno
            </NativeSelectOption>
            {tipos.map((t) => (
              <NativeSelectOption key={t.codigo} value={t.codigo}>
                {t.nombre} ({t.cantidad} {UNIDADES[t.unidad]})
              </NativeSelectOption>
            ))}
          </NativeSelect>
          {tipo && (
            <FieldDescription>
              {tipo.norma}. {tipo.descripcion}
              {!tipo.validado && <strong className="block text-amber-800">Pendiente de validación jurídica.</strong>}
            </FieldDescription>
          )}
          <ErrorCampo estado={estado} campo="tipo_codigo" id="tipo_codigo-error" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field>
            <FieldLabel htmlFor="fecha_evento">Fecha del evento</FieldLabel>
            <Input type="date" required {...propsCampo(estado, "fecha_evento")} />
            <FieldDescription>Notificación, reparto o presentación que inicia el término.</FieldDescription>
            <ErrorCampo estado={estado} campo="fecha_evento" id="fecha_evento-error" />
          </Field>
          {tipo?.unidad === "horas" && (
            <Field>
              <FieldLabel htmlFor="hora_evento">Hora del evento</FieldLabel>
              <Input type="time" required {...propsCampo(estado, "hora_evento")} />
              <ErrorCampo estado={estado} campo="hora_evento" id="hora_evento-error" />
            </Field>
          )}
          <Field>
            <FieldLabel htmlFor="cantidad">Cantidad (opcional)</FieldLabel>
            <Input type="number" min={1} inputMode="numeric" placeholder={tipo ? String(tipo.cantidad) : ""} {...propsCampo(estado, "cantidad")} />
            <FieldDescription>Solo si la providencia fijó un término distinto.</FieldDescription>
            <ErrorCampo estado={estado} campo="cantidad" id="cantidad-error" />
          </Field>
        </div>
        <Field>
          <FieldLabel htmlFor="observaciones">Observaciones</FieldLabel>
          <Input {...propsCampo(estado, "observaciones")} />
        </Field>
        <BotonEnviar className="w-fit">Registrar término</BotonEnviar>
      </FieldGroup>
    </form>
  );
}
