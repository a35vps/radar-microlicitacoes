/**
 * Server functions (RPC) chamadas pelo navegador. Exigem usuário autenticado.
 * Módulos com service_role são carregados dinamicamente DENTRO do handler,
 * para nunca entrarem no bundle do cliente.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { UFS } from "@/lib/domain/constants";

const syncSchema = z.object({
  uf: z.enum(UFS),
  modalidades: z.array(z.number().int().min(1).max(20)).min(1).max(5),
  diasPublicacao: z.number().int().min(1).max(10),
  diasProposta: z.number().int().min(1).max(60),
});

export const sincronizarAgora = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => syncSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { executarSincronizacao, PARAMETROS_PADRAO } = await import("@/server/sync.server");
    return executarSincronizacao(
      "manual",
      { ...PARAMETROS_PADRAO, ...data, modalidades: [...new Set(data.modalidades)] },
      context.userId,
    );
  });

export const buscarDetalhesEdital = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ contratacaoId: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { buscarDetalhes } = await import("@/server/detalhes.server");
    return buscarDetalhes(data.contratacaoId);
  });
