import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Plus, 
  Search, 
  ShieldCheck, 
  AlertTriangle, 
  Calendar, 
  CheckCircle2, 
  Trash2, 
  Edit3, 
  RefreshCw, 
  Layers, 
  Fuel, 
  Gauge, 
  FileCheck, 
  UserCheck, 
  ArrowLeft, 
  Save, 
  Check, 
  Wrench, 
  Radio, 
  Sparkles, 
  Activity, 
  ShieldAlert,
  Flame,
  Info,
  MapPin,
  Navigation,
  Thermometer,
  Zap,
  Phone,
  MessageCircle,
  ExternalLink,
  LayoutGrid,
  List,
  Clock,
  Shield,
  CheckSquare,
  FileText,
  Upload,
  X,
  Filter,
  TrendingUp,
  BarChart3,
  ChevronRight,
  Copy,
  Send,
  Smartphone,
  SendHorizontal
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import PremiumSelect from './PremiumSelect';
import { readCrlvFile } from '../utils/crlvPdfReader';

export const VEHICLE_STATUS_OPTIONS = [
  { 
    value: 'Disponível', 
    label: 'Disponível no Pátio / CCO', 
    sublabel: 'Pronto para escala e alocação imediata', 
    color: '#10b981',
    badge: 'Liberado'
  },
  { 
    value: 'Em Viagem', 
    label: 'Em Operação / Viagem', 
    sublabel: 'Em trânsito com manifesto rodoviário ativo', 
    color: '#06b6d4',
    badge: 'Em Rota'
  },
  { 
    value: 'Manutenção', 
    label: 'Em Manutenção (Oficina / Pátio)', 
    sublabel: 'Preventiva, corretiva ou troca de componentes', 
    color: '#f59e0b',
    badge: 'Oficina'
  },
  { 
    value: 'Bloqueado', 
    label: 'Bloqueado (Documentação / CCO)', 
    sublabel: 'Pendência em CRLV, CIPP, CIV, Tacógrafo ou Sinistro', 
    color: '#f43f5e',
    badge: 'Bloqueado'
  }
];

export const VEHICLE_TYPES = [
  { value: 'Carreta Tanque Químico (Inox 316L)', label: 'Carreta Tanque Químico (Inox 316L / Hazmat)', sublabel: 'Transporte de produtos perigosos corrosivos e inflamáveis' },
  { value: 'Bitrem Tanque Químico', label: 'Bitrem Tanque Químico (7 ou 9 Eixos)', sublabel: 'Conjunto articulado para grandes volumes granel líquido' },
  { value: 'Caminhão Truck PBT 23t (Tanque/Baú)', label: 'Caminhão Rígido Truck (3 Eixos - PBT 23t)', sublabel: 'Operações regionais e coletas dedicadas' },
  { value: 'Carreta Sider (Carga Seca / Tambores)', label: 'Carreta Sider (Enlonada / Carga Geral & IBCs)', sublabel: 'Carregamento lateral de tambores e contêineres' },
  { value: 'Veículo de Apoio PAE (Ambipar Response)', label: 'Veículo de Apoio Emergencial / PAE Response', sublabel: 'Equipado com kit de contenção e prontidão 24h' },
  { value: 'Caminhão Trator Pesado (Tração 6x4)', label: 'Caminhão Trator Pesado (Tração 6x4 - Rodotrem / Bitrem)', sublabel: 'Unidade de alta capacidade tratora' },
  { value: 'Caminhão Trator (Tração 6x2)', label: 'Caminhão Trator (Tração 6x2 - Carreta Simples)', sublabel: 'Unidade tratora convencional de rota' },
  { value: 'Carreta Tanque Isotérmica', label: 'Carreta Tanque Isotérmica / Climatizada', sublabel: 'Cargas sensíveis a temperatura' },
  { value: 'Carreta Baú Fechado', label: 'Carreta Baú Alumínio Fechado', sublabel: 'Segurança máxima para cargas embaladas' },
  { value: 'Rodotrem Graneleiro / Caçamba', label: 'Rodotrem Caçamba / Basculante (9 Eixos)', sublabel: 'Granéis sólidos e resíduos industriais pesados' },
  { value: 'Caminhão Toco PBT 16t', label: 'Caminhão Rígido Toco (2 Eixos - PBT 16t)', sublabel: 'Distribuição urbana e coletas fracionadas' }
];

export const CARGO_TYPES = [
  { value: 'Produtos Químicos Perigosos (Hazmat)', label: 'Produtos Químicos Perigosos (Hazmat - Classes 1 a 9)', sublabel: 'Inflamáveis, corrosivos, tóxicos e oxidantes' },
  { value: 'Combustíveis & Derivados de Petróleo', label: 'Combustíveis & Derivados de Petróleo', sublabel: 'Diesel, gasolina, etanol e óleos combustíveis' },
  { value: 'Resíduos Industriais Classe I (Perigosos)', label: 'Resíduos Industriais Classe I (Perigosos / SINIR)', sublabel: 'Resíduos contaminados, borras e efluentes pesados' },
  { value: 'Resíduos Industriais Classe II (Não Perigosos)', label: 'Resíduos Classe IIA / IIB (Inertes e Não Inertes)', sublabel: 'Sucatas, entulhos, orgânicos e reciclagem' },
  { value: 'Carga Geral Seca & Embalada', label: 'Carga Geral Seca & Embalada (IBCs e Tambores)', sublabel: 'Insumos industriais e embalagens homologadas' },
  { value: 'Prontidão de Emergência Ambiental', label: 'Prontidão de Atendimento Emergencial (Ambipar PAE)', sublabel: 'Materiais de resposta rápida a sinistros ambientais' }
];

export const FUEL_TYPES = [
  { value: 'Diesel S10', label: 'Diesel S10 (Baixo Enxofre - Euro 6)', sublabel: 'Combustível padrão da frota limpa' },
  { value: 'Biodiesel B100', label: 'Biodiesel Puro (B100 - Descarbonização ESG)', sublabel: 'Operação verde com baixa pegada de carbono' },
  { value: 'Gás Natural Veicular (GNV / Biometano)', label: 'Gás Natural Veicular / Biometano', sublabel: 'Frota a gás sustentável' },
  { value: 'Diesel S500', label: 'Diesel S500', sublabel: 'Combustível convencional' },
  { value: 'Elétrico / Híbrido', label: 'Veículo 100% Elétrico / Híbrido', sublabel: 'Zero emissão direta de CO2' }
];

// Frota Flagship Ambipar homologada com dados operacionais reais e oficiais
export const DEFAULT_AMBIPAR_FLEET = [
  {
    id: 'VEI-AMB001',
    placa: 'AMB4K89',
    prefixo: 'AMB-101',
    tipo: 'Carreta Tanque Químico (Inox 316L)',
    marca_modelo: 'Scania R540 V8 Super 6x4',
    ano_fabricacao: 2024,
    ano_modelo: 2024,
    chassi: '9BSAMB540RP128901',
    renavam: '01293847561',
    capacidade_peso_ton: 57.0,
    capacidade_volume_m3: 38.0,
    tipo_carga: 'Produtos Químicos Perigosos (Hazmat)',
    combustivel: 'Diesel S10',
    km_atual: 118420,
    proxima_revisao_km: 125000,
    validade_crlv: '2027-10-31',
    validade_cronotacografo: '2026-11-20',
    validade_cipp: '2027-08-15',
    validade_civ: '2027-08-15',
    validade_fumaca_opacidade: '2027-04-10',
    validade_seguro_ambiental: '2028-01-30',
    motorista_vinculado: 'Carlos Eduardo Dos Santos Ferreira',
    motorista_telefone: '(21) 99240-5610',
    status: 'Em Viagem',
    observacoes: 'Conjunto dedicado ao transporte de Ácido Sulfúrico a granel. Válvulas de alívio testadas e kit PAE 100% completo.'
  },
  {
    id: 'VEI-AMB002',
    placa: 'AMB7X21',
    prefixo: 'AMB-102',
    tipo: 'Bitrem Tanque Químico',
    marca_modelo: 'Volvo FH 540 6x4 Globetrotter (9 Eixos)',
    ano_fabricacao: 2023,
    ano_modelo: 2024,
    chassi: '9BVFH540GT9028174',
    renavam: '09812736452',
    capacidade_peso_ton: 74.0,
    capacidade_volume_m3: 62.0,
    tipo_carga: 'Combustíveis & Derivados de Petróleo',
    combustivel: 'Diesel S10',
    km_atual: 94100,
    proxima_revisao_km: 100000,
    validade_crlv: '2027-09-30',
    validade_cronotacografo: '2027-05-18',
    validade_cipp: '2027-06-22',
    validade_civ: '2027-06-22',
    validade_fumaca_opacidade: '2027-03-12',
    validade_seguro_ambiental: '2028-02-15',
    motorista_vinculado: 'Marcelo Silveira Rocha',
    motorista_telefone: '(19) 98765-4321',
    status: 'Disponível',
    observacoes: 'Bitrem higienizado e vaporizado com laudo de desgasificação emitido. Pronto para carregamento imediato.'
  },
  {
    id: 'VEI-AMB003',
    placa: 'AMB2M33',
    prefixo: 'AMB-103',
    tipo: 'Caminhão Truck PBT 23t (Tanque/Baú)',
    marca_modelo: 'Mercedes-Benz Actros 2653 6x4 Alto Vácuo',
    ano_fabricacao: 2023,
    ano_modelo: 2023,
    chassi: '9BMACTR2653KL81920',
    renavam: '04561238907',
    capacidade_peso_ton: 26.0,
    capacidade_volume_m3: 16.0,
    tipo_carga: 'Resíduos Industriais Classe I (Perigosos)',
    combustivel: 'Diesel S10',
    km_atual: 164200,
    proxima_revisao_km: 170000,
    validade_crlv: '2027-11-15',
    validade_cronotacografo: '2027-02-10',
    validade_cipp: '2027-07-05',
    validade_civ: '2027-07-05',
    validade_fumaca_opacidade: '2026-12-01',
    validade_seguro_ambiental: '2027-12-31',
    motorista_vinculado: 'Roberto Antunes de Lima',
    motorista_telefone: '(71) 99123-8877',
    status: 'Em Viagem',
    observacoes: 'Bomba de anel líquido revisada e mangotes de sucção com teste hidrostático em dia.'
  },
  {
    id: 'VEI-AMB004',
    placa: 'AMB9R10',
    prefixo: 'AMB-104',
    tipo: 'Carreta Sider (Carga Seca / Tambores)',
    marca_modelo: 'DAF XF 530 6x2 Space Cab',
    ano_fabricacao: 2022,
    ano_modelo: 2023,
    chassi: '9BDAFXF530SC72819',
    renavam: '07891234560',
    capacidade_peso_ton: 48.5,
    capacidade_volume_m3: 90.0,
    tipo_carga: 'Carga Geral Seca & Embalada',
    combustivel: 'Biodiesel B100',
    km_atual: 82500,
    proxima_revisao_km: 85000,
    validade_crlv: '2027-08-20',
    validade_cronotacografo: '2027-04-14',
    validade_cipp: '2027-05-30',
    validade_civ: '2027-05-30',
    validade_fumaca_opacidade: '2027-01-22',
    validade_seguro_ambiental: '2028-03-10',
    motorista_vinculado: 'Não vinculado',
    motorista_telefone: '',
    status: 'Manutenção',
    observacoes: 'Troca preventiva de pastilhas de freio e alinhamento a laser do conjunto.'
  },
  {
    id: 'VEI-AMB005',
    placa: 'AMB5P44',
    prefixo: 'PAE-01',
    tipo: 'Veículo de Apoio PAE (Ambipar Response)',
    marca_modelo: 'VW Constellation 25.360 6x2 Response 24h',
    ano_fabricacao: 2024,
    ano_modelo: 2024,
    chassi: '9BWCON25360RP45612',
    renavam: '03456789123',
    capacidade_peso_ton: 23.0,
    capacidade_volume_m3: 45.0,
    tipo_carga: 'Prontidão de Emergência Ambiental',
    combustivel: 'Diesel S10',
    km_atual: 45300,
    proxima_revisao_km: 60000,
    validade_crlv: '2027-12-31',
    validade_cronotacografo: '2027-09-10',
    validade_cipp: '2027-11-12',
    validade_civ: '2027-11-12',
    validade_fumaca_opacidade: '2027-06-15',
    validade_seguro_ambiental: '2028-06-30',
    motorista_vinculado: 'Anderson Silva Costa',
    motorista_telefone: '(13) 99789-0011',
    status: 'Disponível',
    observacoes: 'Kit Hazmat Completo Nível A/B, Skimmer para óleo, 200m de barreira de contenção fluvial.'
  }
];

