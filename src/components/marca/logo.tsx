import { ScaleIcon } from "lucide-react";

export function Logo() {
  return (
    <span className="inline-flex items-center gap-2 font-semibold tracking-tight">
      <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
        <ScaleIcon className="size-4" aria-hidden="true" />
      </span>
      Copiloto Judicial
    </span>
  );
}
