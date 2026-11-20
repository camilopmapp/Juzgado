"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export interface Enlace {
  href: string;
  etiqueta: string;
}

export function Navegacion({ enlaces }: { enlaces: Enlace[] }) {
  const ruta = usePathname();
  return (
    <nav aria-label="Principal" className="-mb-px flex gap-1 overflow-x-auto">
      {enlaces.map((e) => {
        const activo = ruta === e.href || ruta.startsWith(`${e.href}/`);
        return (
          <Link
            key={e.href}
            href={e.href}
            aria-current={activo ? "page" : undefined}
            className={cn(
              "border-b-2 px-3 py-2 text-sm whitespace-nowrap transition-colors",
              activo ? "border-primary font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {e.etiqueta}
          </Link>
        );
      })}
    </nav>
  );
}
