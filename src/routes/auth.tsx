import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import "@lovable.dev/cloud-auth-js/styles.css";

import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Logo } from "@/components/brand/logo";

const searchSchema = z.object({ redirect: z.string().optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Entrar — Radar de Microlicitações" },
      { name: "description", content: "Acesse seu painel de oportunidades de compras públicas." },
      { property: "og:title", content: "Entrar — Radar de Microlicitações" },
      { property: "og:description", content: "Acesse seu painel de oportunidades de compras públicas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

const credSchema = z.object({
  email: z.string().trim().email("E-mail inválido").max(255),
  senha: z.string().min(8, "A senha precisa ter ao menos 8 caracteres").max(72),
});

/** Aceita apenas caminhos internos para evitar redirecionamento aberto. */
function destinoSeguro(r: string | undefined): string {
  return r && r.startsWith("/") && !r.startsWith("//") ? r : "/painel";
}

function AuthPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const [modo, setModo] = useState<"entrar" | "cadastrar" | "recuperar">("entrar");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const destino = destinoSeguro(redirect);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setCarregando(true);
    try {
      if (modo === "recuperar") {
        const em = z.string().trim().email().safeParse(email);
        if (!em.success) throw new Error("Informe um e-mail válido.");
        const { error } = await supabase.auth.resetPasswordForEmail(em.data, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Se o e-mail existir, você receberá um link para redefinir a senha.");
        setModo("entrar");
        return;
      }
      const parsed = credSchema.safeParse({ email, senha });
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Dados inválidos");
      if (modo === "cadastrar") {
        const { data, error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.senha,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (!data.session) {
          toast.success("Conta criada! Confirme pelo link enviado ao seu e-mail.");
          setModo("entrar");
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.senha });
        if (error) throw new Error(error.message === "Invalid login credentials" ? "E-mail ou senha incorretos." : error.message);
      }
      await navigate({ to: destino, replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha na autenticação");
    } finally {
      setCarregando(false);
    }
  }

  async function social(provider: "google" | "lovable") {
    const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: window.location.origin + "/auth" });
    if (result.error) { toast.error("Não foi possível entrar. Tente novamente."); return; }
    if (result.redirected) return;
    await navigate({ to: destino, replace: true });
  }

  const titulo = { entrar: "Entrar no painel", cadastrar: "Criar conta", recuperar: "Recuperar senha" }[modo];

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-radar p-10 text-sidebar-foreground lg:flex lg:flex-col lg:justify-between">
        <div className="radar-grid absolute inset-0" aria-hidden />
        <Link to="/" className="relative"><Logo /></Link>
        <p className="relative max-w-md font-display text-3xl font-bold leading-tight text-sidebar-accent-foreground">
          Oportunidades de até R$ 15 mil, com foco em Minas Gerais.
        </p>
      </aside>

      <section className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
          <h1 className="text-2xl font-bold">{titulo}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Acesso restrito a usuários autenticados.</p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            {modo !== "recuperar" && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="senha">Senha</Label>
                  {modo === "entrar" && (
                    <button type="button" className="text-xs text-primary hover:underline" onClick={() => setModo("recuperar")}>
                      Esqueci a senha
                    </button>
                  )}
                </div>
                <Input id="senha" type="password" autoComplete={modo === "cadastrar" ? "new-password" : "current-password"} value={senha} onChange={(e) => setSenha(e.target.value)} required />
              </div>
            )}
            <Button type="submit" className="w-full" disabled={carregando}>
              {carregando && <Loader2 className="animate-spin" />}
              {modo === "entrar" ? "Entrar" : modo === "cadastrar" ? "Criar conta" : "Enviar link"}
            </Button>
          </form>

          {modo !== "recuperar" && (
            <>
              <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
                <Separator className="flex-1" /> ou <Separator className="flex-1" />
              </div>
              <div className="space-y-2">
                <Button variant="outline" className="w-full" onClick={() => void social("google")}>Continuar com Google</Button>
                <button type="button" className="lovable-auth-button w-full" onClick={() => void social("lovable")}>
                  Continuar com Lovable
                </button>
              </div>
            </>
          )}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {modo === "entrar" ? "Ainda não tem conta? " : "Já tem conta? "}
            <button type="button" className="font-medium text-primary hover:underline" onClick={() => setModo(modo === "entrar" ? "cadastrar" : "entrar")}>
              {modo === "entrar" ? "Criar conta" : "Entrar"}
            </button>
          </p>
        </div>
      </section>
    </main>
  );
}
