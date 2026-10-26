import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, EmptyState } from "@/components/shared/states";

export const Route = createFileRoute("/_authenticated/fornecedores")({
  component: FornecedoresPage,
});

function FornecedoresPage() {
  return (
    <>
      <PageHeader titulo="Fornecedores" descricao="Cadastre fornecedores e custos para calcular suas cotações." />
      <EmptyState titulo="Nenhum fornecedor cadastrado" descricao="Os fornecedores cadastrados aparecerão aqui para uso nas cotações." />
    </>
  );
}

