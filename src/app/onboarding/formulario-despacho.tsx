"use client";

import { useActionState } from "react";
import { BotonEnviar, ErrorCampo, MensajeFormulario, propsCampo } from "@/components/formulario";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { crearDespacho } from "@/features/despachos/actions";
import { ESPECIALIDADES } from "@/features/despachos/catalogos";
import { ESTADO_INICIAL } from "@/lib/formularios";

export function FormularioDespacho() {
  const [estado, accion] = useActionState(crearDespacho, ESTADO_INICIAL);
  return (
    <form action={accion} noValidate>
      <FieldGroup>
        <MensajeFormulario estado={estado} />
        <Field>
          <FieldLabel htmlFor="nombre">Nombre del despacho</FieldLabel>
          <Input placeholder="Juzgado 1 Civil Municipal de Bogotá" required {...propsCampo(estado, "nombre")} />
          <ErrorCampo estado={estado} campo="nombre" id="nombre-error" />
        </Field>
        <Field>
          <FieldLabel htmlFor="codigo">Código del despacho</FieldLabel>
          <Input inputMode="numeric" placeholder="110014003001" required {...propsCampo(estado, "codigo")} />
          <FieldDescription>Los 12 primeros dígitos de los radicados del despacho.</FieldDescription>
          <ErrorCampo estado={estado} campo="codigo" id="codigo-error" />
        </Field>
        <Field>
          <FieldLabel htmlFor="especialidad">Especialidad</FieldLabel>
          <NativeSelect className="w-full" required {...propsCampo(estado, "especialidad")} defaultValue={estado.valores?.especialidad ?? ""}>
            <NativeSelectOption value="" disabled>
              Elija una
            </NativeSelectOption>
            {Object.entries(ESPECIALIDADES).map(([valor, etiqueta]) => (
              <NativeSelectOption key={valor} value={valor}>
                {etiqueta}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <FieldDescription>Define qué términos y módulos verá el despacho.</FieldDescription>
          <ErrorCampo estado={estado} campo="especialidad" id="especialidad-error" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          {(["departamento", "municipio", "seccional"] as const).map((campo) => (
            <Field key={campo}>
              <FieldLabel htmlFor={campo} className="capitalize">
                {campo}
              </FieldLabel>
              <Input required {...propsCampo(estado, campo)} />
              <ErrorCampo estado={estado} campo={campo} id={`${campo}-error`} />
            </Field>
          ))}
        </div>
        <BotonEnviar>Solicitar registro</BotonEnviar>
      </FieldGroup>
    </form>
  );
}
