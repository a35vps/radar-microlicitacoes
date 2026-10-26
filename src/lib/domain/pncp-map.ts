/**
 * Mapeamento puro (sem I/O) dos payloads da API PNCP para o formato do banco.
 * Isolado para ser testável e reutilizado pelo coletor do servidor.
 */
import { classificarCategoria } from "./categorias";
import { VALOR_TETO_PERFIL } from "./constants";

/** Subconjunto tipado do payload de /v1/contratacoes/{publicacao|proposta}. */
export interface PncpContratacao {
  numeroControlePNCP: string;
  orgaoEntidade?: { cnpj?: string; razaoSocial?: string; esferaId?: string } | null;
  unidadeOrgao?: { nomeUnidade?: string; municipioNome?: string; codigoIbge?: string; ufSigla?: string } | null;
  modalidadeId?: number | null;
  modalidadeNome?: string | null;
  modoDisputaNome?: string | null;
  amparoLegal?: { nome?: string } | null;
  objetoCompra?: string | null;
  informacaoComplementar?: string | null;
  valorTotalEstimado?: number | null;
  valorTotalHomologado?: number | null;
  dataAberturaProposta?: string | null;
  dataEncerramentoProposta?: string | null;
  dataPublicacaoPncp?: string | null;
  dataAtualizacaoGlobal?: string | null;
  dataAtualizacao?: string | null;
  situacaoCompraNome?: string | null;
  srp?: boolean | null;
  anoCompra?: number | null;
  sequencialCompra?: number | null;
  numeroCompra?: string | null;
  processo?: string | null;
  linkSistemaOrigem?: string | null;
}

export interface ContratacaoRow {
  numero_controle_pncp: string;
  is_demo: false;
  orgao_cnpj: string;
  orgao_razao_social: string;
  orgao_esfera: string | null;
  unidade_nome: string | null;
  municipio_nome: string | null;
  municipio_ibge: string | null;
  uf_sigla: string | null;
  modalidade_id: number | null;
  modalidade_nome: string | null;
  modo_disputa_nome: string | null;
  amparo_legal_nome: string | null;
  objeto_compra: string;
  informacao_complementar: string | null;
  categoria: string;
  valor_total_estimado: number | null;
  valor_total_homologado: number | null;
  data_abertura_proposta: string | null;
  data_encerramento_proposta: string | null;
  data_publicacao_pncp: string | null;
  data_atualizacao_pncp: string | null;
  situacao_compra_nome: string | null;
  srp: boolean | null;
  ano_compra: number;
  sequencial_compra: number;
  numero_compra: string | null;
  processo: string | null;
  link_sistema_origem: string | null;
  url_pncp: string;
  last_synced_at: string;
}

/** Valores monetários: ausente, não numérico ou ≤ 0 vira null ("não informado"). */
export function valorOuNulo(v: unknown): number | null {
  if (typeof v !== "number" || !Number.isFinite(v) || v <= 0) return null;
  return Math.round(v * 100) / 100;
}

const textoOuNulo = (v: unknown): string | null =>
  typeof v === "string" && v.trim() !== "" ? v.trim() : null;

/**
 * Datas do PNCP chegam sem fuso (horário de Brasília). Anexamos -03:00
 * para que o banco grave o instante correto.
 */
export function dataPncpParaIso(v: unknown): string | null {
  const s = textoOuNulo(v);
  if (!s) return null;
  if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(s)) return s;
  return `${s}-03:00`;
}

export function urlOficialPncp(cnpj: string, ano: number, sequencial: number): string {
  return `https://pncp.gov.br/app/editais/${cnpj}/${ano}/${sequencial}`;
}

