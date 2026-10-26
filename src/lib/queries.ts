import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Contratacao = Tables<"contratacoes">;
export type Avaliacao = Tables<"avaliacoes">;
export type Fornecedor = Tables<"fornecedores">;
export type Cotacao = Tables<"cotacoes">;
export type SyncRun = Tables<"sync_runs">;
export type Detalhes = Tables<"contratacao_detalhes">;

export interface FiltrosPainel {
  demo: boolean;
  valorMax: number;
  incluirSemValor: boolean;
  uf: string;
  municipio: string;
  modalidade: string;
  categoria: string;
  ateData: string;
  busca: string;
  somenteAbertas: boolean;
}

function semCaracteresDeFiltro(s: string): string {
  return s.replace(/[,()%*\\]/g, " ").trim().slice(0, 100);
}

export const contratacoesQuery = (f: FiltrosPainel) =>
  queryOptions({
    queryKey: ["contratacoes", f],
    staleTime: 60_000,
    queryFn: async () => {
      let q = supabase.from("contratacoes")
        .select("id, numero_controle_pncp, is_demo, orgao_razao_social, municipio_nome, uf_sigla, modalidade_id, modalidade_nome, objeto_compra, categoria, valor_total_estimado, data_abertura_proposta, data_encerramento_proposta, data_atualizacao_pncp, srp, url_pncp")
        .eq("is_demo", f.demo);
      q = f.incluirSemValor
        ? q.or(`valor_total_estimado.is.null,valor_total_estimado.lte.${f.valorMax}`)
        : q.lte("valor_total_estimado", f.valorMax);
      if (f.uf !== "todas") q = q.eq("uf_sigla", f.uf);
      const mun = semCaracteresDeFiltro(f.municipio);
      if (mun) q = q.ilike("municipio_nome", `%${mun}%`);
      if (f.modalidade !== "todas") q = q.eq("modalidade_id", Number(f.modalidade));
      if (f.categoria !== "todas") q = q.eq("categoria", f.categoria);
      if (f.somenteAbertas) q = q.gte("data_encerramento_proposta", new Date().toISOString());
      if (f.ateData) q = q.lte("data_encerramento_proposta", `${f.ateData}T23:59:59-03:00`);
      const busca = semCaracteresDeFiltro(f.busca);
      if (busca) q = q.or(`objeto_compra.ilike.%${busca}%,orgao_razao_social.ilike.%${busca}%`);
      const { data, error } = await q.order("data_encerramento_proposta", { ascending: true, nullsFirst: false }).limit(500);
      if (error) throw error;
      return data;
    },
  });

export const avaliacoesQuery = () =>
  queryOptions({
    queryKey: ["avaliacoes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("avaliacoes").select("*");
      if (error) throw error;
      return data;
    },
  });

export const detalhesStatusQuery = () =>
  queryOptions({
    queryKey: ["detalhes-status"],
    queryFn: async () => {
      const { data, error } = await supabase.from("contratacao_detalhes").select("contratacao_id, itens_status");
      if (error) throw error;
      return data;
    },
  });

export const fornecedoresQuery = () =>
  queryOptions({
    queryKey: ["fornecedores"],
    queryFn: async () => {
      const { data, error } = await supabase.from("fornecedores").select("*").is("deleted_at", null).order("nome");
      if (error) throw error;
      return data;
    },
  });

export const syncRunsQuery = () =>
  queryOptions({
    queryKey: ["sync-runs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sync_runs").select("*").order("started_at", { ascending: false }).limit(30);
      if (error) throw error;
      return data;
    },
  });

export const contratacaoQuery = (id: string) =>
  queryOptions({
    queryKey: ["contratacao", id],
    queryFn: async () => {
      const [c, d, a, cot] = await Promise.all([
        supabase.from("contratacoes").select("*").eq("id", id).maybeSingle(),
        supabase.from("contratacao_detalhes").select("*").eq("contratacao_id", id).maybeSingle(),
        supabase.from("avaliacoes").select("*").eq("contratacao_id", id).maybeSingle(),
        supabase.from("cotacoes").select("*").eq("contratacao_id", id).order("created_at"),
      ]);
      for (const r of [c, d, a, cot]) if (r.error) throw r.error;
      return { contratacao: c.data, detalhes: d.data, avaliacao: a.data, cotacoes: cot.data ?? [] };
    },
  });

/** Cria ou atualiza a avaliação do usuário atual para uma contratação. */
export async function salvarAvaliacao(contratacaoId: string, patch: Partial<Omit<Avaliacao, "id" | "user_id" | "contratacao_id">>) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Sessão expirada");
  const { error } = await supabase.from("avaliacoes")
    .upsert({ user_id: u.user.id, contratacao_id: contratacaoId, ...patch }, { onConflict: "user_id,contratacao_id" });
  if (error) throw error;
}
