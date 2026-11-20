import type { Metadata } from "next";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormularioLogin } from "./formulario-login";

export const metadata: Metadata = { title: "Ingresar" };

export default async function PaginaLogin({ searchParams }: PageProps<"/login">) {
  const { siguiente, error } = await searchParams;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ingresar</CardTitle>
        <CardDescription>El acceso es solo por invitación de su despacho.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {error === "enlace" && (
          <Alert variant="destructive">
            <AlertDescription>El enlace no es válido o ya venció. Pida uno nuevo.</AlertDescription>
          </Alert>
        )}
        <FormularioLogin siguiente={typeof siguiente === "string" ? siguiente : undefined} />
      </CardContent>
    </Card>
  );
}