/** Converte payload em linha; retorna null se faltar identificação mínima. */
export function mapearContratacao(c: PncpContratacao, agoraIso: string): ContratacaoRow | null {
  const cnpj = c.orgaoEntidade?.cnpj;
  const ano = c.anoCompra;
  const seq = c.sequencialCompra;
  if (!c.numeroControlePNCP || !cnpj || typeof ano !== "number" || typeof seq !== "number") return null;
  const objeto = textoOuNulo(c.objetoCompra) ?? "(objeto não informado)";
  return {
    numero_controle_pncp: c.numeroControlePNCP,
    is_demo: false,
    orgao_cnpj: cnpj,
    orgao_razao_social: textoOuNulo(c.orgaoEntidade?.razaoSocial) ?? "(órgão não informado)",
    orgao_esfera: textoOuNulo(c.orgaoEntidade?.esferaId),
    unidade_nome: textoOuNulo(c.unidadeOrgao?.nomeUnidade),
    municipio_nome: textoOuNulo(c.unidadeOrgao?.municipioNome),
    municipio_ibge: textoOuNulo(c.unidadeOrgao?.codigoIbge),
    uf_sigla: textoOuNulo(c.unidadeOrgao?.ufSigla)?.toUpperCase() ?? null,
    modalidade_id: typeof c.modalidadeId === "number" ? c.modalidadeId : null,
    modalidade_nome: textoOuNulo(c.modalidadeNome),
    modo_disputa_nome: textoOuNulo(c.modoDisputaNome),
    amparo_legal_nome: textoOuNulo(c.amparoLegal?.nome),
    objeto_compra: objeto,
    informacao_complementar: textoOuNulo(c.informacaoComplementar),
    categoria: classificarCategoria(objeto),
    valor_total_estimado: valorOuNulo(c.valorTotalEstimado),
    valor_total_homologado: valorOuNulo(c.valorTotalHomologado),
    data_abertura_proposta: dataPncpParaIso(c.dataAberturaProposta),
    data_encerramento_proposta: dataPncpParaIso(c.dataEncerramentoProposta),
    data_publicacao_pncp: dataPncpParaIso(c.dataPublicacaoPncp),
    data_atualizacao_pncp: dataPncpParaIso(c.dataAtualizacaoGlobal ?? c.dataAtualizacao),
    situacao_compra_nome: textoOuNulo(c.situacaoCompraNome),
    srp: typeof c.srp === "boolean" ? c.srp : null,
    ano_compra: ano,
    sequencial_compra: seq,
    numero_compra: textoOuNulo(c.numeroCompra),
    processo: textoOuNulo(c.processo),
    link_sistema_origem: textoOuNulo(c.linkSistemaOrigem),
    url_pncp: urlOficialPncp(cnpj, ano, seq),
    last_synced_at: agoraIso,
  };
}

/** Regra de coleta: guarda até o teto do perfil OU sem valor informado (sinalizado na UI). */
export function dentroDoPerfil(row: Pick<ContratacaoRow, "valor_total_estimado">): boolean {
  return row.valor_total_estimado === null || row.valor_total_estimado <= VALOR_TETO_PERFIL;
}

// ---------------------------------------------------------------------
// Itens e arquivos
// ---------------------------------------------------------------------
export interface PncpItem {
  numeroItem?: number;
  descricao?: string;
  materialOuServicoNome?: string;
  quantidade?: number;
  unidadeMedida?: string;
  valorUnitarioEstimado?: number | null;
  valorTotal?: number | null;
  orcamentoSigiloso?: boolean;
  situacaoCompraItemNome?: string;
  criterioJulgamentoNome?: string;
  tipoBeneficioNome?: string;
}

export interface ItemEdital {
  numero: number | null;
  descricao: string;
  tipo: string | null;
  quantidade: number | null;
  unidade: string | null;
  /** null = não informado/sigiloso. NUNCA derivado do valor total da contratação. */
  valor_unitario_estimado: number | null;
  valor_total_item: number | null;
  orcamento_sigiloso: boolean;
  situacao: string | null;
  criterio: string | null;
  beneficio: string | null;
}

export function mapearItem(i: PncpItem): ItemEdital {
  const sigiloso = i.orcamentoSigiloso === true;
  return {
    numero: typeof i.numeroItem === "number" ? i.numeroItem : null,
    descricao: textoOuNulo(i.descricao) ?? "(sem descrição)",
    tipo: textoOuNulo(i.materialOuServicoNome),
    quantidade: typeof i.quantidade === "number" && i.quantidade > 0 ? i.quantidade : null,
    unidade: textoOuNulo(i.unidadeMedida),
    valor_unitario_estimado: sigiloso ? null : valorOuNulo(i.valorUnitarioEstimado),
    valor_total_item: sigiloso ? null : valorOuNulo(i.valorTotal),
    orcamento_sigiloso: sigiloso,
    situacao: textoOuNulo(i.situacaoCompraItemNome),
    criterio: textoOuNulo(i.criterioJulgamentoNome),
    beneficio: textoOuNulo(i.tipoBeneficioNome),
  };
}

export interface PncpArquivo { url?: string; titulo?: string; tipoDocumentoNome?: string; statusAtivo?: boolean; dataPublicacaoPncp?: string }
export interface ArquivoEdital { url: string; titulo: string; tipo: string | null; publicado_em: string | null }

export function mapearArquivo(a: PncpArquivo): ArquivoEdital | null {
  const url = textoOuNulo(a.url);
  if (!url || a.statusAtivo === false) return null;
  return {
    url,
    titulo: textoOuNulo(a.titulo) ?? "Documento",
    tipo: textoOuNulo(a.tipoDocumentoNome),
    publicado_em: dataPncpParaIso(a.dataPublicacaoPncp),
  };
}
