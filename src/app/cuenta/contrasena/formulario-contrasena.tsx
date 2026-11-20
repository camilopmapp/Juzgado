"use client";

import { useActionState } from "react";
import { BotonEnviar, ErrorCampo, MensajeFormulario, propsCampo } from "@/components/formulario";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cambiarContrasena } from "@/features/auth/actions";
import { ESTADO_INICIAL } from "@/lib/formularios";

export function FormularioContrasena({ nombre }: { nombre: string }) {
  const [estado, accion] = useActionState(cambiarContrasena, ESTADO_INICIAL);
  return (
    <form action={accion} noValidate>
      <FieldGroup>
        <MensajeFormulario estado={estado} />
        <Field>
          <FieldLabel htmlFor="nombre">Nombre completo</FieldLabel>
          <Input autoComplete="name" {...propsCampo(estado, "nombre")} defaultValue={estado.valores?.nombre ?? nombre} />
        </Field>
        <Field>
          <FieldLabel htmlFor="contrasena">Nueva contraseña</FieldLabel>
          <Input type="password" autoComplete="new-password" required {...propsCampo(estado, "contrasena")} defaultValue="" />
          <FieldDescription>Mínimo 12 caracteres.</FieldDescription>
          <ErrorCampo estado={estado} campo="contrasena" id="contrasena-error" />
        </Field>
        <Field>
          <FieldLabel htmlFor="confirmacion">Repita la contraseña</FieldLabel>
          <Input type="password" autoComplete="new-password" required {...propsCampo(estado, "confirmacion")} defaultValue="" />
          <ErrorCampo estado={estado} campo="confirmacion" id="confirmacion-error" />
        </Field>
        <BotonEnviar className="w-full">Guardar y continuar</BotonEnviar>
      </FieldGroup>
    </form>
  );
}
