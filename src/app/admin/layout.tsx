import { Encabezado } from "@/components/app/encabezado";
import { requerirAdmin } from "@/features/despachos/contexto";

export default async function LayoutAdmin({ children }: LayoutProps<"/admin">) {
  const { nombre, membresias, activa } = await requerirAdmin();
  const enlaces = [
    ...(activa?.despacho.verificado ? [{ href: "/tablero", etiqueta: "Tablero de términos" }] : []),
    { href: "/admin", etiqueta: "Administración" },
  ];
  return (
    <>
      <Encabezado nombre={nombre} membresias={membresias} activa={activa} enlaces={enlaces} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
    </>
  );
}
