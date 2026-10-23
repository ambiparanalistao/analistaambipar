export type MaintenanceRole='admin_geral'|'admin_empresa'|'analista_transporte'|'supervisor'|'operador_logistico'|'motorista'|'cliente';
// Stage 1 schema snapshot, maintained from the reviewed migrations.
// This is scoped to the new tenant/maintenance tables, not a generated snapshot of production.
// Dates/timestamps are ISO strings; money uses PostgreSQL numeric, serialized by supabase-js as number.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];
export type Enums = {
  partner_type: "oficina_mecanica" | "eletrica" | "funilaria_pintura" | "borracharia" | "concessionaria" | "auto_center" | "guincho_socorro" | "lavagem" | "tacografo_rastreador" | "outros";
  partner_status: "ativo" | "inativo" | "bloqueado";
  maintenance_type: "preventiva" | "corretiva" | "preditiva" | "sinistro" | "revisao" | "inspecao" | "pneus";
  priority_level: "baixa" | "media" | "alta" | "critica";
  order_status: "aberta" | "aguardando_orcamento" | "orcamento_aprovado" | "em_transito" | "na_oficina" | "em_execucao" | "aguardando_peca" | "concluido" | "veiculo_retirado" | "encerrada" | "cancelada";
  occurrence_severity: "leve" | "moderada" | "grave" | "critica";
};

