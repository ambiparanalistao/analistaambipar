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
  CheckSquare
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import PremiumSelect from './PremiumSelect';
import { AUDITED_VEHICLES, AUDITED_DRIVERS } from '../data/auditedAmbiparData';

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

// Frota Flagship Ambipar homologada com dados operacionais auditados 2026 (21 Veículos)
export const DEFAULT_AMBIPAR_FLEET = AUDITED_VEHICLES;

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

export default function VehiclesModule({ user, onNavigateDrivers }) {
  const [viewMode, setViewMode] = useState('list'); // 'list' ou 'form'
  const [displayLayout, setDisplayLayout] = useState('cards'); // 'cards' ou 'table'
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Inicializa veículos a partir do localStorage ou da frota flagship Ambipar
  const [vehicles, setVehicles] = useState(() => {
    try {
      const saved = localStorage.getItem('ambipar_real_vehicles');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) {
          // Remove resquício de teste inválido digitado com placa numérica '32342322'
          const filtered = parsed.filter(v => v.placa !== '32342322' && v.marca_modelo !== 'errsszxfdrs');
          if (filtered.length >= 15) return filtered;
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
        const list = parsed && parsed.length > 0 ? parsed : AUDITED_DRIVERS;
        return list.map(d => ({ 
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
    setViewMode('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  // KPIs da Frota
  const totalVehicles = vehicles.length;
  const availableCount = vehicles.filter(v => v.status === 'Disponível').length;
  const tripCount = vehicles.filter(v => v.status === 'Em Viagem').length;
  const maintenanceCount = vehicles.filter(v => v.status === 'Manutenção').length;
  const blockedCount = vehicles.filter(v => v.status === 'Bloqueado').length;

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
              >
                <Plus size={18} />
                <span>+ Homologar Novo Veículo</span>
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
          {/* 5 CARDS EXECUTIVOS DE KPIS (HORIZONTALMENTE DISTRIBUÍDOS)   */}
          {/* ========================================================== */}
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-top">
                <span className="kpi-title">Frota Total Cadastrada</span>
                <div className="kpi-icon-wrap emerald">
                  <Truck size={18} />
                </div>
              </div>
              <div className="kpi-main-val">
                <span className="val-number">{totalVehicles}</span>
                <span className="unit-suffix">veículos</span>
              </div>
              <div className="kpi-footer-status">
                <span>Veículos & implementos ativos</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-top">
                <span className="kpi-title">Disponíveis no Pátio</span>
                <div className="kpi-icon-wrap forest">
                  <CheckCircle2 size={18} />
                </div>
              </div>
              <div className="kpi-main-val">
                <span className="val-number" style={{ color: '#10b981' }}>{availableCount}</span>
                <span className="unit-suffix">liberados</span>
              </div>
              <div className="kpi-footer-status">
                <span>Prontos para escala imediata CCO</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-top">
                <span className="kpi-title">Em Operação / Viagem</span>
                <div className="kpi-icon-wrap cyan">
                  <Activity size={18} />
                </div>
              </div>
              <div className="kpi-main-val">
                <span className="val-number" style={{ color: '#06b6d4' }}>{tripCount}</span>
                <span className="unit-suffix">em rota</span>
              </div>
              <div className="kpi-footer-status">
                <span>Com manifesto de viagem ativo</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-top">
                <span className="kpi-title">Manutenção Preventiva</span>
                <div className="kpi-icon-wrap orange">
                  <Wrench size={18} />
                </div>
              </div>
              <div className="kpi-main-val">
                <span className="val-number" style={{ color: '#f59e0b' }}>{maintenanceCount}</span>
                <span className="unit-suffix">em revisão</span>
              </div>
              <div className="kpi-footer-status">
                <span>Oficina central e testes hidrostáticos</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-top">
                <span className="kpi-title">Bloqueados / Validade</span>
                <div className="kpi-icon-wrap danger">
                  <ShieldAlert size={18} />
                </div>
              </div>
              <div className="kpi-main-val">
                <span className="val-number" style={{ color: blockedCount > 0 ? '#f43f5e' : '#10b981' }}>
                  {blockedCount}
                </span>
                <span className="unit-suffix">{blockedCount > 0 ? 'alertas' : 'em dia'}</span>
              </div>
              <div className="kpi-footer-status">
                <span>Vistorias CIPP / CIV / Tacógrafo</span>
              </div>
            </div>
          </div>

          {/* ========================================================== */}
          {/* BARRA DE COMANDO: BUSCA, FILTROS RÁPIDOS & LAYOUT SWITCHER */}
          {/* ========================================================== */}
          <div className="filter-panel">
            <div className="search-bar">
              <Search size={18} />
              <input
                type="text"
                placeholder="Pesquisar por Placa (ex: AMB-4K89), Prefixo, Modelo, Rota GPS ou Motorista..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="filter-actions-row">
              <div className="status-chips-filter">
                {['Todos', 'Disponível', 'Em Viagem', 'Manutenção', 'Bloqueado'].map((status) => (
                  <button
                    key={status}
                    type="button"
                    className={`status-chip-btn ${statusFilter === status ? 'active' : ''}`}
                    onClick={() => setStatusFilter(status)}
                  >
                    {status}
                  </button>
                ))}
              </div>

              <div className="view-mode-toggle">
                <button
                  type="button"
                  className={`view-mode-btn ${displayLayout === 'cards' ? 'active' : ''}`}
                  onClick={() => setDisplayLayout('cards')}
                  title="Visualização em Cockpit de Cards"
                >
                  <LayoutGrid size={15} />
                  <span>Cockpit</span>
                </button>
                <button
                  type="button"
                  className={`view-mode-btn ${displayLayout === 'table' ? 'active' : ''}`}
                  onClick={() => setDisplayLayout('table')}
                  title="Visualização em Tabela Executiva"
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

                    {/* Motorista Alocado com WhatsApp Direto */}
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
                      {waLink && (
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-whatsapp-mini"
                          title="Chamar motorista no WhatsApp"
                        >
                          <MessageCircle size={14} />
                          <span>WhatsApp</span>
                        </a>
                      )}
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
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <strong style={{ fontSize: '0.82rem', color: '#ffffff' }}>
                              {vehicle.motorista_vinculado || 'Não vinculado'}
                            </strong>
                            {waLink && (
                              <a
                                href={waLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="table-wa-direct-btn"
                              >
                                <MessageCircle size={12} />
                                <span>WhatsApp</span>
                              </a>
                            )}
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
    </div>
  );
}
