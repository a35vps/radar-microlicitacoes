/**
 * Cliente HTTP do PNCP — executa SOMENTE no servidor.
 * - Timeout por requisição
 * - Retentativas com backoff exponencial + jitter (429, 5xx, rede, timeout)
 * - Respeita o cabeçalho Retry-After
 * - Intervalo mínimo entre requisições (rate limit cooperativo)
 * - HTTP 204 do PNCP significa "sem resultados" (não é erro)
 */

export const PNCP_CONSULTA_BASE = "https://pncp.gov.br/api/consulta";
export const PNCP_API_BASE = "https://pncp.gov.br/api/pncp";

const TIMEOUT_MS = 20_000;
const MAX_TENTATIVAS = 4;
const INTERVALO_MIN_MS = 350;

let ultimaRequisicao = 0;

const dormir = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export class PncpErro extends Error {
  constructor(message: string, readonly status: number | null, readonly url: string) {
    super(message);
    this.name = "PncpErro";
  }
}

export type RespostaPncp<T> = { status: number; dados: T | null };

async function respeitarIntervalo(): Promise<void> {
  const espera = ultimaRequisicao + INTERVALO_MIN_MS - Date.now();
  if (espera > 0) await dormir(espera);
  ultimaRequisicao = Date.now();
}

function retryAfterMs(h: string | null): number | null {
  if (!h) return null;
  const s = Number(h);
  if (Number.isFinite(s)) return Math.min(s * 1000, 30_000);
  const d = Date.parse(h);
  return Number.isFinite(d) ? Math.min(Math.max(0, d - Date.now()), 30_000) : null;
}

export async function getJsonPncp<T>(url: string): Promise<RespostaPncp<T>> {
  let ultimoErro: PncpErro | null = null;
  for (let tentativa = 1; tentativa <= MAX_TENTATIVAS; tentativa++) {
    await respeitarIntervalo();
    try {
      const res = await fetch(url, {
        headers: { Accept: "application/json", "User-Agent": "RadarMicrolicitacoes/1.0" },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (res.status === 204) return { status: 204, dados: null };
      if (res.ok) return { status: res.status, dados: (await res.json()) as T };

      const corpo = (await res.text()).slice(0, 300);
      ultimoErro = new PncpErro(`HTTP ${res.status}: ${corpo}`, res.status, url);
      const retentavel = res.status === 429 || res.status >= 500;
      if (!retentavel) throw ultimoErro;
      const espera = retryAfterMs(res.headers.get("retry-after")) ?? backoff(tentativa);
      console.warn(`[PNCP] ${res.status} em ${url} — tentativa ${tentativa}/${MAX_TENTATIVAS}, aguardando ${espera}ms`);
      if (tentativa < MAX_TENTATIVAS) await dormir(espera);
    } catch (e) {
      if (e instanceof PncpErro && e.status !== null && e.status < 500 && e.status !== 429) throw e;
      const msg = e instanceof Error ? e.message : String(e);
      ultimoErro = e instanceof PncpErro ? e : new PncpErro(`Falha de rede/timeout: ${msg}`, null, url);
      console.warn(`[PNCP] erro em ${url} — tentativa ${tentativa}/${MAX_TENTATIVAS}: ${msg}`);
      if (tentativa < MAX_TENTATIVAS) await dormir(backoff(tentativa));
    }
  }
  throw ultimoErro ?? new PncpErro("Falha desconhecida", null, url);
}

function backoff(tentativa: number): number {
  return Math.min(1000 * 2 ** (tentativa - 1), 8000) + Math.floor(Math.random() * 300);
}

export interface PaginaConsulta<T> {
  data: T[];
  totalRegistros: number;
  totalPaginas: number;
  numeroPagina: number;
  paginasRestantes: number;
  empty: boolean;
}

export function montarUrl(base: string, caminho: string, params: Record<string, string | number | undefined>): string {
  const u = new URL(base + caminho);
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "") u.searchParams.set(k, String(v));
  return u.toString();
}

/** yyyyMMdd no fuso de Brasília. */
export function dataPncp(d: Date): string {
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
  return p.replace(/-/g, "");
}
