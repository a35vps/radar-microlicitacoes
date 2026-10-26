import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Calculator, Filter, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Radar de Microlicitações — compras públicas até R$ 15 mil" },
      { name: "description", content: "Encontre dispensas e pregões de até R$ 15 mil no PNCP, priorizando Minas Gerais e a região de Belo Horizonte." },
      { property: "og:title", content: "Radar de Microlicitações" },
      { property: "og:description", content: "Monitore compras públicas de até R$ 15 mil no PNCP, com foco em MG e RMBH." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const RECURSOS = [
  { icon: Filter, titulo: "Filtro por perfil", texto: "Dados oficiais do PNCP filtrados até R$ 5, 10 ou 15 mil, com prioridade para MG e RMBH." },
  { icon: Calculator, titulo: "Cotações reais", texto: "Lucro e margem só aparecem depois que você cadastra custos reais dos seus fornecedores." },
  { icon: ShieldCheck, titulo: "Alertas claros", texto: "Score explicável com avisos de exigências regulatórias, prazo e logística." },
] as const;

function Landing() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-radar text-sidebar-foreground">
      <div className="radar-grid absolute inset-0 pointer-events-none" aria-hidden />
      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8">
        <header className="flex items-center justify-between">
          <Logo />
          <Button asChild variant="secondary" size="sm">
            <Link to="/auth">Entrar</Link>
          </Button>
        </header>

        <section className="flex flex-1 flex-col justify-center py-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-sidebar-primary">
            PNCP · Minas Gerais · Belo Horizonte
          </p>
          <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.05] text-sidebar-accent-foreground sm:text-6xl">
            Pequenas compras públicas, decisões com números reais.
          </h1>
          <p className="mt-6 max-w-xl text-base text-sidebar-foreground/80 sm:text-lg">
            Monitore contratações de até R$ 15 mil, avalie cada oportunidade e calcule sua margem
            a partir das suas próprias cotações — sem estimativas inventadas.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" variant="radar">
              <Link to="/auth">
                Acessar o painel <ArrowRight />
              </Link>
            </Button>
          </div>

          <div className="mt-16 grid gap-4 sm:grid-cols-3">
            {RECURSOS.map((r) => (
              <div key={r.titulo} className="rounded-xl border border-sidebar-border bg-sidebar-accent/60 p-5 backdrop-blur">
                <r.icon className="size-5 text-sidebar-primary" aria-hidden />
                <h2 className="mt-3 text-base font-semibold text-sidebar-accent-foreground">{r.titulo}</h2>
                <p className="mt-1 text-sm text-sidebar-foreground/75">{r.texto}</p>
              </div>
            ))}
          </div>
        </section>

        <footer className="text-xs text-sidebar-foreground/60">
          Fonte: Portal Nacional de Contratações Públicas (API pública de consulta). Este sistema não envia
          propostas nem lances automaticamente.
        </footer>
      </div>
    </main>
  );
}
