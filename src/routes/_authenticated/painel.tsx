import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, EmptyState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/painel")({
  component: PainelPage,
});

function PainelPage() {
  return (
    <>
      <PageHeader
        titulo="Painel de oportunidades"
        descricao="Acompanhe compras públicas do PNCP de até R$ 15 mil."
        acoes={<Button asChild><Link to="/sincronizacao">Sincronizar PNCP</Link></Button>}
      />
      <EmptyState
        titulo="Nenhuma oportunidade carregada"
        descricao="Execute uma sincronização para buscar dados oficiais ou mantenha o modo de demonstração ativo nas configurações."
        acao={<Button asChild variant="outline"><Link to="/sincronizacao">Ver sincronização</Link></Button>}
      />
    </>
  );
}

