"use client";

import { useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function ErrorApp({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <Alert variant="destructive">
      <AlertTitle>Algo salió mal</AlertTitle>
      <AlertDescription className="flex flex-col items-start gap-3">
        <p>{error.message || "No se pudo cargar esta página."}</p>
        {error.digest && <p className="text-xs">Código de error: {error.digest}</p>}
        <Button variant="outline" size="sm" onClick={reset}>
          Reintentar
        </Button>
      </AlertDescription>
    </Alert>
  );
}
