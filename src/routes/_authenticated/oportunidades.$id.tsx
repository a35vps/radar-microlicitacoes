import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, ErrorState, LoadingRows, PageHeader } from "@/components/shared/states";
import { contratacaoQuery } from "@/lib/queries";
import { formatBRL, formatData, prazoRelativo } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/oportunidades/$id")({
  component: OportunidadePage,
});

function OportunidadePage() {
  const { id } = Route.useParams();
  const query = useQuery(contratacaoQuery(id));

  if (query.isPending) return <LoadingRows linhas={5} />;
  if (query.isError) return <ErrorState mensagem="Não foi possível carregar esta oportunidade." onRetry={() => void query.refetch()} />;
  if (!query.data.contratacao) return <EmptyState titulo="Oportunidade não encontrada" descricao="Ela pode ter sido removida ou ainda não foi sincronizada." />;

  const c = query.data.contratacao;
  return (
    <>
      <Button asChild variant="ghost" className="mb-4 -ml-3"><Link to="/painel"><ArrowLeft /> Voltar ao painel</Link></Button>
      <PageHeader titulo={c.objeto_compra} descricao={`${c.orgao_razao_social ?? "Órgão não informado"} · ${c.municipio_nome ?? "Município não informado"}/${c.uf_sigla ?? "—"}`} />
      <div className="grid gap-4 md:grid-cols-2">
        <Card><CardHeader><CardTitle>Resumo oficial</CardTitle></CardHeader><CardContent className="space-y-3 text-sm">
          <p><strong>Valor total estimado:</strong> {formatBRL(c.valor_total_estimado)}</p>
          <p><strong>Modalidade:</strong> {c.modalidade_nome ?? "Não informada"}</p>
          <p><strong>Abertura:</strong> {formatData(c.data_abertura_proposta)}</p>
          <p><strong>Encerramento:</strong> {formatData(c.data_encerramento_proposta)} · {prazoRelativo(c.data_encerramento_proposta)}</p>
          <Button asChild variant="outline"><a href={c.url_pncp ?? "#"} target="_blank" rel="noreferrer">Abrir fonte oficial</a></Button>
        </CardContent></Card>
        <Card><CardHeader><CardTitle>Itens e avaliação</CardTitle></CardHeader><CardContent className="space-y-3 text-sm">
          <p>{query.data.detalhes?.itens_status === "verificado" ? "Itens verificados no PNCP." : "Itens não verificados: confira o edital oficial."}</p>
          <p className="text-muted-foreground">Lucro e margem ficam bloqueados até o cadastro de uma cotação real.</p>
          <Button asChild><a href={c.url_pncp ?? "#"} target="_blank" rel="noreferrer">Conferir edital</a></Button>
        </CardContent></Card>
      </div>
    </>
  );
}

