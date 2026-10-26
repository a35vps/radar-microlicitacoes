import { Radar } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LogoProps {
  className?: string;
  /** Mostra apenas o ícone (sidebar recolhida). */
  compacto?: boolean;
}

export function Logo({ className, compacto = false }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
        <Radar className="size-4.5" aria-hidden />
      </span>
      {!compacto && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-[15px] font-bold tracking-tight">Radar</span>
          <span className="text-[11px] font-medium uppercase tracking-[0.14em] opacity-70">
            Microlicitações
          </span>
        </span>
      )}
    </div>
  );
}
