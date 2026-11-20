import { Logo } from "@/components/marca/logo";

export default function LayoutPublico({ children }: LayoutProps<"/">) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 px-4 py-10">
      <Logo />
      <div className="w-full max-w-sm">{children}</div>
      <p className="max-w-sm text-center text-xs text-muted-foreground">
        Herramienta de apoyo. No reemplaza el criterio del funcionario judicial.
      </p>
    </main>
  );
}
