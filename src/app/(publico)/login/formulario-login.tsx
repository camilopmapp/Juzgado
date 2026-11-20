"use client";

import Link from "next/link";
import { useActionState } from "react";
import { BotonEnviar, ErrorCampo, MensajeFormulario, propsCampo } from "@/components/formulario";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { iniciarSesion } from "@/features/auth/actions";
import { ESTADO_INICIAL } from "@/lib/formularios";

export function FormularioLogin({ siguiente }: { siguiente?: string }) {
  const [estado, accion] = useActionState(iniciarSesion, ESTADO_INICIAL);
  return (
    <form action={accion} noValidate>
      <FieldGroup>
        <MensajeFormulario estado={estado} />
        <input type="hidden" name="siguiente" value={siguiente ?? ""} />
        <Field>
          <FieldLabel htmlFor="correo">Correo institucional</FieldLabel>
          <Input type="email" autoComplete="email" required {...propsCampo(estado, "correo")} />
          <ErrorCampo estado={estado} campo="correo" id="correo-error" />
        </Field>
        <Field>
          <div className="flex items-center justify-between">
            <FieldLabel htmlFor="contrasena">Contraseña</FieldLabel>
            <Link href="/recuperar" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
              ¿La olvidó?
            </Link>
          </div>
          <Input type="password" autoComplete="current-password" required {...propsCampo(estado, "contrasena")} defaultValue="" />
          <ErrorCampo estado={estado} campo="contrasena" id="contrasena-error" />
        </Field>
        <BotonEnviar className="w-full">Ingresar</BotonEnviar>
      </FieldGroup>
    </form>
  );
}
