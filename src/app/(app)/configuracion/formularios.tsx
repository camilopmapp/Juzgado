"use client";

import { useActionState } from "react";
import { BotonEnviar, ErrorCampo, MensajeFormulario, propsCampo } from "@/components/formulario";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { actualizarDespacho, eliminarSuspensionLocal, registrarSuspensionLocal } from "@/features/despachos/actions";
import { ESPECIALIDADES, ROLES } from "@/features/despachos/catalogos";
import { actualizarMiembro, invitarMiembro } from "@/features/equipo/actions";
import { ESTADO_INICIAL } from "@/lib/formularios";

export function FormularioConfiguracion({
  despacho,
}: {
  despacho: {
    nombre: string;
    departamento: string;
    municipio: string;
    seccional: string;
    especialidad: string;
    vacancia_colectiva: boolean;
    umbral_amarillo_pct: number;
    umbral_rojo_pct: number;
  };
}) {
  const [estado, accion] = useActionState(actualizarDespacho, ESTADO_INICIAL);
  const v = (campo: keyof typeof despacho) => estado.valores?.[campo] ?? String(despacho[campo]);
  return (
    <form action={accion} noValidate>
      <FieldGroup>
        <MensajeFormulario estado={estado} />
        <Field>
          <FieldLabel htmlFor="nombre">Nombre</FieldLabel>
          <Input {...propsCampo(estado, "nombre")} defaultValue={v("nombre")} />
          <ErrorCampo estado={estado} campo="nombre" id="nombre-error" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          {(["departamento", "municipio", "seccional"] as const).map((c) => (
            <Field key={c}>
              <FieldLabel htmlFor={c} className="capitalize">
                {c}
              </FieldLabel>
              <Input {...propsCampo(estado, c)} defaultValue={v(c)} />
              <ErrorCampo estado={estado} campo={c} id={`${c}-error`} />
            </Field>
          ))}
        </div>
        <Field>
          <FieldLabel htmlFor="especialidad">Especialidad</FieldLabel>
          <NativeSelect className="w-full" {...propsCampo(estado, "especialidad")} defaultValue={v("especialidad")}>
            {Object.entries(ESPECIALIDADES).map(([valor, etiqueta]) => (
              <NativeSelectOption key={valor} value={valor}>
                {etiqueta}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        <Field orientation="horizontal">
          <Checkbox id="vacancia_colectiva" name="vacancia_colectiva" defaultChecked={despacho.vacancia_colectiva} />
          <FieldLabel htmlFor="vacancia_colectiva">El despacho tiene vacancia judicial colectiva</FieldLabel>
        </Field>
        <FieldDescription className="-mt-4">
          Desmárquelo si el despacho trabaja durante la vacancia (p. ej. control de garantías). Cambia el cálculo de los términos.
        </FieldDescription>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="umbral_amarillo_pct">Amarillo desde (% del término)</FieldLabel>
            <Input type="number" min={1} max={99} {...propsCampo(estado, "umbral_amarillo_pct")} defaultValue={v("umbral_amarillo_pct")} />
            <ErrorCampo estado={estado} campo="umbral_amarillo_pct" id="umbral_amarillo_pct-error" />
          </Field>
          <Field>
            <FieldLabel htmlFor="umbral_rojo_pct">Rojo desde (% del término)</FieldLabel>
            <Input type="number" min={2} max={100} {...propsCampo(estado, "umbral_rojo_pct")} defaultValue={v("umbral_rojo_pct")} />
            <ErrorCampo estado={estado} campo="umbral_rojo_pct" id="umbral_rojo_pct-error" />
          </Field>
        </div>
        <BotonEnviar className="w-fit">Guardar</BotonEnviar>
      </FieldGroup>
    </form>
  );
}

export function FormularioInvitacion() {
  const [estado, accion] = useActionState(invitarMiembro, ESTADO_INICIAL);
  return (
    <form action={accion} noValidate>
      <FieldGroup className="gap-3">
        <MensajeFormulario estado={estado} />
        <div className="grid gap-3 sm:grid-cols-[1fr_12rem_auto] sm:items-end">
          <Field>
            <FieldLabel htmlFor="correo">Correo</FieldLabel>
            <Input type="email" {...propsCampo(estado, "correo")} />
            <ErrorCampo estado={estado} campo="correo" id="correo-error" />
          </Field>
          <Field>
            <FieldLabel htmlFor="rol">Rol</FieldLabel>
            <NativeSelect className="w-full" {...propsCampo(estado, "rol")} defaultValue={estado.valores?.rol ?? "sustanciador"}>
              {Object.entries(ROLES).map(([v, e]) => (
                <NativeSelectOption key={v} value={v}>
                  {e}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>
          <BotonEnviar>Invitar</BotonEnviar>
        </div>
      </FieldGroup>
    </form>
  );
}

export function FormularioMiembro({ membresiaId, rol, activo }: { membresiaId: string; rol: string; activo: boolean }) {
  const [estado, accion] = useActionState(actualizarMiembro, ESTADO_INICIAL);
  return (
    <form action={accion} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="membresia_id" value={membresiaId} />
      <label htmlFor={`rol-${membresiaId}`} className="sr-only">
        Rol
      </label>
      <NativeSelect id={`rol-${membresiaId}`} name="rol" size="sm" defaultValue={rol}>
        {Object.entries(ROLES).map(([v, e]) => (
          <NativeSelectOption key={v} value={v}>
            {e}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      <BotonEnviar size="sm" variant="outline" name="activo" value={String(activo)}>
        Guardar rol
      </BotonEnviar>
      <BotonEnviar size="sm" variant={activo ? "destructive" : "secondary"} name="activo" value={String(!activo)}>
        {activo ? "Desactivar" : "Reactivar"}
      </BotonEnviar>
      {estado.mensaje && <span className={estado.ok ? "text-sm text-emerald-700" : "text-sm text-destructive"} role="status">{estado.mensaje}</span>}
    </form>
  );
}

export function FormularioSuspensionLocal() {
  const [estado, accion] = useActionState(registrarSuspensionLocal, ESTADO_INICIAL);
  return (
    <form action={accion} noValidate>
      <FieldGroup className="gap-3">
        <MensajeFormulario estado={estado} />
        <div className="grid gap-3 sm:grid-cols-3">
          <Field>
            <FieldLabel htmlFor="tipo">Tipo</FieldLabel>
            <NativeSelect className="w-full" {...propsCampo(estado, "tipo")} defaultValue={estado.valores?.tipo ?? "cierre_despacho"}>
              <NativeSelectOption value="cierre_despacho">Cierre del despacho</NativeSelectOption>
              <NativeSelectOption value="otro">Otra suspensión</NativeSelectOption>
            </NativeSelect>
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
            <Input placeholder="Traslado de sede" {...propsCampo(estado, "motivo")} />
            <ErrorCampo estado={estado} campo="motivo" id="motivo-error" />
          </Field>
          <Field>
            <FieldLabel htmlFor="soporte">Soporte</FieldLabel>
            <Input placeholder="Acuerdo o acta que lo ordena" {...propsCampo(estado, "soporte")} />
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

export function BotonEliminarSuspension({ suspensionId }: { suspensionId: string }) {
  const [estado, accion, pendiente] = useActionState(eliminarSuspensionLocal, ESTADO_INICIAL);
  return (
    <form action={accion} className="flex items-center gap-2">
      <input type="hidden" name="suspension_id" value={suspensionId} />
      <Button type="submit" size="sm" variant="ghost" disabled={pendiente}>
        Eliminar
      </Button>
      {estado.mensaje && !estado.ok && <span className="text-sm text-destructive">{estado.mensaje}</span>}
    </form>
  );
}