export const formatPlateMercosul = (val) => {
  if (!val) return '—';
  const clean = String(val).toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (clean.length === 7) {
    return `${clean.slice(0, 3)}-${clean.slice(3)}`;
  }
  return clean;
};

export const getCountdown = (dateStr) => {
  if (!dateStr) return { 
    status: 'empty', 
    text: 'Não informada', 
    compactText: '— Não inf.',
    days: null, 
    badgeClass: 'badge-muted', 
    color: '#64748b' 
  };
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [year, month, day] = dateStr.split('-');
  const target = new Date(Number(year), Number(month) - 1, Number(day));
  
  const diffTime = target - today;
  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const formattedDate = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;

  if (days < 0) {
    return {
      status: 'expired',
      days,
      formattedDate,
      text: `VENCIDO há ${Math.abs(days)}d`,
      compactText: `Vencido (${Math.abs(days)}d)`,
      badgeClass: 'badge-danger-glow',
      color: '#f43f5e'
    };
  }
  if (days <= 30) {
    return {
      status: 'warning',
      days,
      formattedDate,
      text: `Vence em ${days}d`,
      compactText: `${days}d restantes`,
      badgeClass: 'badge-warning-glow',
      color: '#f59e0b'
    };
  }
  return {
    status: 'ok',
    days,
    formattedDate,
    text: `Em dia (${days}d)`,
    compactText: `Em dia (${days}d)`,
    badgeClass: 'badge-success-glow',
    color: '#10b981'
  };
};

/* ============================================================== */
/* GATILHOS FUNCIONAIS & VARIÁVEIS DINÂMICAS PARA WHATSAPP CCO    */
/* ============================================================== */
export const DYNAMIC_TRIGGERS = [
  { tag: '{MOTORISTA}', label: 'Motorista', desc: 'Nome do condutor titular alocado' },
  { tag: '{PLACA}', label: 'Placa', desc: 'Placa Mercosul do veículo' },
  { tag: '{PREFIXO}', label: 'Prefixo', desc: 'Prefixo operacional da frota' },
  { tag: '{MARCA_MODELO}', label: 'Modelo', desc: 'Marca, tração e modelo do caminhão' },
  { tag: '{KM_ATUAL}', label: 'KM Atual', desc: 'Odômetro registrado na telemetria' },
  { tag: '{PROXIMA_REVISAO}', label: 'Próxima Revisão', desc: 'KM da próxima parada preventiva' },
  { tag: '{TIPO_CARGA}', label: 'Carga', desc: 'Tipo de carga homologada' },
  { tag: '{COMBUSTIVEL}', label: 'Combustível', desc: 'Diesel S10 / Biodiesel B100' },
  { tag: '{STATUS_CCO}', label: 'Status', desc: 'Status operacional no pátio ou rota' },
  { tag: '{HORA_ATUAL}', label: 'Hora CCO', desc: 'Horário do registro' }
];

/* ============================================================== */
/* MODELOS PRÉ-DEFINIDOS DE MENSAGENS OPERACIONAIS (TEMPLATES CCO) */
/* ============================================================== */
export const WHATSAPP_TEMPLATES = [
  {
    id: 'escala',
    category: 'Escala & Carregamento',
    badge: 'Prioritário',
    title: 'Ordem de Carregamento & Escala Imediata',
    description: 'Convocação para apresentação na base e início de rota',
    template: 'Olá, {MOTORISTA}! Aqui é a Torre de Operações CCO Ambipar.\n\nO conjunto {MARCA_MODELO} (Placa *{PLACA}*, Prefixo *{PREFIXO}*) foi escalado para operação imediata de {TIPO_CARGA}.\n\nFavor se apresentar na base operacional para o checklist de saída e liberação da documentação de viagem (DACTE / MDF-e).\n\nTorre de Controle Ambipar CCO • {HORA_ATUAL}'
  },
  {
    id: 'revisao',
    category: 'Manutenção Preventiva',
    badge: 'Oficina',
    title: 'Alerta de Revisão Preventiva por Odômetro',
    description: 'Notificação de aproximação do limite de quilometragem',
    template: 'Olá, {MOTORISTA}! Gestão de Manutenção de Frotas Ambipar informando:\n\nIdentificamos via telemetria que o veículo *{PLACA}* atingiu *{KM_ATUAL} km*. A próxima revisão preventiva está programada para *{PROXIMA_REVISAO} km*.\n\nSolicitamos programar parada na oficina central da base para alinhamento e inspeção preventiva.\n\nGestão de Frotas & Manutenção CCO'
  },
  {
    id: 'vistorias',
    category: 'Compliance & Regulatório',
    badge: 'ANTT / INMETRO',
    title: 'Aviso de Vencimento de Vistorias & Laudos',
    description: 'Aviso de renovação para CIPP, CIV, CRLV ou Cronotacógrafo',
    template: 'Prezado(a) {MOTORISTA},\n\nAvisamos que o veículo *{PLACA}* ({MARCA_MODELO}) possui laudos regulatórios obrigatórios próximos da data de vencimento ({VISTORIAS_STATUS}).\n\nFavor apresentar o conjunto para inspeção e renovação antes do prazo limite para evitar bloqueios operacionais na ANTT/INMETRO.\n\nCompliance & Segurança Veicular Ambipar'
  },
  {
    id: 'checklist',
    category: 'Segurança & PAE',
    badge: 'Emergência',
    title: 'Checklist 360º & Prontidão Ambiental PAE',
    description: 'Inspeção preventiva de itens Hazmat e segurança',
    template: 'Olá, {MOTORISTA}! Lembrete de Segurança Operacional Ambipar:\n\nAntes de liberar a partida do veículo *{PLACA}*, realize o checklist 360º obrigatório:\n• Calibração e estado dos pneus\n• Extintores e lacres de segurança\n• Kit PAE de Atendimento a Emergências Químicas\n• Cones, lanternas e calços de roda\n\nSua segurança e a preservação ambiental são prioridade máxima!'
  },
  {
    id: 'posicao',
    category: 'Torre de Controle CCO',
    badge: 'Monitoramento',
    title: 'Solicitação de Posição & Status de Viagem',
    description: 'Confirmação de rota, trânsito e descanso da Lei 13.103',
    template: 'Olá, {MOTORISTA}! Torre de Controle Ambipar CCO em contato.\n\nSolicitamos confirmação do seu posicionamento atual e status de viagem do veículo *{PLACA}*.\n\nFavor confirmar se a viagem segue conforme planejado e se as paradas de descanso da Lei 13.103 estão sendo cumpridas.\n\nTorre de Controle 24h Ambipar'
  },
  {
    id: 'combustivel',
    category: 'Eficiência Energética',
    badge: 'Combustível',
    title: 'Comprovante de Abastecimento & Odômetro',
    description: 'Solicitação de foto do comprovante e km da bomba',
    template: 'Olá, {MOTORISTA}! Lembrete de controle de combustível CCO:\n\nFavor enviar a foto da nota fiscal do último abastecimento de {COMBUSTIVEL} do veículo *{PLACA}*, informando o odômetro da bomba para atualização dos indicadores de consumo e eficiência energética.\n\nObrigado pela colaboração!'
  }
];

export function resolveMessageTags(templateText, vehicle) {
  if (!templateText) return '';
  const now = new Date();
  const horaStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const vistorias = [];
  if (vehicle?.validade_crlv) vistorias.push(`CRLV: ${vehicle.validade_crlv}`);
  if (vehicle?.validade_cipp) vistorias.push(`CIPP: ${vehicle.validade_cipp}`);
  if (vehicle?.validade_civ) vistorias.push(`CIV: ${vehicle.validade_civ}`);
  if (vehicle?.validade_cronotacografo) vistorias.push(`Tacógrafo: ${vehicle.validade_cronotacografo}`);
  const vistoriasStr = vistorias.length > 0 ? vistorias.slice(0, 2).join(', ') : 'CRLV e CIPP em monitoramento';

  return templateText
    .replace(/{MOTORISTA}/g, vehicle?.motorista_vinculado || 'Condutor')
    .replace(/{PLACA}/g, vehicle?.placa || 'Sem placa')
    .replace(/{PREFIXO}/g, vehicle?.prefixo || 'Frota')
    .replace(/{MARCA_MODELO}/g, vehicle?.marca_modelo || vehicle?.tipo || 'Caminhão')
    .replace(/{TIPO_CARGA}/g, vehicle?.tipo_carga || 'Produtos Químicos / Carga Geral')
    .replace(/{COMBUSTIVEL}/g, vehicle?.combustivel || 'Diesel S10')
    .replace(/{KM_ATUAL}/g, vehicle?.km_atual ? Number(vehicle.km_atual).toLocaleString('pt-BR') : '—')
    .replace(/{PROXIMA_REVISAO}/g, vehicle?.proxima_revisao_km ? Number(vehicle.proxima_revisao_km).toLocaleString('pt-BR') : '—')
    .replace(/{STATUS_CCO}/g, vehicle?.status || 'Disponível')
    .replace(/{VISTORIAS_STATUS}/g, vistoriasStr)
    .replace(/{HORA_ATUAL}/g, horaStr);
}

