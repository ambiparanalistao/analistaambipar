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
  Info
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import PremiumSelect from './PremiumSelect';

export const VEHICLE_STATUS_OPTIONS = [
  { 
    value: 'Disponível', 
    label: 'Disponível no Pátio / CCO', 
    sublabel: 'Pronto para escala e nova viagem', 
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
  { value: 'Cavalo Mecânico (Tração 6x4)', label: 'Cavalo Mecânico (Tração 6x4 - Rodotrem / Bitrem)', sublabel: 'Unidade tratora pesada de alta capacidade' },
  { value: 'Cavalo Mecânico (Tração 6x2)', label: 'Cavalo Mecânico (Tração 6x2 - Carreta Simples)', sublabel: 'Unidade tratora pesada convencional' },
  { value: 'Carreta Tanque Químico (Inox 316L)', label: 'Carreta Tanque Químico (Inox 316L / Hazmat)', sublabel: 'Transporte de produtos perigosos corrosivos e inflamáveis' },
  { value: 'Carreta Tanque Isotérmica', label: 'Carreta Tanque Isotérmica / Climatizada', sublabel: 'Cargas sensíveis a temperatura' },
  { value: 'Carreta Sider (Carga Seca / Tambores)', label: 'Carreta Sider (Enlonada / Carga Geral & IBCs)', sublabel: 'Carregamento lateral de tambores e contêineres' },
  { value: 'Carreta Baú Fechado', label: 'Carreta Baú Alumínio Fechado', sublabel: 'Segurança máxima para cargas embaladas' },
  { value: 'Bitrem Tanque Químico', label: 'Bitrem Tanque Químico (7 ou 9 Eixos)', sublabel: 'Conjunto articulado para grandes volumes granel líquido' },
  { value: 'Rodotrem Graneleiro / Caçamba', label: 'Rodotrem Caçamba / Basculante (9 Eixos)', sublabel: 'Granéis sólidos e resíduos industriais pesados' },
  { value: 'Caminhão Truck PBT 23t (Tanque/Baú)', label: 'Caminhão Rígido Truck (3 Eixos - PBT 23t)', sublabel: 'Operações regionais e coletas dedicadas' },
  { value: 'Caminhão Toco PBT 16t', label: 'Caminhão Rígido Toco (2 Eixos - PBT 16t)', sublabel: 'Distribuição urbana e coletas fracionadas' },
  { value: 'Veículo de Apoio PAE (Ambipar Response)', label: 'Veículo de Apoio Emergencial / PAE Response', sublabel: 'Equipado com kit de contenção e prontidão 24h' }
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
  { value: 'Diesel S500', label: 'Diesel S500', sublabel: 'Combustível convencional' },
  { value: 'Biodiesel B100', label: 'Biodiesel Puro (B100 - Descarbonização ESG)', sublabel: 'Operação verde com baixa pegada de carbono' },
  { value: 'Gás Natural Veicular (GNV / Biometano)', label: 'Gás Natural Veicular / Biometano', sublabel: 'Frota a gás sustentável' },
  { value: 'Elétrico / Híbrido', label: 'Veículo 100% Elétrico / Híbrido', sublabel: 'Zero emissão direta de CO2' }
];

export default function VehiclesModule({ user, onNavigateDrivers }) {
  const [viewMode, setViewMode] = useState('list'); // 'list' ou 'form'
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [typeFilter, setTypeFilter] = useState('Todos');
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Carrega veículos do localStorage ou vazio (sem dados fictícios)
  const [vehicles, setVehicles] = useState(() => {
    try {
      const saved = localStorage.getItem('ambipar_real_vehicles');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Lista de motoristas cadastrados para vinculação
  const [availableDrivers, setAvailableDrivers] = useState(() => {
    try {
      const saved = localStorage.getItem('ambipar_real_drivers');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map(d => ({ value: d.nome, label: `${d.nome} (CNH ${d.categoria_cnh || 'E'})` }));
      }
      return [];
    } catch {
      return [];
    }
  });

  const initialForm = {
    placa: '',
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
    meta_consumo_kml: '2.40',
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

  // Salva no localStorage como backup persistente
  useEffect(() => {
    try {
      localStorage.setItem('ambipar_real_vehicles', JSON.stringify(vehicles));
      // Atualiza também a lista resumida de placas para o módulo de motoristas
      const platesList = vehicles.map(v => ({
        plate: v.placa,
        model: `${v.placa} - ${v.marca_modelo || v.tipo}`
      }));
      localStorage.setItem('ambipar_fleet_vehicles', JSON.stringify(platesList));
    } catch (e) {
      console.warn('Erro ao salvar veículos:', e);
    }
  }, [vehicles]);

  // Busca do Supabase se a tabela existir
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
      console.warn('Tabela veiculos ainda não executada no Supabase:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupabaseVehicles();
  }, []);

  // Prepara formulário para cadastrar
  const handleOpenCreateForm = () => {
    setEditingId(null);
    setFormData(initialForm);
    setViewMode('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Prepara formulário para editar
  const handleOpenEditForm = (vehicle) => {
    setEditingId(vehicle.id);
    setFormData({
      placa: vehicle.placa || '',
      tipo: vehicle.tipo || 'Carreta Tanque Químico (Inox 316L)',
      marca_modelo: vehicle.marca_modelo || '',
      ano_fabricacao: vehicle.ano_fabricacao || new Date().getFullYear(),
      ano_modelo: vehicle.ano_modelo || new Date().getFullYear(),
      chassi: vehicle.chassi || '',
      renavam: vehicle.renavam || '',
      capacidade_peso_ton: vehicle.capacidade_peso_ton || '',
      capacidade_volume_m3: vehicle.capacidade_volume_m3 || '',
      tipo_carga: vehicle.tipo_carga || 'Produtos Químicos Perigosos (Hazmat)',
      combustivel: vehicle.combustivel || 'Diesel S10',
      meta_consumo_kml: vehicle.meta_consumo_kml || '2.40',
      km_atual: vehicle.km_atual || '',
      proxima_revisao_km: vehicle.proxima_revisao_km || '',
      validade_crlv: vehicle.validade_crlv || '',
      validade_cronotacografo: vehicle.validade_cronotacografo || '',
      validade_cipp: vehicle.validade_cipp || '',
      validade_civ: vehicle.validade_civ || '',
      validade_fumaca_opacidade: vehicle.validade_fumaca_opacidade || '',
      validade_seguro_ambiental: vehicle.validade_seguro_ambiental || '',
      motorista_vinculado: vehicle.motorista_vinculado || '',
      status: vehicle.status || 'Disponível',
      observacoes: vehicle.observacoes || ''
    });
    setViewMode('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Salvar formulário (Create ou Update)
  const handleSubmitForm = async (e) => {
    e.preventDefault();

    const formattedPlaca = formData.placa.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!formattedPlaca || formattedPlaca.length < 7) {
      alert('A Placa do veículo deve ter no mínimo 7 caracteres (Padrão Mercosul ou Antigo).');
      return;
    }

    const payload = {
      ...formData,
      placa: formattedPlaca,
      capacidade_peso_ton: formData.capacidade_peso_ton ? parseFloat(formData.capacidade_peso_ton) : null,
      capacidade_volume_m3: formData.capacidade_volume_m3 ? parseFloat(formData.capacidade_volume_m3) : null,
      meta_consumo_kml: formData.meta_consumo_kml ? parseFloat(formData.meta_consumo_kml) : 2.40,
      km_atual: formData.km_atual ? parseInt(formData.km_atual, 10) : 0,
      proxima_revisao_km: formData.proxima_revisao_km ? parseInt(formData.proxima_revisao_km, 10) : null,
      user_id: user?.id || null,
      updated_at: new Date().toISOString()
    };

    if (editingId) {
      // Atualização
      const updatedList = vehicles.map(v => v.id === editingId ? { ...payload, id: editingId } : v);
      setVehicles(updatedList);

      if (isSupabaseConfigured && supabase) {
        try {
          await supabase.from('veiculos').update(payload).eq('id', editingId);
        } catch (err) {
          console.warn('Erro ao atualizar no Supabase:', err);
        }
      }

      setFeedback({ type: 'success', text: `Veículo placa ${formattedPlaca} atualizado com sucesso!` });
    } else {
      // Criação
      const newId = `AMB-VEH-${Date.now()}`;
      const newVehicle = { ...payload, id: newId, created_at: new Date().toISOString() };
      setVehicles([newVehicle, ...vehicles]);

      if (isSupabaseConfigured && supabase) {
        try {
          await supabase.from('veiculos').insert([{ ...payload, id: newId }]);
        } catch (err) {
          console.warn('Erro ao inserir no Supabase:', err);
        }
      }

      setFeedback({ type: 'success', text: `Novo veículo placa ${formattedPlaca} homologado na frota com sucesso!` });
    }

    setViewMode('list');
    setTimeout(() => setFeedback(null), 4500);
  };

  // Excluir Veículo
  const handleDeleteVehicle = async (id, placa) => {
    if (!window.confirm(`Tem certeza que deseja remover o veículo de placa ${placa} da frota ativa?`)) {
      return;
    }

    const filtered = vehicles.filter(v => v.id !== id);
    setVehicles(filtered);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('veiculos').delete().eq('id', id);
      } catch (err) {
        console.warn('Erro ao deletar no Supabase:', err);
      }
    }

    setFeedback({ type: 'warning', text: `Veículo ${placa} removido da frota.` });
    setTimeout(() => setFeedback(null), 3500);
  };

  // Alterar Status Rápido
  const handleQuickStatusChange = async (id, newStatus) => {
    const updated = vehicles.map(v => v.id === id ? { ...v, status: newStatus } : v);
    setVehicles(updated);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('veiculos').update({ status: newStatus }).eq('id', id);
      } catch (err) {
        console.warn('Erro ao atualizar status rápido no Supabase:', err);
      }
    }
  };

  // Função utilitária de cálculo de contagem regressiva de validade
  const getCountdown = (dateString) => {
    if (!dateString) return { days: null, status: 'empty', text: 'Não Informado', badgeClass: 'badge-gray' };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateString + 'T00:00:00');
    const diffTime = target - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        days: diffDays,
        status: 'expired',
        text: `VENCIDO HÁ ${Math.abs(diffDays)} DIAS`,
        badgeClass: 'badge-danger-glow'
      };
    } else if (diffDays <= 30) {
      return {
        days: diffDays,
        status: 'warning',
        text: `VENCE EM ${diffDays} DIAS`,
        badgeClass: 'badge-warning-glow'
      };
    } else {
      return {
        days: diffDays,
        status: 'ok',
        text: `Em dia (${diffDays} dias)`,
        badgeClass: 'badge-success-glow'
      };
    }
  };

  // KPIs Consolidados
  const totalVehicles = vehicles.length;
  const availableCount = vehicles.filter(v => v.status === 'Disponível').length;
  const tripCount = vehicles.filter(v => v.status === 'Em Viagem').length;
  const maintenanceCount = vehicles.filter(v => v.status === 'Manutenção').length;
  const blockedCount = vehicles.filter(v => v.status === 'Bloqueado').length;

  // Filtros aplicados
  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = 
      (v.placa && v.placa.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (v.marca_modelo && v.marca_modelo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (v.motorista_vinculado && v.motorista_vinculado.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (v.tipo && v.tipo.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'Todos' || v.status === statusFilter;
    const matchesType = typeFilter === 'Todos' || v.tipo === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="module-page-container animate-fade-in" id="vehicles-module-root">
      {/* Cabeçalho do Módulo de Frotas */}
      <div className="module-page-header">
        <div className="module-title-area">
          <div className="module-icon-pill forest">
            <Truck size={22} />
          </div>
          <div>
            <h2>Gestão de Frotas & Veículos Homologados</h2>
            <p>Controle de cavalos mecânicos, implementos, carretas tanques, vistorias CIPP/CIV e telemetria de frota</p>
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
                <span>Atualizar</span>
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
              <span>Voltar para Lista de Veículos</span>
            </button>
          )}
        </div>
      </div>

      {/* Banner de Feedback Operacional */}
      {feedback && (
        <div className={`alert alert-${feedback.type} animate-fade-in`} style={{ marginBottom: '1.25rem' }}>
          <CheckCircle2 size={18} />
          <span>{feedback.text}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODO 1: FORMULÁRIO COMPLETO NA PÁGINA (CADASTRO / EDIÇÃO)      */}
      {/* ============================================================== */}
      {viewMode === 'form' ? (
        <form onSubmit={handleSubmitForm} className="driver-full-page-form animate-fade-in" id="vehicle-form">
          <div className="form-header-banner">
            <div>
              <h3>{editingId ? `Editar Veículo Placa ${formData.placa}` : 'Homologar Novo Veículo na Frota Ambipar'}</h3>
              <p>Cadastre as especificações do implemento, vistorias de segurança e vincule o motorista responsável</p>
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
                <span>{editingId ? 'Salvar Alterações' : 'Concluir Cadastro do Veículo'}</span>
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
                    <p>Registro do veículo e classificação operacional</p>
                  </div>
                </div>
              </div>

              <div className="grid-2-cols" style={{ marginBottom: '1.1rem' }}>
                <div className="input-group-custom">
                  <label>Placa do Veículo (Mercosul ou Antigo) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: BRA2E19"
                    maxLength={8}
                    value={formData.placa}
                    onChange={(e) => setFormData({ ...formData, placa: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })}
                    style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '0.12em', color: '#10b981' }}
                  />
                </div>

                <div className="input-group-custom">
                  <label>Status Operacional do Veículo</label>
                  <PremiumSelect
                    value={formData.status}
                    onChange={(val) => setFormData({ ...formData, status: val })}
                    options={VEHICLE_STATUS_OPTIONS}
                    id="vehicle-status-select"
                  />
                </div>
              </div>

              <div className="input-group-custom" style={{ marginBottom: '1.1rem' }}>
                <label>Tipo do Implemento / Veículo *</label>
                <PremiumSelect
                  value={formData.tipo}
                  onChange={(val) => setFormData({ ...formData, tipo: val })}
                  options={VEHICLE_TYPES}
                  id="vehicle-type-select"
                />
              </div>

              <div className="input-group-custom" style={{ marginBottom: '1.1rem' }}>
                <label>Marca & Modelo do Caminhão / Carreta *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Scania R500 Super 6x4 ou Tanque Randon Inox 35.000L"
                  value={formData.marca_modelo}
                  onChange={(e) => setFormData({ ...formData, marca_modelo: e.target.value })}
                />
              </div>

              <div className="grid-2-cols">
                <div className="input-group-custom">
                  <label>Ano de Fabricação</label>
                  <input
                    type="number"
                    min="1990"
                    max="2035"
                    value={formData.ano_fabricacao}
                    onChange={(e) => setFormData({ ...formData, ano_fabricacao: e.target.value })}
                  />
                </div>
                <div className="input-group-custom">
                  <label>Ano Modelo</label>
                  <input
                    type="number"
                    min="1990"
                    max="2035"
                    value={formData.ano_modelo}
                    onChange={(e) => setFormData({ ...formData, ano_modelo: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid-2-cols" style={{ marginTop: '1.1rem' }}>
                <div className="input-group-custom">
                  <label>Chassi (17 caracteres)</label>
                  <input
                    type="text"
                    maxLength={17}
                    placeholder="9BWCA..."
                    value={formData.chassi}
                    onChange={(e) => setFormData({ ...formData, chassi: e.target.value.toUpperCase() })}
                  />
                </div>
                <div className="input-group-custom">
                  <label>RENAVAM (11 dígitos)</label>
                  <input
                    type="text"
                    maxLength={11}
                    placeholder="00123456789"
                    value={formData.renavam}
                    onChange={(e) => setFormData({ ...formData, renavam: e.target.value.replace(/\D/g, '') })}
                  />
                </div>
              </div>
            </div>

            {/* Bloco 2: Capacidade, Operação & Consumo */}
            <div className="card-panel card-z-mid-high" style={{ position: 'relative', zIndex: 35 }}>
              <div className="panel-header">
                <div className="header-icon-label">
                  <Gauge size={20} className="icon-cyan" />
                  <div>
                    <h4>2. Capacidade de Carga & Telemetria</h4>
                    <p>Limites volumétricos, combustível e metas de consumo</p>
                  </div>
                </div>
              </div>

              <div className="input-group-custom" style={{ marginBottom: '1.1rem' }}>
                <label>Tipo de Carga Predominante / Operação</label>
                <PremiumSelect
                  value={formData.tipo_carga}
                  onChange={(val) => setFormData({ ...formData, tipo_carga: val })}
                  options={CARGO_TYPES}
                  id="vehicle-cargo-type-select"
                />
              </div>

              <div className="grid-2-cols" style={{ marginBottom: '1.1rem' }}>
                <div className="input-group-custom">
                  <label>Capacidade em Toneladas (PBTC / Carga Líquida) *</label>
                  <div className="input-with-unit">
                    <input
                      type="number"
                      step="0.1"
                      required
                      placeholder="Ex: 45.0"
                      value={formData.capacidade_peso_ton}
                      onChange={(e) => setFormData({ ...formData, capacidade_peso_ton: e.target.value })}
                    />
                    <span className="unit-tag">ton</span>
                  </div>
                </div>

                <div className="input-group-custom">
                  <label>Capacidade Volumétrica (Tanque ou Baú)</label>
                  <div className="input-with-unit">
                    <input
                      type="number"
                      step="0.5"
                      placeholder="Ex: 35000"
                      value={formData.capacidade_volume_m3}
                      onChange={(e) => setFormData({ ...formData, capacidade_volume_m3: e.target.value })}
                    />
                    <span className="unit-tag">m³ ou L</span>
                  </div>
                </div>
              </div>

              <div className="input-group-custom" style={{ marginBottom: '1.1rem' }}>
                <label>Tipo de Combustível Principal</label>
                <PremiumSelect
                  value={formData.combustivel}
                  onChange={(val) => setFormData({ ...formData, combustivel: val })}
                  options={FUEL_TYPES}
                  id="vehicle-fuel-select"
                />
              </div>

              <div className="grid-2-cols" style={{ marginBottom: '1.1rem' }}>
                <div className="input-group-custom">
                  <label>Meta de Consumo Operacional</label>
                  <div className="input-with-unit">
                    <input
                      type="number"
                      step="0.05"
                      placeholder="Ex: 2.40"
                      value={formData.meta_consumo_kml}
                      onChange={(e) => setFormData({ ...formData, meta_consumo_kml: e.target.value })}
                    />
                    <span className="unit-tag">km/l</span>
                  </div>
                </div>

                <div className="input-group-custom">
                  <label>Odômetro Atual (KM Rodado)</label>
                  <div className="input-with-unit">
                    <input
                      type="number"
                      placeholder="Ex: 148500"
                      value={formData.km_atual}
                      onChange={(e) => setFormData({ ...formData, km_atual: e.target.value })}
                    />
                    <span className="unit-tag">km</span>
                  </div>
                </div>
              </div>

              <div className="input-group-custom">
                <label>Próxima Revisão Preventiva (KM Programado)</label>
                <div className="input-with-unit">
                  <input
                    type="number"
                    placeholder="Ex: 160000"
                    value={formData.proxima_revisao_km}
                    onChange={(e) => setFormData({ ...formData, proxima_revisao_km: e.target.value })}
                  />
                  <span className="unit-tag">km</span>
                </div>
              </div>
            </div>

            {/* Bloco 3: Vistorias & Documentação Obrigatória com Contadores */}
            <div className="card-panel card-z-mid" style={{ position: 'relative', zIndex: 30 }}>
              <div className="panel-header">
                <div className="header-icon-label">
                  <FileCheck size={20} className="icon-emerald" />
                  <div>
                    <h4>3. Vistorias & Conformidade Legal</h4>
                    <p>Contadores automáticos de expiração e renovação obrigatória</p>
                  </div>
                </div>
              </div>

              {/* 1. CRLV / Licenciamento */}
              <div className="date-field-with-countdown-card" style={{ marginBottom: '1.1rem' }}>
                <div className="input-group-custom">
                  <label>Validade do Licenciamento Anual (CRLV) *</label>
                  <input
                    type="date"
                    required
                    value={formData.validade_crlv}
                    onChange={(e) => setFormData({ ...formData, validade_crlv: e.target.value })}
                  />
                </div>
                {formData.validade_crlv && (
                  <div className={`countdown-live-banner ${getCountdown(formData.validade_crlv).badgeClass}`}>
                    <Calendar size={14} />
                    <strong>CRLV:</strong>
                    <span>{getCountdown(formData.validade_crlv).text}</span>
                  </div>
                )}
              </div>

              {/* 2. Cronotacógrafo INMETRO */}
              <div className="date-field-with-countdown-card" style={{ marginBottom: '1.1rem' }}>
                <div className="input-group-custom">
                  <label>Validade do Certificado de Cronotacógrafo (INMETRO)</label>
                  <input
                    type="date"
                    value={formData.validade_cronotacografo}
                    onChange={(e) => setFormData({ ...formData, validade_cronotacografo: e.target.value })}
                  />
                </div>
                {formData.validade_cronotacografo && (
                  <div className={`countdown-live-banner ${getCountdown(formData.validade_cronotacografo).badgeClass}`}>
                    <Calendar size={14} />
                    <strong>Tacógrafo:</strong>
                    <span>{getCountdown(formData.validade_cronotacografo).text}</span>
                  </div>
                )}
              </div>

              {/* 3. CIPP (Certificado de Inspeção para Transporte de Produtos Perigosos) */}
              <div className="date-field-with-countdown-card" style={{ marginBottom: '1.1rem' }}>
                <div className="input-group-custom">
                  <label>Validade CIPP (Produtos Perigosos - Tanque/Carreta)</label>
                  <input
                    type="date"
                    value={formData.validade_cipp}
                    onChange={(e) => setFormData({ ...formData, validade_cipp: e.target.value })}
                  />
                </div>
                {formData.validade_cipp && (
                  <div className={`countdown-live-banner ${getCountdown(formData.validade_cipp).badgeClass}`}>
                    <Calendar size={14} />
                    <strong>CIPP:</strong>
                    <span>{getCountdown(formData.validade_cipp).text}</span>
                  </div>
                )}
              </div>

              {/* 4. CIV (Certificado de Inspeção Veicular) */}
              <div className="date-field-with-countdown-card" style={{ marginBottom: '1.1rem' }}>
                <div className="input-group-custom">
                  <label>Validade CIV (Inspeção Veicular Cargas Perigosas)</label>
                  <input
                    type="date"
                    value={formData.validade_civ}
                    onChange={(e) => setFormData({ ...formData, validade_civ: e.target.value })}
                  />
                </div>
                {formData.validade_civ && (
                  <div className={`countdown-live-banner ${getCountdown(formData.validade_civ).badgeClass}`}>
                    <Calendar size={14} />
                    <strong>CIV:</strong>
                    <span>{getCountdown(formData.validade_civ).text}</span>
                  </div>
                )}
              </div>

              {/* 5. Laudo de Fumaça Preta / Opacidade */}
              <div className="date-field-with-countdown-card" style={{ marginBottom: '1.1rem' }}>
                <div className="input-group-custom">
                  <label>Laudo de Opacidade / Fumaça Preta (IBAMA / CETESB)</label>
                  <input
                    type="date"
                    value={formData.validade_fumaca_opacidade}
                    onChange={(e) => setFormData({ ...formData, validade_fumaca_opacidade: e.target.value })}
                  />
                </div>
                {formData.validade_fumaca_opacidade && (
                  <div className={`countdown-live-banner ${getCountdown(formData.validade_fumaca_opacidade).badgeClass}`}>
                    <Calendar size={14} />
                    <strong>Fumaça Preta:</strong>
                    <span>{getCountdown(formData.validade_fumaca_opacidade).text}</span>
                  </div>
                )}
              </div>

              {/* 6. Seguro Ambiental / RCTR-C */}
              <div className="date-field-with-countdown-card">
                <div className="input-group-custom">
                  <label>Validade da Apólice de Seguro Ambiental & Carga</label>
                  <input
                    type="date"
                    value={formData.validade_seguro_ambiental}
                    onChange={(e) => setFormData({ ...formData, validade_seguro_ambiental: e.target.value })}
                  />
                </div>
                {formData.validade_seguro_ambiental && (
                  <div className={`countdown-live-banner ${getCountdown(formData.validade_seguro_ambiental).badgeClass}`}>
                    <Calendar size={14} />
                    <strong>Seguro:</strong>
                    <span>{getCountdown(formData.validade_seguro_ambiental).text}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bloco 4: Vinculação de Motorista & Equipamentos Embarcados */}
            <div className="card-panel card-z-low" style={{ position: 'relative', zIndex: 25 }}>
              <div className="panel-header">
                <div className="header-icon-label">
                  <UserCheck size={20} className="icon-cyan" />
                  <div>
                    <h4>4. Alocação de Motorista & Segurança</h4>
                    <p>Condutor dedicado e kit de emergência Ambipar PAE</p>
                  </div>
                </div>
              </div>

              <div className="input-group-custom" style={{ marginBottom: '1.25rem' }}>
                <label>Motorista Dedicado / Alocado</label>
                {availableDrivers.length > 0 ? (
                  <PremiumSelect
                    value={formData.motorista_vinculado}
                    onChange={(val) => setFormData({ ...formData, motorista_vinculado: val })}
                    options={[
                      { value: '', label: 'Nenhum motorista alocado (Veículo no Pátio)', sublabel: 'Disponível para qualquer condutor da escala' },
                      ...availableDrivers
                    ]}
                    id="vehicle-driver-select"
                  />
                ) : (
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <input
                      type="text"
                      placeholder="Ex: Carlos Eduardo dos Santos"
                      value={formData.motorista_vinculado}
                      onChange={(e) => setFormData({ ...formData, motorista_vinculado: e.target.value })}
                    />
                    {onNavigateDrivers && (
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={onNavigateDrivers}
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        + Cadastrar Motorista
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="input-group-custom" style={{ marginBottom: '1.25rem' }}>
                <label>Observações Técnicas & Equipamentos Embarcados</label>
                <textarea
                  rows={4}
                  placeholder="Ex: Equipado com Kit de Emergência PAE, Linha de Vida para Carregamento Superior, Válvula de Fundo Pneumática, Rastreador Sascar / Autotrac e Pneus novos eixo direcional."
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                />
              </div>

              <div className="emergency-kit-checklist-box">
                <h6>Checklist de Prontidão Ambipar Response</h6>
                <div className="checklist-items-grid">
                  <div className="check-item"><Check size={14} color="#10b981" /> Kit PAE (Mantas absorventes, turfa, batoques)</div>
                  <div className="check-item"><Check size={14} color="#10b981" /> 2 Extintores 12kg PQS ABC recarregados</div>
                  <div className="check-item"><Check size={14} color="#10b981" /> Cones de sinalização e fita zebrada</div>
                  <div className="check-item"><Check size={14} color="#10b981" /> Calços de segurança para rodas</div>
                </div>
              </div>
            </div>
          </div>

          {/* Barra de Ação Inferior Fixa */}
          <div className="form-bottom-actions">
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
              <span>{editingId ? 'Salvar Alterações no Veículo' : 'Concluir Homologação do Veículo'}</span>
            </button>
          </div>
        </form>
      ) : (
        /* ============================================================== */
        /* MODO 2: LISTAGEM COMPLETA DA FROTA COM CARDS OPERACIONAIS      */
        /* ============================================================== */
        <>
          {/* Painel de Indicadores da Frota (KPIs) */}
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-top">
                <span className="kpi-title">Frota Total Cadastrada</span>
                <div className="kpi-icon-wrap emerald">
                  <Truck size={20} />
                </div>
              </div>
              <div className="kpi-main-val">
                <span className="val-number">{totalVehicles}</span>
                <span className="unit-suffix">veículos</span>
              </div>
              <div className="kpi-footer-status neutral">
                <span>Cavalos mecânicos & implementos ativos</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-top">
                <span className="kpi-title">Disponíveis no Pátio</span>
                <div className="kpi-icon-wrap forest">
                  <CheckCircle2 size={20} />
                </div>
              </div>
              <div className="kpi-main-val">
                <span className="val-number" style={{ color: '#10b981' }}>{availableCount}</span>
                <span className="unit-suffix">liberados</span>
              </div>
              <div className="kpi-footer-status positive">
                <span>Prontos para alocação e escala</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-top">
                <span className="kpi-title">Em Operação / Viagem</span>
                <div className="kpi-icon-wrap cyan">
                  <Activity size={20} />
                </div>
              </div>
              <div className="kpi-main-val">
                <span className="val-number" style={{ color: '#06b6d4' }}>{tripCount}</span>
                <span className="unit-suffix">em trânsito</span>
              </div>
              <div className="kpi-footer-status neutral">
                <span>Com manifesto de carga ativo</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-top">
                <span className="kpi-title">Manutenção / Oficina</span>
                <div className="kpi-icon-wrap orange">
                  <Wrench size={20} />
                </div>
              </div>
              <div className="kpi-main-val">
                <span className="val-number" style={{ color: '#f59e0b' }}>{maintenanceCount}</span>
                <span className="unit-suffix">em revisão</span>
              </div>
              <div className="kpi-footer-status warning">
                <span>Oficina mecânica ou reparos</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-top">
                <span className="kpi-title">Bloqueados / Documento</span>
                <div className="kpi-icon-wrap danger">
                  <ShieldAlert size={20} />
                </div>
              </div>
              <div className="kpi-main-val">
                <span className="val-number" style={{ color: '#f43f5e' }}>{blockedCount}</span>
                <span className="unit-suffix">pendências</span>
              </div>
              <div className="kpi-footer-status negative">
                <span>Vistorias CIPP/CIV/CRLV vencidas</span>
              </div>
            </div>
          </div>

          {/* Filtros e Barra de Pesquisa */}
          <div className="filter-panel" style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
            <div className="search-bar">
              <Search size={18} />
              <input
                type="text"
                placeholder="Pesquisar por Placa (ex: BRA2E19), Marca/Modelo, Chassi ou Motorista Vinculado..."
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
            </div>
          </div>

          {/* Lista de Veículos */}
          {filteredVehicles.length === 0 ? (
            <div className="empty-state-panel">
              <div className="empty-icon-wrap">
                <Truck size={42} />
              </div>
              <h3>Nenhum Veículo Encontrado</h3>
              <p>
                {vehicles.length === 0 
                  ? 'Nenhum veículo foi homologado ainda na base de dados. Cadastre o primeiro veículo para iniciar o controle da frota Ambipar.'
                  : 'Nenhum veículo corresponde aos filtros selecionados. Tente limpar os termos de busca.'}
              </p>
              <button
                type="button"
                className="btn-primary btn-icon-text"
                onClick={handleOpenCreateForm}
                style={{ marginTop: '1rem' }}
              >
                <Plus size={18} />
                <span>Homologar Primeiro Veículo</span>
              </button>
            </div>
          ) : (
            <div className="vehicles-cards-grid">
              {filteredVehicles.map((vehicle) => {
                const crlvCount = getCountdown(vehicle.validade_crlv);
                const tacografoCount = getCountdown(vehicle.validade_cronotacografo);
                const cippCount = getCountdown(vehicle.validade_cipp);
                const civCount = getCountdown(vehicle.validade_civ);

                return (
                  <div key={vehicle.id} className="vehicle-operational-card animate-fade-in">
                    {/* Topo do Card: Placa Mercosul Estilizada & Status */}
                    <div className="card-top-row">
                      <div className="mercosul-plate-badge">
                        <div className="plate-header">
                          <span className="plate-flag">🇧🇷</span>
                          <span className="plate-country">BRASIL</span>
                        </div>
                        <div className="plate-number">{vehicle.placa}</div>
                      </div>

                      <div className="vehicle-status-area">
                        <span className={`status-pill status-${(vehicle.status || 'Disponível').toLowerCase().replace(/\s+/g, '-')}`}>
                          <span className="status-dot"></span>
                          {vehicle.status || 'Disponível'}
                        </span>
                      </div>
                    </div>

                    {/* Modelo & Implemento */}
                    <div className="vehicle-title-block">
                      <h5>{vehicle.marca_modelo || vehicle.tipo}</h5>
                      <span className="vehicle-type-label">{vehicle.tipo}</span>
                    </div>

                    {/* Dados Técnicos e Capacidade */}
                    <div className="vehicle-specs-grid">
                      <div className="spec-item">
                        <span className="spec-label">Capacidade PBTC</span>
                        <strong className="spec-val">
                          {vehicle.capacidade_peso_ton ? `${vehicle.capacidade_peso_ton} ton` : 'Não informada'}
                        </strong>
                      </div>
                      <div className="spec-item">
                        <span className="spec-label">Volume Carga</span>
                        <strong className="spec-val">
                          {vehicle.capacidade_volume_m3 ? `${vehicle.capacidade_volume_m3} m³` : '—'}
                        </strong>
                      </div>
                      <div className="spec-item">
                        <span className="spec-label">Consumo Meta</span>
                        <strong className="spec-val">{vehicle.meta_consumo_kml || '2.40'} km/l</strong>
                      </div>
                      <div className="spec-item">
                        <span className="spec-label">Odômetro</span>
                        <strong className="spec-val">
                          {vehicle.km_atual ? `${Number(vehicle.km_atual).toLocaleString('pt-BR')} km` : '—'}
                        </strong>
                      </div>
                    </div>

                    {/* Motorista Alocado */}
                    <div className="vehicle-driver-box">
                      <UserCheck size={16} className="text-emerald" />
                      <div>
                        <span className="label-tiny">Motorista Alocado:</span>
                        <strong className="driver-name-highlight">
                          {vehicle.motorista_vinculado || 'Nenhum condutor fixo alocado'}
                        </strong>
                      </div>
                    </div>

                    {/* Semáforo de Validades das Vistorias */}
                    <div className="compliance-chips-row">
                      {vehicle.validade_crlv && (
                        <div className={`compliance-tag ${crlvCount.badgeClass}`} title="Licenciamento CRLV">
                          <span>CRLV: {crlvCount.text}</span>
                        </div>
                      )}
                      {vehicle.validade_cipp && (
                        <div className={`compliance-tag ${cippCount.badgeClass}`} title="Inspeção CIPP Produtos Perigosos">
                          <span>CIPP: {cippCount.text}</span>
                        </div>
                      )}
                      {vehicle.validade_civ && (
                        <div className={`compliance-tag ${civCount.badgeClass}`} title="Inspeção CIV Veicular">
                          <span>CIV: {civCount.text}</span>
                        </div>
                      )}
                      {vehicle.validade_cronotacografo && (
                        <div className={`compliance-tag ${tacografoCount.badgeClass}`} title="Cronotacógrafo INMETRO">
                          <span>Tacógrafo: {tacografoCount.text}</span>
                        </div>
                      )}
                    </div>

                    {/* Ações do Veículo */}
                    <div className="card-actions-footer">
                      <div className="quick-status-selector">
                        <label>Alterar Status:</label>
                        <select
                          value={vehicle.status || 'Disponível'}
                          onChange={(e) => handleQuickStatusChange(vehicle.id, e.target.value)}
                        >
                          <option value="Disponível">Disponível no Pátio</option>
                          <option value="Em Viagem">Em Operação / Viagem</option>
                          <option value="Manutenção">Em Manutenção</option>
                          <option value="Bloqueado">Bloqueado</option>
                        </select>
                      </div>

                      <div className="btn-actions-group">
                        <button
                          type="button"
                          className="btn-icon-secondary"
                          onClick={() => handleOpenEditForm(vehicle)}
                          title="Editar cadastro do veículo"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          type="button"
                          className="btn-icon-danger"
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
          )}
        </>
      )}
    </div>
  );
}
