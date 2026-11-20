"use client";

import { CircleAlertIcon, CircleCheckIcon, Loader2Icon } from "lucide-react";
import type * as React from "react";
import { useFormStatus } from "react-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import type { EstadoFormulario } from "@/lib/formularios";

/** Botón de envío que se deshabilita y muestra un indicador mientras la acción corre. */
export function BotonEnviar({
  children,
  pendiente,
  ...props
}: React.ComponentProps<typeof Button> & { pendiente?: boolean }) {
  const { pending } = useFormStatus();
  const ocupado = pendiente ?? pending;
  return (
    <Button type="submit" disabled={ocupado} aria-busy={ocupado} {...props}>
      {ocupado && <Loader2Icon className="animate-spin" aria-hidden="true" />}
      {children}
    </Button>
  );
}

/** Mensaje general del resultado de una acción (anunciado a lectores de pantalla). */
export function MensajeFormulario({ estado }: { estado: EstadoFormulario }) {
  if (!estado.mensaje) return null;
  const exito = estado.ok === true;
  return (
    <Alert variant={exito ? "default" : "destructive"} role={exito ? "status" : "alert"}>
      {exito ? <CircleCheckIcon aria-hidden="true" /> : <CircleAlertIcon aria-hidden="true" />}
      <AlertDescription>{estado.mensaje}</AlertDescription>
    </Alert>
  );
}

/** Errores de validación de un campo. */
export function ErrorCampo({ estado, campo, id }: { estado: EstadoFormulario; campo: string; id?: string }) {
  const errores = estado.errores?.[campo];
  if (!errores?.length) return null;
  return <FieldError id={id} errors={errores.map((message) => ({ message }))} />;
}

/** Props de accesibilidad para un control con posible error. */
export function propsCampo(estado: EstadoFormulario, campo: string) {
  const invalido = Boolean(estado.errores?.[campo]?.length);
  return {
    id: campo,
    name: campo,
    "aria-invalid": invalido || undefined,
    "aria-describedby": invalido ? `${campo}-error` : undefined,
    defaultValue: estado.valores?.[campo],
  };
}
