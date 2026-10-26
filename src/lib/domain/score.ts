import { isBeloHorizonte, isRmbh, normalizar, UF_PRIORITARIA, VALOR_TETO_PERFIL } from "./constants";

/**
 * Score explicável de oportunidade (0–100).
 * Cada fator retorna pontos e uma justificativa legível, para que o usuário
 * entenda exatamente por que uma contratação ficou acima ou abaixo de outra.
 * O score NÃO afirma elegibilidade: alertas indicam pontos a verificar.
 */

export interface ScoreInput {
  valor_total_estimado: number | null;
  uf_sigla: string | null;
  municipio_nome: string | null;
  modalidade_id: number | null;
  data_encerramento_proposta: string | null;
  objeto_compra: string;
  srp: boolean | null;
  itens_verificados: boolean;
  avaliacao?: {
    documentacao_ok: boolean | null;
    capacidade_entrega: boolean | null;
    impedimento_regulatorio: boolean | null;
    risco_logistico: "baixo" | "medio" | "alto" | null;
  } | null;
}

export type TipoFator = "positivo" | "neutro" | "negativo";
export interface Fator { grupo: string; descricao: string; pontos: number; tipo: TipoFator }

export type TipoAlerta = "regulatorio" | "logistico" | "prazo" | "dados" | "bloqueio";
export interface Alerta { tipo: TipoAlerta; mensagem: string }

export interface ScoreResultado { score: number; fatores: Fator[]; alertas: Alerta[] }

const REGRAS_REGULATORIAS: ReadonlyArray<{ termos: string[]; mensagem: string }> = [
  { termos: ["medicamento", "farmac", "hospitalar", "odontolog", "laborator", "saneante", "correlato"], mensagem: "Pode exigir AFE/licença sanitária (ANVISA/Vigilância Sanitária)." },
  { termos: ["combustive", "gasolina", "diesel", "etanol", "gas glp", "botijao"], mensagem: "Revenda de combustíveis/GLP exige autorização da ANP." },
  { termos: ["arma", "municao", "explosiv", "fogos de artificio"], mensagem: "Produto controlado (Exército/Polícia Federal)." },
  { termos: ["agrotoxico", "defensivo agricola", "fertilizante"], mensagem: "Pode exigir registro no MAPA/órgão estadual." },
  { termos: ["obra", "engenharia", "reforma", "pavimentacao"], mensagem: "Pode exigir registro no CREA/CAU e responsável técnico." },
  { termos: ["generos alimenticios", "alimenticio", "merenda", "carne", "hortifruti"], mensagem: "Pode exigir alvará sanitário para manipulação/transporte de alimentos." },
];

const REGRAS_LOGISTICAS: ReadonlyArray<{ termos: string[]; mensagem: string }> = [
  { termos: ["instalacao", "montagem"], mensagem: "Objeto envolve instalação/montagem no local." },
  { termos: ["entrega parcelada", "entregas parceladas", "parceladamente"], mensagem: "Entregas parceladas: custo de frete recorrente." },
  { termos: ["prestacao de servico", "servicos de", "servico de"], mensagem: "Objeto parece ser serviço — confirme se é compatível com revenda." },
];

const DIA_MS = 86_400_000;

