import type { ReactNode } from "react";
import { AlertTriangle, Inbox } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export function LoadingRows({ linhas = 6 }: { linhas?: number }) {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Carregando">
      {Array.from({ length: linhas }, (_, i) => <Skeleton key={`sk-${i}`} className="h-14 w-full" />)}
    </div>
  );
}

export function EmptyState({ titulo, descricao, acao }: { titulo: string; descricao: string; acao?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed bg-card px-6 py-12 text-center">
      <Inbox className="size-8 text-muted-foreground" aria-hidden />
      <h3 className="mt-3 font-semibold">{titulo}</h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{descricao}</p>
      {acao && <div className="mt-4">{acao}</div>}
    </div>
  );
}

export function ErrorState({ mensagem, onRetry }: { mensagem: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center rounded-xl border border-destructive/30 bg-destructive-soft px-6 py-10 text-center">
      <AlertTriangle className="size-7 text-destructive" aria-hidden />
      <p className="mt-2 text-sm font-medium text-destructive">{mensagem}</p>
      {onRetry && <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>Tentar novamente</Button>}
    </div>
  );
}

export function PageHeader({ titulo, descricao, acoes }: { titulo: string; descricao?: string; acoes?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">{titulo}</h1>
        {descricao && <p className="mt-1 text-sm text-muted-foreground">{descricao}</p>}
      </div>
      {acoes && <div className="flex flex-wrap gap-2">{acoes}</div>}
    </div>
  );
}
