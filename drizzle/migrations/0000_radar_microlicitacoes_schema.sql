-- =====================================================================
-- Radar de Microlicitações — schema inicial
-- Dados PNCP (globais, somente leitura para usuários autenticados; escrita
-- apenas pelo coletor no servidor via service_role) + dados por usuário
-- (avaliações, fornecedores, cotações) isolados por RLS (auth.uid()).
-- =====================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------
-- Contratações coletadas do PNCP (deduplicadas por numero_controle_pncp)
-- ---------------------------------------------------------------------
CREATE TABLE public.contratacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_controle_pncp TEXT NOT NULL UNIQUE,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  orgao_cnpj TEXT NOT NULL,
  orgao_razao_social TEXT NOT NULL,
  orgao_esfera TEXT,
  unidade_nome TEXT,
  municipio_nome TEXT,
  municipio_ibge TEXT,
  uf_sigla TEXT,
  modalidade_id INTEGER,
  modalidade_nome TEXT,
  modo_disputa_nome TEXT,
  amparo_legal_nome TEXT,
  objeto_compra TEXT NOT NULL,
  informacao_complementar TEXT,
  categoria TEXT NOT NULL DEFAULT 'outros',
  valor_total_estimado NUMERIC(16,2),
  valor_total_homologado NUMERIC(16,2),
  data_abertura_proposta TIMESTAMPTZ,
  data_encerramento_proposta TIMESTAMPTZ,
  data_publicacao_pncp TIMESTAMPTZ,
  data_atualizacao_pncp TIMESTAMPTZ,
  situacao_compra_nome TEXT,
  srp BOOLEAN,
  ano_compra INTEGER NOT NULL,
  sequencial_compra INTEGER NOT NULL,
  numero_compra TEXT,
  processo TEXT,
  link_sistema_origem TEXT,
  url_pncp TEXT NOT NULL,
  raw JSONB,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.contratacoes TO authenticated;
GRANT ALL ON public.contratacoes TO service_role;
ALTER TABLE public.contratacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Autenticados leem contratações"
  ON public.contratacoes FOR SELECT TO authenticated USING (true);

CREATE INDEX idx_contratacoes_valor ON public.contratacoes (valor_total_estimado);
CREATE INDEX idx_contratacoes_uf_municipio ON public.contratacoes (uf_sigla, municipio_nome);
CREATE INDEX idx_contratacoes_encerramento ON public.contratacoes (data_encerramento_proposta);
CREATE INDEX idx_contratacoes_modalidade ON public.contratacoes (modalidade_id);
CREATE INDEX idx_contratacoes_categoria ON public.contratacoes (categoria);
CREATE INDEX idx_contratacoes_demo ON public.contratacoes (is_demo);

