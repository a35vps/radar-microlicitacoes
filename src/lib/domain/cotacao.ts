/**
 * Cálculo financeiro de cotações.
 * TODOS os insumos são digitados pelo usuário — nada é estimado ou inventado.
 * O valor total estimado da contratação NUNCA é usado como preço de item.
 */

export interface CotacaoInput {
  quantidade: number;
  custo_unitario: number;
  frete: number;
  /** Percentual de impostos sobre a receita (ex.: alíquota do Simples). */
  impostos_percent: number;
  taxas: number;
  custo_fixo_rateado: number;
  preco_venda_unitario: number;
  prazo_pagamento_dias: number;
}

export interface CotacaoResultado {
  receita: number;
  custoMercadoria: number;
  impostos: number;
  custoTotal: number;
  lucro: number;
  /** null quando a receita é zero (margem indefinida). */
  margemPercent: number | null;
  /** Desembolso antes do recebimento: mercadoria + frete + taxas + custo fixo. */
  capitalGiro: number;
  prazoPagamentoDias: number;
}

const arred = (v: number): number => Math.round(v * 100) / 100;

export function calcularCotacao(c: CotacaoInput): CotacaoResultado {
  const receita = c.preco_venda_unitario * c.quantidade;
  const custoMercadoria = c.custo_unitario * c.quantidade;
  const impostos = receita * (c.impostos_percent / 100);
  const desembolso = custoMercadoria + c.frete + c.taxas + c.custo_fixo_rateado;
  const custoTotal = desembolso + impostos;
  const lucro = receita - custoTotal;
  return {
    receita: arred(receita),
    custoMercadoria: arred(custoMercadoria),
    impostos: arred(impostos),
    custoTotal: arred(custoTotal),
    lucro: arred(lucro),
    margemPercent: receita > 0 ? arred((lucro / receita) * 100) : null,
    capitalGiro: arred(desembolso),
    prazoPagamentoDias: c.prazo_pagamento_dias,
  };
}

export type ResumoCotacoes =
  | { bloqueado: true; motivo: string }
  | ({ bloqueado: false; quantidadeCotacoes: number; prazoPagamentoMaxDias: number } & Omit<
      CotacaoResultado,
      "prazoPagamentoDias"
    >);

/**
 * Consolida apenas as cotações marcadas para o cálculo.
 * Sem cotação cadastrada, o lucro fica bloqueado (não há base real).
 */
export function resumirCotacoes(
  cotacoes: ReadonlyArray<CotacaoInput & { incluir_no_calculo: boolean }>,
): ResumoCotacoes {
  const incluidas = cotacoes.filter((c) => c.incluir_no_calculo);
  if (cotacoes.length === 0) {
    return { bloqueado: true, motivo: "Cadastre ao menos uma cotação para estimar lucro e margem." };
  }
  if (incluidas.length === 0) {
    return { bloqueado: true, motivo: "Nenhuma cotação marcada para entrar no cálculo." };
  }
  const parciais = incluidas.map(calcularCotacao);
  const soma = (k: keyof Omit<CotacaoResultado, "margemPercent" | "prazoPagamentoDias">) =>
    arred(parciais.reduce((acc, p) => acc + p[k], 0));
  const receita = soma("receita");
  const lucro = soma("lucro");
  return {
    bloqueado: false,
    quantidadeCotacoes: incluidas.length,
    receita,
    custoMercadoria: soma("custoMercadoria"),
    impostos: soma("impostos"),
    custoTotal: soma("custoTotal"),
    lucro,
    margemPercent: receita > 0 ? arred((lucro / receita) * 100) : null,
    capitalGiro: soma("capitalGiro"),
    prazoPagamentoMaxDias: Math.max(...parciais.map((p) => p.prazoPagamentoDias)),
  };
}