export interface MaintenanceRows {
  maintenance_partner_requests: {id:string;company_id:string;request_id:string;protocol:string;cnpj:string;payload:Json;status:'pendente'|'aprovada'|'recusada';submitted_at:string;consent_version:string;reviewed_at:string|null;reviewed_by:string|null;review_note:string|null;partner_id:string|null};
  maintenance_partner_request_audit: {id:string;company_id:string;request_id:string;actor_id:string|null;action:string;occurred_at:string;note:string|null};
  companies: {
    id: string;
    company_id: string;
    nome: string;
    ativo: boolean;
    created_at: string;
    updated_at: string;
    created_by: string;
  };
  company_members: {
    id: string;
    company_id: string;
    created_at: string;
    updated_at: string;
    created_by: string;
    user_id: string;
    maintenance_role: MaintenanceRole | null;
    full_module_access: boolean;
    role: "analista" | "gestor" | "auditor" | "administrador";
    ativo: boolean;
  };
  maintenance_partners: {
    onboarding_profile: Json;
    id: string;
    company_id: string;
    created_at: string;
    updated_at: string;
    created_by: string;
    razao_social: string;
    nome_fantasia: string | null;
    cnpj_cpf: string | null;
    tipo: Enums['partner_type'];
    especialidades: string[];
    tipos_veiculo_atendidos: string[];
    contato_nome: string | null;
    telefone: string | null;
    whatsapp: string | null;
    email: string | null;
    cep: string | null;
    logradouro: string | null;
    numero: string | null;
    complemento: string | null;
    bairro: string | null;
    cidade: string | null;
    estado: string | null;
    pais: string;
    latitude: number | null;
    longitude: number | null;
    atende_24h: boolean;
    version: number;
    horario_funcionamento: Json;
    possui_guincho: boolean;
    valor_hora_mao_obra: number;
    prazo_pagamento_dias: number;
    desconto_percentual: number;
    status: Enums['partner_status'];
    motivo_bloqueio: string | null;
    avaliacao_interna: number | null;
    sla_medio_dias: number | null;
  };
  maintenance_orders: {
    responsavel_id: string|null;
    version: number;
    km_abertura: number | null;
    decisao_por: string | null;
    decisao_em: string | null;
    id: string;
    company_id: string;
    created_at: string;
    updated_at: string;
    created_by: string;
    numero: string;
    vehicle_id: string;
    partner_id: string;
    driver_id: string | null;
    tipo: Enums['maintenance_type'];
    prioridade: Enums['priority_level'];
    status: Enums['order_status'];
    descricao_problema: string;
    diagnostico: string | null;
    servicos_executados: string | null;
    km_entrada: number | null;
    km_saida: number | null;
    horimetro: number | null;
    data_abertura: string;
    previsao_entrega: string | null;
    data_entrada_oficina: string | null;
    data_saida_oficina: string | null;
    encerrada_em: string | null;
    orcamento_status: "pendente" | "aprovado" | "reprovado";
    aprovado_por: string | null;
    aprovado_em: string | null;
    valor_pecas: number;
    valor_mao_obra: number;
    valor_total: number | null;
    observacoes: string | null;
  };
  maintenance_order_items: {
    id: string;
    company_id: string;
    created_at: string;
    updated_at: string;
    created_by: string;
    order_id: string;
    tipo: "peca" | "servico";
    descricao: string;
    quantidade: number;
    valor_unitario: number;
    garantia_dias: number;
  };
  maintenance_order_timeline: {
    id: string;
    company_id: string;
    created_at: string;
    updated_at: string;
    created_by: string;
    order_id: string;
    dados: Json | null;
    tipo_evento: "mudanca_status" | "mensagem" | "anexo" | "chegada" | "saida" | "aprovacao" | "comentario";
    status_anterior: Enums['order_status'] | null;
    status_novo: Enums['order_status'] | null;
    descricao: string;
    usuario_id: string;
  };
  workshop_visits: {
    id: string;
    company_id: string;
    created_at: string;
    updated_at: string;
    created_by: string;
    vehicle_id: string;
    order_id: string;
    partner_id: string;
    chegada_em: string;
    saida_em: string | null;
    km_chegada: number | null;
    km_saida: number | null;
    foto_chegada_url: string | null;
    foto_saida_url: string | null;
    registrado_por: string;
    downtime_horas: number | null;
  };
  vehicle_occurrences: {
    id: string;
    company_id: string;
    created_at: string;
    updated_at: string;
    created_by: string;
    vehicle_id: string;
    driver_id: string | null;
    order_id: string | null;
    tipo: "quebra" | "acidente" | "pane_eletrica" | "pneu" | "sinistro" | "outros";
    gravidade: Enums['occurrence_severity'];
    descricao: string;
    local: string | null;
    latitude: number | null;
    longitude: number | null;
    ocorreu_em: string;
    fotos: string[];
  };
  maintenance_messages: {
    situacao:'preparada'|'confirmada'|'registrada';assunto:string|null;destinatario:string|null;efetivada_em:string|null;request_id:string|null;
    id: string;
    company_id: string;
    created_at: string;
    updated_at: string;
    created_by: string;
    order_id: string;
    partner_id: string;
    direcao: "enviada" | "recebida";
    canal: "whatsapp" | "email" | "interno";
    conteudo: string;
    enviado_por: string;
  };
  maintenance_plans: {
    version: number;
    id: string;
    company_id: string;
    created_at: string;
    updated_at: string;
    created_by: string;
    vehicle_id: string | null;
    categoria_veiculo: string | null;
    nome: string;
    intervalo_km: number | null;
    intervalo_dias: number | null;
    ultima_execucao_km: number | null;
    ultima_execucao_data: string | null;
    proxima_km: number | null;
    proxima_data: string | null;
    ativo: boolean;
  };
  maintenance_attachments: {
    id: string;
    company_id: string;
    created_at: string;
    updated_at: string;
    created_by: string;
    order_id: string;
    tipo: "foto_antes" | "foto_depois" | "orcamento" | "nota_fiscal" | "outros";
    url: string;
    nome: string;
    enviado_por: string;
  };
  maintenance_message_templates: {
    version:number;
    id: string;
    company_id: string;
    created_at: string;
    updated_at: string;
    created_by: string;
    nome: string;
    categoria: string;
    conteudo: string;
    ativo: boolean;
  };
  maintenance_settings: {
    version:number;cobranca_ativa:boolean;cobranca_statuses:Enums['order_status'][];
    id: string;
    company_id: string;
    created_at: string;
    updated_at: string;
    created_by: string;
    limite_aprovacao_supervisor: number;
    antecedencia_alerta_dias: number;
    antecedencia_alerta_km: number;
    intervalo_cobranca_horas: number;
  };
}

