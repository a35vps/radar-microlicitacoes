/**
 * Coletor PNCP → banco. Executa SOMENTE no servidor com service_role,
 * porque grava em tabelas globais protegidas por RLS (somente leitura para usuários).
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { MODALIDADES_PADRAO_COLETA, UF_PRIORITARIA } from "@/lib/domain/constants";
import { dentroDoPerfil, mapearContratacao, type ContratacaoRow, type PncpContratacao } from "@/lib/domain/pncp-map";
import { dataPncp, getJsonPncp, montarUrl, PNCP_CONSULTA_BASE, type PaginaConsulta } from "./pncp-client.server";
import type { Json } from "@/integrations/supabase/types";

export interface ParametrosSync {
  uf: string;
  modalidades: number[];
  /** Janela para /publicacao (dias para trás a partir de hoje). */
  diasPublicacao: number;
  /** Janela para /proposta (propostas abertas com fim até hoje + N dias). */
  diasProposta: number;
  maxPaginasPorConsulta: number;
}

export const PARAMETROS_PADRAO: ParametrosSync = {
  uf: UF_PRIORITARIA,
  modalidades: [...MODALIDADES_PADRAO_COLETA],
  diasPublicacao: 3,
  diasProposta: 30,
  maxPaginasPorConsulta: 6,
};

const TAMANHO_PAGINA = 50;
/** Orçamento de tempo total: evita estourar o limite de execução do servidor. */
const ORCAMENTO_MS = 50_000;

interface ErroSync { consulta: string; pagina: number; mensagem: string }

export interface ResultadoSync {
  runId: string;
  status: "sucesso" | "parcial" | "erro";
  paginasLidas: number;
  recebidos: number;
  gravados: number;
  ignorados: number;
  erros: ErroSync[];
}

export async function executarSincronizacao(
  trigger: "manual" | "agendado",
  params: ParametrosSync,
  userId: string | null,
): Promise<ResultadoSync> {
  // Impede execuções concorrentes (uma rodando nos últimos 3 minutos).
  const limite = new Date(Date.now() - 3 * 60_000).toISOString();
  const { data: emAndamento } = await supabaseAdmin
    .from("sync_runs").select("id").eq("status", "executando").gte("started_at", limite).limit(1);
  if (emAndamento && emAndamento.length > 0) {
    throw new Error("Já existe uma sincronização em andamento. Aguarde alguns minutos.");
  }

  const { data: run, error: runErr } = await supabaseAdmin
    .from("sync_runs")
    .insert({ trigger, triggered_by: userId, params: params as unknown as Json })
    .select("id").single();
  if (runErr || !run) throw new Error(`Não foi possível registrar a sincronização: ${runErr?.message}`);

  const inicio = Date.now();
  const hoje = new Date();
  const erros: ErroSync[] = [];
  const vistos = new Set<string>();
  let paginasLidas = 0, recebidos = 0, gravados = 0, ignorados = 0, cortadoPorTempo = false;

  const consultas: Array<{ nome: string; caminho: string; base: Record<string, string | number> }> = [];
  for (const m of params.modalidades) {
    consultas.push({
      nome: `proposta/mod-${m}`,
      caminho: "/v1/contratacoes/proposta",
      base: { dataFinal: dataPncp(new Date(hoje.getTime() + params.diasProposta * 86_400_000)), codigoModalidadeContratacao: m, uf: params.uf },
    });
    consultas.push({
      nome: `publicacao/mod-${m}`,
      caminho: "/v1/contratacoes/publicacao",
      base: { dataInicial: dataPncp(new Date(hoje.getTime() - params.diasPublicacao * 86_400_000)), dataFinal: dataPncp(hoje), codigoModalidadeContratacao: m, uf: params.uf },
    });
  }

  externo: for (const c of consultas) {
    for (let pagina = 1; pagina <= params.maxPaginasPorConsulta; pagina++) {
      if (Date.now() - inicio > ORCAMENTO_MS) { cortadoPorTempo = true; break externo; }
      const url = montarUrl(PNCP_CONSULTA_BASE, c.caminho, { ...c.base, pagina, tamanhoPagina: TAMANHO_PAGINA });
      try {
        const res = await getJsonPncp<PaginaConsulta<PncpContratacao>>(url);
        paginasLidas++;
        const lista = res.dados?.data ?? [];
        recebidos += lista.length;
        const agoraIso = new Date().toISOString();
        const lote: ContratacaoRow[] = [];
        for (const item of lista) {
          const row = mapearContratacao(item, agoraIso);
          if (!row || !dentroDoPerfil(row) || vistos.has(row.numero_controle_pncp)) { ignorados++; continue; }
          vistos.add(row.numero_controle_pncp);
          lote.push({ ...row, raw: item } as ContratacaoRow & { raw: unknown });
        }
        if (lote.length > 0) {
          const { error } = await supabaseAdmin
            .from("contratacoes")
            .upsert(lote as never, { onConflict: "numero_controle_pncp" });
          if (error) erros.push({ consulta: c.nome, pagina, mensagem: `Banco: ${error.message}` });
          else gravados += lote.length;
        }
        const restantes = res.dados?.paginasRestantes ?? 0;
        if (res.status === 204 || lista.length === 0 || restantes <= 0) break;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`[sync] ${c.nome} p${pagina}: ${msg}`);
        erros.push({ consulta: c.nome, pagina, mensagem: msg });
        break; // segue para a próxima consulta
      }
    }
  }

  if (cortadoPorTempo) erros.push({ consulta: "orcamento", pagina: 0, mensagem: "Tempo máximo atingido; execute novamente para continuar." });
  const status: ResultadoSync["status"] =
    erros.length === 0 ? "sucesso" : gravados > 0 || paginasLidas > 0 ? "parcial" : "erro";

  await supabaseAdmin.from("sync_runs").update({
    status, paginas_lidas: paginasLidas, registros_recebidos: recebidos, registros_gravados: gravados,
    registros_ignorados: ignorados, erros: erros as unknown as Json, finished_at: new Date().toISOString(),
  }).eq("id", run.id);

  console.info(`[sync] ${trigger} ${status}: ${paginasLidas} páginas, ${recebidos} recebidos, ${gravados} gravados, ${erros.length} erros`);
  return { runId: run.id, status, paginasLidas, recebidos, gravados, ignorados, erros };
}
