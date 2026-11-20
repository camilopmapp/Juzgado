import { Encabezado } from "@/components/app/encabezado";
import { requerirDespacho } from "@/features/despachos/contexto";

export default async function LayoutApp({ children }: LayoutProps<"/">) {
  const { nombre, membresias, activa, esAdmin } = await requerirDespacho();
  const enlaces = [
    { href: "/tablero", etiqueta: "Tablero de términos" },
    { href: "/procesos", etiqueta: "Procesos" },
    { href: "/configuracion", etiqueta: "Configuración" },
    ...(esAdmin ? [{ href: "/admin", etiqueta: "Administración" }] : []),
  ];
  return (
    <>
      <Encabezado nombre={nombre} membresias={membresias} activa={activa} enlaces={enlaces} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
    </>
  );
}
