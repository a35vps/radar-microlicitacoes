import { Badge } from "@/components/ui/badge";
import { faixaScore } from "@/lib/domain/score";
import { STATUS_LABEL, type StatusOportunidade } from "@/lib/domain/constants";

export function ScoreBadge({ score }: { score: number }) {
  const f = faixaScore(score);
  const variant = f === "alto" ? "success" : f === "medio" ? "warning" : "muted";
  return <Badge variant={variant} className="tabular min-w-10 justify-center" aria-label={`Score ${score}`}>{score}</Badge>;
}

const STATUS_VARIANT = { novo: "info", cotando: "warning", descartado: "muted", participar: "success" } as const;

export function StatusBadge({ status }: { status: StatusOportunidade }) {
  return <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>;
}
