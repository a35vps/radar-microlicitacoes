import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, EmptyState } from "@/components/shared/states";

export const Route = createFileRoute("/_authenticated/sincronizacao")({
  component: SincronizacaoPage,
});

function SincronizacaoPage() {
  return (
    <>
      <PageHeader titulo="Sincronização" descricao="Consulte os dados oficiais do PNCP no servidor." />
      <EmptyState titulo="Nenhuma sincronização executada" descricao="O histórico das consultas ao PNCP aparecerá aqui após a primeira execução." />
    </>
  );
}

