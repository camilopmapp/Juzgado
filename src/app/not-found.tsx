import Link from "next/link";

export default function NoEncontrado() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-3 px-4 text-center">
      <h1 className="text-xl font-semibold">Página no encontrada</h1>
      <p className="text-muted-foreground">El recurso no existe o no tiene permiso para verlo.</p>
      <Link href="/tablero" className="underline underline-offset-4">
        Ir al tablero
      </Link>
    </main>
  );
}
