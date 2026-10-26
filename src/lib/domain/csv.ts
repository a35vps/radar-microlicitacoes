/**
 * Geração de CSV compatível com Excel pt-BR: separador ";", BOM UTF-8,
 * decimais com vírgula e aspas escapadas. Campos ausentes ficam vazios.
 */
export type CelulaCsv = string | number | boolean | null | undefined;

function celula(v: CelulaCsv): string {
  if (v === null || v === undefined) return "";
  let s: string;
  if (typeof v === "number") s = Number.isFinite(v) ? String(v).replace(".", ",") : "";
  else if (typeof v === "boolean") s = v ? "sim" : "não";
  else s = v;
  // Evita injeção de fórmulas ao abrir no Excel/Sheets.
  if (/^[=+\-@]/.test(s) && typeof v === "string") s = `'${s}`;
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function gerarCsv(cabecalho: string[], linhas: CelulaCsv[][]): string {
  const corpo = [cabecalho, ...linhas].map((l) => l.map(celula).join(";")).join("\r\n");
  return `\uFEFF${corpo}`;
}

export function baixarCsv(nomeArquivo: string, conteudo: string): void {
  const blob = new Blob([conteudo], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeArquivo;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
