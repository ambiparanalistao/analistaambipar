import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Route, 
  MapPin, 
  Truck, 
  UserCheck, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  RefreshCw, 
  Phone, 
  Mail, 
  ExternalLink, 
  Calendar, 
  ShieldCheck, 
  Layers, 
  ArrowRight, 
  Navigation, 
  Clock, 
  Sparkles, 
  Filter, 
  ArrowLeft, 
  Save, 
  Check, 
  Flame, 
  Activity, 
  Eye, 
  Printer, 
  Building, 
  Compass, 
  Tag,
  LayoutGrid,
  List,
  ChevronRight,
  Shield,
  Zap,
  Leaf
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import PremiumSelect from './PremiumSelect';
import './ClientsModule.css';

// Catálogo de Rotas Logísticas Homologadas da Ambipar
export const PRESET_ROUTES = [
  {
    id: 'ROTA-BA-SP-01',
    nome: 'Corredor Camaçari (BA) ⇄ Paulínia (SP)',
    origem: 'Camaçari / BA (Polo Petroquímico)',
    destino: 'Paulínia / SP (Base de Tratamento Ambipar)',
    distanciaKm: 1940,
    tempoHoras: 34,
    tipoCarga: 'Químicos Perigosos (Hazmat) & Resíduos Classe I',
    veiculoRecomendado: 'Carreta Tanque Inox Químico (316L)',
    pegadaEstimadaCo2: 2450 // kg CO2e
  },
  {
    id: 'ROTA-SP-RJ-02',
    nome: 'Eixo Cubatão (SP) ⇄ Duque de Caxias (RJ)',
    origem: 'Cubatão / SP (Polo Industrial)',
    destino: 'Duque de Caxias / RJ (REDUC & Base Ambipar)',
    distanciaKm: 460,
    tempoHoras: 8,
    tipoCarga: 'Derivados de Petróleo & Efluentes Industriais',
    veiculoRecomendado: 'Auto-Vácuo Sucção Líquidos (Actros)',
    pegadaEstimadaCo2: 580
  },
  {
    id: 'ROTA-PR-RS-03',
    nome: 'Corredor Araucária (PR) ⇄ Canoas (RS)',
    origem: 'Araucária / PR (REPAR)',
    destino: 'Canoas / RS (REFAP & Destinação Final)',
    distanciaKm: 720,
    tempoHoras: 13,
    tipoCarga: 'Granel Líquido & Resíduos Industriais Classe IIA',
    veiculoRecomendado: 'Bitrem Tanque Químico',
    pegadaEstimadaCo2: 910
  },
  {
    id: 'ROTA-MG-ES-04',
    nome: 'Corredor Betim (MG) ⇄ Tubarão (ES)',
    origem: 'Betim / MG (Polo Automotivo / Petroquímica)',
    destino: 'Vitória / Tubarão / ES (Porto & Pátio Industrial)',
    distanciaKm: 530,
    tempoHoras: 10,
    tipoCarga: 'Cargas Pesadas, Minérios & Big Bags',
    veiculoRecomendado: 'Carreta Sider (Carga Geral / Tambores)',
    pegadaEstimadaCo2: 670
  },
  {
    id: 'ROTA-SP-INT-05',
    nome: 'Anel Paulínia ⇄ Campinas ⇄ Sorocaba (SP)',
    origem: 'Paulínia / SP (Hub Logístico Ambipar)',
    destino: 'Complexo Industrial de Sorocaba / SP',
    distanciaKm: 180,
    tempoHoras: 4,
    tipoCarga: 'Coletas Dedicadas & Fracionadas em IBCs',
    veiculoRecomendado: 'Caminhão Truck PBT 23t (Baú/Sider)',
    pegadaEstimadaCo2: 230
  }
];

export const CLIENT_STATUS_OPTIONS = [
  { 
    value: 'Ativo', 
    label: 'Ativo / Operação Regular', 
    sublabel: 'Contrato vigente com coletas e transportes contínuos', 
    color: '#10b981',
    badge: 'Ativo'
  },
  { 
    value: 'Em Operação', 
    label: 'Em Operação / Viagem em Curso', 
    sublabel: 'Veículo da frota em atendimento no cliente neste momento', 
    color: '#06b6d4',
    badge: 'Em Rota'
  },
  { 
    value: 'Em Negociação', 
    label: 'Em Negociação / Homologação', 
    sublabel: 'Ajuste de escopo de rotas, análise fiscal ou minuta', 
    color: '#f59e0b',
    badge: 'Onboarding'
  },
  { 
    value: 'Bloqueado', 
    label: 'Bloqueado (Licenças / Fiscal)', 
    sublabel: 'Pendência em Licença Ambiental (LO), SINIR ou inadimplência', 
    color: '#f43f5e',
    badge: 'Bloqueado'
  }
];

export const SLA_TIER_OPTIONS = [
  { value: 'Platinum 24/7', label: 'Tier Platinum 24/7 (Crítico / Ininterrupto)', sublabel: 'Janela de atendimento total com frota dedicada e SLA de 2 horas', icon: '💎' },
  { value: 'Gold Prioritário', label: 'Tier Gold Prioritário (Contrato Master)', sublabel: 'Atendimento prioritário com carretas dedicadas e agendamento D+1', icon: '🥇' },
  { value: 'Silver Padrão', label: 'Tier Silver Padrão (Semanal)', sublabel: 'Operações regulares programadas em dias fixos da semana', icon: '🥈' },
  { value: 'Spot / Emergencial', label: 'Tier Spot / Sob Demanda (Ambipar PAE)', sublabel: 'Atendimento pontual mediante solicitação de despacho avulso', icon: '⚡' }
];

export const INDUSTRY_SEGMENTS = [
  { value: 'Química & Petroquímica', label: 'Química & Petroquímica', sublabel: 'Solventes, ácidos, polímeros e resinas líquidas' },
  { value: 'Óleo & Gás (Refinarias)', label: 'Óleo & Gás (Refinarias & Distribuidoras)', sublabel: 'Combustíveis, derivados e água oleosa' },
  { value: 'Papel & Celulose', label: 'Papel & Celulose', sublabel: 'Licores, biomassa, cinzas e efluentes industriais' },
  { value: 'Mineração & Siderurgia', label: 'Mineração & Siderurgia', sublabel: 'Resíduos de flotação, escória e lamas metálicas' },
  { value: 'Farmacêutica & Cosméticos', label: 'Farmacêutica & Cosméticos', sublabel: 'Lotes descaracterizados e efluentes com alto DQO' },
  { value: 'Automotiva & Manufatura', label: 'Automotiva & Manufatura', sublabel: 'Lodos de pintura, óleos solúveis e embalagens contaminadas' },
  { value: 'Alimentos & Bebidas', label: 'Alimentos & Bebidas', sublabel: 'Efluentes orgânicos, gorduras e destinação verde ESG' }
];

export const FREQUENCY_OPTIONS = [
  { value: 'Diária (Seg a Sáb)', label: 'Diária (Segunda a Sábado)', sublabel: 'Fluxo contínuo de escoamento' },
  { value: '3x por Semana', label: '3x por Semana (Seg / Qua / Sex)', sublabel: 'Coleta escalonada' },
  { value: 'Semanal (1x)', label: 'Semanal (1x por semana)', sublabel: 'Volume programado semanal' },
  { value: 'Quinzenal', label: 'Quinzenal', sublabel: 'Atendimento sob batelada' },
  { value: 'Mensal', label: 'Mensal Programada', sublabel: 'Fechamento de ciclo mensal' },
  { value: 'Sob Demanda / Spot', label: 'Sob Demanda (Chamado CCO)', sublabel: 'Despacho acionado conforme enchimento' }
];

