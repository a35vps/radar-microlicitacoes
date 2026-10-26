import { normalizar, type Categoria } from "./constants";

/**
 * Classificação heurística de categoria a partir do texto do objeto.
 * O PNCP não fornece categoria de mercado na contratação; por isso a
 * categoria é sempre apresentada na interface como "inferida".
 * A ordem importa: a primeira regra que casar vence.
 */
const REGRAS: ReadonlyArray<{ categoria: Categoria; termos: string[] }> = [
  { categoria: "saude", termos: ["medicamento", "hospitalar", "odontolog", "farmac", "enfermagem", "laborator", "medico", "saude"] },
  { categoria: "informatica", termos: ["informatica", "computador", "notebook", "impressora", "toner", "cartucho", "mouse", "teclado", "monitor", "software", "periferico", "nobreak"] },
  { categoria: "escritorio", termos: ["expediente", "escritorio", "papelaria", "papel a4", "caneta", "grampeador", "envelope"] },
  { categoria: "limpeza", termos: ["limpeza", "higiene", "detergente", "desinfetante", "sabao", "vassoura", "saco de lixo", "saneante", "descartave"] },
  { categoria: "alimentos", termos: ["generos alimenticios", "alimenticio", "alimento", "merenda", "cafe", "acucar", "lanche", "hortifruti", "carne"] },
  { categoria: "veiculos", termos: ["veiculo", "pneu", "automotiv", "combustive", "oleo lubrificante", "pecas para"] },
  { categoria: "construcao", termos: ["construcao", "obra", "reforma", "engenharia", "cimento", "material eletrico", "hidraulic", "pavimentacao", "manutencao predial"] },
  { categoria: "mobiliario", termos: ["mobiliario", "moveis", "cadeira", "mesa", "armario", "estante"] },
  { categoria: "eletro", termos: ["eletrodomestic", "eletroeletronic", "ar condicionado", "geladeira", "refrigerador", "bebedouro", "ventilador", "televisor"] },
  { categoria: "vestuario", termos: ["uniforme", "vestuario", "camiseta", "calcado", "epi ", "equipamento de protecao"] },
  { categoria: "servicos", termos: ["prestacao de servico", "servicos de", "servico de", "contratacao de empresa especializada"] },
];

export function classificarCategoria(objeto: string | null | undefined): Categoria {
  const texto = ` ${normalizar(objeto)} `;
  for (const regra of REGRAS) {
    if (regra.termos.some((t) => texto.includes(t))) return regra.categoria;
  }
  return "outros";
}
