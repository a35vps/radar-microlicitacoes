-- Permite cadastrar cotações alternativas (vários fornecedores para o mesmo item)
-- sem somá-las: apenas as marcadas entram no cálculo de lucro/margem.
ALTER TABLE public.cotacoes ADD COLUMN incluir_no_calculo BOOLEAN NOT NULL DEFAULT true;