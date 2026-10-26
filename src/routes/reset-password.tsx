import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Redefinir senha — Radar de Microlicitações" },
      { name: "description", content: "Defina uma nova senha de acesso." },
      { property: "og:title", content: "Redefinir senha — Radar de Microlicitações" },
      { property: "og:description", content: "Defina uma nova senha de acesso." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [senha, setSenha] = useState("");
  const [pronto, setPronto] = useState(false);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    // O link de recuperação abre uma sessão temporária (type=recovery no hash).
    if (window.location.hash.includes("type=recovery")) setPronto(true);
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setPronto(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (senha.length < 8) { toast.error("A senha precisa ter ao menos 8 caracteres."); return; }
    setCarregando(true);
    const { error } = await supabase.auth.updateUser({ password: senha });
    setCarregando(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Senha atualizada.");
    await navigate({ to: "/painel", replace: true });
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 rounded-xl border bg-card p-6 shadow-card">
        <h1 className="text-xl font-bold">Nova senha</h1>
        {!pronto && <p className="text-sm text-muted-foreground">Abra esta página pelo link enviado ao seu e-mail.</p>}
        <div className="space-y-1.5">
          <Label htmlFor="senha">Nova senha</Label>
          <Input id="senha" type="password" autoComplete="new-password" value={senha} onChange={(e) => setSenha(e.target.value)} disabled={!pronto} />
        </div>
        <Button type="submit" className="w-full" disabled={!pronto || carregando}>
          {carregando && <Loader2 className="animate-spin" />} Salvar senha
        </Button>
      </form>
    </main>
  );
}
