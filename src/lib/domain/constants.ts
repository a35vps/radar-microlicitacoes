/**
 * Constantes de domínio do Radar de Microlicitações.
 * Valores de negócio centralizados aqui para evitar "números mágicos" espalhados.
 */

/** Teto de valor total estimado para o perfil do revendedor (R$). */
export const VALOR_TETO_PERFIL = 15_000;

/** Faixas de filtro de valor disponíveis no painel (R$). */
export const FAIXAS_VALOR = [5_000, 10_000, 15_000] as const;
export type FaixaValor = (typeof FAIXAS_VALOR)[number];

export const STATUS_OPORTUNIDADE = ["novo", "cotando", "descartado", "participar"] as const;
export type StatusOportunidade = (typeof STATUS_OPORTUNIDADE)[number];

export const STATUS_LABEL: Record<StatusOportunidade, string> = {
  novo: "Novo",
  cotando: "Cotando",
  descartado: "Descartado",
  participar: "Participar",
};

/** Modalidades PNCP (códigos oficiais do manual da API de consulta). */
export const MODALIDADES: ReadonlyArray<{ id: number; nome: string }> = [
  { id: 8, nome: "Dispensa" },
  { id: 6, nome: "Pregão - Eletrônico" },
  { id: 7, nome: "Pregão - Presencial" },
  { id: 9, nome: "Inexigibilidade" },
  { id: 12, nome: "Credenciamento" },
];

/** Modalidades coletadas por padrão (mais aderentes a microcompras). */
export const MODALIDADES_PADRAO_COLETA = [8, 6] as const;

export const CATEGORIAS = [
  "informatica",
  "escritorio",
  "limpeza",
  "alimentos",
  "saude",
  "construcao",
  "veiculos",
  "mobiliario",
  "eletro",
  "vestuario",
  "servicos",
  "outros",
] as const;
export type Categoria = (typeof CATEGORIAS)[number];

export const CATEGORIA_LABEL: Record<Categoria, string> = {
  informatica: "Informática",
  escritorio: "Escritório e papelaria",
  limpeza: "Limpeza e higiene",
  alimentos: "Alimentos",
  saude: "Saúde e hospitalar",
  construcao: "Construção e manutenção",
  veiculos: "Veículos e combustíveis",
  mobiliario: "Mobiliário",
  eletro: "Eletroeletrônicos",
  vestuario: "Vestuário e EPI",
  servicos: "Serviços",
  outros: "Outros",
};

export const UFS = [
  "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS", "MT", "PA",
  "PB", "PE", "PI", "PR", "RJ", "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO",
] as const;

export const UF_PRIORITARIA = "MG";

/** 34 municípios da Região Metropolitana de Belo Horizonte (Lei Complementar MG 89/2006 e alterações). */
export const MUNICIPIOS_RMBH = [
  "Baldim", "Belo Horizonte", "Betim", "Brumadinho", "Caeté", "Capim Branco", "Confins",
  "Contagem", "Esmeraldas", "Florestal", "Ibirité", "Igarapé", "Itaguara", "Itatiaiuçu",
  "Jaboticatubas", "Juatuba", "Lagoa Santa", "Mário Campos", "Mateus Leme", "Matozinhos",
  "Nova Lima", "Nova União", "Pedro Leopoldo", "Raposos", "Ribeirão das Neves", "Rio Acima",
  "Rio Manso", "Sabará", "Santa Luzia", "São Joaquim de Bicas", "São José da Lapa", "Sarzedo",
  "Taquaraçu de Minas", "Vespasiano",
] as const;

/** Normaliza texto para comparação: minúsculas, sem acentos, espaços colapsados. */
export function normalizar(texto: string | null | undefined): string {
  return (texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

const RMBH_NORMALIZADO = new Set(MUNICIPIOS_RMBH.map(normalizar));

export function isRmbh(municipio: string | null | undefined): boolean {
  return RMBH_NORMALIZADO.has(normalizar(municipio));
}

export function isBeloHorizonte(municipio: string | null | undefined): boolean {
  return normalizar(municipio) === "belo horizonte";
}
