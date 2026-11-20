"use client";

import Link from "next/link";
import { useActionState } from "react";
import { BotonEnviar, ErrorCampo, MensajeFormulario, propsCampo } from "@/components/formulario";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { solicitarRecuperacion } from "@/features/auth/actions";
import { ESTADO_INICIAL } from "@/lib/formularios";

export default function PaginaRecuperar() {
  const [estado, accion] = useActionState(solicitarRecuperacion, ESTADO_INICIAL);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recuperar contraseña</CardTitle>
        <CardDescription>Le enviaremos un enlace para crear una nueva.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={accion} noValidate>
          <FieldGroup>
            <MensajeFormulario estado={estado} />
            <Field>
              <FieldLabel htmlFor="correo">Correo</FieldLabel>
              <Input type="email" autoComplete="email" required {...propsCampo(estado, "correo")} />
              <ErrorCampo estado={estado} campo="correo" id="correo-error" />
            </Field>
            <BotonEnviar className="w-full">Enviar enlace</BotonEnviar>
            <Link href="/login" className="text-center text-sm text-muted-foreground underline-offset-4 hover:underline">
              Volver a ingresar
            </Link>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
