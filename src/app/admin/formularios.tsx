"use client";

import { useActionState } from "react";
import { BotonEnviar, ErrorCampo, MensajeFormulario, propsCampo } from "@/components/formulario";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import {
  cambiarValidacionTermino,
  cargarCalendarioAnual,
  eliminarSuspensionGeneral,
  invitarJuez,
  registrarSuspensionGeneral,
  verificarDespacho,
} from "@/features/admin/actions";
import { type EstadoFormulario, ESTADO_INICIAL } from "@/lib/formularios";

function Resultado({ estado }: { estado: EstadoFormulario }) {
  if (!estado.mensaje) return null;
  return (
    <span role="status" className={estado.ok ? "text-sm text-emerald-700" : "text-sm text-destructive"}>
      {estado.mensaje}
    </span>
  );
}

export function BotonVerificar({ despachoId }: { despachoId: string }) {
  const [estado, accion] = useActionState(verificarDespacho, ESTADO_INICIAL);
  return (
    <form action={accion} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="despacho_id" value={despachoId} />
      <BotonEnviar size="sm">Verificar</BotonEnviar>
      <Resultado estado={estado} />
    </form>
  );
}

export function FormularioCalendario({ anioSugerido }: { anioSugerido: number }) {
  const [estado, accion] = useActionState(cargarCalendarioAnual, ESTADO_INICIAL);
  return (
    <form action={accion} noValidate className="flex flex-col gap-3">
      <MensajeFormulario estado={estado} />
      <div className="flex flex-wrap items-end gap-2">
        <Field className="w-32">
          <FieldLabel htmlFor="anio">Año</FieldLabel>
          <Input type="number" min={1984} max={2100} {...propsCampo(estado, "anio")} defaultValue={estado.valores?.anio ?? String(anioSugerido)} />
        </Field>
        <BotonEnviar>Cargar festivos y vacancias</BotonEnviar>
      </div>
      <ErrorCampo estado={estado} campo="anio" />
    </form>
  );
}

export function FormularioSuspensionGeneral() {
  const [estado, accion] = useActionState(registrarSuspensionGeneral, ESTADO_INICIAL);
  return (
    <form action={accion} noValidate>
      <FieldGroup className="gap-3">
        <MensajeFormulario estado={estado} />
        <div className="grid gap-3 sm:grid-cols-3">
          <Field>
            <FieldLabel htmlFor="tipo">Tipo</FieldLabel>
            <NativeSelect className="w-full" {...propsCampo(estado, "tipo")} defaultValue={estado.valores?.tipo ?? "acuerdo_csj"}>
              <NativeSelectOption value="acuerdo_csj">Acuerdo del CSJ</NativeSelectOption>
              <NativeSelectOption value="vacancia_colectiva">Vacancia colectiva</NativeSelectOption>
              <NativeSelectOption value="semana_santa">Semana Santa</NativeSelectOption>
              <NativeSelectOption value="otro">Otro</NativeSelectOption>
            </NativeSelect>
          </Field>
          <Field>
            <FieldLabel htmlFor="alcance">Alcance</FieldLabel>
            <NativeSelect className="w-full" {...propsCampo(estado, "alcance")} defaultValue={estado.valores?.alcance ?? "nacional"}>
              <NativeSelectOption value="nacional">Nacional</NativeSelectOption>
              <NativeSelectOption value="seccional">Seccional</NativeSelectOption>
            </NativeSelect>
          </Field>
          <Field>
            <FieldLabel htmlFor="seccional">Seccional (si aplica)</FieldLabel>
            <Input {...propsCampo(estado, "seccional")} />
            <ErrorCampo estado={estado} campo="seccional" id="seccional-error" />
          </Field>
          <Field>
            <FieldLabel htmlFor="fecha_inicio">Desde</FieldLabel>
            <Input type="date" {...propsCampo(estado, "fecha_inicio")} />
            <ErrorCampo estado={estado} campo="fecha_inicio" id="fecha_inicio-error" />
          </Field>
          <Field>
            <FieldLabel htmlFor="fecha_fin">Hasta (inclusive)</FieldLabel>
            <Input type="date" {...propsCampo(estado, "fecha_fin")} />
            <ErrorCampo estado={estado} campo="fecha_fin" id="fecha_fin-error" />
          </Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="motivo">Motivo</FieldLabel>
            <Input {...propsCampo(estado, "motivo")} />
            <ErrorCampo estado={estado} campo="motivo" id="motivo-error" />
          </Field>
          <Field>
            <FieldLabel htmlFor="soporte">Soporte</FieldLabel>
            <Input placeholder="Acuerdo PCSJA…" {...propsCampo(estado, "soporte")} />
            <ErrorCampo estado={estado} campo="soporte" id="soporte-error" />
          </Field>
        </div>
        <BotonEnviar size="sm" className="w-fit">
          Registrar suspensión
        </BotonEnviar>
      </FieldGroup>
    </form>
  );
}

export function BotonEliminarSuspensionGeneral({ suspensionId }: { suspensionId: string }) {
  const [estado, accion] = useActionState(eliminarSuspensionGeneral, ESTADO_INICIAL);
  return (
    <form action={accion} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="suspension_id" value={suspensionId} />
      <BotonEnviar size="sm" variant="ghost">
        Eliminar
      </BotonEnviar>
      <Resultado estado={estado} />
    </form>
  );
}

export function BotonValidacion({ codigo, validado }: { codigo: string; validado: boolean }) {
  const [estado, accion] = useActionState(cambiarValidacionTermino, ESTADO_INICIAL);
  return (
    <form action={accion} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="codigo" value={codigo} />
      <input type="hidden" name="estado" value={validado ? "pendiente_validacion" : "validado"} />
      <BotonEnviar size="sm" variant={validado ? "ghost" : "outline"}>
        {validado ? "Devolver a pendiente" : "Marcar validado"}
      </BotonEnviar>
      <Resultado estado={estado} />
    </form>
  );
}

export function FormularioInvitarJuez() {
  const [estado, accion] = useActionState(invitarJuez, ESTADO_INICIAL);
  return (
    <form action={accion} noValidate className="flex flex-col gap-3">
      <MensajeFormulario estado={estado} />
      <div className="flex flex-wrap items-end gap-2">
        <Field className="max-w-sm">
          <FieldLabel htmlFor="correo">Correo del juez</FieldLabel>
          <Input type="email" {...propsCampo(estado, "correo")} />
        </Field>
        <BotonEnviar>Enviar invitación</BotonEnviar>
      </div>
      <ErrorCampo estado={estado} campo="correo" />
    </form>
  );
}