export interface MaintenanceInserts {
  companies: {
    id?: string;
    company_id?: never;
    nome: string;
    ativo?: boolean;
    created_at?: string;
    updated_at?: string;
    created_by?: string;
  };
  company_members: {
    id?: string;
    company_id: string;
    created_at?: string;
    updated_at?: string;
    created_by?: string;
    user_id: string;
    maintenance_role?: MaintenanceRole | null;
    full_module_access?: boolean;
    role?: "analista" | "gestor" | "auditor" | "administrador";
    ativo?: boolean;
  };
  maintenance_partners: {
    id?: string;
    company_id: string;
    created_at?: string;
    updated_at?: string;
    created_by?: string;
    razao_social: string;
    nome_fantasia?: string | null;
    cnpj_cpf?: string | null;
    tipo?: Enums['partner_type'];
    especialidades?: string[];
    tipos_veiculo_atendidos?: string[];
    contato_nome?: string | null;
    telefone?: string | null;
    whatsapp?: string | null;
    email?: string | null;
    cep?: string | null;
    logradouro?: string | null;
    numero?: string | null;
    complemento?: string | null;
    bairro?: string | null;
    cidade?: string | null;
    estado?: string | null;
    pais?: string;
    latitude?: number | null;
    longitude?: number | null;
    atende_24h?: boolean;
    version?: never;
    horario_funcionamento?: Json;
    possui_guincho?: boolean;
    valor_hora_mao_obra?: number;
    prazo_pagamento_dias?: number;
    desconto_percentual?: number;
    status?: Enums['partner_status'];
    motivo_bloqueio?: string | null;
    avaliacao_interna?: number | null;
    sla_medio_dias?: never;
  };
  maintenance_orders: {
    id?: string;
    company_id: string;
    created_at?: string;
    updated_at?: string;
    created_by?: string;
    numero?: never;
    vehicle_id: string;
    partner_id: string;
    driver_id?: string | null;
    tipo?: Enums['maintenance_type'];
    prioridade?: Enums['priority_level'];
    status?: Enums['order_status'];
    descricao_problema: string;
    diagnostico?: string | null;
    servicos_executados?: string | null;
    km_entrada?: number | null;
    km_saida?: number | null;
    horimetro?: number | null;
    data_abertura?: string;
    previsao_entrega?: string | null;
    data_entrada_oficina?: string | null;
    data_saida_oficina?: string | null;
    encerrada_em?: never;
    orcamento_status?: "pendente" | "aprovado" | "reprovado";
    aprovado_por?: string | null;
    aprovado_em?: string | null;
    valor_pecas?: never;
    valor_mao_obra?: never;
    valor_total?: never;
    observacoes?: string | null;
  };
  maintenance_order_items: {
    id?: string;
    company_id: string;
    created_at?: string;
    updated_at?: string;
    created_by?: string;
    order_id: string;
    tipo: "peca" | "servico";
    descricao: string;
    quantidade: number;
    valor_unitario: number;
    garantia_dias?: number;
  };
  maintenance_order_timeline: {
    id?: string;
    company_id: string;
    created_at?: string;
    updated_at?: string;
    created_by?: string;
    order_id: string;
    tipo_evento: "mudanca_status" | "mensagem" | "anexo" | "chegada" | "saida" | "aprovacao" | "comentario";
    status_anterior?: Enums['order_status'] | null;
    status_novo?: Enums['order_status'] | null;
    descricao: string;
    usuario_id: string;
  };
  workshop_visits: {
    id?: string;
    company_id: string;
    created_at?: string;
    updated_at?: string;
    created_by?: string;
    vehicle_id: string;
    order_id: string;
    partner_id: string;
    chegada_em?: string;
    saida_em?: string | null;
    km_chegada?: number | null;
    km_saida?: number | null;
    foto_chegada_url?: string | null;
    foto_saida_url?: string | null;
    registrado_por?: string;
    downtime_horas?: never;
  };
  vehicle_occurrences: {
    id?: string;
    company_id: string;
    created_at?: string;
    updated_at?: string;
    created_by?: string;
    vehicle_id: string;
    driver_id?: string | null;
    order_id?: string | null;
    tipo: "quebra" | "acidente" | "pane_eletrica" | "pneu" | "sinistro" | "outros";
    gravidade?: Enums['occurrence_severity'];
    descricao: string;
    local?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    ocorreu_em?: string;
    fotos?: string[];
  };
  maintenance_messages: {
    id?: string;
    company_id: string;
    created_at?: string;
    updated_at?: string;
    created_by?: string;
    order_id: string;
    partner_id: string;
    direcao: "enviada" | "recebida";
    canal: "whatsapp" | "email" | "interno";
    conteudo: string;
    enviado_por?: string;
  };
  maintenance_plans: {
    id?: string;
    company_id: string;
    created_at?: string;
    updated_at?: string;
    created_by?: string;
    vehicle_id?: string | null;
    categoria_veiculo?: string | null;
    nome: string;
    intervalo_km?: number | null;
    intervalo_dias?: number | null;
    ultima_execucao_km?: number | null;
    ultima_execucao_data?: string | null;
    proxima_km?: never;
    proxima_data?: never;
    ativo?: boolean;
  };
  maintenance_attachments: {
    id?: string;
    company_id: string;
    created_at?: string;
    updated_at?: string;
    created_by?: string;
    order_id: string;
    tipo: "foto_antes" | "foto_depois" | "orcamento" | "nota_fiscal" | "outros";
    url: string;
    nome: string;
    enviado_por?: string;
  };
  maintenance_message_templates: {
    id?: string;
    company_id: string;
    created_at?: string;
    updated_at?: string;
    created_by?: string;
    nome: string;
    categoria: string;
    conteudo: string;
    ativo?: boolean;
  };
  maintenance_settings: {
    id?: string;
    company_id: string;
    created_at?: string;
    updated_at?: string;
    created_by?: string;
    limite_aprovacao_supervisor?: number;
    antecedencia_alerta_dias?: number;
    antecedencia_alerta_km?: number;
    intervalo_cobranca_horas?: number;
  };
}