CREATE TRIGGER trg_contratacoes_updated BEFORE UPDATE ON public.contratacoes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------
-- Itens e arquivos do edital (cache obtido sob demanda no servidor)
-- ---------------------------------------------------------------------
CREATE TABLE public.contratacao_detalhes (
  contratacao_id UUID PRIMARY KEY REFERENCES public.contratacoes(id) ON DELETE CASCADE,
  itens JSONB,
  arquivos JSONB,
  itens_status TEXT NOT NULL CHECK (itens_status IN ('ok','vazio','erro','nao_verificado')),
  arquivos_status TEXT NOT NULL CHECK (arquivos_status IN ('ok','vazio','erro','nao_verificado')),
  erro TEXT,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.contratacao_detalhes TO authenticated;
GRANT ALL ON public.contratacao_detalhes TO service_role;
ALTER TABLE public.contratacao_detalhes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Autenticados leem detalhes"
  ON public.contratacao_detalhes FOR SELECT TO authenticated USING (true);
CREATE TRIGGER trg_detalhes_updated BEFORE UPDATE ON public.contratacao_detalhes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------
-- Log de sincronizações
-- ---------------------------------------------------------------------
CREATE TABLE public.sync_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger TEXT NOT NULL CHECK (trigger IN ('manual','agendado')),
  status TEXT NOT NULL DEFAULT 'executando' CHECK (status IN ('executando','sucesso','parcial','erro')),
  triggered_by UUID,
  params JSONB,
  paginas_lidas INTEGER NOT NULL DEFAULT 0,
  registros_recebidos INTEGER NOT NULL DEFAULT 0,
  registros_gravados INTEGER NOT NULL DEFAULT 0,
  registros_ignorados INTEGER NOT NULL DEFAULT 0,
  erros JSONB NOT NULL DEFAULT '[]'::jsonb,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.sync_runs TO authenticated;
GRANT ALL ON public.sync_runs TO service_role;
ALTER TABLE public.sync_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Autenticados leem sincronizações"
  ON public.sync_runs FOR SELECT TO authenticated USING (true);
CREATE INDEX idx_sync_runs_started ON public.sync_runs (started_at DESC);
CREATE TRIGGER trg_sync_runs_updated BEFORE UPDATE ON public.sync_runs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------
-- Avaliação manual por usuário (status, favorito, checagens)
-- ---------------------------------------------------------------------
CREATE TABLE public.avaliacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  contratacao_id UUID NOT NULL REFERENCES public.contratacoes(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'novo' CHECK (status IN ('novo','cotando','descartado','participar')),
  favorito BOOLEAN NOT NULL DEFAULT false,
  documentacao_ok BOOLEAN,
  capacidade_entrega BOOLEAN,
  impedimento_regulatorio BOOLEAN,
  impedimento_descricao TEXT,
  risco_logistico TEXT CHECK (risco_logistico IN ('baixo','medio','alto')),
  distancia_km NUMERIC(10,1),
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, contratacao_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.avaliacoes TO authenticated;
GRANT ALL ON public.avaliacoes TO service_role;
ALTER TABLE public.avaliacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Dono lê avaliações" ON public.avaliacoes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Dono cria avaliações" ON public.avaliacoes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Dono altera avaliações" ON public.avaliacoes FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Dono remove avaliações" ON public.avaliacoes FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX idx_avaliacoes_user ON public.avaliacoes (user_id);
CREATE INDEX idx_avaliacoes_contratacao ON public.avaliacoes (contratacao_id);
CREATE TRIGGER trg_avaliacoes_updated BEFORE UPDATE ON public.avaliacoes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------
-- Fornecedores (cadastrados pelo usuário — nunca gerados automaticamente)
-- ---------------------------------------------------------------------
CREATE TABLE public.fornecedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  nome TEXT NOT NULL CHECK (char_length(nome) BETWEEN 1 AND 200),
  cnpj TEXT CHECK (cnpj IS NULL OR char_length(cnpj) <= 20),
  contato TEXT,
  email TEXT,
  telefone TEXT,
  cidade TEXT,
  uf TEXT CHECK (uf IS NULL OR char_length(uf) = 2),
  observacoes TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.fornecedores TO authenticated;
GRANT ALL ON public.fornecedores TO service_role;
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Dono lê fornecedores" ON public.fornecedores FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Dono cria fornecedores" ON public.fornecedores FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Dono altera fornecedores" ON public.fornecedores FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Dono remove fornecedores" ON public.fornecedores FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX idx_fornecedores_user ON public.fornecedores (user_id);
CREATE TRIGGER trg_fornecedores_updated BEFORE UPDATE ON public.fornecedores
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------
-- Cotações (todos os valores digitados pelo usuário)
-- ---------------------------------------------------------------------
CREATE TABLE public.cotacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  contratacao_id UUID NOT NULL REFERENCES public.contratacoes(id) ON DELETE CASCADE,
  fornecedor_id UUID REFERENCES public.fornecedores(id) ON DELETE SET NULL,
  descricao_item TEXT NOT NULL CHECK (char_length(descricao_item) BETWEEN 1 AND 500),
  quantidade NUMERIC(14,4) NOT NULL CHECK (quantidade > 0),
  custo_unitario NUMERIC(14,2) NOT NULL CHECK (custo_unitario >= 0),
  frete NUMERIC(14,2) NOT NULL CHECK (frete >= 0),
  impostos_percent NUMERIC(6,2) NOT NULL CHECK (impostos_percent >= 0 AND impostos_percent <= 100),
  taxas NUMERIC(14,2) NOT NULL CHECK (taxas >= 0),
  custo_fixo_rateado NUMERIC(14,2) NOT NULL CHECK (custo_fixo_rateado >= 0),
  preco_venda_unitario NUMERIC(14,2) NOT NULL CHECK (preco_venda_unitario >= 0),
  prazo_pagamento_dias INTEGER NOT NULL CHECK (prazo_pagamento_dias >= 0 AND prazo_pagamento_dias <= 365),
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cotacoes TO authenticated;
GRANT ALL ON public.cotacoes TO service_role;
ALTER TABLE public.cotacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Dono lê cotações" ON public.cotacoes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Dono cria cotações" ON public.cotacoes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Dono altera cotações" ON public.cotacoes FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Dono remove cotações" ON public.cotacoes FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX idx_cotacoes_user ON public.cotacoes (user_id);
CREATE INDEX idx_cotacoes_contratacao ON public.cotacoes (contratacao_id);
CREATE INDEX idx_cotacoes_fornecedor ON public.cotacoes (fornecedor_id);
CREATE TRIGGER trg_cotacoes_updated BEFORE UPDATE ON public.cotacoes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------
-- DADOS DE DEMONSTRAÇÃO (fictícios, is_demo = true, prefixo DEMO-)
-- Nunca misturados aos reais: a interface oculta por padrão e marca "DEMO".
-- ---------------------------------------------------------------------
INSERT INTO public.contratacoes (numero_controle_pncp, is_demo, orgao_cnpj, orgao_razao_social, orgao_esfera, unidade_nome, municipio_nome, uf_sigla, modalidade_id, modalidade_nome, objeto_compra, categoria, valor_total_estimado, data_abertura_proposta, data_encerramento_proposta, data_publicacao_pncp, data_atualizacao_pncp, situacao_compra_nome, srp, ano_compra, sequencial_compra, url_pncp)
VALUES
('DEMO-0001', true, '00000000000000', 'ÓRGÃO FICTÍCIO DE DEMONSTRAÇÃO A', 'M', 'Unidade Demo', 'Belo Horizonte', 'MG', 8, 'Dispensa', '[DEMO] Aquisição de material de escritório (papel A4, canetas, grampeadores)', 'escritorio', 4800.00, now() - interval '1 day', now() + interval '6 days', now() - interval '1 day', now() - interval '1 day', 'Divulgada no PNCP', false, 2026, 1, 'https://pncp.gov.br/app/editais'),
('DEMO-0002', true, '00000000000000', 'ÓRGÃO FICTÍCIO DE DEMONSTRAÇÃO B', 'M', 'Unidade Demo', 'Contagem', 'MG', 8, 'Dispensa', '[DEMO] Aquisição de produtos de limpeza e higiene', 'limpeza', 9200.00, now() - interval '2 days', now() + interval '3 days', now() - interval '2 days', now() - interval '2 days', 'Divulgada no PNCP', false, 2026, 2, 'https://pncp.gov.br/app/editais'),
('DEMO-0003', true, '00000000000000', 'ÓRGÃO FICTÍCIO DE DEMONSTRAÇÃO C', 'E', 'Unidade Demo', 'Uberlândia', 'MG', 6, 'Pregão - Eletrônico', '[DEMO] Registro de preços para aquisição de medicamentos', 'saude', 14500.00, now() - interval '3 days', now() + interval '1 day', now() - interval '3 days', now() - interval '3 days', 'Divulgada no PNCP', true, 2026, 3, 'https://pncp.gov.br/app/editais'),
('DEMO-0004', true, '00000000000000', 'ÓRGÃO FICTÍCIO DE DEMONSTRAÇÃO D', 'M', 'Unidade Demo', 'São Paulo', 'SP', 8, 'Dispensa', '[DEMO] Aquisição de periféricos de informática (mouse, teclado)', 'informatica', NULL, now() - interval '1 day', now() + interval '10 days', now() - interval '1 day', now() - interval '1 day', 'Divulgada no PNCP', false, 2026, 4, 'https://pncp.gov.br/app/editais');
