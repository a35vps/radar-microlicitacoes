export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      avaliacoes: {
        Row: {
          capacidade_entrega: boolean | null
          contratacao_id: string
          created_at: string
          distancia_km: number | null
          documentacao_ok: boolean | null
          favorito: boolean
          id: string
          impedimento_descricao: string | null
          impedimento_regulatorio: boolean | null
          notas: string | null
          risco_logistico: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          capacidade_entrega?: boolean | null
          contratacao_id: string
          created_at?: string
          distancia_km?: number | null
          documentacao_ok?: boolean | null
          favorito?: boolean
          id?: string
          impedimento_descricao?: string | null
          impedimento_regulatorio?: boolean | null
          notas?: string | null
          risco_logistico?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          capacidade_entrega?: boolean | null
          contratacao_id?: string
          created_at?: string
          distancia_km?: number | null
          documentacao_ok?: boolean | null
          favorito?: boolean
          id?: string
          impedimento_descricao?: string | null
          impedimento_regulatorio?: boolean | null
          notas?: string | null
          risco_logistico?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "avaliacoes_contratacao_id_fkey"
            columns: ["contratacao_id"]
            isOneToOne: false
            referencedRelation: "contratacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      contratacao_detalhes: {
        Row: {
          arquivos: Json | null
          arquivos_status: string
          contratacao_id: string
          created_at: string
          erro: string | null
          fetched_at: string
          itens: Json | null
          itens_status: string
          updated_at: string
        }
        Insert: {
          arquivos?: Json | null
          arquivos_status: string
          contratacao_id: string
          created_at?: string
          erro?: string | null
          fetched_at?: string
          itens?: Json | null
          itens_status: string
          updated_at?: string
        }
        Update: {
          arquivos?: Json | null
          arquivos_status?: string
          contratacao_id?: string
          created_at?: string
          erro?: string | null
          fetched_at?: string
          itens?: Json | null
          itens_status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contratacao_detalhes_contratacao_id_fkey"
            columns: ["contratacao_id"]
            isOneToOne: true
            referencedRelation: "contratacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      contratacoes: {
        Row: {
          amparo_legal_nome: string | null
          ano_compra: number
          categoria: string
          created_at: string
          data_abertura_proposta: string | null
          data_atualizacao_pncp: string | null
          data_encerramento_proposta: string | null
          data_publicacao_pncp: string | null
          first_seen_at: string
          id: string
          informacao_complementar: string | null
          is_demo: boolean
          last_synced_at: string
          link_sistema_origem: string | null
          modalidade_id: number | null
          modalidade_nome: string | null
          modo_disputa_nome: string | null
          municipio_ibge: string | null
          municipio_nome: string | null
          numero_compra: string | null
          numero_controle_pncp: string
          objeto_compra: string
          orgao_cnpj: string
          orgao_esfera: string | null
          orgao_razao_social: string
          processo: string | null
          raw: Json | null
          sequencial_compra: number
          situacao_compra_nome: string | null
          srp: boolean | null
          uf_sigla: string | null
          unidade_nome: string | null
          updated_at: string
          url_pncp: string
          valor_total_estimado: number | null
          valor_total_homologado: number | null
        }
        Insert: {
          amparo_legal_nome?: string | null
          ano_compra: number
          categoria?: string
          created_at?: string
          data_abertura_proposta?: string | null
          data_atualizacao_pncp?: string | null
          data_encerramento_proposta?: string | null
          data_publicacao_pncp?: string | null
          first_seen_at?: string
          id?: string
          informacao_complementar?: string | null
          is_demo?: boolean
          last_synced_at?: string
          link_sistema_origem?: string | null
          modalidade_id?: number | null
          modalidade_nome?: string | null
          modo_disputa_nome?: string | null
          municipio_ibge?: string | null
          municipio_nome?: string | null
          numero_compra?: string | null
          numero_controle_pncp: string
          objeto_compra: string
          orgao_cnpj: string
          orgao_esfera?: string | null
          orgao_razao_social: string
          processo?: string | null
          raw?: Json | null
          sequencial_compra: number
          situacao_compra_nome?: string | null
          srp?: boolean | null
          uf_sigla?: string | null
          unidade_nome?: string | null
          updated_at?: string
          url_pncp: string
          valor_total_estimado?: number | null
          valor_total_homologado?: number | null
        }
        Update: {
          amparo_legal_nome?: string | null
          ano_compra?: number
          categoria?: string
          created_at?: string
          data_abertura_proposta?: string | null
          data_atualizacao_pncp?: string | null
          data_encerramento_proposta?: string | null
          data_publicacao_pncp?: string | null
          first_seen_at?: string
          id?: string
          informacao_complementar?: string | null
          is_demo?: boolean
          last_synced_at?: string
          link_sistema_origem?: string | null
          modalidade_id?: number | null
          modalidade_nome?: string | null
          modo_disputa_nome?: string | null
          municipio_ibge?: string | null
          municipio_nome?: string | null
          numero_compra?: string | null
          numero_controle_pncp?: string
          objeto_compra?: string
          orgao_cnpj?: string
          orgao_esfera?: string | null
          orgao_razao_social?: string
          processo?: string | null
          raw?: Json | null
          sequencial_compra?: number
          situacao_compra_nome?: string | null
          srp?: boolean | null
          uf_sigla?: string | null
          unidade_nome?: string | null
          updated_at?: string
          url_pncp?: string
          valor_total_estimado?: number | null
          valor_total_homologado?: number | null
        }
        Relationships: []
      }
      cotacoes: {
        Row: {
          contratacao_id: string
          created_at: string
          custo_fixo_rateado: number
          custo_unitario: number
          descricao_item: string
          fornecedor_id: string | null
          frete: number
          id: string
          impostos_percent: number
          incluir_no_calculo: boolean
          observacoes: string | null
          prazo_pagamento_dias: number
          preco_venda_unitario: number
          quantidade: number
          taxas: number
          updated_at: string
          user_id: string
        }
        Insert: {
          contratacao_id: string
          created_at?: string
          custo_fixo_rateado: number
          custo_unitario: number
          descricao_item: string
          fornecedor_id?: string | null
          frete: number
          id?: string
          impostos_percent: number
          incluir_no_calculo?: boolean
          observacoes?: string | null
          prazo_pagamento_dias: number
          preco_venda_unitario: number
          quantidade: number
          taxas: number
          updated_at?: string
          user_id: string
        }
        Update: {
          contratacao_id?: string
          created_at?: string
          custo_fixo_rateado?: number
          custo_unitario?: number
          descricao_item?: string
          fornecedor_id?: string | null
          frete?: number
          id?: string
          impostos_percent?: number
          incluir_no_calculo?: boolean
          observacoes?: string | null
          prazo_pagamento_dias?: number
          preco_venda_unitario?: number
          quantidade?: number
          taxas?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cotacoes_contratacao_id_fkey"
            columns: ["contratacao_id"]
            isOneToOne: false
            referencedRelation: "contratacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cotacoes_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
        ]
      }
      fornecedores: {
        Row: {
          cidade: string | null
          cnpj: string | null
          contato: string | null
          created_at: string
          deleted_at: string | null
          email: string | null
          id: string
          nome: string
          observacoes: string | null
          telefone: string | null
          uf: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cidade?: string | null
          cnpj?: string | null
          contato?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          telefone?: string | null
          uf?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cidade?: string | null
          cnpj?: string | null
          contato?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          telefone?: string | null
          uf?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sync_runs: {
        Row: {
          created_at: string
          erros: Json
          finished_at: string | null
          id: string
          paginas_lidas: number
          params: Json | null
          registros_gravados: number
          registros_ignorados: number
          registros_recebidos: number
          started_at: string
          status: string
          trigger: string
          triggered_by: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          erros?: Json
          finished_at?: string | null
          id?: string
          paginas_lidas?: number
          params?: Json | null
          registros_gravados?: number
          registros_ignorados?: number
          registros_recebidos?: number
          started_at?: string
          status?: string
          trigger: string
          triggered_by?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          erros?: Json
          finished_at?: string | null
          id?: string
          paginas_lidas?: number
          params?: Json | null
          registros_gravados?: number
          registros_ignorados?: number
          registros_recebidos?: number
          started_at?: string
          status?: string
          trigger?: string
          triggered_by?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
