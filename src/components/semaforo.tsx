import { Badge } from "@/components/ui/badge";
import type { ColorSemaforo } from "@/domain/terminos/semaforo";
import { COLORES } from "@/features/terminos/catalogos";
import { cn } from "@/lib/utils";

/** Indicador del semáforo: color + texto (no depende solo del color). */
export function IndicadorSemaforo({ color, className }: { color: ColorSemaforo; className?: string }) {
  const info = COLORES[color];
  return (
    <Badge variant="outline" className={cn("gap-1.5 border font-medium", info.clase, className)}>
      <span aria-hidden="true" className="size-2 rounded-full bg-current opacity-70" />
      {info.etiqueta}
    </Badge>
  );
}

export function DiasRestantes({ dias, habiles }: { dias: number | null; habiles: boolean }) {
  if (dias === null) return <span className="text-muted-foreground">—</span>;
  const unidad = habiles ? (Math.abs(dias) === 1 ? "día hábil" : "días hábiles") : Math.abs(dias) === 1 ? "día" : "días";
  if (dias < 0) return <span className="font-medium text-red-700">Venció hace {Math.abs(dias)} {unidad}</span>;
  if (dias === 0) return <span className="font-medium text-red-700">Vence hoy</span>;
  return (
    <span>
      {dias} {unidad}
    </span>
  );
}
