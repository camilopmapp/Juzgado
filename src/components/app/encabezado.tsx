import { LogOutIcon } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/marca/logo";
import { Button } from "@/components/ui/button";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { cerrarSesion } from "@/features/auth/actions";
import { cambiarDespachoActivo } from "@/features/despachos/actions";
import { ROLES } from "@/features/despachos/catalogos";
import type { MembresiaActiva } from "@/features/despachos/contexto";
import { type Enlace, Navegacion } from "./navegacion";

export function Encabezado({
  nombre,
  membresias,
  activa,
  enlaces,
}: {
  nombre: string;
  membresias: MembresiaActiva[];
  activa: MembresiaActiva | null;
  enlaces: Enlace[];
}) {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 pt-3">
        <Link href="/tablero" aria-label="Inicio">
          <Logo />
        </Link>
        <div className="ml-auto flex items-center gap-2 text-sm">
          {membresias.length > 1 && activa ? (
            <form action={cambiarDespachoActivo} className="flex items-center gap-2">
              <label htmlFor="despacho_id" className="sr-only">
                Despacho
              </label>
              <NativeSelect id="despacho_id" name="despacho_id" size="sm" defaultValue={activa.despacho.id}>
                {membresias.map((m) => (
                  <NativeSelectOption key={m.despacho.id} value={m.despacho.id}>
                    {m.despacho.nombre}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <Button type="submit" size="sm" variant="outline">
                Cambiar
              </Button>
            </form>
          ) : (
            activa && <span className="hidden text-muted-foreground sm:inline">{activa.despacho.nombre}</span>
          )}
          <span className="hidden md:inline">
            {nombre}
            {activa && <span className="text-muted-foreground"> · {ROLES[activa.rol]}</span>}
          </span>
          <form action={cerrarSesion}>
            <Button type="submit" size="sm" variant="ghost" aria-label="Cerrar sesión">
              <LogOutIcon aria-hidden="true" />
              <span className="hidden sm:inline">Salir</span>
            </Button>
          </form>
        </div>
        <div className="w-full">
          <Navegacion enlaces={enlaces} />
        </div>
      </div>
    </header>
  );
}