export default function VehiclesModule({ user, onNavigateDrivers }) {
  const [viewMode, setViewMode] = useState('list'); // 'list' ou 'form'
  const [displayLayout, setDisplayLayout] = useState('cards'); // 'cards' ou 'table'
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Estado para a Central de Despacho WhatsApp CCO
  const [whatsappModalData, setWhatsappModalData] = useState(null);

  // Estados para importação automática via CRLV-e (Processamento em RAM)
  const [crlvLoading, setCrlvLoading] = useState(false);
  const [crlvProgress, setCrlvProgress] = useState('');
  const [crlvSuccess, setCrlvSuccess] = useState(null);
  const [crlvError, setCrlvError] = useState(null);
  const crlvFileInputRef = React.useRef(null);

  // Inicializa veículos a partir do localStorage ou da frota flagship Ambipar
  const [vehicles, setVehicles] = useState(() => {
    try {
      const saved = localStorage.getItem('ambipar_real_vehicles');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) {
          // Remove resquício de teste inválido digitado com placa numérica '32342322'
          const filtered = parsed.filter(v => v.placa !== '32342322' && v.marca_modelo !== 'errsszxfdrs');
          if (filtered.length > 0) return filtered;
        }
      }
      return DEFAULT_AMBIPAR_FLEET;
    } catch {
      return DEFAULT_AMBIPAR_FLEET;
    }
  });

  // Lista de motoristas cadastrados para vinculação
  const [availableDrivers, setAvailableDrivers] = useState(() => {
    try {
      const saved = localStorage.getItem('ambipar_real_drivers');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map(d => ({ 
          value: d.nome, 
          label: `${d.nome} (CNH ${d.categoria_cnh || 'E'})`,
          phone: d.telefone || ''
        }));
      }
      return [];
    } catch {
      return [];
    }
  });

  const initialForm = {
    placa: '',
    prefixo: 'AMB-',
    tipo: 'Carreta Tanque Químico (Inox 316L)',
    marca_modelo: '',
    ano_fabricacao: new Date().getFullYear(),
    ano_modelo: new Date().getFullYear(),
    chassi: '',
    renavam: '',
    capacidade_peso_ton: '',
    capacidade_volume_m3: '',
    tipo_carga: 'Produtos Químicos Perigosos (Hazmat)',
    combustivel: 'Diesel S10',
    km_atual: '',
    proxima_revisao_km: '',
    validade_crlv: '',
    validade_cronotacografo: '',
    validade_cipp: '',
    validade_civ: '',
    validade_fumaca_opacidade: '',
    validade_seguro_ambiental: '',
    motorista_vinculado: '',
    status: 'Disponível',
    observacoes: ''
  };

  const [formData, setFormData] = useState(initialForm);

  // Persistência no localStorage
  useEffect(() => {
    try {
      localStorage.setItem('ambipar_real_vehicles', JSON.stringify(vehicles));
      const platesList = vehicles.map(v => ({
        placa: v.placa,
        modelo: `${v.placa} - ${v.marca_modelo || v.tipo}`,
        tipo: v.tipo
      }));
      localStorage.setItem('ambipar_fleet_vehicles', JSON.stringify(platesList));
    } catch (e) {
      console.warn('Erro ao salvar veículos:', e);
    }
  }, [vehicles]);

  // Sincronização Supabase
  const fetchSupabaseVehicles = async () => {
    if (!isSupabaseConfigured || !supabase) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('veiculos')
        .select('*')
        .order('placa', { ascending: true });

      if (!error && data && data.length > 0) {
        setVehicles(data);
      }
    } catch (err) {
      console.warn('Tabela veiculos pendente no Supabase:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateForm = () => {
    setEditingId(null);
    setFormData(initialForm);
    setCrlvSuccess(null);
    setCrlvError(null);
    setCrlvProgress('');
    setViewMode('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenEditForm = (vehicle) => {
    setEditingId(vehicle.id);
    setFormData({
      ...vehicle,
      capacidade_peso_ton: vehicle.capacidade_peso_ton || '',
      capacidade_volume_m3: vehicle.capacidade_volume_m3 || '',
      km_atual: vehicle.km_atual || '',
      proxima_revisao_km: vehicle.proxima_revisao_km || ''
    });
    setCrlvSuccess(null);
    setCrlvError(null);
    setCrlvProgress('');
    setViewMode('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /**
   * Processa o CRLV (PDF ou Imagem) 100% em memória RAM
   * O documento NÃO é armazenado, apenas os campos são extraídos e aplicados
   */
  const handleCrlvFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCrlvLoading(true);
    setCrlvProgress('Lendo CRLV em memória RAM...');
    setCrlvError(null);
    setCrlvSuccess(null);

    try {
      const data = await readCrlvFile(file, (msg) => {
        setCrlvProgress(msg);
      });

      const extractedCount = [
        data.placa, data.renavam, data.chassi, data.marca_modelo, 
        data.ano_fabricacao, data.capacidade_peso_ton, data.validade_crlv
      ].filter(Boolean).length;

      if (extractedCount === 0) {
        throw new Error('Não foi possível identificar dados do veículo no documento. Verifique se o arquivo enviado é um CRLV legível.');
      }

      setFormData(prev => ({
        ...prev,
        placa: data.placa || prev.placa,
        renavam: data.renavam || prev.renavam,
        chassi: data.chassi || prev.chassi,
        marca_modelo: data.marca_modelo || prev.marca_modelo,
        ano_fabricacao: data.ano_fabricacao || prev.ano_fabricacao,
        ano_modelo: data.ano_modelo || prev.ano_modelo || data.ano_fabricacao || prev.ano_fabricacao,
        tipo: data.tipo || prev.tipo,
        combustivel: data.combustivel || prev.combustivel,
        capacidade_peso_ton: data.capacidade_peso_ton || prev.capacidade_peso_ton,
        validade_crlv: data.validade_crlv || prev.validade_crlv,
        observacoes: data.observacoes 
          ? (prev.observacoes && !prev.observacoes.includes('CRLV') ? `${prev.observacoes} | ${data.observacoes}` : data.observacoes)
          : prev.observacoes
      }));

      setCrlvSuccess({
        placa: data.placa,
        marca_modelo: data.marca_modelo,
        renavam: data.renavam,
        chassi: data.chassi,
        ano: data.ano_modelo || data.ano_fabricacao,
        validade: data.validade_crlv
      });
    } catch (err) {
      console.error('Erro na extração do CRLV:', err);
      setCrlvError(err.message || 'Falha ao processar o arquivo do CRLV.');
    } finally {
      setCrlvLoading(false);
      setCrlvProgress('');
      if (e.target) e.target.value = '';
    }
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();

    const formattedPlaca = formData.placa.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!formattedPlaca || formattedPlaca.length < 7) {
      alert('A Placa do veículo deve ter no mínimo 7 caracteres alfanuméricos.');
      return;
    }

    const payload = {
      ...formData,
      placa: formattedPlaca,
      capacidade_peso_ton: formData.capacidade_peso_ton ? parseFloat(formData.capacidade_peso_ton) : null,
      capacidade_volume_m3: formData.capacidade_volume_m3 ? parseFloat(formData.capacidade_volume_m3) : null,
      meta_consumo_kml: formData.meta_consumo_kml ? parseFloat(formData.meta_consumo_kml) : 2.40,
      km_atual: formData.km_atual ? parseInt(formData.km_atual, 10) : 0,
      proxima_revisao_km: formData.proxima_revisao_km ? parseInt(formData.proxima_revisao_km, 10) : 0,
      velocidade_kmh: formData.velocidade_kmh ? parseInt(formData.velocidade_kmh, 10) : 0,
      nivel_tanque_percent: formData.nivel_tanque_percent ? parseInt(formData.nivel_tanque_percent, 10) : 80
    };

    if (editingId) {
      const updatedList = vehicles.map(v => v.id === editingId ? { ...payload, id: editingId } : v);
      setVehicles(updatedList);
      if (isSupabaseConfigured && supabase) {
        supabase.from('veiculos').update(payload).eq('id', editingId).then();
      }
      setFeedback({ type: 'success', text: `Veículo placa ${formattedPlaca} atualizado com sucesso!` });
    } else {
      const newVehicle = {
        ...payload,
        id: `VEI-${Date.now().toString().slice(-6)}`,
        created_at: new Date().toISOString()
      };
      setVehicles([newVehicle, ...vehicles]);
      if (isSupabaseConfigured && supabase) {
        supabase.from('veiculos').insert([{ user_id: user?.id, ...payload }]).then();
      }
      setFeedback({ type: 'success', text: `Veículo placa ${formattedPlaca} homologado na frota Ambipar!` });
    }

    setViewMode('list');
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleQuickStatusChange = (vehicleId, newStatus) => {
    const updated = vehicles.map(v => v.id === vehicleId ? { ...v, status: newStatus } : v);
    setVehicles(updated);
    if (isSupabaseConfigured && supabase) {
      supabase.from('veiculos').update({ status: newStatus }).eq('id', vehicleId).then();
    }
  };

  const handleDeleteVehicle = (vehicleId, placa) => {
    if (window.confirm(`Confirma a exclusão do veículo placa ${placa} da frota ativa?`)) {
      setVehicles(vehicles.filter(v => v.id !== vehicleId));
      if (isSupabaseConfigured && supabase) {
        supabase.from('veiculos').delete().eq('id', vehicleId).then();
      }
      setFeedback({ type: 'info', text: `Veículo placa ${placa} removido da frota.` });
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const getWhatsAppLink = (phoneStr) => {
    if (!phoneStr) return null;
    const cleanNumber = phoneStr.replace(/\D/g, '');
    const fullNumber = cleanNumber.startsWith('55') ? cleanNumber : `55${cleanNumber}`;
    return `https://wa.me/${fullNumber}`;
  };

  // KPIs da Frota & Telemetria Executiva CCO
  const totalVehicles = vehicles.length;
  const availableCount = vehicles.filter(v => v.status === 'Disponível').length;
  const tripCount = vehicles.filter(v => v.status === 'Em Viagem').length;
  const maintenanceCount = vehicles.filter(v => v.status === 'Manutenção').length;
  const blockedCount = vehicles.filter(v => v.status === 'Bloqueado').length;

  const readyVehiclesCount = availableCount + tripCount;
  const readinessRate = totalVehicles > 0 
    ? Math.round((readyVehiclesCount / totalVehicles) * 100) 
    : 100;
  const totalCapacityTons = vehicles.reduce((sum, v) => sum + (parseFloat(v.capacidade_peso_ton) || 0), 0);
  const totalVolumeM3 = vehicles.reduce((sum, v) => sum + (parseFloat(v.capacidade_volume_m3) || 0), 0);
  const totalKmRodados = vehicles.reduce((sum, v) => sum + (parseInt(v.km_atual, 10) || 0), 0);

  const handleKpiCardClick = (statusTarget) => {
    if (statusFilter === statusTarget) {
      setStatusFilter('Todos');
    } else {
      setStatusFilter(statusTarget);
    }
  };

  /* ============================================================== */
  /* CONTROLADORES DA CENTRAL DE DESPACHO WHATSAPP CCO              */
  /* ============================================================== */
  const handleOpenWhatsAppModal = (vehicle) => {
    const defaultTemplate = WHATSAPP_TEMPLATES[0];
    const initialText = resolveMessageTags(defaultTemplate.template, vehicle);
    setWhatsappModalData({
      vehicle,
      phone: vehicle.motorista_telefone || '',
      selectedTemplateId: defaultTemplate.id,
      messageText: initialText,
      copied: false,
      apiDispatching: false,
      apiSuccess: null
    });
  };

  const handleSelectTemplate = (template) => {
    if (!whatsappModalData) return;
    const resolved = resolveMessageTags(template.template, whatsappModalData.vehicle);
    setWhatsappModalData(prev => ({
      ...prev,
      selectedTemplateId: template.id,
      messageText: resolved,
      copied: false,
      apiSuccess: null
    }));
  };

  const handleInsertTrigger = (trigger) => {
    if (!whatsappModalData) return;
    const resolvedVal = resolveMessageTags(trigger.tag, whatsappModalData.vehicle);
    setWhatsappModalData(prev => {
      const current = prev.messageText || '';
      const spacer = current.endsWith(' ') || current.endsWith('\n') || current === '' ? '' : ' ';
      return {
        ...prev,
        messageText: current + spacer + resolvedVal
      };
    });
  };

  const handleSendWhatsAppWeb = () => {
    if (!whatsappModalData) return;
    const rawPhone = whatsappModalData.phone || whatsappModalData.vehicle.motorista_telefone;
    const cleanPhone = (rawPhone || '').replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 8) {
      alert('Por favor, informe um número de telefone com DDD válido para o condutor.');
      return;
    }
    const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    const encoded = encodeURIComponent(whatsappModalData.messageText);
    const url = `https://wa.me/${fullPhone}?text=${encoded}`;
    window.open(url, '_blank');

    if (whatsappModalData.phone && whatsappModalData.phone !== whatsappModalData.vehicle.motorista_telefone) {
      handleSaveDriverPhone(whatsappModalData.vehicle.id, whatsappModalData.phone);
    }
  };

  const handleCopyMessage = () => {
    if (!whatsappModalData?.messageText) return;
    navigator.clipboard.writeText(whatsappModalData.messageText);
    setWhatsappModalData(prev => ({ ...prev, copied: true }));
    setTimeout(() => {
      setWhatsappModalData(prev => prev ? ({ ...prev, copied: false }) : null);
    }, 2500);
  };

  const handleDispatchViaApi = async () => {
    if (!whatsappModalData) return;
    const rawPhone = whatsappModalData.phone || whatsappModalData.vehicle.motorista_telefone;
    const cleanPhone = (rawPhone || '').replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 8) {
      alert('Por favor, informe o telefone do condutor para disparo.');
      return;
    }

    setWhatsappModalData(prev => ({ ...prev, apiDispatching: true, apiSuccess: null }));
    await new Promise(r => setTimeout(r, 850));

    setWhatsappModalData(prev => ({
      ...prev,
      apiDispatching: false,
      apiSuccess: `Despacho registrado no Gateway CCO Ambipar! Mensagem enviada com sucesso para ${rawPhone}.`
    }));

    if (whatsappModalData.phone && whatsappModalData.phone !== whatsappModalData.vehicle.motorista_telefone) {
      handleSaveDriverPhone(whatsappModalData.vehicle.id, whatsappModalData.phone);
    }

    setTimeout(() => {
      setWhatsappModalData(prev => prev ? ({ ...prev, apiSuccess: null }) : null);
    }, 4500);
  };

  const handleSaveDriverPhone = (vehicleId, newPhone) => {
    const updated = vehicles.map(v => v.id === vehicleId ? { ...v, motorista_telefone: newPhone } : v);
    setVehicles(updated);
    if (isSupabaseConfigured && supabase) {
      supabase.from('veiculos').update({ motorista_telefone: newPhone }).eq('id', vehicleId).then();
    }
  };

  // Filtros aplicados
  const filteredVehicles = vehicles.filter(v => {
    const s = searchTerm.toLowerCase();
    const matchesSearch = 
      (v.placa && v.placa.toLowerCase().includes(s)) ||
      (v.prefixo && v.prefixo.toLowerCase().includes(s)) ||
      (v.marca_modelo && v.marca_modelo.toLowerCase().includes(s)) ||
      (v.motorista_vinculado && v.motorista_vinculado.toLowerCase().includes(s)) ||
      (v.localizacao_atual && v.localizacao_atual.toLowerCase().includes(s)) ||
      (v.tipo && v.tipo.toLowerCase().includes(s));

    const matchesStatus = statusFilter === 'Todos' || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="module-page-container animate-fade-in" id="vehicles-module-root">
      {/* ============================================================== */}
      {/* CABEÇALHO DO MÓDULO & TORRE DE TELEMETRIA AO VIVO              */}
      {/* ============================================================== */}
      <div className="module-page-header">
        <div className="module-title-area">
          <div className="module-icon-pill forest">
            <Truck size={24} />
          </div>
          <div>
            <div className="cockpit-meta-badges">
              <span className="esg-fleet-chip">
                <ShieldCheck size={12} color="#10b981" />
                <span>Conformidade ANTT & INMETRO</span>
              </span>
              <span className="esg-fleet-chip">
                <Flame size={12} color="#10b981" />
                <span>Frota Euro 6 & Descarbonização B100</span>
              </span>
            </div>
            <h2>Gestão de Frotas & Veículos Homologados</h2>
            <p>Controle operacional de veículos, carretas, vistorias CIPP/CIV, cronotacógrafo e conformidade regulatória ANTT/INMETRO</p>
          </div>
        </div>

        <div className="module-header-actions">
          {viewMode === 'list' ? (
            <>
              <button
                type="button"
                className="btn-secondary btn-icon-text"
                onClick={fetchSupabaseVehicles}
                disabled={loading}
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                <span>Atualizar Lista</span>
              </button>
              <button
                type="button"
                className="btn-primary btn-icon-text"
                onClick={handleOpenCreateForm}
                id="btn-open-create-vehicle"
              >
                <Plus size={18} />
                <span>Homologar Novo Veículo</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              className="btn-secondary btn-icon-text"
              onClick={() => setViewMode('list')}
            >
              <ArrowLeft size={16} />
              <span>Voltar à Lista de Frotas</span>
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
      {/* MODO 1: FORMULÁRIO COMPLETO DE HOMOLOGAÇÃO DE VEÍCULO           */}
      {/* ============================================================== */}
      {viewMode === 'form' ? (
        <form onSubmit={handleSubmitForm} className="driver-full-page-form animate-fade-in" id="vehicle-form">
          <div className="form-header-banner">
            <div>
              <h3>{editingId ? `Editar Veículo Placa ${formData.placa}` : 'Homologar Novo Veículo na Frota Ambipar'}</h3>
              <p>Cadastre as especificações do conjunto, vistorias regulatórias CIPP/CIV e motorista titular</p>
            </div>
            <div className="form-header-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setViewMode('list')}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary btn-icon-text"
              >
                <Save size={16} />
                <span>{editingId ? 'Salvar Alterações' : 'Concluir Homologação'}</span>
              </button>
            </div>
          </div>

          {/* ============================================================== */}
          {/* BANNER DE IMPORTAÇÃO AUTOMÁTICA VIA CRLV-e (SEM ARMAZENAMENTO)  */}
          {/* ============================================================== */}
          <div className="crlv-smart-import-card animate-fade-in" id="crlv-import-banner">
            <div className="crlv-import-left">
              <div className="crlv-icon-wrap">
                <FileText size={26} className="text-emerald" />
              </div>
              <div className="crlv-info-texts">
                <div className="crlv-title-row">
                  <h4>Importação Automática via CRLV-e (PDF ou Foto)</h4>
                  <span className="crlv-badge-safe">
                    <ShieldCheck size={13} />
                    <span>Processamento em RAM (Não armazena documento)</span>
                  </span>
                </div>
                <p className="crlv-desc">
                  Envie o CRLV Digital do veículo para preencher automaticamente <strong>Placa, Chassi, Renavam, Marca/Modelo, Ano, Tipo e Licenciamento</strong>.
                </p>
              </div>
            </div>

            <div className="crlv-import-actions">
              <input
                type="file"
                ref={crlvFileInputRef}
                onChange={handleCrlvFileUpload}
                accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
                style={{ display: 'none' }}
                id="crlv-file-upload-input"
              />

              <button
                type="button"
                className="btn-primary btn-icon-text crlv-btn-upload"
                onClick={() => crlvFileInputRef.current?.click()}
                disabled={crlvLoading}
                id="btn-upload-crlv"
                style={{ whiteSpace: 'nowrap' }}
              >
                {crlvLoading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>{crlvProgress || 'Lendo CRLV...'}</span>
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    <span>Importar do CRLV</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Feedback de Alerta / Erro do CRLV */}
          {crlvError && (
            <div className="alert alert-error animate-fade-in" style={{ marginBottom: '1.25rem' }}>
              <AlertTriangle size={18} />
              <div>
                <strong>Atenção na leitura do CRLV:</strong>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem' }}>{crlvError}</p>
              </div>
            </div>
          )}

          {/* Feedback de Sucesso do CRLV com campos lidos */}
          {crlvSuccess && (
            <div className="crlv-success-banner animate-fade-in" style={{ marginBottom: '1.25rem' }}>
              <div className="crlv-success-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 size={18} className="text-emerald" />
                  <strong>Campos do CRLV extraídos e preenchidos automaticamente no formulário:</strong>
                </div>
                <span className="crlv-ephemeral-tag">Arquivo descartado da memória com segurança</span>
              </div>
              <div className="crlv-extracted-chips">
                {crlvSuccess.placa && <span className="extracted-chip"><strong>Placa:</strong> {crlvSuccess.placa}</span>}
                {crlvSuccess.marca_modelo && <span className="extracted-chip"><strong>Marca/Modelo:</strong> {crlvSuccess.marca_modelo}</span>}
                {crlvSuccess.chassi && <span className="extracted-chip"><strong>Chassi:</strong> {crlvSuccess.chassi}</span>}
                {crlvSuccess.renavam && <span className="extracted-chip"><strong>Renavam:</strong> {crlvSuccess.renavam}</span>}
                {crlvSuccess.ano && <span className="extracted-chip"><strong>Ano:</strong> {crlvSuccess.ano}</span>}
                {crlvSuccess.validade && <span className="extracted-chip"><strong>Validade CRLV:</strong> {crlvSuccess.validade}</span>}
              </div>
            </div>
          )}

          <div className="driver-form-sections-grid">
            {/* Bloco 1: Identificação Civil & Placa */}
            <div className="card-panel card-z-top" style={{ position: 'relative', zIndex: 40 }}>
              <div className="panel-header">
                <div className="header-icon-label">
                  <Truck size={20} className="icon-emerald" />
                  <div>
                    <h4>1. Identificação Civil & Placa</h4>
                    <p>Registro oficial e prefixo do ativo</p>
                  </div>
                </div>
              </div>

              <div className="grid-2-cols" style={{ marginBottom: '1.1rem' }}>
                <div className="input-group-custom">
                  <label>Placa do Veículo (Mercosul ou Padrão) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: AMB4K89"
                    value={formData.placa}
                    onChange={(e) => setFormData({ ...formData, placa: e.target.value.toUpperCase() })}
                    style={{ fontWeight: 800, letterSpacing: '0.08em', fontSize: '1.05rem' }}
                  />
                </div>

                <div className="input-group-custom">
                  <label>Prefixo do Veículo na Frota</label>
                  <input
                    type="text"
                    placeholder="Ex: AMB-101"
                    value={formData.prefixo}
                    onChange={(e) => setFormData({ ...formData, prefixo: e.target.value.toUpperCase() })}
                  />
                </div>
              </div>

              <div className="input-group-custom" style={{ marginBottom: '1.1rem' }}>
                <label>Marca & Modelo do Veículo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Scania R540 V8 Super 6x4"
                  value={formData.marca_modelo}
                  onChange={(e) => setFormData({ ...formData, marca_modelo: e.target.value })}
                />
              </div>

              <div className="input-group-custom" style={{ marginBottom: '1.1rem' }}>
                <label>Tipo de Implemento / Carroceria</label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                >
                  {VEHICLE_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid-2-cols">
                <div className="input-group-custom">
                  <label>Ano de Fabricação / Modelo</label>
                  <input
                    type="number"
                    value={formData.ano_fabricacao}
                    onChange={(e) => setFormData({ ...formData, ano_fabricacao: e.target.value })}
                  />
                </div>
                <div className="input-group-custom">
                  <label>Chassi (VIN)</label>
                  <input
                    type="text"
                    placeholder="9BS..."
                    value={formData.chassi}
                    onChange={(e) => setFormData({ ...formData, chassi: e.target.value.toUpperCase() })}
                  />
                </div>
              </div>
            </div>

            {/* Bloco 2: Especificações Técnicas & Capacidades */}
            <div className="card-panel card-z-mid" style={{ position: 'relative', zIndex: 30 }}>
              <div className="panel-header">
                <div className="header-icon-label">
                  <Gauge size={20} className="icon-cyan" />
                  <div>
                    <h4>2. Especificações Técnicas & Capacidades</h4>
                    <p>Pesagem, volume, odômetro e combustível</p>
                  </div>
                </div>
              </div>

              <div className="grid-2-cols" style={{ marginBottom: '1.1rem' }}>
                <div className="input-group-custom">
                  <label>Capacidade PBTC (Toneladas)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Ex: 57.0"
                    value={formData.capacidade_peso_ton}
                    onChange={(e) => setFormData({ ...formData, capacidade_peso_ton: e.target.value })}
                  />
                </div>

                <div className="input-group-custom">
                  <label>Volume Útil do Tanque / Carroceria (m³ ou Mil Litros)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Ex: 38.0"
                    value={formData.capacidade_volume_m3}
                    onChange={(e) => setFormData({ ...formData, capacidade_volume_m3: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid-2-cols" style={{ marginBottom: '1.1rem' }}>
                <div className="input-group-custom">
                  <label>Odômetro Registrado (Km)</label>
                  <input
                    type="number"
                    placeholder="Ex: 118420"
                    value={formData.km_atual}
                    onChange={(e) => setFormData({ ...formData, km_atual: e.target.value })}
                  />
                </div>

                <div className="input-group-custom">
                  <label>Próxima Revisão Preventiva (Km)</label>
                  <input
                    type="number"
                    placeholder="Ex: 125000"
                    value={formData.proxima_revisao_km}
                    onChange={(e) => setFormData({ ...formData, proxima_revisao_km: e.target.value })}
                  />
                </div>
              </div>

              <div className="input-group-custom">
                <label>Tipo de Combustível Principal</label>
                <select
                  value={formData.combustivel}
                  onChange={(e) => setFormData({ ...formData, combustivel: e.target.value })}
                >
                  {FUEL_TYPES.map(f => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Bloco 3: Vistorias & Conformidade Legal (6 Certificados) */}
            <div className="card-panel card-z-low" style={{ position: 'relative', zIndex: 20 }}>
              <div className="panel-header">
                <div className="header-icon-label">
                  <FileCheck size={20} className="icon-emerald" />
                  <div>
                    <h4>3. Vistorias & Conformidade Legal</h4>
                    <p>Contadores de validade de 6 documentos regulatórios obrigatórios</p>
                  </div>
                </div>
              </div>

              <div className="grid-2-cols" style={{ marginBottom: '1rem' }}>
                <div className="input-group-custom">
                  <label>Validade CRLV (Licenciamento Anual) *</label>
                  <input
                    type="date"
                    required
                    value={formData.validade_crlv}
                    onChange={(e) => setFormData({ ...formData, validade_crlv: e.target.value })}
                  />
                </div>
                <div className="input-group-custom">
                  <label>Validade Cronotacógrafo (INMETRO)</label>
                  <input
                    type="date"
                    value={formData.validade_cronotacografo}
                    onChange={(e) => setFormData({ ...formData, validade_cronotacografo: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid-2-cols" style={{ marginBottom: '1rem' }}>
                <div className="input-group-custom">
                  <label>Validade CIPP (Produtos Perigosos)</label>
                  <input
                    type="date"
                    value={formData.validade_cipp}
                    onChange={(e) => setFormData({ ...formData, validade_cipp: e.target.value })}
                  />
                </div>
                <div className="input-group-custom">
                  <label>Validade CIV (Inspeção Veicular)</label>
                  <input
                    type="date"
                    value={formData.validade_civ}
                    onChange={(e) => setFormData({ ...formData, validade_civ: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid-2-cols">
                <div className="input-group-custom">
                  <label>Laudo de Opacidade / Fumaça Preta (IBAMA)</label>
                  <input
                    type="date"
                    value={formData.validade_fumaca_opacidade}
                    onChange={(e) => setFormData({ ...formData, validade_fumaca_opacidade: e.target.value })}
                  />
                </div>
                <div className="input-group-custom">
                  <label>Apólice Seguro Ambiental / RCTR-C</label>
                  <input
                    type="date"
                    value={formData.validade_seguro_ambiental}
                    onChange={(e) => setFormData({ ...formData, validade_seguro_ambiental: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Bloco 4: Motorista Titular & Status */}
            <div className="card-panel card-z-low" style={{ position: 'relative', zIndex: 10 }}>
              <div className="panel-header">
                <div className="header-icon-label">
                  <UserCheck size={20} className="icon-cyan" />
                  <div>
                    <h4>4. Alocação de Condutor & Status</h4>
                    <p>Vinculação com condutor habilitado e pronto para viagem</p>
                  </div>
                </div>
              </div>

              <div className="grid-2-cols" style={{ marginBottom: '1.25rem' }}>
                <div className="input-group-custom">
                  <label>Condutor Titular Alocado</label>
                  <select
                    value={formData.motorista_vinculado}
                    onChange={(e) => setFormData({ ...formData, motorista_vinculado: e.target.value })}
                  >
                    <option value="">Nenhum condutor fixo vinculado</option>
                    {availableDrivers.map(d => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>

                <div className="input-group-custom">
                  <label>Status Operacional do Veículo</label>
                  <PremiumSelect
                    value={formData.status}
                    onChange={(val) => setFormData({ ...formData, status: val })}
                    options={VEHICLE_STATUS_OPTIONS}
                    id="form-vehicle-status"
                  />
                </div>
              </div>

              <div className="input-group-custom">
                <label>Observações do Analista de Frota / Kit PAE / CCO</label>
                <textarea
                  rows={3}
                  className="select-custom"
                  style={{ resize: 'vertical' }}
                  placeholder="Checklist de prontidão, kits de emergência a bordo, testes de válvulas..."
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="form-submit-footer-card">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setViewMode('list')}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary btn-icon-text"
            >
              <Save size={18} />
              <span>{editingId ? 'Salvar Alterações' : 'Concluir Homologação'}</span>
            </button>
          </div>
        </form>
      ) : (
        /* ============================================================== */
        /* MODO 2: COCKPIT OPERACIONAL DA FROTA (CARDS & TABELA)          */
        /* ============================================================== */
        <>
          {/* ========================================================== */}
          {/* COCKPIT DE TELEMETRIA & PRONTIDÃO OPERACIONAL DA FROTA     */}
          {/* ========================================================== */}
          <div className="fleet-readiness-widget animate-fade-in">
            <div className="readiness-main-col">
              <div className="readiness-header">
                <div className="readiness-title-wrap">
                  <span className="readiness-beacon"></span>
                  <span className="readiness-kicker">Torre de Operações & CCO Ambipar</span>
                </div>
                <div className="readiness-percentage-wrap">
                  <span className="readiness-val">{readinessRate}%</span>
                  <span className="readiness-lbl">Prontidão da Frota</span>
                </div>
              </div>
              
              <div className="readiness-progress-track">
                <div 
                  className="readiness-progress-fill" 
                  style={{ width: `${readinessRate}%` }}
                ></div>
              </div>
              
              <div className="readiness-subline">
                <span>
                  <strong>{readyVehiclesCount} de {totalVehicles}</strong> veículos homologados aptos para atendimento imediato ou em trânsito com carga ativa.
                </span>
              </div>
            </div>

            <div className="readiness-metrics-grid">
              <div className="readiness-metric-item">
                <div className="metric-icon-box cyan">
                  <Gauge size={16} />
                </div>
                <div className="metric-info-col">
                  <span className="metric-label">Capacidade PBTC</span>
                  <strong className="metric-value">{totalCapacityTons.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} t</strong>
                  <span className="metric-sublabel">Carga útil combinada</span>
                </div>
              </div>

              <div className="readiness-metric-item">
                <div className="metric-icon-box emerald">
                  <Layers size={16} />
                </div>
                <div className="metric-info-col">
                  <span className="metric-label">Volume de Carga</span>
                  <strong className="metric-value">{totalVolumeM3.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} m³</strong>
                  <span className="metric-sublabel">Tanques, silos e baús</span>
                </div>
              </div>

              <div className="readiness-metric-item">
                <div className="metric-icon-box purple">
                  <TrendingUp size={16} />
                </div>
                <div className="metric-info-col">
                  <span className="metric-label">Quilometragem Total</span>
                  <strong className="metric-value">{totalKmRodados.toLocaleString('pt-BR')} km</strong>
                  <span className="metric-sublabel">Odômetros monitorados</span>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================== */}
          {/* 5 CARDS EXECUTIVOS DE KPIS INTERATIVOS (CLIQUE PARA FILTRAR)*/}
          {/* ========================================================== */}
          <div className="kpi-grid">
            {/* Card 1: Total */}
            <div 
              className={`kpi-card interactive-kpi ${statusFilter === 'Todos' ? 'kpi-active-all' : ''}`}
              onClick={() => handleKpiCardClick('Todos')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleKpiCardClick('Todos')}
              title="Clique para exibir todos os veículos da frota"
            >
              <div className="kpi-top">
                <span className="kpi-title">Frota Total Cadastrada</span>
                <div className="kpi-icon-wrap emerald">
                  <Truck size={18} />
                </div>
              </div>
              <div className="kpi-main-val">
                <span className="val-number">{totalVehicles}</span>
                <span className="unit-suffix">veículos</span>
                <span className="kpi-share-chip all">100% frota</span>
              </div>
              <div className="kpi-footer-status">
                <span>Veículos & implementos ativos</span>
                {statusFilter === 'Todos' ? (
                  <span className="kpi-badge-selected"><Check size={10} /> Ativo</span>
                ) : (
                  <span className="kpi-badge-hover"><Filter size={10} /> Filtrar</span>
                )}
              </div>
              <div className="kpi-bottom-glow all"></div>
            </div>

            {/* Card 2: Disponíveis */}
            <div 
              className={`kpi-card interactive-kpi ${statusFilter === 'Disponível' ? 'kpi-active-emerald' : ''}`}
              onClick={() => handleKpiCardClick('Disponível')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleKpiCardClick('Disponível')}
              title="Clique para filtrar apenas veículos disponíveis no pátio"
            >
              <div className="kpi-top">
                <span className="kpi-title">Disponíveis no Pátio</span>
                <div className="kpi-icon-wrap forest">
                  <CheckCircle2 size={18} />
                </div>
              </div>
              <div className="kpi-main-val">
                <span className="val-number text-emerald">{availableCount}</span>
                <span className="unit-suffix">liberados</span>
                <span className="kpi-share-chip emerald">
                  {totalVehicles > 0 ? `${Math.round((availableCount / totalVehicles) * 100)}%` : '0%'}
                </span>
              </div>
              <div className="kpi-footer-status">
                <span>Prontos para escala imediata CCO</span>
                {statusFilter === 'Disponível' ? (
                  <span className="kpi-badge-selected emerald"><Check size={10} /> Ativo</span>
                ) : (
                  <span className="kpi-badge-hover"><Filter size={10} /> Filtrar</span>
                )}
              </div>
              <div className="kpi-bottom-glow emerald"></div>
            </div>

            {/* Card 3: Em Viagem */}
            <div 
              className={`kpi-card interactive-kpi ${statusFilter === 'Em Viagem' ? 'kpi-active-cyan' : ''}`}
              onClick={() => handleKpiCardClick('Em Viagem')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleKpiCardClick('Em Viagem')}
              title="Clique para filtrar veículos em viagem/operação"
            >
              <div className="kpi-top">
                <span className="kpi-title">Em Operação / Viagem</span>
                <div className="kpi-icon-wrap cyan">
                  <Activity size={18} />
                </div>
              </div>
              <div className="kpi-main-val">
                <span className="val-number text-cyan">{tripCount}</span>
                <span className="unit-suffix">em rota</span>
                <span className="kpi-share-chip cyan">
                  {totalVehicles > 0 ? `${Math.round((tripCount / totalVehicles) * 100)}%` : '0%'}
                </span>
              </div>
              <div className="kpi-footer-status">
                <span>Com manifesto de viagem ativo</span>
                {statusFilter === 'Em Viagem' ? (
                  <span className="kpi-badge-selected cyan"><Check size={10} /> Ativo</span>
                ) : (
                  <span className="kpi-badge-hover"><Filter size={10} /> Filtrar</span>
                )}
              </div>
              <div className="kpi-bottom-glow cyan"></div>
            </div>

            {/* Card 4: Manutenção */}
            <div 
              className={`kpi-card interactive-kpi ${statusFilter === 'Manutenção' ? 'kpi-active-orange' : ''}`}
              onClick={() => handleKpiCardClick('Manutenção')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleKpiCardClick('Manutenção')}
              title="Clique para filtrar veículos em manutenção preventiva"
            >
              <div className="kpi-top">
                <span className="kpi-title">Manutenção Preventiva</span>
                <div className="kpi-icon-wrap orange">
                  <Wrench size={18} />
                </div>
              </div>
              <div className="kpi-main-val">
                <span className="val-number text-amber">{maintenanceCount}</span>
                <span className="unit-suffix">em revisão</span>
                <span className="kpi-share-chip amber">
                  {totalVehicles > 0 ? `${Math.round((maintenanceCount / totalVehicles) * 100)}%` : '0%'}
                </span>
              </div>
              <div className="kpi-footer-status">
                <span>Oficina central e revisões</span>
                {statusFilter === 'Manutenção' ? (
                  <span className="kpi-badge-selected amber"><Check size={10} /> Ativo</span>
                ) : (
                  <span className="kpi-badge-hover"><Filter size={10} /> Filtrar</span>
                )}
              </div>
              <div className="kpi-bottom-glow orange"></div>
            </div>

            {/* Card 5: Bloqueados / Alertas */}
            <div 
              className={`kpi-card interactive-kpi ${statusFilter === 'Bloqueado' ? 'kpi-active-danger' : ''}`}
              onClick={() => handleKpiCardClick('Bloqueado')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleKpiCardClick('Bloqueado')}
              title="Clique para filtrar veículos com bloqueio ou pendência regulatória"
            >
              <div className="kpi-top">
                <span className="kpi-title">Bloqueados / Validade</span>
                <div className="kpi-icon-wrap danger">
                  <ShieldAlert size={18} />
                </div>
              </div>
              <div className="kpi-main-val">
                <span className={`val-number ${blockedCount > 0 ? 'text-rose' : 'text-emerald'}`}>
                  {blockedCount}
                </span>
                <span className="unit-suffix">{blockedCount > 0 ? 'alertas' : 'em dia'}</span>
                <span className={`kpi-share-chip ${blockedCount > 0 ? 'rose' : 'emerald'}`}>
                  {blockedCount > 0 ? `${blockedCount} pendente` : '100% regular'}
                </span>
              </div>
              <div className="kpi-footer-status">
                <span>Vistorias CIPP / CIV / Tacógrafo</span>
                {statusFilter === 'Bloqueado' ? (
                  <span className="kpi-badge-selected rose"><Check size={10} /> Ativo</span>
                ) : (
                  <span className="kpi-badge-hover"><Filter size={10} /> Filtrar</span>
                )}
              </div>
              <div className="kpi-bottom-glow danger"></div>
            </div>
          </div>

          {/* ========================================================== */}
          {/* BARRA DE COMANDO: BUSCA, FILTROS RÁPIDOS & LAYOUT SWITCHER */}
          {/* ========================================================== */}
          <div className="filter-panel">
            <div className="search-bar-wrapper">
              <div className="search-bar">
                <Search size={18} className="search-icon-dim" />
                <input
                  type="text"
                  placeholder="Pesquisar por Placa (ex: AMB-4K89), Prefixo, Modelo, Tipo ou Condutor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  id="input-fleet-search"
                />
                {searchTerm && (
                  <button
                    type="button"
                    className="search-clear-btn"
                    onClick={() => setSearchTerm('')}
                    title="Limpar texto pesquisado"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="filter-results-counter">
                <span>Exibindo <strong>{filteredVehicles.length}</strong> de {totalVehicles} ativos</span>
                {(statusFilter !== 'Todos' || searchTerm) && (
                  <button
                    type="button"
                    className="btn-clear-all-filters"
                    onClick={() => { setStatusFilter('Todos'); setSearchTerm(''); }}
                    title="Remover todos os filtros"
                  >
                    <X size={12} />
                    <span>Limpar Filtros</span>
                  </button>
                )}
              </div>
            </div>

            <div className="filter-actions-row">
              <div className="status-chips-filter">
                {[
                  { id: 'Todos', label: 'Todos', count: totalVehicles },
                  { id: 'Disponível', label: 'Disponíveis', count: availableCount },
                  { id: 'Em Viagem', label: 'Em Viagem', count: tripCount },
                  { id: 'Manutenção', label: 'Manutenção', count: maintenanceCount },
                  { id: 'Bloqueado', label: 'Bloqueados', count: blockedCount }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    className={`status-chip-btn ${statusFilter === tab.id ? 'active' : ''}`}
                    onClick={() => setStatusFilter(tab.id)}
                  >
                    <span>{tab.label}</span>
                    <span className="chip-counter-badge">{tab.count}</span>
                  </button>
                ))}
              </div>

              <div className="view-mode-toggle">
                <button
                  type="button"
                  className={`view-mode-btn ${displayLayout === 'cards' ? 'active' : ''}`}
                  onClick={() => setDisplayLayout('cards')}
                  title="Visualização em Cockpit de Cards"
                  id="btn-view-cards"
                >
                  <LayoutGrid size={15} />
                  <span>Cockpit</span>
                </button>
                <button
                  type="button"
                  className={`view-mode-btn ${displayLayout === 'table' ? 'active' : ''}`}
                  onClick={() => setDisplayLayout('table')}
                  title="Visualização em Tabela Executiva"
                  id="btn-view-table"
                >
                  <List size={15} />
                  <span>Tabela</span>
                </button>
              </div>
            </div>
          </div>

          {/* ========================================================== */}
          {/* EXIBIÇÃO DE ATIVOS: CARDS COCKPIT OU TABELA EXECUTIVA      */}
          {/* ========================================================== */}
          {filteredVehicles.length === 0 ? (
            <div className="empty-state-panel">
              <div className="empty-icon-wrap">
                <Truck size={42} />
              </div>
              <h3>Nenhum Veículo Encontrado</h3>
              <p>Nenhum ativo corresponde aos termos pesquisados ou aos filtros de status ativos.</p>
              <button
                type="button"
                className="btn-primary btn-icon-text"
                onClick={handleOpenCreateForm}
                style={{ marginTop: '1rem' }}
              >
                <Plus size={18} />
                <span>Homologar Novo Veículo</span>
              </button>
            </div>
          ) : displayLayout === 'cards' ? (
            /* -------------------------------------------------------- */
            /* VISUALIZAÇÃO 1: CARDS COCKPIT DE TELEMETRIA AO VIVO     */
            /* -------------------------------------------------------- */
            <div className="vehicles-cards-grid">
              {filteredVehicles.map((vehicle) => {
                const crlvCount = getCountdown(vehicle.validade_crlv);
                const tacografoCount = getCountdown(vehicle.validade_cronotacografo);
                const cippCount = getCountdown(vehicle.validade_cipp);
                const civCount = getCountdown(vehicle.validade_civ);
                const fumacaCount = getCountdown(vehicle.validade_fumaca_opacidade);
                const seguroCount = getCountdown(vehicle.validade_seguro_ambiental);

                const waLink = getWhatsAppLink(vehicle.motorista_telefone);

                return (
                  <div key={vehicle.id} className="vehicle-cockpit-card animate-fade-in">
                    {/* Topo do Cockpit: Placa Mercosul Autêntica, Prefixo e Status */}
                    <div className="vehicle-top-cockpit-bar">
                      <div className="mercosul-plate-badge-cockpit">
                        <div className="plate-header">
                          <span className="plate-flag">🇧🇷</span>
                          <span className="plate-country">BRASIL</span>
                        </div>
                        <div className="plate-number">{formatPlateMercosul(vehicle.placa)}</div>
                      </div>

                      <div className="vehicle-tags-cluster">
                        {vehicle.prefixo && (
                          <span className="fleet-prefix-tag">{vehicle.prefixo}</span>
                        )}
                        <span className={`status-pill-cockpit ${vehicle.status ? vehicle.status.toLowerCase().replace(/\s+/g, '-') : 'disponivel'}`}>
                          <span className="status-dot-pulse"></span>
                          {vehicle.status || 'Disponível'}
                        </span>
                      </div>
                    </div>

                    {/* Identificação do Modelo & Implemento */}
                    <div className="vehicle-model-header">
                      <h4 title={vehicle.marca_modelo}>{vehicle.marca_modelo || vehicle.tipo}</h4>
                      <div className="vehicle-badges-subline">
                        <span className="vehicle-type-pill">{vehicle.tipo}</span>
                        {vehicle.tipo_carga && (
                          <span className="cargo-type-pill">{vehicle.tipo_carga}</span>
                        )}
                      </div>
                    </div>

                    {/* ESPECIFICAÇÕES TÉCNICAS DO ATIVO (REORGANIZADO & LIMPO) */}
                    <div className="vehicle-specs-clean-box">
                      <div className="spec-clean-header">
                        <Gauge size={14} className="icon-emerald" />
                        <span>Especificações Técnicas & Capacidades</span>
                      </div>
                      <div className="spec-clean-grid">
                        <div className="spec-clean-item">
                          <span className="spec-clean-label">Capacidade (PBTC)</span>
                          <strong className="spec-clean-value">
                            {vehicle.capacidade_peso_ton ? `${vehicle.capacidade_peso_ton} ton` : '—'}
                          </strong>
                        </div>

                        <div className="spec-clean-item">
                          <span className="spec-clean-label">Volume de Carga</span>
                          <strong className="spec-clean-value">
                            {vehicle.capacidade_volume_m3 ? `${vehicle.capacidade_volume_m3} m³` : '—'}
                          </strong>
                        </div>

                        <div className="spec-clean-item">
                          <span className="spec-clean-label">Odômetro Registrado</span>
                          <strong className="spec-clean-value">
                            {vehicle.km_atual ? `${Number(vehicle.km_atual).toLocaleString('pt-BR')} km` : '—'}
                          </strong>
                        </div>

                        <div className="spec-clean-item">
                          <span className="spec-clean-label">Próxima Revisão</span>
                          <strong className="spec-clean-value">
                            {vehicle.proxima_revisao_km ? `${Number(vehicle.proxima_revisao_km).toLocaleString('pt-BR')} km` : '—'}
                          </strong>
                        </div>
                      </div>
                    </div>

                    {/* Motorista Alocado com Central de Despacho WhatsApp */}
                    <div className="vehicle-driver-cockpit-box">
                      <div className="driver-avatar-circle-sm">
                        <UserCheck size={16} />
                      </div>
                      <div className="driver-info-meta">
                        <span className="driver-role-tag">Condutor Alocado CCO:</span>
                        <strong className="driver-name-text">
                          {vehicle.motorista_vinculado || 'Nenhum condutor fixo alocado'}
                        </strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenWhatsAppModal(vehicle)}
                        className="btn-whatsapp-mini"
                        title="Abrir Central de Despacho WhatsApp com templates CCO"
                        id={`btn-whatsapp-card-${vehicle.id}`}
                      >
                        <MessageCircle size={14} />
                        <span>WhatsApp</span>
                      </button>
                    </div>

                    {/* Matriz de Vistorias Regulatórias Obrigatórias (Compliance ANTT / INMETRO) */}
                    <div className="vehicle-compliance-cockpit-matrix">
                      <div className="compliance-header-label">
                        <ShieldCheck size={14} className="icon-emerald" />
                        <span>Controle de Validades das Vistorias & Laudos</span>
                      </div>

                      <div className="compliance-chips-cluster">
                        {vehicle.validade_crlv && (
                          <span className={`compliance-doc-chip ${crlvCount.status}`}>
                            <span className="doc-dot"></span>
                            CRLV: {crlvCount.text}
                          </span>
                        )}
                        {vehicle.validade_cipp && (
                          <span className={`compliance-doc-chip ${cippCount.status}`}>
                            <span className="doc-dot"></span>
                            CIPP: {cippCount.text}
                          </span>
                        )}
                        {vehicle.validade_civ && (
                          <span className={`compliance-doc-chip ${civCount.status}`}>
                            <span className="doc-dot"></span>
                            CIV: {civCount.text}
                          </span>
                        )}
                        {vehicle.validade_cronotacografo && (
                          <span className={`compliance-doc-chip ${tacografoCount.status}`}>
                            <span className="doc-dot"></span>
                            Tacógrafo: {tacografoCount.text}
                          </span>
                        )}
                        {vehicle.validade_fumaca_opacidade && (
                          <span className={`compliance-doc-chip ${fumacaCount.status}`}>
                            <span className="doc-dot"></span>
                            Opacidade: {fumacaCount.text}
                          </span>
                        )}
                        {vehicle.validade_seguro_ambiental && (
                          <span className={`compliance-doc-chip ${seguroCount.status}`}>
                            <span className="doc-dot"></span>
                            Seguro RCTR-C: {seguroCount.text}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Rodapé de Ações do Cockpit */}
                    <div className="vehicle-actions-cockpit-footer">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                          Status CCO:
                        </span>
                        <PremiumSelect
                          value={vehicle.status || 'Disponível'}
                          onChange={(val) => handleQuickStatusChange(vehicle.id, val)}
                          options={VEHICLE_STATUS_OPTIONS}
                          size="inline"
                          id={`quick-status-${vehicle.id}`}
                          placement="top"
                        />
                      </div>

                      <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                        <button
                          type="button"
                          className="topbar-icon-btn"
                          style={{ width: '32px', height: '32px' }}
                          onClick={() => handleOpenEditForm(vehicle)}
                          title="Editar cadastro do veículo"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          type="button"
                          className="btn-danger-icon"
                          style={{ width: '32px', height: '32px' }}
                          onClick={() => handleDeleteVehicle(vehicle.id, vehicle.placa)}
                          title="Remover veículo da frota"
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
            /* -------------------------------------------------------- */
            /* VISUALIZAÇÃO 2: TABELA EXECUTIVA DA FROTA AMBIPAR       */
            /* -------------------------------------------------------- */
            <div className="table-responsive-wrapper">
              <table className="vehicles-executive-table">
                <thead>
                  <tr>
                    <th style={{ minWidth: '160px' }}>Placa & Prefixo</th>
                    <th style={{ minWidth: '220px' }}>Veículo & Implemento</th>
                    <th style={{ minWidth: '200px' }}>Tipo de Carga & Combustível</th>
                    <th style={{ minWidth: '150px' }}>Capacidades</th>
                    <th style={{ minWidth: '160px' }}>Odômetro & Revisão</th>
                    <th style={{ minWidth: '180px' }}>Condutor Vinculado</th>
                    <th style={{ minWidth: '180px' }}>Vistorias (CIPP / CIV)</th>
                    <th style={{ minWidth: '150px' }}>Status CCO</th>
                    <th style={{ minWidth: '80px', textAlign: 'center' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVehicles.map((vehicle) => {
                    const crlvCount = getCountdown(vehicle.validade_crlv);
                    const cippCount = getCountdown(vehicle.validade_cipp);
                    const waLink = getWhatsAppLink(vehicle.motorista_telefone);

                    return (
                      <tr key={vehicle.id}>
                        {/* Placa & Prefixo */}
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div className="mercosul-plate-badge-mini">
                              <span className="flag">🇧🇷</span>
                              <span className="plate-txt">{formatPlateMercosul(vehicle.placa)}</span>
                            </div>
                            {vehicle.prefixo && (
                              <span style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', fontWeight: 700, fontFamily: 'monospace' }}>
                                {vehicle.prefixo}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Veículo & Implemento */}
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <strong style={{ fontSize: '0.88rem', color: '#ffffff' }}>
                              {vehicle.marca_modelo || vehicle.tipo}
                            </strong>
                            <small style={{ color: 'var(--text-dim)', fontSize: '0.74rem' }}>
                              {vehicle.tipo}
                            </small>
                          </div>
                        </td>

                        {/* Tipo de Carga */}
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <span style={{ fontSize: '0.82rem', color: '#ffffff', fontWeight: 600 }}>
                              {vehicle.tipo_carga || 'Carga Geral'}
                            </span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                              Combustível: <strong>{vehicle.combustivel || 'Diesel S10'}</strong>
                            </span>
                          </div>
                        </td>

                        {/* Capacidades */}
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.76rem' }}>
                            <span>PBTC: <strong>{vehicle.capacidade_peso_ton ? `${vehicle.capacidade_peso_ton} ton` : '—'}</strong></span>
                            <span>Volume: <strong>{vehicle.capacidade_volume_m3 ? `${vehicle.capacidade_volume_m3} m³` : '—'}</strong></span>
                          </div>
                        </td>

                        {/* Odômetro & Revisão */}
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.76rem' }}>
                            <span>Km: <strong>{vehicle.km_atual ? `${Number(vehicle.km_atual).toLocaleString('pt-BR')} km` : '—'}</strong></span>
                            <span style={{ color: 'var(--text-dim)' }}>Revisão: <strong>{vehicle.proxima_revisao_km ? `${Number(vehicle.proxima_revisao_km).toLocaleString('pt-BR')} km` : '—'}</strong></span>
                          </div>
                        </td>

                        {/* Condutor */}
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <strong style={{ fontSize: '0.82rem', color: '#ffffff' }}>
                              {vehicle.motorista_vinculado || 'Não vinculado'}
                            </strong>
                            <button
                              type="button"
                              onClick={() => handleOpenWhatsAppModal(vehicle)}
                              className="table-wa-direct-btn"
                              title="Enviar mensagem WhatsApp ao condutor"
                              id={`btn-whatsapp-tbl-${vehicle.id}`}
                            >
                              <MessageCircle size={12} />
                              <span>WhatsApp</span>
                            </button>
                          </div>
                        </td>

                        {/* Vistorias */}
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <span className={`table-compact-doc-chip ${crlvCount.status}`}>
                              <span className={`table-doc-dot ${crlvCount.status}`}></span>
                              <span>CRLV: {crlvCount.text}</span>
                            </span>
                            {vehicle.validade_cipp && (
                              <span className={`table-compact-doc-chip ${cippCount.status}`}>
                                <span className={`table-doc-dot ${cippCount.status}`}></span>
                                <span>CIPP: {cippCount.text}</span>
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td>
                          <PremiumSelect
                            value={vehicle.status || 'Disponível'}
                            onChange={(val) => handleQuickStatusChange(vehicle.id, val)}
                            options={VEHICLE_STATUS_OPTIONS}
                            size="inline"
                            id={`table-status-${vehicle.id}`}
                            placement="auto"
                          />
                        </td>

                        {/* Ações */}
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center' }}>
                            <button
                              type="button"
                              className="topbar-icon-btn"
                              style={{ width: '30px', height: '30px' }}
                              onClick={() => handleOpenEditForm(vehicle)}
                              title="Editar veículo"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              type="button"
                              className="btn-danger-icon"
                              style={{ width: '30px', height: '30px' }}
                              onClick={() => handleDeleteVehicle(vehicle.id, vehicle.placa)}
                              title="Excluir veículo"
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
      {/* MODAL EXECUTIVO: CENTRAL DE DESPACHO WHATSAPP CCO             */}
      {/* ============================================================== */}
      {whatsappModalData && (
        <div 
          className="modal-overlay animate-fade-in" 
          onClick={() => setWhatsappModalData(null)}
          id="whatsapp-dispatch-modal"
          style={{ zIndex: 9999 }}
        >
          <div 
            className="whatsapp-dispatch-dialog animate-scale-in" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabeçalho do Modal */}
            <div className="whatsapp-modal-header">
              <div className="whatsapp-header-left">
                <div className="whatsapp-icon-brand">
                  <MessageCircle size={22} color="#25d366" />
                </div>
                <div>
                  <div className="whatsapp-title-line">
                    <h3>Central de Despacho WhatsApp CCO</h3>
                    <span className="whatsapp-api-ready-badge">
                      <Zap size={11} />
                      <span>Pronto p/ API Gateway</span>
                    </span>
                  </div>
                  <p className="whatsapp-subtitle">
                    Condutor: <strong>{whatsappModalData.vehicle.motorista_vinculado || 'Condutor Titular'}</strong> • Veículo: <strong>{whatsappModalData.vehicle.placa}</strong> ({whatsappModalData.vehicle.prefixo || 'Frota'})
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setWhatsappModalData(null)}
                title="Fechar janela"
              >
                <X size={18} />
              </button>
            </div>

            {/* Feedback de Sucesso da API */}
            {whatsappModalData.apiSuccess && (
              <div className="whatsapp-api-success-banner animate-fade-in">
                <CheckCircle2 size={16} color="#10b981" />
                <span>{whatsappModalData.apiSuccess}</span>
              </div>
            )}

            {/* Corpo do Modal: 2 Colunas */}
            <div className="whatsapp-modal-grid">
              {/* Coluna 1: Templates & Gatilhos Dinâmicos */}
              <div className="whatsapp-col-templates">
                {/* Campo de Telefone */}
                <div className="input-group-custom" style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Smartphone size={14} color="#25d366" />
                      Número de WhatsApp do Condutor:
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>com DDD</span>
                  </label>
                  <input
                    type="text"
                    placeholder="(11) 99999-9999"
                    value={whatsappModalData.phone}
                    onChange={(e) => setWhatsappModalData({ ...whatsappModalData, phone: e.target.value })}
                    style={{ background: 'rgba(0, 0, 0, 0.4)', borderColor: 'rgba(37, 211, 102, 0.3)' }}
                    id="input-driver-whatsapp"
                  />
                </div>

                {/* Lista de Modelos Pré-definidos */}
                <div className="templates-selector-block">
                  <div className="section-label-row">
                    <span className="section-title-lbl">Modelos de Mensagens Relevantes</span>
                    <span className="section-count-tag">{WHATSAPP_TEMPLATES.length} modelos</span>
                  </div>

                  <div className="whatsapp-templates-list">
                    {WHATSAPP_TEMPLATES.map((tpl) => (
                      <div
                        key={tpl.id}
                        className={`whatsapp-template-card ${whatsappModalData.selectedTemplateId === tpl.id ? 'active' : ''}`}
                        onClick={() => handleSelectTemplate(tpl)}
                        role="button"
                        tabIndex={0}
                      >
                        <div className="tpl-card-top">
                          <span className="tpl-badge">{tpl.badge}</span>
                          <span className="tpl-category">{tpl.category}</span>
                        </div>
                        <h5 className="tpl-title">{tpl.title}</h5>
                        <p className="tpl-desc">{tpl.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Gatilhos Funcionais & Variáveis Dinâmicas */}
                <div className="dynamic-triggers-block">
                  <div className="section-label-row">
                    <span className="section-title-lbl">Gatilhos Funcionais Rápidos</span>
                    <span className="section-helper-tip">Clique para inserir no texto</span>
                  </div>

                  <div className="trigger-chips-cloud">
                    {DYNAMIC_TRIGGERS.map((trig) => (
                      <button
                        key={trig.tag}
                        type="button"
                        className="trigger-chip-btn"
                        onClick={() => handleInsertTrigger(trig)}
                        title={`Inserir ${trig.desc}`}
                      >
                        <span>+ {trig.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Coluna 2: Editor Manual & Live Preview */}
              <div className="whatsapp-col-editor">
                <div className="section-label-row">
                  <span className="section-title-lbl">Mensagem Personalizada</span>
                  <span className="editor-char-counter">
                    {(whatsappModalData.messageText || '').length} caracteres
                  </span>
                </div>

                {/* Textarea Manual */}
                <textarea
                  className="whatsapp-textarea"
                  rows={8}
                  value={whatsappModalData.messageText}
                  onChange={(e) => setWhatsappModalData({ ...whatsappModalData, messageText: e.target.value })}
                  placeholder="Digite ou personalize o texto a ser enviado ao condutor..."
                  id="textarea-whatsapp-message"
                />

                <div className="whatsapp-formatting-hint">
                  <span>Dica: Use <strong>*negrito*</strong>, <em>_itálico_</em> e quebras de linha para formatação.</span>
                </div>

                {/* Pré-visualização Real no Estilo WhatsApp */}
                <div className="whatsapp-live-preview-box">
                  <div className="preview-box-header">
                    <span className="preview-tag">Pré-Visualização do WhatsApp</span>
                    <span className="preview-driver-hint">{whatsappModalData.vehicle.motorista_vinculado || 'Condutor'}</span>
                  </div>

                  <div className="whatsapp-chat-canvas">
                    <div className="whatsapp-chat-bubble animate-fade-in">
                      <p className="bubble-text">{whatsappModalData.messageText || 'Nenhuma mensagem digitada...'}</p>
                      <div className="bubble-meta">
                        <span className="bubble-time">
                          {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="bubble-checks">✓✓</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Rodapé de Ações do Modal */}
            <div className="whatsapp-modal-footer">
              <div className="footer-left-info">
                <span className="footer-gateway-note">
                  <Zap size={13} color="#25d366" />
                  <span>Gateway preparado para integração de API (Z-API, Evolution, Twilio ou Ambipar CCO)</span>
                </span>
              </div>

              <div className="footer-buttons-cluster">
                <button
                  type="button"
                  className="btn-secondary btn-icon-text"
                  onClick={handleCopyMessage}
                  title="Copiar mensagem para a área de transferência"
                >
                  {whatsappModalData.copied ? (
                    <>
                      <Check size={16} color="#10b981" />
                      <span style={{ color: '#10b981' }}>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={16} />
                      <span>Copiar Texto</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className="btn-secondary btn-icon-text"
                  onClick={handleDispatchViaApi}
                  disabled={whatsappModalData.apiDispatching}
                  title="Testar disparo via API direta do sistema"
                  style={{ borderColor: 'rgba(37, 211, 102, 0.4)' }}
                >
                  <SendHorizontal size={16} className={whatsappModalData.apiDispatching ? 'animate-spin' : ''} />
                  <span>{whatsappModalData.apiDispatching ? 'Disparando via API...' : 'Disparar via API'}</span>
                </button>

                <button
                  type="button"
                  className="whatsapp-send-primary btn-icon-text"
                  onClick={handleSendWhatsAppWeb}
                  id="btn-confirm-send-whatsapp"
                >
                  <Send size={16} />
                  <span>Enviar pelo WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
