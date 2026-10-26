/** Formatadores pt-BR. Ausência de dado é sempre explícita ("não informado"). */
const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const num = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });

export function formatBRL(v: number | null | undefined, vazio = "Não informado"): string {
  return v === null || v === undefined || !Number.isFinite(v) ? vazio : brl.format(v);
}

export function formatNumero(v: number | null | undefined, vazio = "—"): string {
  return v === null || v === undefined || !Number.isFinite(v) ? vazio : num.format(v);
}

export function formatPercent(v: number | null | undefined, vazio = "—"): string {
  return v === null || v === undefined || !Number.isFinite(v) ? vazio : `${num.format(v)}%`;
}

const TZ = "America/Sao_Paulo";

export function formatData(iso: string | null | undefined, vazio = "Não informada"): string {
  if (!iso) return vazio;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return vazio;
  return d.toLocaleDateString("pt-BR", { timeZone: TZ });
}

export function formatDataHora(iso: string | null | undefined, vazio = "Não informada"): string {
  if (!iso) return vazio;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return vazio;
  return d.toLocaleString("pt-BR", { timeZone: TZ, dateStyle: "short", timeStyle: "short" });
}

/** "em 3 dias", "hoje", "encerrada há 2 dias". */
export function prazoRelativo(iso: string | null | undefined, agora: Date = new Date()): string {
  if (!iso) return "Sem data";
  const diffMs = new Date(iso).getTime() - agora.getTime();
  const horas = diffMs / 3_600_000;
  if (horas < 0) {
    const d = Math.ceil(-horas / 24);
    return d <= 1 ? "Encerrada" : `Encerrada há ${d} dias`;
  }
  if (horas < 24) return `Encerra em ${Math.max(1, Math.round(horas))}h`;
  const dias = Math.floor(horas / 24);
  return dias === 1 ? "Encerra em 1 dia" : `Encerra em ${dias} dias`;
}
