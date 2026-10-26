/**
 * Busca itens e arquivos de uma contratação na API pública do PNCP e grava cache.
 * Somente servidor (usa service_role para escrever no cache global).
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { mapearArquivo, mapearItem, type ArquivoEdital, type ItemEdital, type PncpArquivo, type PncpItem } from "@/lib/domain/pncp-map";
import { getJsonPncp, montarUrl, PNCP_API_BASE } from "./pncp-client.server";
import type { Json } from "@/integrations/supabase/types";

type StatusBusca = "ok" | "vazio" | "erro" | "nao_verificado";

export interface DetalhesResultado {
  itens: ItemEdital[];
  arquivos: ArquivoEdital[];
  itens_status: StatusBusca;
  arquivos_status: StatusBusca;
  erro: string | null;
  fetched_at: string;
}

const MAX_PAGINAS_ITENS = 5;
const TAMANHO = 100;

export async function buscarDetalhes(contratacaoId: string): Promise<DetalhesResultado> {
  const { data: c, error } = await supabaseAdmin
    .from("contratacoes")
    .select("id, is_demo, orgao_cnpj, ano_compra, sequencial_compra")
    .eq("id", contratacaoId)
    .maybeSingle();
  if (error || !c) throw new Error("Contratação não encontrada.");

  const agora = new Date().toISOString();
  if (c.is_demo) {
    // Dados de demonstração não existem no PNCP.
    return { itens: [], arquivos: [], itens_status: "nao_verificado", arquivos_status: "nao_verificado", erro: "Registro de demonstração: sem itens reais.", fetched_at: agora };
  }

  const base = `/v1/orgaos/${encodeURIComponent(c.orgao_cnpj)}/compras/${c.ano_compra}/${c.sequencial_compra}`;
  const erros: string[] = [];

  let itens: ItemEdital[] = [];
  let itensStatus: StatusBusca = "vazio";
  try {
    for (let p = 1; p <= MAX_PAGINAS_ITENS; p++) {
      const res = await getJsonPncp<PncpItem[]>(montarUrl(PNCP_API_BASE, `${base}/itens`, { pagina: p, tamanhoPagina: TAMANHO }));
      const lote = Array.isArray(res.dados) ? res.dados : [];
      itens = itens.concat(lote.map(mapearItem));
      if (lote.length < TAMANHO) break;
    }
    itensStatus = itens.length > 0 ? "ok" : "vazio";
  } catch (e) {
    itensStatus = "erro";
    erros.push(`Itens: ${e instanceof Error ? e.message : String(e)}`);
  }

  let arquivos: ArquivoEdital[] = [];
  let arquivosStatus: StatusBusca = "vazio";
  try {
    const res = await getJsonPncp<PncpArquivo[]>(montarUrl(PNCP_API_BASE, `${base}/arquivos`, {}));
    arquivos = (Array.isArray(res.dados) ? res.dados : []).map(mapearArquivo).filter((a): a is ArquivoEdital => a !== null);
    arquivosStatus = arquivos.length > 0 ? "ok" : "vazio";
  } catch (e) {
    arquivosStatus = "erro";
    erros.push(`Arquivos: ${e instanceof Error ? e.message : String(e)}`);
  }

  const resultado: DetalhesResultado = {
    itens, arquivos, itens_status: itensStatus, arquivos_status: arquivosStatus,
    erro: erros.length ? erros.join(" | ") : null, fetched_at: agora,
  };

  const { error: upErr } = await supabaseAdmin.from("contratacao_detalhes").upsert({
    contratacao_id: c.id,
    itens: itens as unknown as Json,
    arquivos: arquivos as unknown as Json,
    itens_status: itensStatus,
    arquivos_status: arquivosStatus,
    erro: resultado.erro,
    fetched_at: agora,
  }, { onConflict: "contratacao_id" });
  if (upErr) console.error(`[detalhes] falha ao gravar cache: ${upErr.message}`);

  return resultado;
}