// Dados Iniciais Flagship Reais da Ambipar
export const DEFAULT_CLIENTS = [
  {
    id: 'CLI-AMB001',
    razao_social: 'Braskem S/A - Polo Petroquímico de Camaçari',
    nome_fantasia: 'Braskem Camaçari Q1',
    cnpj: '42.150.391/0001-90',
    inscricao_estadual: '012.345.678-BA',
    segmento: 'Química & Petroquímica',
    status: 'Em Operação',
    tier_sla: 'Platinum 24/7',
    
    // Endereço
    cep: '42810-000',
    logradouro: 'Rua Eteno, 1561 - Complexo Básico',
    numero: '1561',
    bairro: 'Polo Petroquímico',
    cidade: 'Camaçari',
    uf: 'BA',
    polo_logistico: 'Polo Petroquímico de Camaçari - BA',
    
    // Roteirização
    rota_id: 'ROTA-BA-SP-01',
    rota_nome: 'Corredor Camaçari (BA) ⇄ Paulínia (SP)',
    tipo_operacao: 'Coleta na Origem & Transbordo Químico',
    frequencia: 'Diária (Seg a Sáb)',
    janela_atendimento: '24h Contínuo (Planta Ininterrupta)',
    veiculo_preferencial: 'Carreta Tanque Inox Químico (316L)',
    veiculo_alocado_placa: 'AMB-4K89',
    motorista_preferencial: 'Carlos Eduardo Santos',
    distancia_km: 1940,
    tempo_ciclo_horas: 34,
    volume_mensal_ton: 850,
    
    // Ambiental & Licenças
    classes_residuos: 'Classe I (Perigosos - Corrosivos e Inflamáveis)',
    codigo_ibama: '07.01 - Indústria Química Orgânica',
    mtr_obrigatorio: true,
    licenca_ambiental_num: 'LO INEMA nº 2024/09812-BA',
    validade_licenca: '2027-11-30',
    
    // Contato
    responsavel_nome: 'Engª Marcela Albuquerque',
    responsavel_cargo: 'Gerente de Logística e Meio Ambiente',
    telefone: '(71) 98845-1200',
    email: 'marcela.albuquerque@braskem.com',
    observacoes: 'Exigência obrigatória de kit Hazmat nível A, CIPP/CIV atualizados e condutor com certificação MOPP e NR-20.'
  },
  {
    id: 'CLI-AMB002',
    razao_social: 'BASF S/A - Complexo Químico & Tintas Suvinil',
    nome_fantasia: 'BASF Paulínia / Demarchi',
    cnpj: '48.539.407/0001-18',
    inscricao_estadual: '524.891.023.114',
    segmento: 'Química & Petroquímica',
    status: 'Ativo',
    tier_sla: 'Gold Prioritário',
    
    // Endereço
    cep: '13140-000',
    logradouro: 'Avenida Brasil, 2500 - Distrito Industrial',
    numero: '2500',
    bairro: 'Cascata',
    cidade: 'Paulínia',
    uf: 'SP',
    polo_logistico: 'Polo Químico de Paulínia - SP',
    
    // Roteirização
    rota_id: 'ROTA-SP-INT-05',
    rota_nome: 'Anel Paulínia ⇄ Campinas ⇄ Sorocaba (SP)',
    tipo_operacao: 'Circuito Fechado Dedicado & Coleta de Borras',
    frequencia: '3x por Semana',
    janela_atendimento: '07:00 às 18:00 (Seg a Sex)',
    veiculo_preferencial: 'Carreta Sider (Carga Geral / Tambores)',
    veiculo_alocado_placa: 'AMB-9T21',
    motorista_preferencial: 'Roberto Mendes Faria',
    distancia_km: 180,
    tempo_ciclo_horas: 4,
    volume_mensal_ton: 320,
    
    // Ambiental & Licenças
    classes_residuos: 'Classe I (Solventes Residuais, Borras de Tinta)',
    codigo_ibama: '13.02 - Fabricação de Tintas e Esmaltes',
    mtr_obrigatorio: true,
    licenca_ambiental_num: 'LO CETESB nº 34002981-SP',
    validade_licenca: '2028-02-15',
    
    // Contato
    responsavel_nome: 'Rodrigo Fontes Toledo',
    responsavel_cargo: 'Coordenador de EHS & Operações',
    telefone: '(19) 99762-3344',
    email: 'rodrigo.toledo@basf.com',
    observacoes: 'Coleta semanal de IBCs 1000L com solvente para coprocessamento e reciclagem de embalagens.'
  },
  {
    id: 'CLI-AMB003',
    razao_social: 'Petróleo Brasileiro S/A - Refinaria de Paulínia (REPLAN)',
    nome_fantasia: 'Petrobras REPLAN',
    cnpj: '33.000.167/0001-01',
    inscricao_estadual: '524.001.222.000',
    segmento: 'Óleo & Gás (Refinarias)',
    status: 'Em Operação',
    tier_sla: 'Platinum 24/7',
    
    // Endereço
    cep: '13140-900',
    logradouro: 'Rodovia SP-332, km 130',
    numero: 'S/N',
    bairro: 'Zona Rural',
    cidade: 'Paulínia',
    uf: 'SP',
    polo_logistico: 'Polo Químico de Paulínia - SP',
    
    // Roteirização
    rota_id: 'ROTA-SP-RJ-02',
    rota_nome: 'Eixo Cubatão (SP) ⇄ Duque de Caxias (RJ)',
    tipo_operacao: 'Sucção de Água Oleosa & Borras de Tanque',
    frequencia: 'Diária (Seg a Sáb)',
    janela_atendimento: '24h Contínuo (Planta Ininterrupta)',
    veiculo_preferencial: 'Auto-Vácuo Sucção Líquidos (Actros)',
    veiculo_alocado_placa: 'AMB-2M33',
    motorista_preferencial: 'Anderson Silva Costa',
    distancia_km: 460,
    tempo_ciclo_horas: 8,
    volume_mensal_ton: 1200,
    
    // Ambiental & Licenças
    classes_residuos: 'Classe I (Borras de Fundo de Tanque & Água Oleosa)',
    codigo_ibama: '05.01 - Refino de Petróleo',
    mtr_obrigatorio: true,
    licenca_ambiental_num: 'LO IBAMA nº 1489/2023',
    validade_licenca: '2027-08-10',
    
    // Contato
    responsavel_nome: 'Eng. Fernando Diniz Prado',
    responsavel_cargo: 'Supervisor Geral de Descarte & PAE',
    telefone: '(19) 98112-9988',
    email: 'fernando.prado@petrobras.com.br',
    observacoes: 'Contrato com cláusula de prontidão emergencial 24h Ambipar Response com caminhão vácuo e barreiras fluviais.'
  },
  {
    id: 'CLI-AMB004',
    razao_social: 'Klabin S/A - Unidade Puma Ortigueira',
    nome_fantasia: 'Klabin Puma',
    cnpj: '89.637.490/0001-45',
    inscricao_estadual: '901.884.210.009',
    segmento: 'Papel & Celulose',
    status: 'Ativo',
    tier_sla: 'Gold Prioritário',
    
    // Endereço
    cep: '84350-000',
    logradouro: 'Fazenda Campina dos Pupos - Estrada Klabin',
    numero: 'Km 12',
    bairro: 'Zona Industrial',
    cidade: 'Ortigueira',
    uf: 'PR',
    polo_logistico: 'Polo Moveleiro & Celulose - PR',
    
    // Roteirização
    rota_id: 'ROTA-PR-RS-03',
    rota_nome: 'Corredor Araucária (PR) ⇄ Canoas (RS)',
    tipo_operacao: 'Escoamento de Cinzas & Lodo de ETE',
    frequencia: '3x por Semana',
    janela_atendimento: '06:00 às 22:00 (Seg a Sáb)',
    veiculo_preferencial: 'Roll-on / Caçamba Estanque',
    veiculo_alocado_placa: 'AMB-7X10',
    motorista_preferencial: 'Marcos Vinicius Lima',
    distancia_km: 720,
    tempo_ciclo_horas: 13,
    volume_mensal_ton: 680,
    
    // Ambiental & Licenças
    classes_residuos: 'Classe IIA (Cinzas de Caldeira de Biomassa & Dregs)',
    codigo_ibama: '15.01 - Fabricação de Celulose e Papel',
    mtr_obrigatorio: true,
    licenca_ambiental_num: 'LO IAT-PR nº 8901/2024',
    validade_licenca: '2028-06-30',
    
    // Contato
    responsavel_nome: 'Camila Guimarães Rocha',
    responsavel_cargo: 'Especialista em Economia Circular',
    telefone: '(42) 99120-7755',
    email: 'camila.rocha@klabin.com.br',
    observacoes: 'Aplicação direta em compostagem e agricultura regenerativa, auditoria ESG trimestral.'
  },
  {
    id: 'CLI-AMB005',
    razao_social: 'Vale S/A - Complexo Minerário de Tubarão',
    nome_fantasia: 'Vale Tubarão',
    cnpj: '33.592.510/0001-54',
    inscricao_estadual: '081.234.567.890',
    segmento: 'Mineração & Siderurgia',
    status: 'Ativo',
    tier_sla: 'Gold Prioritário',
    
    // Endereço
    cep: '29090-900',
    logradouro: 'Avenida Dante Michelini, 5500 - Ponta de Tubarão',
    numero: '5500',
    bairro: 'Jardim Camburi',
    cidade: 'Vitória',
    uf: 'ES',
    polo_logistico: 'Complexo Portuário de Tubarão - ES',
    
    // Roteirização
    rota_id: 'ROTA-MG-ES-04',
    rota_nome: 'Corredor Betim (MG) ⇄ Tubarão (ES)',
    tipo_operacao: 'Transporte de Resíduos Minerais & Escórias',
    frequencia: 'Semanal (1x)',
    janela_atendimento: '08:00 às 17:00 (Seg a Sex)',
    veiculo_preferencial: 'Bitrem Tanque Químico',
    veiculo_alocado_placa: 'AMB-5P44',
    motorista_preferencial: 'Luciano Antunes Moreira',
    distancia_km: 530,
    tempo_ciclo_horas: 10,
    volume_mensal_ton: 450,
    
    // Ambiental & Licenças
    classes_residuos: 'Classe IIA e IIB (Rejeitos Minerais Estabilizados)',
    codigo_ibama: '01.02 - Extração de Minério de Ferro',
    mtr_obrigatorio: true,
    licenca_ambiental_num: 'LO IEMA-ES nº 4501/2023',
    validade_licenca: '2027-09-18',
    
    // Contato
    responsavel_nome: 'Eng. Thiago Vasconcelos',
    responsavel_cargo: 'Gerente Operacional de Descarte',
    telefone: '(27) 99881-4411',
    email: 'thiago.vasconcelos@vale.com',
    observacoes: 'Controle rigoroso de pesagem em balança rodoviária aferida pelo INMETRO na portaria 4.'
  },
  {
    id: 'CLI-AMB006',
    razao_social: 'Rhodia Brasil Ltda - Grupo Solvay',
    nome_fantasia: 'Rhodia Paulínia Solvay',
    cnpj: '61.096.005/0001-83',
    inscricao_estadual: '524.300.111.456',
    segmento: 'Química & Petroquímica',
    status: 'Em Negociação',
    tier_sla: 'Silver Padrão',
    
    // Endereço
    cep: '13140-000',
    logradouro: 'Estrada da Rhodia, km 8',
    numero: 'S/N',
    bairro: 'Betel',
    cidade: 'Paulínia',
    uf: 'SP',
    polo_logistico: 'Polo Químico de Paulínia - SP',
    
    // Roteirização
    rota_id: 'ROTA-SP-INT-05',
    rota_nome: 'Anel Paulínia ⇄ Campinas ⇄ Sorocaba (SP)',
    tipo_operacao: 'Coleta de Efluentes Químicos com Fenol',
    frequencia: 'Quinzenal',
    janela_atendimento: '08:00 às 16:00 (Seg a Sex)',
    veiculo_preferencial: 'Carreta Tanque Inox Químico (316L)',
    veiculo_alocado_placa: 'AMB-8L19',
    motorista_preferencial: 'Carlos Eduardo Santos',
    distancia_km: 180,
    tempo_ciclo_horas: 4,
    volume_mensal_ton: 190,
    
    // Ambiental & Licenças
    classes_residuos: 'Classe I (Efluentes Fenólicos & Poliamidas)',
    codigo_ibama: '07.03 - Síntese de Fibras Sintéticas',
    mtr_obrigatorio: true,
    licenca_ambiental_num: 'LO CETESB nº 1908234-SP',
    validade_licenca: '2026-12-15',
    
    // Contato
    responsavel_nome: 'Juliana Pires Martins',
    responsavel_cargo: 'Supervisora de Sustentabilidade',
    telefone: '(19) 99611-8899',
    email: 'juliana.martins@solvay.com',
    observacoes: 'Contrato em fase final de homologação técnica. Emissão de DRE de frete sob análise no CCO.'
  }
];