type Immutable = 'id' | 'company_id' | 'created_at' | 'created_by';
type AppendOnly = 'maintenance_notifications'|'maintenance_communication_audit'| 'maintenance_vehicle_events'|'maintenance_vehicle_preferences'|'maintenance_driver_bindings'|'maintenance_allocations'| 'maintenance_order_timeline' | 'maintenance_messages' | 'maintenance_partner_audit' | 'maintenance_partner_attachments';
export type MaintenanceUpdate<T extends keyof MaintenanceInserts> =
  T extends AppendOnly ? never : Partial<Omit<MaintenanceInserts[T], Immutable | (T extends 'maintenance_orders' ? 'vehicle_id' | 'partner_id' | 'data_abertura' : never)>>;
export type TableName = keyof MaintenanceRows;
export type Row<T extends TableName> = MaintenanceRows[T];
export type Insert<T extends TableName> = MaintenanceInserts[T];
export type VehicleStatus = 'Disponível' | 'Em Viagem' | 'Manutenção' | 'Bloqueado';
export type MaintenanceDatabase = {
  public: {
    Tables: { [T in TableName]: {
      Row: MaintenanceRows[T]; Insert: MaintenanceInserts[T]; Update: MaintenanceUpdate<T>;
      Relationships: [];
    } };
    Views: Record<string, never>;
    Functions: {
      maintenance_plan_command: { Args:{target_company:string;command:string;body?:Json};Returns:Json };
      maintenance_branch_command: { Args:{target_company:string;command:string;body?:Json};Returns:Json };
      maintenance_analytics_command: { Args:{target_company:string;command:string;body?:Json};Returns:Json };
      maintenance_communication_command: { Args:{target_company:string;command:string;body?:Json};Returns:Json };
      maintenance_vehicle_command: { Args:{target_company:string;command:string;body?:Json};Returns:Json };
      maintenance_order_command: { Args:{target_company:string;command:string;body:Json};Returns:Json };
      maintenance_partner_metrics: { Args: { target_company:string; target_partner:string }; Returns:{total_os:number;custo_medio:number|null}[] };
      maintenance_partner_approval_notice: {Args:{target_company:string;command:'claim'|'finish';body?:Json};Returns:Json};
      maintenance_partner_registration: {Args:{invite:string;command:'info'|'submit';body?:Json};Returns:Json};
      maintenance_partner_requests_command: {Args:{target_company:string;command:'link'|'rotate'|'revoke'|'list'|'detail'|'approve'|'reject';body?:Json};Returns:Json};
      maintenance_partner_cities: { Args:{target_company:string}; Returns:{cidade:string}[] };
    };
    Enums: Enums;
    CompositeTypes: Record<string, never>;
  };
};

