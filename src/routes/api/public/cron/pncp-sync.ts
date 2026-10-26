import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";

/**
 * Endpoint de sincronização agendada. Público apenas no caminho: toda
 * requisição é autenticada pelo segredo gerenciado do agendador.
 */
export const Route = createFileRoute("/api/public/cron/pncp-sync")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authFailure = await authenticateCronRequest(request);
        if (authFailure) return authFailure;
        try {
          const { executarSincronizacao, PARAMETROS_PADRAO } = await import("@/server/sync.server");
          const r = await executarSincronizacao("agendado", PARAMETROS_PADRAO, null);
          return Response.json({ ok: true, status: r.status, gravados: r.gravados, erros: r.erros.length });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          console.error(`[cron] sincronização falhou: ${msg}`);
          return Response.json({ ok: false, erro: msg }, { status: 500 });
        }
      },
    },
  },
});