// Formatadores
export const formatCNPJ = (val) => {
  if (!val) return '—';
  const clean = String(val).replace(/\D/g, '');
  if (clean.length === 14) {
    return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  return val;
};

export const formatPhone = (val) => {
  if (!val) return '—';
  const clean = String(val).replace(/\D/g, '');
  if (clean.length === 11) {
    return clean.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  if (clean.length === 10) {
    return clean.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return val;
};

export const formatCEP = (val) => {
  if (!val) return '—';
  const clean = String(val).replace(/\D/g, '');
  if (clean.length === 8) {
    return clean.replace(/(\d{5})(\d{3})/, '$1-$2');
  }
  return val;
};

export default function ClientsModule({ user, onNavigateTrips, onNavigateFleet }) {
  // Estado principal de clientes (inicia com salvos ou dados oficiais de demonstração)
  const [clients, setClients] = useState(() => {
    try {
      const saved = localStorage.getItem('ambipar_real_clients');
      return saved ? JSON.parse(saved) : DEFAULT_CLIENTS;
    } catch {
      return DEFAULT_CLIENTS;
    }
  });

  const [routesList, setRoutesList] = useState(PRESET_ROUTES);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table' | 'form'
  const [activeTab, setActiveTab] = useState('todos'); // 'todos' | 'em_operacao' | 'ativos' | 'platinum' | 'bloqueados'
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [routeFilter, setRouteFilter] = useState('Todas');
  const [feedback, setFeedback] = useState(null);

  // Modais
  const [selectedClientDossier, setSelectedClientDossier] = useState(null);
  const [clientToRedirect, setClientToRedirect] = useState(null);
  const [newSelectedRouteId, setNewSelectedRouteId] = useState('');
  const [newSelectedFrequency, setNewSelectedFrequency] = useState('');

  // Formulário de Cadastro / Edição
  const [editingId, setEditingId] = useState(null);
  const [formStep, setFormStep] = useState(1); // 1: Cadastral, 2: Endereço, 3: Rota, 4: Ambiental, 5: Contatos
  const [formData, setFormData] = useState({
    razao_social: '',
    nome_fantasia: '',
    cnpj: '',
    inscricao_estadual: '',
    segmento: 'Química & Petroquímica',
    status: 'Ativo',
    tier_sla: 'Gold Prioritário',
    
    cep: '',
    logradouro: '',
    numero: '',
    bairro: '',
    cidade: '',
    uf: 'SP',
    polo_logistico: '',
    
    rota_id: 'ROTA-BA-SP-01',
    tipo_operacao: 'Coleta na Origem & Transbordo Químico',
    frequencia: '3x por Semana',
    janela_atendimento: '07:00 às 18:00 (Seg a Sex)',
    veiculo_preferencial: 'Carreta Tanque Inox Químico (316L)',
    veiculo_alocado_placa: 'AMB-4K89',
    motorista_preferencial: 'Carlos Eduardo Santos',
    distancia_km: 1940,
    tempo_ciclo_horas: 34,
    volume_mensal_ton: 250,
    
    classes_residuos: 'Classe I (Perigosos - Corrosivos e Inflamáveis)',
    codigo_ibama: '07.01 - Indústria Química Orgânica',
    mtr_obrigatorio: true,
    licenca_ambiental_num: '',
    validade_licenca: '',
    
    responsavel_nome: '',
    responsavel_cargo: '',
    telefone: '',
    email: '',
    observacoes: ''
  });

  // Salva no localStorage a cada atualização
  useEffect(() => {
    try {
      localStorage.setItem('ambipar_real_clients', JSON.stringify(clients));
    } catch (err) {
      console.warn('Erro ao salvar clientes localmente:', err);
    }
  }, [clients]);

  // Carrega do Supabase se configurado
  const fetchSupabaseClients = async () => {
    if (!isSupabaseConfigured || !supabase) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        setClients(data);
        setFeedback({ type: 'success', text: `${data.length} clientes carregados do Supabase PostgreSQL.` });
      }
    } catch {
      // Falha silenciosa usando fallback local
    } finally {
      setLoading(false);
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  // Abrir Form para Criar
  const handleOpenCreateForm = () => {
    setEditingId(null);
    setFormStep(1);
    setFormData({
      razao_social: '',
      nome_fantasia: '',
      cnpj: '',
      inscricao_estadual: '',
      segmento: 'Química & Petroquímica',
      status: 'Ativo',
      tier_sla: 'Gold Prioritário',
      
      cep: '',
      logradouro: '',
      numero: '',
      bairro: '',
      cidade: '',
      uf: 'SP',
      polo_logistico: 'Polo Químico de Paulínia - SP',
      
      rota_id: 'ROTA-BA-SP-01',
      tipo_operacao: 'Coleta na Origem & Transbordo Químico',
      frequencia: '3x por Semana',
      janela_atendimento: '07:00 às 18:00 (Seg a Sex)',
      veiculo_preferencial: 'Carreta Tanque Inox Químico (316L)',
      veiculo_alocado_placa: 'AMB-4K89',
      motorista_preferencial: 'Carlos Eduardo Santos',
      distancia_km: 1940,
      tempo_ciclo_horas: 34,
      volume_mensal_ton: 250,
      
      classes_residuos: 'Classe I (Perigosos - Corrosivos e Inflamáveis)',
      codigo_ibama: '07.01 - Indústria Química Orgânica',
      mtr_obrigatorio: true,
      licenca_ambiental_num: 'LO CETESB nº ' + Math.floor(1000000 + Math.random() * 9000000) + '-SP',
      validade_licenca: '2028-12-31',
      
      responsavel_nome: '',
      responsavel_cargo: 'Gerente de EHS / Logística',
      telefone: '',
      email: '',
      observacoes: ''
    });
    setViewMode('form');
  };

  // Abrir Form para Editar
  const handleOpenEditForm = (client) => {
    setEditingId(client.id);
    setFormStep(1);
    setFormData({ ...client });
    setViewMode('form');
  };

  // Preencher Exemplo Ambipar Rápido
  const handleFillExample = () => {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    setFormData({
      razao_social: `Oxigás Indústria Química do Brasil Ltda (Planta ${randomSuffix})`,
      nome_fantasia: `Oxigás Brasil #${randomSuffix}`,
      cnpj: '12.345.678/0001-' + (Math.floor(10 + Math.random() * 89)),
      inscricao_estadual: '524.' + randomSuffix + '.890.111',
      segmento: 'Química & Petroquímica',
      status: 'Ativo',
      tier_sla: 'Platinum 24/7',
      
      cep: '13140-000',
      logradouro: 'Avenida das Indústrias Químicas',
      numero: String(randomSuffix),
      bairro: 'Distrito Industrial Norte',
      cidade: 'Paulínia',
      uf: 'SP',
      polo_logistico: 'Polo Químico de Paulínia - SP',
      
      rota_id: 'ROTA-BA-SP-01',
      tipo_operacao: 'Coleta na Origem & Transbordo Químico',
      frequencia: 'Diária (Seg a Sáb)',
      janela_atendimento: '24h Contínuo (Planta Ininterrupta)',
      veiculo_preferencial: 'Carreta Tanque Inox Químico (316L)',
      veiculo_alocado_placa: 'AMB-4K89',
      motorista_preferencial: 'Carlos Eduardo Santos',
      distancia_km: 1940,
      tempo_ciclo_horas: 34,
      volume_mensal_ton: 480,
      
      classes_residuos: 'Classe I (Gases Liquefeitos & Solventes Oxigenados)',
      codigo_ibama: '07.02 - Fabricação de Gases Industriais',
      mtr_obrigatorio: true,
      licenca_ambiental_num: `LO CETESB nº 489${randomSuffix}-SP`,
      validade_licenca: '2028-10-25',
      
      responsavel_nome: 'Dra. Gabriela Vasconcellos',
      responsavel_cargo: 'Diretora de Operações Industriais',
      telefone: '(19) 98765-4321',
      email: `gabriela.vasconcellos@oxigas${randomSuffix}.com.br`,
      observacoes: 'Contrato prioritário Ambipar CCO com telemetria via satélite e relatório de pegada de carbono mensal.'
    });
    setFeedback({ type: 'info', text: 'Dados de exemplo industrial preenchidos com sucesso!' });
    setTimeout(() => setFeedback(null), 3000);
  };

  // Salvar Formulário
  const handleSubmitForm = (e) => {
    e.preventDefault();
    if (!formData.razao_social || !formData.cnpj) {
      alert('Por favor preencha pelo menos a Razão Social e o CNPJ da empresa.');
      return;
    }

    const selectedRouteObj = routesList.find(r => r.id === formData.rota_id) || routesList[0];

    const payload = {
      ...formData,
      rota_nome: selectedRouteObj.nome,
      distancia_km: Number(formData.distancia_km) || selectedRouteObj.distanciaKm,
      tempo_ciclo_horas: Number(formData.tempo_ciclo_horas) || selectedRouteObj.tempoHoras,
      volume_mensal_ton: Number(formData.volume_mensal_ton) || 0,
      updated_at: new Date().toISOString()
    };

    if (editingId) {
      const updated = clients.map(c => c.id === editingId ? { ...payload, id: editingId } : c);
      setClients(updated);
      if (isSupabaseConfigured && supabase) {
        supabase.from('clientes').update(payload).eq('id', editingId).then();
      }
      setFeedback({ type: 'success', text: `Cliente "${payload.nome_fantasia || payload.razao_social}" atualizado com sucesso!` });
    } else {
      const newClient = {
        ...payload,
        id: `CLI-AMB${Math.floor(100 + Math.random() * 900)}`,
        created_at: new Date().toISOString()
      };
      setClients([newClient, ...clients]);
      if (isSupabaseConfigured && supabase) {
        supabase.from('clientes').insert([{ user_id: user?.id, ...payload }]).then();
      }
      setFeedback({ type: 'success', text: `Cliente "${newClient.nome_fantasia || newClient.razao_social}" cadastrado e direcionado à rota!` });
    }

    setViewMode('cards');
    setTimeout(() => setFeedback(null), 4000);
  };

  // Exclusão
  const handleDeleteClient = (clientId, name) => {
    if (window.confirm(`Confirma a desativação e remoção do cliente "${name}" do CCO?`)) {
      setClients(clients.filter(c => c.id !== clientId));
      if (isSupabaseConfigured && supabase) {
        supabase.from('clientes').delete().eq('id', clientId).then();
      }
      setFeedback({ type: 'info', text: `Cliente "${name}" removido com sucesso.` });
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  // Abrir Modal de Redirecionar Rota
  const handleOpenRedirectModal = (client) => {
    setClientToRedirect(client);
    setNewSelectedRouteId(client.rota_id || routesList[0].id);
    setNewSelectedFrequency(client.frequencia || '3x por Semana');
  };

  // Confirmar Mudança Rápida de Rota
  const handleConfirmRedirectRoute = () => {
    if (!clientToRedirect) return;
    const targetRoute = routesList.find(r => r.id === newSelectedRouteId) || routesList[0];

    const updated = clients.map(c => {
      if (c.id === clientToRedirect.id) {
        return {
          ...c,
          rota_id: targetRoute.id,
          rota_nome: targetRoute.nome,
          distancia_km: targetRoute.distanciaKm,
          tempo_ciclo_horas: targetRoute.tempoHoras,
          veiculo_preferencial: targetRoute.veiculoRecomendado,
          frequencia: newSelectedFrequency,
          status: 'Em Operação'
        };
      }
      return c;
    });

    setClients(updated);
    if (isSupabaseConfigured && supabase) {
      supabase.from('clientes').update({
        rota_id: targetRoute.id,
        rota_nome: targetRoute.nome,
        distancia_km: targetRoute.distanciaKm,
        tempo_ciclo_horas: targetRoute.tempoHoras,
        frequencia: newSelectedFrequency,
        status: 'Em Operação'
      }).eq('id', clientToRedirect.id).then();
    }

    setFeedback({
      type: 'success',
      text: `Cliente "${clientToRedirect.nome_fantasia || clientToRedirect.razao_social}" foi direcionado com sucesso para a rota: ${targetRoute.nome}!`
    });

    setClientToRedirect(null);
    setTimeout(() => setFeedback(null), 4000);
  };

  // WhatsApp Link
  const getWhatsAppLink = (phoneStr, clientName) => {
    if (!phoneStr) return null;
    const cleanNumber = phoneStr.replace(/\D/g, '');
    const fullNumber = cleanNumber.startsWith('55') ? cleanNumber : `55${cleanNumber}`;
    const text = encodeURIComponent(`Olá, sou do CCO Ambipar Logistics a respeito das operações da unidade ${clientName}.`);
    return `https://wa.me/${fullNumber}?text=${text}`;
  };

  // KPIs
  const totalClients = clients.length;
  const activeCount = clients.filter(c => c.status === 'Ativo' || c.status === 'Em Operação').length;
  const inTripCount = clients.filter(c => c.status === 'Em Operação').length;
  const totalVolumeMonthly = clients.reduce((acc, c) => acc + (Number(c.volume_mensal_ton) || 0), 0);
  const totalRoutesUsed = new Set(clients.map(c => c.rota_id).filter(Boolean)).size;
  const blockedCount = clients.filter(c => c.status === 'Bloqueado').length;

  // Filtragem
  const filteredClients = clients.filter(c => {
    const s = searchTerm.toLowerCase();
    const matchesSearch = 
      (c.razao_social && c.razao_social.toLowerCase().includes(s)) ||
      (c.nome_fantasia && c.nome_fantasia.toLowerCase().includes(s)) ||
      (c.cnpj && c.cnpj.includes(s)) ||
      (c.cidade && c.cidade.toLowerCase().includes(s)) ||
      (c.uf && c.uf.toLowerCase().includes(s)) ||
      (c.rota_nome && c.rota_nome.toLowerCase().includes(s)) ||
      (c.segmento && c.segmento.toLowerCase().includes(s)) ||
      (c.polo_logistico && c.polo_logistico.toLowerCase().includes(s));

    const matchesStatus = statusFilter === 'Todos' || c.status === statusFilter;
    const matchesRoute = routeFilter === 'Todas' || c.rota_id === routeFilter;

    // Filtros de abas rápidas
    if (activeTab === 'em_operacao') {
      return matchesSearch && matchesStatus && matchesRoute && c.status === 'Em Operação';
    }
    if (activeTab === 'ativos') {
      return matchesSearch && matchesStatus && matchesRoute && c.status === 'Ativo';
    }
    if (activeTab === 'platinum') {
      return matchesSearch && matchesStatus && matchesRoute && c.tier_sla?.includes('Platinum');
    }
    if (activeTab === 'bloqueados') {
      return matchesSearch && matchesStatus && matchesRoute && c.status === 'Bloqueado';
    }

    return matchesSearch && matchesStatus && matchesRoute;
  });

  return (
    <div className="module-page-container animate-fade-in" id="clients-module-root">
      {/* ============================================================== */}
      {/* 1. CABEÇALHO DO MÓDULO & TORRE DE CLIENTES & ROTAS            */}
      {/* ============================================================== */}
      <div className="module-page-header">
        <div className="module-title-area">
          <div className="module-icon-pill forest">
            <Building2 size={24} />
          </div>
          <div>
            <div className="cockpit-meta-badges">
              <span className="esg-fleet-chip">
                <Route size={12} color="#10b981" />
                <span>Roteirização Dedicada & Logística Reversa</span>
              </span>
              <span className="esg-fleet-chip">
                <ShieldCheck size={12} color="#10b981" />
                <span>Homologação ANTT, IBAMA & SINIR</span>
              </span>
            </div>
            <h2>Gestão de Clientes & Roteirização Dedicada</h2>
            <p>
              Cadastro industrial homologado, controle de SLA contratual, gestão de polos químicos e direcionamento dinâmico a rotas operacionais Ambipar.
            </p>
          </div>
        </div>

        <div className="module-header-actions">
          {viewMode !== 'form' ? (
            <>
              <button
                type="button"
                className="btn-secondary btn-icon-text"
                onClick={fetchSupabaseClients}
                disabled={loading}
                title="Sincronizar com banco de dados Supabase"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                <span>Atualizar</span>
              </button>

              <button
                type="button"
                className="btn-primary btn-icon-text"
                onClick={handleOpenCreateForm}
                id="btn-cadastrar-novo-cliente"
              >
                <Plus size={18} />
                <span>+ Cadastrar Novo Cliente & Rota</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              className="btn-secondary btn-icon-text"
              onClick={() => setViewMode('cards')}
            >
              <ArrowLeft size={16} />
              <span>Voltar ao Painel de Clientes</span>
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <div className={`alert alert-${feedback.type} animate-fade-in`} style={{ marginBottom: '1.25rem' }}>
          <CheckCircle2 size={18} />
          <span>{feedback.text}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODO 1: FORMULÁRIO COMPLETO DE HOMOLOGAÇÃO DE CLIENTE          */}
      {/* ============================================================== */}
      {viewMode === 'form' ? (
        <form onSubmit={handleSubmitForm} className="driver-full-page-form animate-fade-in" id="client-form">
          <div className="form-header-banner">
            <div>
              <span className="form-tag">
                <Sparkles size={14} />
                <span>{editingId ? 'ATUALIZAÇÃO DE CONTRATO & ROTA' : 'NOVA HOMOLOGAÇÃO DE CLIENTE INDUSTRIAL'}</span>
              </span>
              <h3>{editingId ? `Editando: ${formData.nome_fantasia || formData.razao_social}` : 'Cadastrar Novo Cliente & Atribuir Rota'}</h3>
              <p>Preencha os dados cadastrais, endereço industrial, parâmetros de coleta e selecione a rota de atendimento do cliente.</p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <button
                type="button"
                className="btn-secondary btn-icon-text"
                onClick={handleFillExample}
                title="Preencher com dados de exemplo de teste da Ambipar"
              >
                <Zap size={15} color="#10b981" />
                <span>Preencher Exemplo</span>
              </button>

              <button
                type="submit"
                className="btn-primary btn-icon-text"
                id="btn-salvar-cliente-submit"
              >
                <Save size={16} />
                <span>{editingId ? 'Salvar Alterações' : 'Concluir Cadastro & Direcionar'}</span>
              </button>
            </div>
          </div>

          {/* Stepper de Abas do Formulário */}
          <div className="client-form-stepper">
            <button
              type="button"
              className={`stepper-btn ${formStep === 1 ? 'active' : ''}`}
              onClick={() => setFormStep(1)}
            >
              <span className="step-num">1</span>
              <span>Dados Cadastrais</span>
            </button>
            <button
              type="button"
              className={`stepper-btn ${formStep === 2 ? 'active' : ''}`}
              onClick={() => setFormStep(2)}
            >
              <span className="step-num">2</span>
              <span>Endereço & Polo</span>
            </button>
            <button
              type="button"
              className={`stepper-btn ${formStep === 3 ? 'active' : ''}`}
              onClick={() => setFormStep(3)}
            >
              <span className="step-num">3</span>
              <span>Roteirização & Frota</span>
            </button>
            <button
              type="button"
              className={`stepper-btn ${formStep === 4 ? 'active' : ''}`}
              onClick={() => setFormStep(4)}
            >
              <span className="step-num">4</span>
              <span>Resíduos & Licenças</span>
            </button>
            <button
              type="button"
              className={`stepper-btn ${formStep === 5 ? 'active' : ''}`}
              onClick={() => setFormStep(5)}
            >
              <span className="step-num">5</span>
              <span>Contatos & SLA</span>
            </button>
          </div>

          {/* PASSO 1: DADOS CADASTRAIS & JURÍDICOS */}
          {formStep === 1 && (
            <div className="form-section-card animate-fade-in">
              <div className="section-card-title">
                <Building size={18} color="#10b981" />
                <span>Identificação Jurídica & Segmento Industrial</span>
              </div>

              <div className="form-grid-3">
                <div className="form-field full-row">
                  <label>Razão Social Completa *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Braskem S/A - Unidade Q1 Polo Petroquímico"
                    value={formData.razao_social}
                    onChange={e => setFormData({ ...formData, razao_social: e.target.value })}
                  />
                </div>

                <div className="form-field">
                  <label>Nome Fantasia / Unidade *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Braskem Camaçari"
                    value={formData.nome_fantasia}
                    onChange={e => setFormData({ ...formData, nome_fantasia: e.target.value })}
                  />
                </div>

                <div className="form-field">
                  <label>CNPJ *</label>
                  <input
                    type="text"
                    required
                    placeholder="00.000.000/0000-00"
                    value={formData.cnpj}
                    onChange={e => setFormData({ ...formData, cnpj: formatCNPJ(e.target.value) })}
                  />
                </div>

                <div className="form-field">
                  <label>Inscrição Estadual (IE)</label>
                  <input
                    type="text"
                    placeholder="Ex: 012.345.678-BA"
                    value={formData.inscricao_estadual}
                    onChange={e => setFormData({ ...formData, inscricao_estadual: e.target.value })}
                  />
                </div>

                <div className="form-field">
                  <label>Segmento / Setor</label>
                  <PremiumSelect
                    value={formData.segmento}
                    onChange={val => setFormData({ ...formData, segmento: val })}
                    options={INDUSTRY_SEGMENTS}
                  />
                </div>

                <div className="form-field">
                  <label>Status Operacional</label>
                  <PremiumSelect
                    value={formData.status}
                    onChange={val => setFormData({ ...formData, status: val })}
                    options={CLIENT_STATUS_OPTIONS}
                  />
                </div>

                <div className="form-field">
                  <label>Nível SLA / Parceria</label>
                  <PremiumSelect
                    value={formData.tier_sla}
                    onChange={val => setFormData({ ...formData, tier_sla: val })}
                    options={SLA_TIER_OPTIONS}
                  />
                </div>
              </div>

              <div className="step-actions">
                <div></div>
                <button
                  type="button"
                  className="btn-primary btn-icon-text"
                  onClick={() => setFormStep(2)}
                >
                  <span>Avançar para Endereço</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* PASSO 2: ENDEREÇO & POLO INDUSTRIAL */}
          {formStep === 2 && (
            <div className="form-section-card animate-fade-in">
              <div className="section-card-title">
                <MapPin size={18} color="#10b981" />
                <span>Localização da Planta & Polo Logístico</span>
              </div>

              <div className="form-grid-3">
                <div className="form-field">
                  <label>CEP</label>
                  <input
                    type="text"
                    placeholder="00000-000"
                    value={formData.cep}
                    onChange={e => setFormData({ ...formData, cep: formatCEP(e.target.value) })}
                  />
                </div>

                <div className="form-field" style={{ gridColumn: 'span 2' }}>
                  <label>Logradouro / Rodovia</label>
                  <input
                    type="text"
                    placeholder="Ex: Rodovia Cônego Domenico Rangoni, km 260"
                    value={formData.logradouro}
                    onChange={e => setFormData({ ...formData, logradouro: e.target.value })}
                  />
                </div>

                <div className="form-field">
                  <label>Número / Km</label>
                  <input
                    type="text"
                    placeholder="Ex: 1561 ou S/N"
                    value={formData.numero}
                    onChange={e => setFormData({ ...formData, numero: e.target.value })}
                  />
                </div>

                <div className="form-field">
                  <label>Bairro / Distrito</label>
                  <input
                    type="text"
                    placeholder="Ex: Polo Industrial"
                    value={formData.bairro}
                    onChange={e => setFormData({ ...formData, bairro: e.target.value })}
                  />
                </div>

                <div className="form-field">
                  <label>Cidade *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Paulínia"
                    value={formData.cidade}
                    onChange={e => setFormData({ ...formData, cidade: e.target.value })}
                  />
                </div>

                <div className="form-field">
                  <label>Estado (UF) *</label>
                  <select
                    className="styled-native-select"
                    value={formData.uf}
                    onChange={e => setFormData({ ...formData, uf: e.target.value })}
                  >
                    {['SP', 'BA', 'RJ', 'MG', 'PR', 'RS', 'SC', 'ES', 'GO', 'PE', 'PA', 'AM', 'MT', 'MS'].map(uf => (
                      <option key={uf} value={uf}>{uf}</option>
                    ))}
                  </select>
                </div>

                <div className="form-field" style={{ gridColumn: 'span 2' }}>
                  <label>Polo Logístico Regional</label>
                  <input
                    type="text"
                    placeholder="Ex: Polo Petroquímico de Camaçari - BA"
                    value={formData.polo_logistico}
                    onChange={e => setFormData({ ...formData, polo_logistico: e.target.value })}
                  />
                </div>
              </div>

              <div className="step-actions">
                <button
                  type="button"
                  className="btn-secondary btn-icon-text"
                  onClick={() => setFormStep(1)}
                >
                  <ArrowLeft size={16} />
                  <span>Voltar</span>
                </button>
                <button
                  type="button"
                  className="btn-primary btn-icon-text"
                  onClick={() => setFormStep(3)}
                >
                  <span>Avançar para Roteirização</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* PASSO 3: ROTEIRIZAÇÃO LOGÍSTICA & DIRECIONAMENTO */}
          {formStep === 3 && (
            <div className="form-section-card animate-fade-in">
              <div className="section-card-title">
                <Route size={18} color="#10b981" />
                <span>Direcionamento de Rota, Frota Dedicada & Janela de Carga</span>
              </div>

              <div className="highlight-route-selection-box">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700, color: '#ffffff' }}>
                  Selecione a Rota Logística de Atendimento do Cliente *
                </label>
                <div className="route-cards-picker">
                  {routesList.map(route => {
                    const isSelected = formData.rota_id === route.id;
                    return (
                      <div
                        key={route.id}
                        className={`route-picker-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => {
                          setFormData({
                            ...formData,
                            rota_id: route.id,
                            distancia_km: route.distanciaKm,
                            tempo_ciclo_horas: route.tempoHoras,
                            veiculo_preferencial: route.veiculoRecomendado
                          });
                        }}
                      >
                        <div className="picker-card-top">
                          <span className="route-badge-code">{route.id}</span>
                          {isSelected && <span className="selected-indicator"><Check size={14} /> Selecionada</span>}
                        </div>
                        <h4 className="picker-route-title">{route.nome}</h4>
                        <div className="picker-route-details">
                          <div className="picker-point">
                            <span className="point-dot origin"></span>
                            <span>{route.origem}</span>
                          </div>
                          <div className="picker-arrow-down">
                            <ArrowRight size={14} />
                          </div>
                          <div className="picker-point">
                            <span className="point-dot dest"></span>
                            <span>{route.destino}</span>
                          </div>
                        </div>
                        <div className="picker-metrics-chips">
                          <span>{route.distanciaKm} km</span>
                          <span>~{route.tempoHoras}h ciclo</span>
                          <span className="co2-tag">🌱 {route.pegadaEstimadaCo2} kg CO2e</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="form-grid-3" style={{ marginTop: '1.5rem' }}>
                <div className="form-field">
                  <label>Tipo de Operação</label>
                  <select
                    className="styled-native-select"
                    value={formData.tipo_operacao}
                    onChange={e => setFormData({ ...formData, tipo_operacao: e.target.value })}
                  >
                    <option value="Coleta na Origem & Transbordo Químico">Coleta na Origem & Transbordo Químico</option>
                    <option value="Circuito Fechado Dedicado & Coleta de Borras">Circuito Fechado Dedicado & Coleta de Borras</option>
                    <option value="Sucção de Água Oleosa & Borras de Tanque">Sucção de Água Oleosa & Borras de Tanque</option>
                    <option value="Transporte de Resíduos Minerais & Escórias">Transporte de Resíduos Minerais & Escórias</option>
                    <option value="Escoamento de Cinzas & Lodo de ETE">Escoamento de Cinzas & Lodo de ETE</option>
                    <option value="Entrega de Insumos & Logística Reversa">Entrega de Insumos & Logística Reversa</option>
                  </select>
                </div>

                <div className="form-field">
                  <label>Frequência de Atendimento</label>
                  <PremiumSelect
                    value={formData.frequencia}
                    onChange={val => setFormData({ ...formData, frequencia: val })}
                    options={FREQUENCY_OPTIONS}
                  />
                </div>

                <div className="form-field">
                  <label>Janela de Atendimento / Horário</label>
                  <input
                    type="text"
                    placeholder="Ex: 07:00 às 18:00 (Seg a Sex)"
                    value={formData.janela_atendimento}
                    onChange={e => setFormData({ ...formData, janela_atendimento: e.target.value })}
                  />
                </div>

                <div className="form-field">
                  <label>Veículo Preferencial / Homologado</label>
                  <input
                    type="text"
                    placeholder="Ex: Carreta Tanque Inox Químico (316L)"
                    value={formData.veiculo_preferencial}
                    onChange={e => setFormData({ ...formData, veiculo_preferencial: e.target.value })}
                  />
                </div>

                <div className="form-field">
                  <label>Placa do Veículo Alocado (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Ex: AMB-4K89"
                    value={formData.veiculo_alocado_placa}
                    onChange={e => setFormData({ ...formData, veiculo_alocado_placa: e.target.value.toUpperCase() })}
                  />
                </div>

                <div className="form-field">
                  <label>Motorista Homologado CCO</label>
                  <input
                    type="text"
                    placeholder="Ex: Carlos Eduardo Santos"
                    value={formData.motorista_preferencial}
                    onChange={e => setFormData({ ...formData, motorista_preferencial: e.target.value })}
                  />
                </div>

                <div className="form-field">
                  <label>Distância da Rota (km)</label>
                  <input
                    type="number"
                    value={formData.distancia_km}
                    onChange={e => setFormData({ ...formData, distancia_km: e.target.value })}
                  />
                </div>

                <div className="form-field">
                  <label>Tempo Estimado de Ciclo (horas)</label>
                  <input
                    type="number"
                    value={formData.tempo_ciclo_horas}
                    onChange={e => setFormData({ ...formData, tempo_ciclo_horas: e.target.value })}
                  />
                </div>

                <div className="form-field">
                  <label>Volume Mensal Estimado (Toneladas)</label>
                  <input
                    type="number"
                    placeholder="Ex: 500"
                    value={formData.volume_mensal_ton}
                    onChange={e => setFormData({ ...formData, volume_mensal_ton: e.target.value })}
                  />
                </div>
              </div>

              <div className="step-actions">
                <button
                  type="button"
                  className="btn-secondary btn-icon-text"
                  onClick={() => setFormStep(2)}
                >
                  <ArrowLeft size={16} />
                  <span>Voltar</span>
                </button>
                <button
                  type="button"
                  className="btn-primary btn-icon-text"
                  onClick={() => setFormStep(4)}
                >
                  <span>Avançar para Conformidade</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* PASSO 4: RESÍDUOS & LICENÇAS AMBIENTAIS */}
          {formStep === 4 && (
            <div className="form-section-card animate-fade-in">
              <div className="section-card-title">
                <ShieldCheck size={18} color="#10b981" />
                <span>Resíduos, Licenciamento Ambiental & MTR</span>
              </div>

              <div className="form-grid-3">
                <div className="form-field full-row">
                  <label>Classes de Carga / Resíduos Homologados</label>
                  <input
                    type="text"
                    placeholder="Ex: Classe I (Perigosos - Corrosivos e Inflamáveis) / Classe IIA"
                    value={formData.classes_residuos}
                    onChange={e => setFormData({ ...formData, classes_residuos: e.target.value })}
                  />
                </div>

                <div className="form-field">
                  <label>Código de Atividade IBAMA</label>
                  <input
                    type="text"
                    placeholder="Ex: 07.01 - Indústria Química Orgânica"
                    value={formData.codigo_ibama}
                    onChange={e => setFormData({ ...formData, codigo_ibama: e.target.value })}
                  />
                </div>

                <div className="form-field">
                  <label>Nº da Licença de Operação (LO)</label>
                  <input
                    type="text"
                    placeholder="Ex: LO CETESB nº 34002981-SP"
                    value={formData.licenca_ambiental_num}
                    onChange={e => setFormData({ ...formData, licenca_ambiental_num: e.target.value })}
                  />
                </div>

                <div className="form-field">
                  <label>Validade da Licença Ambiental</label>
                  <input
                    type="date"
                    value={formData.validade_licenca}
                    onChange={e => setFormData({ ...formData, validade_licenca: e.target.value })}
                  />
                </div>

                <div className="form-field checkbox-field" style={{ gridColumn: 'span 3', display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <input
                    type="checkbox"
                    id="chk-mtr-obrigatorio"
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#10b981' }}
                    checked={formData.mtr_obrigatorio}
                    onChange={e => setFormData({ ...formData, mtr_obrigatorio: e.target.checked })}
                  />
                  <label htmlFor="chk-mtr-obrigatorio" style={{ cursor: 'pointer', color: '#ffffff', fontWeight: 600 }}>
                    Exigência de Emissão de Manifesto de Transporte de Resíduos (MTR / SINIR) em toda viagem
                  </label>
                </div>
              </div>

              <div className="step-actions">
                <button
                  type="button"
                  className="btn-secondary btn-icon-text"
                  onClick={() => setFormStep(3)}
                >
                  <ArrowLeft size={16} />
                  <span>Voltar</span>
                </button>
                <button
                  type="button"
                  className="btn-primary btn-icon-text"
                  onClick={() => setFormStep(5)}
                >
                  <span>Avançar para Contatos & Finalização</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* PASSO 5: CONTATOS & FINALIZAÇÃO */}
          {formStep === 5 && (
            <div className="form-section-card animate-fade-in">
              <div className="section-card-title">
                <UserCheck size={18} color="#10b981" />
                <span>Interlocutor da Planta & Governança Operacional</span>
              </div>

              <div className="form-grid-3">
                <div className="form-field">
                  <label>Nome do Responsável / Gestor</label>
                  <input
                    type="text"
                    placeholder="Ex: Dra. Marcela Albuquerque"
                    value={formData.responsavel_nome}
                    onChange={e => setFormData({ ...formData, responsavel_nome: e.target.value })}
                  />
                </div>

                <div className="form-field">
                  <label>Cargo / Departamento</label>
                  <input
                    type="text"
                    placeholder="Ex: Gerente de EHS & Logística"
                    value={formData.responsavel_cargo}
                    onChange={e => setFormData({ ...formData, responsavel_cargo: e.target.value })}
                  />
                </div>

                <div className="form-field">
                  <label>Telefone / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="(00) 00000-0000"
                    value={formData.telefone}
                    onChange={e => setFormData({ ...formData, telefone: formatPhone(e.target.value) })}
                  />
                </div>

                <div className="form-field" style={{ gridColumn: 'span 2' }}>
                  <label>E-mail Corporativo</label>
                  <input
                    type="email"
                    placeholder="marcela@empresa.com.br"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="form-field full-row">
                  <label>Observações & Requisitos Especiais de Carga/Descarga</label>
                  <textarea
                    rows={3}
                    placeholder="Instruções de segurança, EPIs obrigatórios na portaria, kit de contenção, procedimentos de pesagem e horários de pico."
                    value={formData.observacoes}
                    onChange={e => setFormData({ ...formData, observacoes: e.target.value })}
                    className="styled-native-textarea"
                  />
                </div>
              </div>

              <div className="step-actions">
                <button
                  type="button"
                  className="btn-secondary btn-icon-text"
                  onClick={() => setFormStep(4)}
                >
                  <ArrowLeft size={16} />
                  <span>Voltar</span>
                </button>
                <button
                  type="submit"
                  className="btn-primary btn-icon-text"
                  style={{ background: 'linear-gradient(135deg, #10b981, #059669)', padding: '0.75rem 1.75rem' }}
                >
                  <Check size={18} />
                  <span>{editingId ? 'Salvar Alterações do Cliente' : 'Homologar Cliente & Ativar Rota'}</span>
                </button>
              </div>
            </div>
          )}
        </form>
      ) : (
        /* ============================================================== */
        /* MODO 2: COCKPIT EXECUTIVO DE CLIENTES & ROTAS (CARDS & TABELA) */
        /* ============================================================== */
        <>
          {/* Top 5 KPIs Executivos */}
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-top">
                <span className="kpi-title">Clientes Industriais</span>
                <div className="kpi-icon-wrap emerald">
                  <Building2 size={18} />
                </div>
              </div>
              <div className="kpi-main-val">
                <span className="val-number">{totalClients}</span>
                <span className="unit-suffix">cadastrados</span>
              </div>
              <div className="kpi-footer-status">
                <span style={{ color: '#10b981', fontWeight: 600 }}>{activeCount} ativos</span> na carteira CCO
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-top">
                <span className="kpi-title">Em Atendimento / Rota</span>
                <div className="kpi-icon-wrap cyan">
                  <Truck size={18} />
                </div>
              </div>
              <div className="kpi-main-val">
                <span className="val-number">{inTripCount}</span>
                <span className="unit-suffix">em viagem</span>
              </div>
              <div className="kpi-footer-status">
                Atendimento em trânsito com telemetria ativa
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-top">
                <span className="kpi-title">Volume Mensal Escoado</span>
                <div className="kpi-icon-wrap forest">
                  <Layers size={18} />
                </div>
              </div>
              <div className="kpi-main-val">
                <span className="val-number">{totalVolumeMonthly.toLocaleString('pt-BR')}</span>
                <span className="unit-suffix">t / mês</span>
              </div>
              <div className="kpi-footer-status">
                Capacidade logística contratada
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-top">
                <span className="kpi-title">Rotas Conectadas</span>
                <div className="kpi-icon-wrap orange">
                  <Route size={18} />
                </div>
              </div>
              <div className="kpi-main-val">
                <span className="val-number">{totalRoutesUsed}</span>
                <span className="unit-suffix">eixos logísticos</span>
              </div>
              <div className="kpi-footer-status">
                Atendendo {routesList.length} corredores nacionais
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-top">
                <span className="kpi-title">Conformidade Ambiental</span>
                <div className="kpi-icon-wrap emerald">
                  <ShieldCheck size={18} />
                </div>
              </div>
              <div className="kpi-main-val">
                <span className="val-number">{Math.round(((totalClients - blockedCount) / (totalClients || 1)) * 100)}%</span>
                <span className="unit-suffix">homologados</span>
              </div>
              <div className="kpi-footer-status">
                {blockedCount === 0 ? 'Zero pendências em LO / SINIR' : `${blockedCount} clientes com licença a regularizar`}
              </div>
            </div>
          </div>

          {/* Abas Rápidas no Topo */}
          <div className="client-tabs-bar">
            <button
              type="button"
              className={`client-tab-item ${activeTab === 'todos' ? 'active' : ''}`}
              onClick={() => setActiveTab('todos')}
            >
              <Building2 size={15} />
              <span>Todos os Clientes ({totalClients})</span>
            </button>
            <button
              type="button"
              className={`client-tab-item ${activeTab === 'em_operacao' ? 'active' : ''}`}
              onClick={() => setActiveTab('em_operacao')}
            >
              <Truck size={15} />
              <span>Em Operação Hoje ({inTripCount})</span>
            </button>
            <button
              type="button"
              className={`client-tab-item ${activeTab === 'ativos' ? 'active' : ''}`}
              onClick={() => setActiveTab('ativos')}
            >
              <CheckCircle2 size={15} />
              <span>Ativos Regulares ({clients.filter(c => c.status === 'Ativo').length})</span>
            </button>
            <button
              type="button"
              className={`client-tab-item ${activeTab === 'platinum' ? 'active' : ''}`}
              onClick={() => setActiveTab('platinum')}
            >
              <Sparkles size={15} />
              <span>Tier Platinum 24/7 ({clients.filter(c => c.tier_sla?.includes('Platinum')).length})</span>
            </button>
            {blockedCount > 0 && (
              <button
                type="button"
                className={`client-tab-item danger ${activeTab === 'bloqueados' ? 'active' : ''}`}
                onClick={() => setActiveTab('bloqueados')}
              >
                <AlertTriangle size={15} />
                <span>Bloqueados / Pendência ({blockedCount})</span>
              </button>
            )}
          </div>

          {/* Barra de Filtros & Modo de Visualização */}
          <div className="filter-panel">
            <div className="search-bar">
              <Search size={16} />
              <input
                type="text"
                placeholder="Buscar por Razão Social, CNPJ, Cidade, UF, Rota, Segmento ou Polo..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  style={{ background: 'transparent', color: 'var(--text-dim)', fontSize: '0.8rem' }}
                >
                  ✕
                </button>
              )}
            </div>

            <div className="filter-actions-row">
              <div style={{ minWidth: '180px' }}>
                <PremiumSelect
                  value={statusFilter}
                  onChange={setStatusFilter}
                  options={[
                    { value: 'Todos', label: 'Todos os Status' },
                    ...CLIENT_STATUS_OPTIONS
                  ]}
                  placeholder="Filtrar Status..."
                  size="sm"
                />
              </div>

              <div style={{ minWidth: '220px' }}>
                <PremiumSelect
                  value={routeFilter}
                  onChange={setRouteFilter}
                  options={[
                    { value: 'Todas', label: 'Todas as Rotas' },
                    ...routesList.map(r => ({ value: r.id, label: r.nome, sublabel: `${r.distanciaKm} km - ${r.origem}` }))
                  ]}
                  placeholder="Filtrar por Rota..."
                  size="sm"
                />
              </div>

              {/* Botões de Alternância Cards vs Tabela */}
              <div className="view-switch-group">
                <button
                  type="button"
                  className={`view-toggle-btn ${viewMode === 'cards' ? 'active' : ''}`}
                  onClick={() => setViewMode('cards')}
                  title="Visualização em Cards Dossiê"
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  type="button"
                  className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
                  onClick={() => setViewMode('table')}
                  title="Visualização em Tabela Operacional"
                >
                  <List size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Contagem de Resultados */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', color: 'var(--text-dim)', fontSize: '0.82rem' }}>
            <span>Exibindo <strong>{filteredClients.length}</strong> de <strong>{totalClients}</strong> clientes industriais</span>
            <span>Ambipar CCO Logistics • Gestão de Contratos & Roteirização</span>
          </div>

          {/* ============================================================== */}
          {/* VISUALIZAÇÃO 1: CARDS DOSSIÊ DO CLIENTE                       */}
          {/* ============================================================== */}
          {viewMode === 'cards' ? (
            <div className="clients-dossier-grid">
              {filteredClients.map(client => {
                const statusMeta = CLIENT_STATUS_OPTIONS.find(s => s.value === client.status) || CLIENT_STATUS_OPTIONS[0];
                const routeMeta = routesList.find(r => r.id === client.rota_id) || routesList[0];
                const whatsappUrl = getWhatsAppLink(client.telefone, client.nome_fantasia || client.razao_social);

                return (
                  <div key={client.id} className="client-dossier-card animate-fade-in" id={`client-card-${client.id}`}>
                    {/* Topo do Card */}
                    <div className="client-card-header">
                      <div className="client-identity">
                        <div className="client-avatar-badge">
                          <span>{client.nome_fantasia?.slice(0, 2).toUpperCase() || 'CL'}</span>
                        </div>
                        <div>
                          <div className="client-name-row">
                            <h3 className="client-name" title={client.razao_social}>
                              {client.nome_fantasia || client.razao_social}
                            </h3>
                            <span 
                              className="client-tier-chip"
                              style={{ 
                                background: client.tier_sla?.includes('Platinum') ? 'rgba(6, 182, 212, 0.15)' : 'rgba(16, 185, 129, 0.12)',
                                color: client.tier_sla?.includes('Platinum') ? '#38bdf8' : '#34d399',
                                border: client.tier_sla?.includes('Platinum') ? '1px solid rgba(6, 182, 212, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)'
                              }}
                            >
                              {client.tier_sla || 'Gold'}
                            </span>
                          </div>
                          <span className="client-razao-sub">{client.razao_social}</span>
                        </div>
                      </div>

                      <div className="client-status-box">
                        <span 
                          className="status-pill"
                          style={{
                            background: `${statusMeta.color}18`,
                            color: statusMeta.color,
                            borderColor: `${statusMeta.color}40`,
                            padding: '3px 10px',
                            fontSize: '0.74rem'
                          }}
                        >
                          <span className="dot" style={{ background: statusMeta.color }}></span>
                          {client.status}
                        </span>
                      </div>
                    </div>

                    {/* Dados Básicos: CNPJ, Cidade, Segmento */}
                    <div className="client-meta-strip">
                      <div className="meta-pill">
                        <span className="meta-lbl">CNPJ:</span>
                        <span className="meta-val">{client.cnpj}</span>
                      </div>
                      <div className="meta-pill">
                        <MapPin size={12} color="#10b981" />
                        <span className="meta-val">{client.cidade} / {client.uf}</span>
                      </div>
                      <div className="meta-pill">
                        <Tag size={12} color="#06b6d4" />
                        <span className="meta-val">{client.segmento}</span>
                      </div>
                    </div>

                    {/* BOX DA ROTA ATRIBUÍDA ("DIRECIONAR ELE A ROTA") */}
                    <div className="client-route-cockpit-box">
                      <div className="route-cockpit-top">
                        <div className="route-cockpit-title">
                          <Route size={15} color="#10b981" />
                          <span className="route-main-name">{client.rota_nome || routeMeta.nome}</span>
                        </div>
                        <button
                          type="button"
                          className="btn-redirect-route-quick"
                          onClick={() => handleOpenRedirectModal(client)}
                          title="Alterar ou Redirecionar Rota deste cliente"
                        >
                          <Compass size={13} />
                          <span>Mudar Rota</span>
                        </button>
                      </div>

                      {/* Timeline do Trajeto da Rota */}
                      <div className="route-path-visualizer">
                        <div className="path-node">
                          <span className="node-marker origin"></span>
                          <div className="node-text">
                            <span className="node-label">Origem</span>
                            <span className="node-loc">{client.cidade}/{client.uf} ({client.nome_fantasia || 'Planta'})</span>
                          </div>
                        </div>

                        <div className="path-connector-line">
                          <span className="connector-dist">{client.distancia_km || routeMeta.distanciaKm} km</span>
                          <span className="connector-eta">~{client.tempo_ciclo_horas || routeMeta.tempoHoras}h ciclo</span>
                        </div>

                        <div className="path-node">
                          <span className="node-marker dest"></span>
                          <div className="node-text">
                            <span className="node-label">Destino</span>
                            <span className="node-loc">{routeMeta.destino?.split('(')[0] || 'Base Ambipar'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Rodapé da Rota com Frequência, Veículo e Motorista */}
                      <div className="route-dispatch-meta-grid">
                        <div className="dispatch-cell">
                          <span className="dispatch-lbl"><Clock size={11} /> Frequência</span>
                          <span className="dispatch-val">{client.frequencia || '3x por Semana'}</span>
                        </div>
                        <div className="dispatch-cell">
                          <span className="dispatch-lbl"><Truck size={11} /> Veículo Alocado</span>
                          <span className="dispatch-val">{client.veiculo_alocado_placa || 'Carreta Tanque'}</span>
                        </div>
                        <div className="dispatch-cell">
                          <span className="dispatch-lbl"><UserCheck size={11} /> Condutor MOPP</span>
                          <span className="dispatch-val" title={client.motorista_preferencial}>
                            {client.motorista_preferencial?.split(' ')[0] || 'Escala CCO'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Resíduos & Licenciamento Ambiental */}
                    <div className="client-compliance-summary">
                      <div className="compliance-row">
                        <span className="compliance-lbl">Resíduos:</span>
                        <span className="compliance-val" title={client.classes_residuos}>
                          {client.classes_residuos || 'Classe I e II'}
                        </span>
                      </div>
                      <div className="compliance-row">
                        <span className="compliance-lbl">Licença de Operação:</span>
                        <span className="compliance-val">
                          <ShieldCheck size={13} color="#10b981" style={{ marginRight: '4px' }} />
                          {client.licenca_ambiental_num || 'LO Homologada'} (Até {client.validade_licenca || '2028'})
                        </span>
                      </div>
                    </div>

                    {/* Rodapé do Card: Contato & Ações */}
                    <div className="client-card-footer">
                      <div className="client-contact-brief">
                        {whatsappUrl ? (
                          <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-whatsapp-direct"
                            title={`Conversar com ${client.responsavel_nome} no WhatsApp`}
                          >
                            <Phone size={13} />
                            <span>{client.telefone}</span>
                          </a>
                        ) : (
                          <span style={{ fontSize: '0.76rem', color: 'var(--text-dim)' }}>Sem telefone</span>
                        )}
                        <span className="client-resp-name" title={client.responsavel_nome}>
                          {client.responsavel_nome?.split(' ')[0] || 'Gestor'}
                        </span>
                      </div>

                      <div className="client-card-actions">
                        <button
                          type="button"
                          className="btn-icon-action"
                          onClick={() => setSelectedClientDossier(client)}
                          title="Visualizar Dossiê Completo"
                        >
                          <Eye size={15} />
                        </button>

                        <button
                          type="button"
                          className="btn-icon-action"
                          onClick={() => handleOpenEditForm(client)}
                          title="Editar Cadastro"
                        >
                          <Edit3 size={15} />
                        </button>

                        <button
                          type="button"
                          className="btn-icon-action danger"
                          onClick={() => handleDeleteClient(client.id, client.nome_fantasia || client.razao_social)}
                          title="Excluir Cliente"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ============================================================== */
            /* VISUALIZAÇÃO 2: TABELA OPERACIONAL CCO                         */
            /* ============================================================== */
            <div className="table-responsive-wrapper animate-fade-in">
              <table className="styled-executive-table">
                <thead>
                  <tr>
                    <th>Cliente / Razão Social</th>
                    <th>CNPJ / IE</th>
                    <th>Polo / Localização</th>
                    <th>Rota Atribuída</th>
                    <th>Frequência</th>
                    <th>Veículo & Motorista</th>
                    <th>Licença LO</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map(client => {
                    const statusMeta = CLIENT_STATUS_OPTIONS.find(s => s.value === client.status) || CLIENT_STATUS_OPTIONS[0];
                    return (
                      <tr key={client.id}>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <strong style={{ color: '#ffffff' }}>{client.nome_fantasia || client.razao_social}</strong>
                            <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>{client.segmento}</span>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.78rem' }}>
                            <span>{client.cnpj}</span>
                            <span style={{ color: 'var(--text-dim)', fontSize: '0.72rem' }}>IE: {client.inscricao_estadual || 'Isento'}</span>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}>
                            <MapPin size={13} color="#10b981" />
                            <span>{client.cidade}/{client.uf}</span>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 600, color: '#38bdf8', fontSize: '0.8rem' }}>{client.rota_nome?.split('(')[0] || client.rota_id}</span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{client.distancia_km} km • ~{client.tempo_ciclo_horas}h</span>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.78rem', color: '#ffffff' }}>{client.frequencia}</span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.76rem' }}>
                            <span style={{ color: '#ffffff' }}>{client.veiculo_alocado_placa || 'Frota CCO'}</span>
                            <span style={{ color: 'var(--text-dim)' }}>{client.motorista_preferencial}</span>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.74rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <ShieldCheck size={12} />
                            {client.validade_licenca || 'Válida'}
                          </span>
                        </td>
                        <td>
                          <span 
                            className="status-badge-chip"
                            style={{
                              background: `${statusMeta.color}18`,
                              color: statusMeta.color,
                              border: `1px solid ${statusMeta.color}40`,
                              fontSize: '0.72rem'
                            }}
                          >
                            {client.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                            <button
                              type="button"
                              className="btn-icon-action"
                              onClick={() => handleOpenRedirectModal(client)}
                              title="Redirecionar Rota"
                            >
                              <Compass size={14} color="#06b6d4" />
                            </button>
                            <button
                              type="button"
                              className="btn-icon-action"
                              onClick={() => setSelectedClientDossier(client)}
                              title="Ver Dossiê"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              type="button"
                              className="btn-icon-action"
                              onClick={() => handleOpenEditForm(client)}
                              title="Editar"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              type="button"
                              className="btn-icon-action danger"
                              onClick={() => handleDeleteClient(client.id, client.nome_fantasia || client.razao_social)}
                              title="Excluir"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ============================================================== */}
      {/* MODAL 1: REDIRECIONAR CLIENTE A UMA NOVA ROTA (AÇÃO RÁPIDA)    */}
      {/* ============================================================== */}
      {clientToRedirect && (
        <div className="modal-overlay animate-fade-in" onClick={() => setClientToRedirect(null)}>
          <div className="modal-dialog-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div className="modal-header-banner">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div className="modal-icon-glow">
                  <Compass size={20} color="#06b6d4" />
                </div>
                <div>
                  <h3 style={{ color: '#ffffff', margin: 0, fontSize: '1.15rem' }}>Direcionar Cliente à Rota Logística</h3>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                    {clientToRedirect.nome_fantasia || clientToRedirect.razao_social} ({clientToRedirect.cidade}/{clientToRedirect.uf})
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setClientToRedirect(null)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body-content" style={{ padding: '1.25rem' }}>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: '1.1rem' }}>
                Selecione a nova rota logística para direcionar o escoamento ou coleta deste cliente industrial. O CCO atualizará os tempos de trânsito e o despacho imediatamente:
              </p>

              <div style={{ marginBottom: '1.2rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#ffffff', marginBottom: '0.4rem' }}>
                  Nova Rota Logística *
                </label>
                <select
                  className="styled-native-select"
                  value={newSelectedRouteId}
                  onChange={e => setNewSelectedRouteId(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem' }}
                >
                  {routesList.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.nome} ({r.distanciaKm} km | ~{r.tempoHoras}h ciclo | {r.origem})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '1.2rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#ffffff', marginBottom: '0.4rem' }}>
                  Frequência de Atendimento *
                </label>
                <PremiumSelect
                  value={newSelectedFrequency}
                  onChange={setNewSelectedFrequency}
                  options={FREQUENCY_OPTIONS}
                />
              </div>

              {/* Rota Selecionada Preview */}
              {(() => {
                const previewRoute = routesList.find(r => r.id === newSelectedRouteId) || routesList[0];
                return (
                  <div className="route-preview-badge-card" style={{ background: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.25)', padding: '0.9rem', borderRadius: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <strong style={{ color: '#38bdf8', fontSize: '0.88rem' }}>{previewRoute.nome}</strong>
                      <span style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 700 }}>{previewRoute.distanciaKm} km</span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      <div><strong>Origem:</strong> {previewRoute.origem}</div>
                      <div><strong>Destino:</strong> {previewRoute.destino}</div>
                      <div><strong>Veículo Padrão:</strong> {previewRoute.veiculoRecomendado}</div>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="modal-footer-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', padding: '1rem 1.25rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setClientToRedirect(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-primary btn-icon-text"
                onClick={handleConfirmRedirectRoute}
                style={{ background: 'linear-gradient(135deg, #06b6d4, #0284c7)' }}
              >
                <Compass size={16} />
                <span>Confirmar e Direcionar para Rota</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: DOSSIÊ COMPLETO DO CLIENTE (FICHA TÉCNICA CCO)        */}
      {/* ============================================================== */}
      {selectedClientDossier && (
        <div className="modal-overlay animate-fade-in" onClick={() => setSelectedClientDossier(null)}>
          <div className="modal-dialog-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '820px' }}>
            <div className="modal-header-banner">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div className="modal-icon-glow emerald">
                  <Building2 size={24} color="#10b981" />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h3 style={{ color: '#ffffff', margin: 0 }}>{selectedClientDossier.nome_fantasia || selectedClientDossier.razao_social}</h3>
                    <span className="client-tier-chip" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
                      {selectedClientDossier.tier_sla}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                    {selectedClientDossier.razao_social} • CNPJ: {selectedClientDossier.cnpj}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setSelectedClientDossier(null)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body-content" style={{ padding: '1.5rem', maxHeight: '72vh', overflowY: 'auto' }}>
              {/* Grid de 3 Colunas de Detalhes */}
              <div className="dossier-details-grid">
                {/* Coluna 1: Endereço & Polo */}
                <div className="dossier-box">
                  <div className="dossier-box-title">
                    <MapPin size={15} color="#10b981" />
                    <span>Localização da Planta</span>
                  </div>
                  <div className="dossier-data-item">
                    <span className="lbl">Endereço:</span>
                    <span className="val">{selectedClientDossier.logradouro}, {selectedClientDossier.numero}</span>
                  </div>
                  <div className="dossier-data-item">
                    <span className="lbl">Bairro / Cidade:</span>
                    <span className="val">{selectedClientDossier.bairro || '—'} - {selectedClientDossier.cidade} / {selectedClientDossier.uf}</span>
                  </div>
                  <div className="dossier-data-item">
                    <span className="lbl">CEP:</span>
                    <span className="val">{selectedClientDossier.cep || '—'}</span>
                  </div>
                  <div className="dossier-data-item">
                    <span className="lbl">Polo Logístico:</span>
                    <span className="val" style={{ color: '#38bdf8' }}>{selectedClientDossier.polo_logistico || 'Polo Industrial'}</span>
                  </div>
                </div>

                {/* Coluna 2: Roteirização */}
                <div className="dossier-box">
                  <div className="dossier-box-title">
                    <Route size={15} color="#06b6d4" />
                    <span>Roteirização Logística</span>
                  </div>
                  <div className="dossier-data-item">
                    <span className="lbl">Rota Ativa:</span>
                    <span className="val" style={{ color: '#ffffff', fontWeight: 600 }}>{selectedClientDossier.rota_nome}</span>
                  </div>
                  <div className="dossier-data-item">
                    <span className="lbl">Distância & Ciclo:</span>
                    <span className="val">{selectedClientDossier.distancia_km} km (~{selectedClientDossier.tempo_ciclo_horas}h ciclo)</span>
                  </div>
                  <div className="dossier-data-item">
                    <span className="lbl">Frequência:</span>
                    <span className="val">{selectedClientDossier.frequencia}</span>
                  </div>
                  <div className="dossier-data-item">
                    <span className="lbl">Janela de Carga:</span>
                    <span className="val">{selectedClientDossier.janela_atendimento}</span>
                  </div>
                  <div className="dossier-data-item">
                    <span className="lbl">Veículo / Motorista:</span>
                    <span className="val">{selectedClientDossier.veiculo_alocado_placa || 'Carreta Tanque'} • {selectedClientDossier.motorista_preferencial}</span>
                  </div>
                </div>

                {/* Coluna 3: Conformidade & Resíduos */}
                <div className="dossier-box">
                  <div className="dossier-box-title">
                    <ShieldCheck size={15} color="#f59e0b" />
                    <span>Conformidade & Meio Ambiente</span>
                  </div>
                  <div className="dossier-data-item">
                    <span className="lbl">Tipos de Resíduo:</span>
                    <span className="val">{selectedClientDossier.classes_residuos}</span>
                  </div>
                  <div className="dossier-data-item">
                    <span className="lbl">Licença de Operação (LO):</span>
                    <span className="val" style={{ color: '#10b981', fontWeight: 600 }}>{selectedClientDossier.licenca_ambiental_num || 'LO Homologada'}</span>
                  </div>
                  <div className="dossier-data-item">
                    <span className="lbl">Validade da LO:</span>
                    <span className="val">{selectedClientDossier.validade_licenca || '2028-12-31'}</span>
                  </div>
                  <div className="dossier-data-item">
                    <span className="lbl">Código IBAMA:</span>
                    <span className="val">{selectedClientDossier.codigo_ibama || '07.01'}</span>
                  </div>
                  <div className="dossier-data-item">
                    <span className="lbl">MTR / SINIR:</span>
                    <span className="val" style={{ color: selectedClientDossier.mtr_obrigatorio ? '#10b981' : 'var(--text-muted)' }}>
                      {selectedClientDossier.mtr_obrigatorio ? '✓ Obrigatório em toda expedição' : 'Dispensado'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contatos & Governança */}
              <div className="dossier-contact-bar" style={{ marginTop: '1.25rem', padding: '1rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.07)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Responsável na Planta
                    </span>
                    <div style={{ color: '#ffffff', fontWeight: 700, fontSize: '0.92rem' }}>
                      {selectedClientDossier.responsavel_nome} — <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>{selectedClientDossier.responsavel_cargo}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      ✉ {selectedClientDossier.email} • ☎ {selectedClientDossier.telefone}
                    </div>
                  </div>

                  {getWhatsAppLink(selectedClientDossier.telefone, selectedClientDossier.nome_fantasia) && (
                    <a
                      href={getWhatsAppLink(selectedClientDossier.telefone, selectedClientDossier.nome_fantasia)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-whatsapp-direct"
                      style={{ padding: '0.5rem 1rem', fontSize: '0.84rem' }}
                    >
                      <Phone size={15} />
                      <span>Chamar no WhatsApp</span>
                    </a>
                  )}
                </div>
              </div>

              {selectedClientDossier.observacoes && (
                <div style={{ marginTop: '1rem', padding: '0.85rem', background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <strong style={{ color: '#f59e0b' }}>Observações Operacionais: </strong>
                  {selectedClientDossier.observacoes}
                </div>
              )}
            </div>

            <div className="modal-footer-actions" style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 1.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <button
                type="button"
                className="btn-secondary btn-icon-text"
                onClick={() => window.print()}
              >
                <Printer size={15} />
                <span>Imprimir Ficha Cadastral</span>
              </button>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setSelectedClientDossier(null)}
                >
                  Fechar
                </button>
                <button
                  type="button"
                  className="btn-primary btn-icon-text"
                  onClick={() => {
                    const client = selectedClientDossier;
                    setSelectedClientDossier(null);
                    handleOpenEditForm(client);
                  }}
                >
                  <Edit3 size={15} />
                  <span>Editar Cadastro Completo</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
