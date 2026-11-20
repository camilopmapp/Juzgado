import { TriangleAlertIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

/** Advierte cuando faltan festivos de algún año: los vencimientos podrían estar mal. */
export function AvisoCalendario({ anios }: { anios: number[] }) {
  if (anios.length === 0) return null;
  return (
    <Alert variant="destructive">
      <TriangleAlertIcon aria-hidden="true" />
      <AlertTitle>Calendario incompleto</AlertTitle>
      <AlertDescription>
        No están cargados los festivos de {anios.join(", ")}. Los vencimientos que caigan en esos años pueden estar mal
        calculados. Pida al administrador de la plataforma que cargue el calendario.
      </AlertDescription>
    </Alert>
  );
}