export function calcularScore(input: ScoreInput, agora: Date = new Date()): ScoreResultado {
  const fatores: Fator[] = [];
  const alertas: Alerta[] = [];
  const objeto = ` ${normalizar(input.objeto_compra)} `;

  // 1) Valor total estimado (nunca interpretado como valor de item)
  const v = input.valor_total_estimado;
  if (v === null || !Number.isFinite(v) || v <= 0) {
    fatores.push({ grupo: "Valor", descricao: "Valor total estimado não informado (pode ser sigiloso)", pontos: 0, tipo: "neutro" });
    alertas.push({ tipo: "dados", mensagem: "Valor total estimado ausente no PNCP." });
  } else if (v <= 5_000) {
    fatores.push({ grupo: "Valor", descricao: "Valor total até R$ 5 mil", pontos: 25, tipo: "positivo" });
  } else if (v <= 10_000) {
    fatores.push({ grupo: "Valor", descricao: "Valor total até R$ 10 mil", pontos: 20, tipo: "positivo" });
  } else if (v <= VALOR_TETO_PERFIL) {
    fatores.push({ grupo: "Valor", descricao: "Valor total até R$ 15 mil", pontos: 15, tipo: "positivo" });
  } else {
    fatores.push({ grupo: "Valor", descricao: "Valor total acima do teto de R$ 15 mil", pontos: 0, tipo: "negativo" });
  }

  // 2) Localização (prioridade MG / RMBH)
  const uf = (input.uf_sigla ?? "").toUpperCase();
  if (uf === UF_PRIORITARIA && isBeloHorizonte(input.municipio_nome)) {
    fatores.push({ grupo: "Local", descricao: "Belo Horizonte", pontos: 25, tipo: "positivo" });
  } else if (uf === UF_PRIORITARIA && isRmbh(input.municipio_nome)) {
    fatores.push({ grupo: "Local", descricao: "Região Metropolitana de BH", pontos: 20, tipo: "positivo" });
  } else if (uf === UF_PRIORITARIA) {
    fatores.push({ grupo: "Local", descricao: "Minas Gerais, fora da RMBH", pontos: 12, tipo: "positivo" });
    alertas.push({ tipo: "logistico", mensagem: "Fora da RMBH: confira custo e prazo de frete." });
  } else {
    fatores.push({ grupo: "Local", descricao: `Fora de MG (${uf || "UF não informada"})`, pontos: 0, tipo: "negativo" });
    alertas.push({ tipo: "logistico", mensagem: "Entrega fora de Minas Gerais." });
  }

  // 3) Prazo para envio de proposta
  if (!input.data_encerramento_proposta) {
    fatores.push({ grupo: "Prazo", descricao: "Data de encerramento não informada", pontos: 0, tipo: "neutro" });
    alertas.push({ tipo: "dados", mensagem: "Data final de propostas ausente." });
  } else {
    const dias = (new Date(input.data_encerramento_proposta).getTime() - agora.getTime()) / DIA_MS;
    if (dias < 0) {
      fatores.push({ grupo: "Prazo", descricao: "Propostas encerradas", pontos: 0, tipo: "negativo" });
      alertas.push({ tipo: "prazo", mensagem: "Prazo de propostas já encerrado." });
    } else if (dias < 2) {
      fatores.push({ grupo: "Prazo", descricao: "Encerra em menos de 2 dias", pontos: 4, tipo: "neutro" });
      alertas.push({ tipo: "prazo", mensagem: "Prazo curto: menos de 48h para cotar." });
    } else if (dias < 5) {
      fatores.push({ grupo: "Prazo", descricao: "Encerra em 2 a 5 dias", pontos: 12, tipo: "positivo" });
    } else {
      fatores.push({ grupo: "Prazo", descricao: "5 dias ou mais para cotar", pontos: 20, tipo: "positivo" });
    }
  }

  // 4) Modalidade
  if (input.modalidade_id === 8) {
    fatores.push({ grupo: "Modalidade", descricao: "Dispensa (rito simplificado)", pontos: 15, tipo: "positivo" });
  } else if (input.modalidade_id === 6) {
    fatores.push({ grupo: "Modalidade", descricao: "Pregão eletrônico", pontos: 8, tipo: "positivo" });
  } else {
    fatores.push({ grupo: "Modalidade", descricao: "Outra modalidade", pontos: 3, tipo: "neutro" });
  }

  // 5) Transparência de itens
  if (input.itens_verificados) {
    fatores.push({ grupo: "Itens", descricao: "Itens verificados no PNCP", pontos: 5, tipo: "positivo" });
  } else {
    fatores.push({ grupo: "Itens", descricao: "Itens não verificados", pontos: 0, tipo: "neutro" });
  }

  // 6) Alertas por palavras-chave no objeto
  let penalRegulatoria = 0;
  for (const r of REGRAS_REGULATORIAS) {
    if (r.termos.some((t) => objeto.includes(t))) {
      alertas.push({ tipo: "regulatorio", mensagem: r.mensagem });
      penalRegulatoria += 10;
    }
  }
  if (penalRegulatoria > 0) {
    const pontos = -Math.min(penalRegulatoria, 20);
    fatores.push({ grupo: "Regulatório", descricao: "Possíveis exigências regulatórias", pontos, tipo: "negativo" });
  }
  let penalLogistica = 0;
  for (const r of REGRAS_LOGISTICAS) {
    if (r.termos.some((t) => objeto.includes(t))) {
      alertas.push({ tipo: "logistico", mensagem: r.mensagem });
      penalLogistica += 5;
    }
  }
  if (input.srp) {
    alertas.push({ tipo: "logistico", mensagem: "Registro de preços: quantidades não são garantidas." });
    penalLogistica += 5;
  }
  if (penalLogistica > 0) {
    fatores.push({ grupo: "Logística", descricao: "Pontos logísticos de atenção", pontos: -Math.min(penalLogistica, 15), tipo: "negativo" });
  }

  // 7) Avaliação manual do usuário
  const a = input.avaliacao;
  if (a) {
    if (a.impedimento_regulatorio === true) {
      fatores.push({ grupo: "Avaliação", descricao: "Impedimento regulatório marcado por você", pontos: -40, tipo: "negativo" });
      alertas.push({ tipo: "bloqueio", mensagem: "Você marcou impedimento regulatório para esta oportunidade." });
    }
    if (a.documentacao_ok === false) {
      fatores.push({ grupo: "Avaliação", descricao: "Documentação de habilitação pendente", pontos: -15, tipo: "negativo" });
      alertas.push({ tipo: "bloqueio", mensagem: "Documentação de habilitação marcada como pendente." });
    }
    if (a.capacidade_entrega === false) {
      fatores.push({ grupo: "Avaliação", descricao: "Sem capacidade de entrega", pontos: -15, tipo: "negativo" });
      alertas.push({ tipo: "logistico", mensagem: "Você indicou que não consegue entregar." });
    }
    if (a.risco_logistico === "alto") {
      fatores.push({ grupo: "Avaliação", descricao: "Risco logístico alto", pontos: -10, tipo: "negativo" });
    } else if (a.risco_logistico === "medio") {
      fatores.push({ grupo: "Avaliação", descricao: "Risco logístico médio", pontos: -5, tipo: "negativo" });
    }
    if (a.documentacao_ok === true && a.capacidade_entrega === true && a.impedimento_regulatorio !== true) {
      fatores.push({ grupo: "Avaliação", descricao: "Checagem manual positiva", pontos: 10, tipo: "positivo" });
    }
  }

  const bruto = fatores.reduce((acc, f) => acc + f.pontos, 0);
  return { score: Math.max(0, Math.min(100, bruto)), fatores, alertas };
}

export function faixaScore(score: number): "alto" | "medio" | "baixo" {
  if (score >= 70) return "alto";
  if (score >= 45) return "medio";
  return "baixo";
}