export interface MaintenanceRows {
 maintenance_partner_attachments:{id:string;company_id:string;partner_id:string;categoria:'contrato'|'certidao'|'tabela_precos';nome:string;object_path:string;content_type:string;tamanho_bytes:number;created_at:string;updated_at:string;created_by:string};
 maintenance_partner_audit:{id:string;company_id:string;partner_id:string;acao:'criacao'|'edicao'|'bloqueio'|'desbloqueio'|'anexo_incluido'|'anexo_excluido';antes:Json|null;depois:Json|null;created_at:string;created_by:string};
}
export interface MaintenanceInserts {
 maintenance_partner_attachments:Omit<MaintenanceRows['maintenance_partner_attachments'],'id'|'created_at'|'updated_at'|'created_by'>;
 maintenance_partner_audit:never;
}

export interface MaintenanceRows {
 maintenance_vehicle_preferences:{company_id:string;vehicle_id:string;default_partner_id:string|null;preferred_partner_ids:string[];updated_at:string;updated_by:string};
 maintenance_driver_bindings:{company_id:string;user_id:string;driver_id:string;vehicle_id:string;updated_at:string;updated_by:string};
 maintenance_vehicle_events:{id:string;company_id:string;vehicle_id:string;occurred_at:string;recorded_at:string;actor_id:string|null;kind:string;description:string;snapshot:Json;source_key:string};
 maintenance_allocations:{company_id:string;kind:'trip'|'client';reference:string;vehicle_id:string;active:boolean;updated_at:string;updated_by:string};
}
export interface MaintenanceInserts {maintenance_vehicle_preferences:never;maintenance_driver_bindings:never;maintenance_vehicle_events:never;maintenance_allocations:never;}

export interface MaintenanceRows {
 maintenance_notifications:{id:string;company_id:string;order_id:string;user_id:string;titulo:string;baseline_em:string;created_at:string;updated_at:string;read_at:string|null;resolved_at:string|null;next_reminder_at:string;reminder_count:number};
 maintenance_communication_audit:{id:string;company_id:string;entity:string;entity_id:string;action:string;actor_id:string;occurred_at:string;before_data:Json|null;after_data:Json|null};
}
export interface MaintenanceInserts {maintenance_notifications:never;maintenance_communication_audit:never;}
// Phase 2 contract only. No active route, token issuance, table or public permission.
export interface FuturePartnerPortalGrant { companyId:string;orderId:string;partnerId:string;tokenHash:string;expiresAt:string;revokedAt:string|null;capabilities:('update_status'|'upload_quote'|'upload_photo')[]; }

export interface MaintenanceRows {
 maintenance_plan_vehicles:{id:string;company_id:string;plan_id:string;vehicle_id:string;ultima_execucao_km:number;ultima_execucao_data:string;cycle:number;updated_at:string};
 maintenance_plan_orders:{company_id:string;plan_vehicle_id:string;order_id:string;executed_at:string|null};
 maintenance_preventive_notifications:{id:string;company_id:string;user_id:string;plan_vehicle_id:string;estado:'breve'|'vencida';cycle:number;titulo:string;read_at:string|null;resolved_at:string|null;updated_at:string};
 maintenance_plan_audit:{id:string;company_id:string;entity_id:string;actor_id:string|null;action:string;occurred_at:string;snapshot:Json};
}
export interface MaintenanceInserts {maintenance_plan_vehicles:never;maintenance_plan_orders:never;maintenance_preventive_notifications:never;maintenance_plan_audit:never;}

export interface MaintenanceRows {
 maintenance_branches:{id:string;company_id:string;nome:string;ativo:boolean;version:number;created_at:string;updated_at:string;created_by:string};
 maintenance_analytics_audit:{id:string;company_id:string;actor_id:string;action:string;entity_id:string|null;occurred_at:string;snapshot:Json};
}
export interface MaintenanceInserts {maintenance_branches:never;maintenance_analytics_audit:never;}

export interface MaintenanceInserts {maintenance_partner_requests:never;maintenance_partner_request_audit:never;}

export interface MaintenanceRows {maintenance_partner_approval_notices:{request_id:string;company_id:string;partner_id:string;status:'pending'|'sending'|'accepted'|'failed'|'unknown'|'unavailable';phone:string|null;body:string;attempts:number;claimed_at:string|null;provider_message_id:string|null;error_message:string|null;created_at:string;updated_at:string;accepted_at:string|null};}
export interface MaintenanceInserts {maintenance_partner_approval_notices:never;}
