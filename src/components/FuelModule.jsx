import React, { useState, useEffect, useMemo } from 'react';
import {
  Fuel,
  Plus,
  Search,
  Truck,
  UserCheck,
  Calendar,
  Gauge,
  DollarSign,
  Droplets,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  FileText,
  Printer,
  Trash2,
  Edit3,
  RefreshCw,
  Building,
  ArrowRight,
  Sparkles,
  BarChart3,
  Sliders,
  ChevronRight,
  ShieldCheck,
  Leaf,
  Layers,
  LayoutGrid,
  List,
  Check,
  Clock,
  Compass
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import PremiumSelect from './PremiumSelect';
import './FuelModule.css';

// Tipos de Combustíveis Homologados
export const FUEL_TYPES = [
  { value: 'Diesel S10', label: 'Diesel S10 (Euro 6 / Euro 5)', sublabel: 'Baixo teor de enxofre (10 ppm) para frotas pesadas', color: '#10b981' },
  { value: 'Diesel S500', label: 'Diesel S500 (Convencional)', sublabel: 'Veículos mais antigos ou motores estacionários', color: '#f59e0b' },
  { value: 'Diesel Renovável HVO / R5', label: 'Diesel Verde HVO / R5 (Biocombustível)', sublabel: 'Redução de até 80% das emissões GEE (ESG Ambipar)', color: '#06b6d4' },
  { value: 'ARLA 32', label: 'ARLA 32 (Agente Redutor Líquido NOx)', sublabel: 'Injeção catalítica SCR para conformidade Proconve P7/P8', color: '#3b82f6' },
  { value: 'Gasolina Comum / Aditivada', label: 'Gasolina Comum / Aditivada', sublabel: 'Veículos leves de fiscalização e suporte PAE', color: '#ec4899' },
  { value: 'Etanol Hidratado', label: 'Etanol Hidratado', sublabel: 'Frota leve de apoio administrativo', color: '#84cc16' },
  { value: 'GNV / Biometano', label: 'GNV / Biometano Sustentável', sublabel: 'Gás natural comprimido / biometano de aterro', color: '#14b8a6' }
];

// Formas de Pagamento
export const PAYMENT_METHODS = [
  { value: 'Cartão Frota - Ticket Log', label: 'Cartão Frota - Ticket Log (Edenred)', sublabel: 'Débito via rede credenciada de postos' },
  { value: 'Cartão Frota - Good Card', label: 'Cartão Frota - Good Card / Wizeo', sublabel: 'Controle de saldo em tempo real' },
  { value: 'Cartão Frota - Sem Parar / Veloe Go', label: 'Cartão Frota - Sem Parar / Veloe Go', sublabel: 'Abastecimento automatizado' },
  { value: 'Cartão Frota - Repom', label: 'Cartão Frota - Repom Frete', sublabel: 'Gestão de rota e pedágio' },
  { value: 'Faturado Convênio Corporativo', label: 'Faturado Convênio Corporativo (Base / Rede)', sublabel: 'Fechamento quinzenal/mensal direto' },
  { value: 'Cartão Corporativo Débito/Crédito', label: 'Cartão Corporativo CCO (Bandeira)', sublabel: 'Despesas extraordinárias de trânsito' },
  { value: 'Dinheiro / Reembolso Fundo Fixo', label: 'Dinheiro / Reembolso Fundo Fixo', sublabel: 'Ressarcimento mediante NF/Cupom fiscal' }
];

// Classificação de Eficiência de Consumo (km/l) para Caminhões Pesados
export const getConsumptionEfficiency = (kmPerL, fuelType) => {
  if (fuelType === 'ARLA 32') {
    return { label: 'Dosagem ARLA 32', status: 'normal', color: '#3b82f6' };
  }
  const val = Number(kmPerL);
  if (!val || val <= 0) return { label: 'Sem cálculo', status: 'indefinido', color: '#94a3b8' };
  
  if (val >= 2.6) {
    return { label: 'Excelente Eficiência', status: 'excelente', color: '#10b981' };
  }
  if (val >= 2.1) {
    return { label: 'Na Meta CCO', status: 'normal', color: '#06b6d4' };
  }
  if (val >= 1.7) {
    return { label: 'Atenção / Abaixo da Meta', status: 'alerta', color: '#f59e0b' };
  }
  return { label: 'Consumo Excessivo (Investigar)', status: 'critico', color: '#f43f5e' };
};

export default function FuelModule({ user }) {
  // Estado 100% Limpo inicial
  const [records, setRecords] = useState(() => {
    try {
      const saved = localStorage.getItem('ambipar_fuel_records_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Carrega veículos e motoristas cadastrados para autocompletar dinamicamente
  const [availablePlates, setAvailablePlates] = useState([]);
  const [availableDrivers, setAvailableDrivers] = useState([]);

  useEffect(() => {
    try {
      // Veículos
      const savedVehicles = localStorage.getItem('ambipar_real_vehicles');
      const savedPlatesList = localStorage.getItem('ambipar_fleet_vehicles');
      let plates = [];
      if (savedVehicles) {
        const parsed = JSON.parse(savedVehicles);
        plates = parsed.map(v => ({
          placa: v.placa,
          modelo: v.modelo || v.tipo || 'Caminhão',
          capacidadeTanque: v.capacidade_tanque || 600
        }));
      } else if (savedPlatesList) {
        const parsed = JSON.parse(savedPlatesList);
        plates = parsed.map(p => ({ placa: p, modelo: 'Frota Ambipar', capacidadeTanque: 600 }));
      }
      setAvailablePlates(plates);

      // Motoristas
      const savedDrivers = localStorage.getItem('ambipar_real_drivers');
      if (savedDrivers) {
        const parsed = JSON.parse(savedDrivers);
        setAvailableDrivers(parsed.map(d => d.nome));
      }
    } catch (e) {
      console.warn('Erro ao carregar veículos/motoristas de apoio:', e);
    }
  }, []);

  // Salva no localStorage a cada atualização
  useEffect(() => {
    try {
      localStorage.setItem('ambipar_fuel_records_v1', JSON.stringify(records));
    } catch (err) {
      console.warn('Erro ao salvar abastecimentos:', err);
    }
  }, [records]);

  // Controles de Visualização & Filtros
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards' | 'audit' | 'form'
  const [activeTab, setActiveTab] = useState('todos'); // 'todos' | 'diesel' | 'arla' | 'hvo' | 'alertas'
  const [searchTerm, setSearchTerm] = useState('');
  const [fuelFilter, setFuelFilter] = useState('Todos');
  const [plateFilter, setPlateFilter] = useState('Todas');
  const [feedback, setFeedback] = useState(null);

  // Modais
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showSimulator, setShowSimulator] = useState(false);

  // Formulário de Cadastro / Edição
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    data_abastecimento: new Date().toISOString().split('T')[0],
    hora_abastecimento: new Date().toTimeString().slice(0, 5),
    placa: '',
    modelo_veiculo: '',
    motorista: '',
    tipo_combustivel: 'Diesel S10',
    litros: '',
    preco_litro: '',
    valor_total: '',
    hodometro_atual: '',
    hodometro_anterior: '',
    horimetro: '',
    tanque_cheio: true,
    posto_nome: '',
    posto_cnpj: '',
    cidade: '',
    uf: 'SP',
    rodovia_km: '',
    nota_fiscal: '',
    forma_pagamento: 'Cartão Frota - Ticket Log',
    nivel_tanque_pos: '100%',
    observacoes: ''
  });

  // Estado do Simulador de Autonomia CCO
  const [simulatorData, setSimulatorData] = useState({
    distanciaKm: 650,
    mediaEsperada: 2.3,
    precoDiesel: 6.15,
    capacidadeTanque: 600
  });

  // Se o usuário seleciona uma placa no formulário, sugere o hodômetro anterior
  const handleSelectPlate = (selectedPlate) => {
    const matchedVehicle = availablePlates.find(p => p.placa === selectedPlate);
    
    // Busca o último abastecimento registrado para esta mesma placa
    const lastRecordForPlate = records
      .filter(r => r.placa?.toUpperCase() === selectedPlate.toUpperCase() && r.id !== editingId)
      .sort((a, b) => new Date(b.data_abastecimento) - new Date(a.data_abastecimento))[0];

    setFormData(prev => ({
      ...prev,
      placa: selectedPlate.toUpperCase(),
      modelo_veiculo: matchedVehicle ? matchedVehicle.modelo : prev.modelo_veiculo,
      hodometro_anterior: lastRecordForPlate ? String(lastRecordForPlate.hodometro_atual) : prev.hodometro_anterior
    }));
  };

  // Cálculo ao digitar litros e preço por litro
  const handleLitersChange = (val) => {
    const litrosNum = parseFloat(val) || 0;
    const precoNum = parseFloat(formData.preco_litro) || 0;
    const calcTotal = litrosNum > 0 && precoNum > 0 ? (litrosNum * precoNum).toFixed(2) : formData.valor_total;
    setFormData(prev => ({
      ...prev,
      litros: val,
      valor_total: calcTotal
    }));
  };

  const handlePriceChange = (val) => {
    const precoNum = parseFloat(val) || 0;
    const litrosNum = parseFloat(formData.litros) || 0;
    const calcTotal = litrosNum > 0 && precoNum > 0 ? (litrosNum * precoNum).toFixed(2) : formData.valor_total;
    setFormData(prev => ({
      ...prev,
      preco_litro: val,
      valor_total: calcTotal
    }));
  };

  // Prévia em tempo real de KM/L e Custo/KM durante digitação
  const liveKmPerL = useMemo(() => {
    const atual = parseFloat(formData.hodometro_atual) || 0;
    const anterior = parseFloat(formData.hodometro_anterior) || 0;
    const litros = parseFloat(formData.litros) || 0;
    if (atual > anterior && litros > 0) {
      return ((atual - anterior) / litros).toFixed(2);
    }
    return null;
  }, [formData.hodometro_atual, formData.hodometro_anterior, formData.litros]);

  const liveCostPerKm = useMemo(() => {
    const atual = parseFloat(formData.hodometro_atual) || 0;
    const anterior = parseFloat(formData.hodometro_anterior) || 0;
    const total = parseFloat(formData.valor_total) || 0;
    const dist = atual - anterior;
    if (dist > 0 && total > 0) {
      return (total / dist).toFixed(2);
    }
    return null;
  }, [formData.hodometro_atual, formData.hodometro_anterior, formData.valor_total]);

  // Abertura de formulário para novo lançamento
  const handleOpenCreateForm = () => {
    setEditingId(null);
    setFormData({
      data_abastecimento: new Date().toISOString().split('T')[0],
      hora_abastecimento: new Date().toTimeString().slice(0, 5),
      placa: '',
      modelo_veiculo: '',
      motorista: '',
      tipo_combustivel: 'Diesel S10',
      litros: '',
      preco_litro: '',
      valor_total: '',
      hodometro_atual: '',
      hodometro_anterior: '',
      horimetro: '',
      tanque_cheio: true,
      posto_nome: '',
      posto_cnpj: '',
      cidade: '',
      uf: 'SP',
      rodovia_km: '',
      nota_fiscal: '',
      forma_pagamento: 'Cartão Frota - Ticket Log',
      nivel_tanque_pos: '100%',
      observacoes: ''
    });
    setViewMode('form');
  };

  // Abertura de formulário para edição
  const handleOpenEditForm = (rec) => {
    setEditingId(rec.id);
    setFormData({
      data_abastecimento: rec.data_abastecimento || '',
      hora_abastecimento: rec.hora_abastecimento || '',
      placa: rec.placa || '',
      modelo_veiculo: rec.modelo_veiculo || '',
      motorista: rec.motorista || '',
      tipo_combustivel: rec.tipo_combustivel || 'Diesel S10',
      litros: rec.litros || '',
      preco_litro: rec.preco_litro || '',
      valor_total: rec.valor_total || '',
      hodometro_atual: rec.hodometro_atual || '',
      hodometro_anterior: rec.hodometro_anterior || '',
      horimetro: rec.horimetro || '',
      tanque_cheio: rec.tanque_cheio ?? true,
      posto_nome: rec.posto_nome || '',
      posto_cnpj: rec.posto_cnpj || '',
      cidade: rec.cidade || '',
      uf: rec.uf || 'SP',
      rodovia_km: rec.rodovia_km || '',
      nota_fiscal: rec.nota_fiscal || '',
      forma_pagamento: rec.forma_pagamento || 'Cartão Frota - Ticket Log',
      nivel_tanque_pos: rec.nivel_tanque_pos || '100%',
      observacoes: rec.observacoes || ''
    });
    setViewMode('form');
  };

  // Submissão do Formulário
  const handleSubmitForm = (e) => {
    e.preventDefault();
    if (!formData.placa.trim()) {
      alert('Por favor informe a Placa do Veículo.');
      return;
    }
    if (!formData.litros || Number(formData.litros) <= 0) {
      alert('Por favor informe a quantidade de litros abastecida.');
      return;
    }

    const litrosNum = Number(formData.litros) || 0;
    const precoNum = Number(formData.preco_litro) || 0;
    const totalNum = Number(formData.valor_total) || (litrosNum * precoNum);
    const atualKm = Number(formData.hodometro_atual) || 0;
    const anteriorKm = Number(formData.hodometro_anterior) || 0;
    const distKm = atualKm > anteriorKm ? atualKm - anteriorKm : 0;
    const kmPorLitro = distKm > 0 && litrosNum > 0 ? Number((distKm / litrosNum).toFixed(2)) : null;
    const cpk = distKm > 0 && totalNum > 0 ? Number((totalNum / distKm).toFixed(2)) : null;

    // Cálculo ambiental: Diesel emite ~2.68 kg CO2/L | HVO reduz 80% | ARLA reduz NOx
    let co2Kg = 0;
    if (formData.tipo_combustivel?.includes('HVO')) {
      co2Kg = Number((litrosNum * 0.53).toFixed(1));
    } else if (formData.tipo_combustivel?.includes('Diesel')) {
      co2Kg = Number((litrosNum * 2.68).toFixed(1));
    } else if (formData.tipo_combustivel?.includes('Gasolina')) {
      co2Kg = Number((litrosNum * 2.27).toFixed(1));
    } else if (formData.tipo_combustivel?.includes('Etanol')) {
      co2Kg = Number((litrosNum * 0.45).toFixed(1));
    }

    const payload = {
      ...formData,
      placa: formData.placa.toUpperCase().trim(),
      litros: litrosNum,
      preco_litro: precoNum,
      valor_total: totalNum,
      hodometro_atual: atualKm,
      hodometro_anterior: anteriorKm,
      distancia_percorrida_km: distKm,
      km_por_litro: kmPorLitro,
      custo_por_km: cpk,
      co2_emitido_kg: co2Kg,
      updated_at: new Date().toISOString()
    };

    if (editingId) {
      const updated = records.map(r => r.id === editingId ? { ...payload, id: editingId } : r);
      setRecords(updated);
      setFeedback({ type: 'success', text: `Abastecimento da placa ${payload.placa} atualizado com sucesso!` });
    } else {
      const newRec = {
        ...payload,
        id: `ABAST-AMB${Math.floor(1000 + Math.random() * 9000)}`,
        created_at: new Date().toISOString()
      };
      setRecords([newRec, ...records]);
      setFeedback({ type: 'success', text: `Abastecimento da placa ${payload.placa} lançado com sucesso no CCO!` });
    }

    setViewMode('table');
    setTimeout(() => setFeedback(null), 4000);
  };

  // Exclusão
  const handleDeleteRecord = (id, placa) => {
    if (window.confirm(`Confirma a exclusão do registro de abastecimento da placa "${placa}"?`)) {
      setRecords(records.filter(r => r.id !== id));
      setFeedback({ type: 'info', text: `Registro de abastecimento removido.` });
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  // KPIs Consolidados
  const totalFuelCost = useMemo(() => {
    return records.reduce((acc, r) => acc + (Number(r.valor_total) || 0), 0);
  }, [records]);

  const totalFuelLiters = useMemo(() => {
    return records
      .filter(r => !r.tipo_combustivel?.includes('ARLA'))
      .reduce((acc, r) => acc + (Number(r.litros) || 0), 0);
  }, [records]);

  const totalArlaLiters = useMemo(() => {
    return records
      .filter(r => r.tipo_combustivel?.includes('ARLA'))
      .reduce((acc, r) => acc + (Number(r.litros) || 0), 0);
  }, [records]);

  const overallAvgKmPerL = useMemo(() => {
    const validRecords = records.filter(r => r.km_por_litro && r.km_por_litro > 0);
    if (validRecords.length === 0) return 0;
    const totalDist = validRecords.reduce((acc, r) => acc + (r.distancia_percorrida_km || 0), 0);
    const totalLitros = validRecords.reduce((acc, r) => acc + (r.litros || 0), 0);
    return totalLitros > 0 ? (totalDist / totalLitros).toFixed(2) : 0;
  }, [records]);

  const overallAvgCpk = useMemo(() => {
    const validRecords = records.filter(r => r.custo_por_km && r.custo_por_km > 0);
    if (validRecords.length === 0) return 0;
    const totalDist = validRecords.reduce((acc, r) => acc + (r.distancia_percorrida_km || 0), 0);
    const totalVal = validRecords.reduce((acc, r) => acc + (r.valor_total || 0), 0);
    return totalDist > 0 ? (totalVal / totalDist).toFixed(2) : 0;
  }, [records]);

  const totalCo2Tons = useMemo(() => {
    const kg = records.reduce((acc, r) => acc + (Number(r.co2_emitido_kg) || 0), 0);
    return (kg / 1000).toFixed(2);
  }, [records]);

  // Lista dinâmica de placas presentes nos registros
  const uniquePlatesInRecords = useMemo(() => {
    return Array.from(new Set(records.map(r => r.placa).filter(Boolean)));
  }, [records]);

  // Filtragem
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        !searchTerm ||
        r.placa?.toLowerCase().includes(q) ||
        r.motorista?.toLowerCase().includes(q) ||
        r.posto_nome?.toLowerCase().includes(q) ||
        r.cidade?.toLowerCase().includes(q) ||
        r.nota_fiscal?.toLowerCase().includes(q);

      const matchFuel = fuelFilter === 'Todos' || r.tipo_combustivel === fuelFilter;
      const matchPlate = plateFilter === 'Todas' || r.placa === plateFilter;

      if (activeTab === 'diesel') {
        return matchSearch && matchFuel && matchPlate && r.tipo_combustivel?.includes('Diesel');
      }
      if (activeTab === 'arla') {
        return matchSearch && matchFuel && matchPlate && r.tipo_combustivel?.includes('ARLA');
      }
      if (activeTab === 'hvo') {
        return matchSearch && matchFuel && matchPlate && r.tipo_combustivel?.includes('HVO');
      }
      if (activeTab === 'alertas') {
        return matchSearch && matchFuel && matchPlate && r.km_por_litro && r.km_por_litro < 2.0;
      }

      return matchSearch && matchFuel && matchPlate;
    });
  }, [records, searchTerm, fuelFilter, plateFilter, activeTab]);

  // Cálculo da Simulação de Rota CCO
  const simResults = useMemo(() => {
    const dist = Number(simulatorData.distanciaKm) || 0;
    const media = Number(simulatorData.mediaEsperada) || 2.3;
    const preco = Number(simulatorData.precoDiesel) || 6.15;
    const cap = Number(simulatorData.capacidadeTanque) || 600;

    const litrosDiesel = media > 0 ? dist / media : 0;
    const litrosArla = litrosDiesel * 0.05; // 5% do consumo de diesel
    const custoDiesel = litrosDiesel * preco;
    const custoArla = litrosArla * 3.80; // média R$ 3,80/L de ARLA
    const custoTotal = custoDiesel + custoArla;
    const autonomiaKm = cap * media;
    const paradasRecomendadas = autonomiaKm > 0 ? Math.floor(dist / (autonomiaKm * 0.85)) : 0;
    const co2Kg = litrosDiesel * 2.68;

    return {
      litrosDiesel: litrosDiesel.toFixed(1),
      litrosArla: litrosArla.toFixed(1),
      custoTotal: custoTotal.toFixed(2),
      custoDiesel: custoDiesel.toFixed(2),
      autonomiaKm: autonomiaKm.toFixed(0),
      paradasRecomendadas,
      co2Kg: co2Kg.toFixed(1)
    };
  }, [simulatorData]);

  return (
    <div className="module-page-container animate-fade-in" id="fuel-module-root">
      {/* 1. Header do Módulo */}
      <div className="fuel-top-header">
        <div className="fuel-header-title-box">
          <div className="fuel-header-icon">
            <Fuel size={28} />
          </div>
          <div className="fuel-header-text">
            <h2>
              Controle de Combustível & ARLA 32
              <span className="fuel-header-tag">Auditoria CCO</span>
            </h2>
            <p>
              Gestão rigorosa de abastecimentos da frota, controle de rendimento (km/l), custo por quilômetro (CPK), conformidade de notas fiscais e emissões de carbono.
            </p>
          </div>
        </div>

        <div className="fuel-header-actions">
          <button
            type="button"
            className="fuel-btn fuel-btn-cyan"
            onClick={() => setShowSimulator(true)}
            title="Calcular previsão de combustível para nova rota"
          >
            <Compass size={16} />
            <span>Simulador de Autonomia</span>
          </button>

          {viewMode !== 'form' && (
            <button
              type="button"
              className="fuel-btn fuel-btn-primary"
              onClick={handleOpenCreateForm}
              id="btn-lancar-abastecimento"
            >
              <Plus size={16} />
              <span>+ Lançar Abastecimento</span>
            </button>
          )}

          {records.length > 0 && viewMode !== 'form' && (
            <button
              type="button"
              className="fuel-btn fuel-btn-secondary"
              onClick={() => window.print()}
              title="Imprimir relatório CCO"
            >
              <Printer size={15} />
              <span>Imprimir</span>
            </button>
          )}
        </div>
      </div>

      {/* Alerta de Feedback */}
      {feedback && (
        <div 
          className="animate-fade-in"
          style={{
            padding: '0.85rem 1.25rem',
            borderRadius: '10px',
            marginBottom: '1.25rem',
            background: feedback.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(6, 182, 212, 0.15)',
            border: `1px solid ${feedback.type === 'success' ? '#10b981' : '#06b6d4'}`,
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            fontSize: '0.86rem'
          }}
        >
          <CheckCircle2 size={18} color={feedback.type === 'success' ? '#10b981' : '#06b6d4'} />
          <span>{feedback.text}</span>
        </div>
      )}

      {/* 2. Grid de KPIs Operacionais (5 Colunas) */}
      <div className="fuel-kpi-grid">
        <div className="fuel-kpi-card">
          <div className="fuel-kpi-top">
            <span className="fuel-kpi-title">Gasto Total Combustível</span>
            <div className="fuel-kpi-icon-wrap emerald">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="fuel-kpi-main-val">
            <span className="val-number">
              R$ {totalFuelCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="fuel-kpi-footer-status">
            {records.length === 0 ? 'Nenhum lançamento no CCO' : `${records.length} notas/tickets lançados`}
          </div>
        </div>

        <div className="fuel-kpi-card">
          <div className="fuel-kpi-top">
            <span className="fuel-kpi-title">Volume Total Diesel</span>
            <div className="fuel-kpi-icon-wrap cyan">
              <Droplets size={18} />
            </div>
          </div>
          <div className="fuel-kpi-main-val">
            <span className="val-number">{totalFuelLiters.toLocaleString('pt-BR')}</span>
            <span className="unit-suffix">litros</span>
          </div>
          <div className="fuel-kpi-footer-status">
            {totalArlaLiters > 0 ? `+ ${totalArlaLiters.toLocaleString('pt-BR')} L de ARLA 32` : 'Diesel S10 / S500 / HVO'}
          </div>
        </div>

        <div className="fuel-kpi-card">
          <div className="fuel-kpi-top">
            <span className="fuel-kpi-title">Média Geral Frota</span>
            <div className="fuel-kpi-icon-wrap amber">
              <Gauge size={18} />
            </div>
          </div>
          <div className="fuel-kpi-main-val">
            <span className="val-number">{overallAvgKmPerL || '—'}</span>
            <span className="unit-suffix">km / litro</span>
          </div>
          <div className="fuel-kpi-footer-status">
            {overallAvgKmPerL > 0 ? 'Rendimento médio pesado apurado' : 'Aguardando hodômetros'}
          </div>
        </div>

        <div className="fuel-kpi-card">
          <div className="fuel-kpi-top">
            <span className="fuel-kpi-title">Custo Médio p/ Km (CPK)</span>
            <div className="fuel-kpi-icon-wrap blue">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="fuel-kpi-main-val">
            <span className="val-number">
              {overallAvgCpk > 0 ? `R$ ${overallAvgCpk}` : '—'}
            </span>
            <span className="unit-suffix">/ km rodado</span>
          </div>
          <div className="fuel-kpi-footer-status">
            {overallAvgCpk > 0 ? 'Custo operacional direto' : 'Base de cálculo por KM'}
          </div>
        </div>

        <div className="fuel-kpi-card">
          <div className="fuel-kpi-top">
            <span className="fuel-kpi-title">Emissões de CO₂ Estimadas</span>
            <div className="fuel-kpi-icon-wrap purple">
              <Leaf size={18} />
            </div>
          </div>
          <div className="fuel-kpi-main-val">
            <span className="val-number">{totalCo2Tons}</span>
            <span className="unit-suffix">t CO₂e</span>
          </div>
          <div className="fuel-kpi-footer-status">
            Inventário GEE escopo 1 Ambipar
          </div>
        </div>
      </div>

      {/* SE FOR VISUALIZAÇÃO DE FORMULÁRIO */}
      {viewMode === 'form' ? (
        <form onSubmit={handleSubmitForm} className="fuel-form-wizard animate-fade-in" id="fuel-create-edit-form">
          <div className="fuel-form-header">
            <h3>
              <Fuel size={20} color="#10b981" />
              <span>{editingId ? 'Editar Lançamento de Abastecimento' : 'Novo Lançamento de Abastecimento & Ticket'}</span>
            </h3>
            <button
              type="button"
              className="fuel-btn fuel-btn-secondary"
              onClick={() => setViewMode('table')}
            >
              Cancelar e Voltar
            </button>
          </div>

          <div className="fuel-form-panels-grid">
            {/* Bloco 1: Veículo, Condutor e Hodômetro */}
            <div className="fuel-panel-card">
              <div className="fuel-panel-title">
                <Truck size={17} />
                <span>1. Veículo, Condutor & Odometria</span>
              </div>

              <div className="fuel-input-field">
                <label>Placa do Veículo *</label>
                {availablePlates.length > 0 ? (
                  <select
                    value={formData.placa}
                    onChange={e => handleSelectPlate(e.target.value)}
                    required
                  >
                    <option value="">-- Selecione uma Placa da Frota ou Digite --</option>
                    {availablePlates.map(p => (
                      <option key={p.placa} value={p.placa}>
                        {p.placa} ({p.modelo})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    placeholder="Ex: ABC1D23 ou BRA2E19"
                    value={formData.placa}
                    onChange={e => setFormData({ ...formData, placa: e.target.value.toUpperCase() })}
                  />
                )}
              </div>

              <div className="fuel-input-field">
                <label>Modelo / Configuração do Veículo</label>
                <input
                  type="text"
                  placeholder="Ex: Cavalo Mecânico 6x2 / Carreta Tanque 316L"
                  value={formData.modelo_veiculo}
                  onChange={e => setFormData({ ...formData, modelo_veiculo: e.target.value })}
                />
              </div>

              <div className="fuel-input-field">
                <label>Motorista / Condutor MOPP</label>
                {availableDrivers.length > 0 ? (
                  <select
                    value={formData.motorista}
                    onChange={e => setFormData({ ...formData, motorista: e.target.value })}
                  >
                    <option value="">-- Selecione o Motorista Homologado --</option>
                    {availableDrivers.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="Nome completo do condutor"
                    value={formData.motorista}
                    onChange={e => setFormData({ ...formData, motorista: e.target.value })}
                  />
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="fuel-input-field">
                  <label>Data *</label>
                  <input
                    type="date"
                    required
                    value={formData.data_abastecimento}
                    onChange={e => setFormData({ ...formData, data_abastecimento: e.target.value })}
                  />
                </div>
                <div className="fuel-input-field">
                  <label>Hora</label>
                  <input
                    type="time"
                    value={formData.hora_abastecimento}
                    onChange={e => setFormData({ ...formData, hora_abastecimento: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="fuel-input-field">
                  <label>KM Hodômetro Anterior</label>
                  <input
                    type="number"
                    placeholder="Ex: 142500"
                    value={formData.hodometro_anterior}
                    onChange={e => setFormData({ ...formData, hodometro_anterior: e.target.value })}
                  />
                </div>
                <div className="fuel-input-field">
                  <label>KM Hodômetro Atual *</label>
                  <input
                    type="number"
                    required
                    placeholder="Ex: 143250"
                    value={formData.hodometro_atual}
                    onChange={e => setFormData({ ...formData, hodometro_atual: e.target.value })}
                  />
                </div>
              </div>

              {/* Prévia de Cálculo de Consumo ao Vivo */}
              {liveKmPerL && (
                <div className="fuel-live-calc-box">
                  <div className="fuel-live-calc-title">
                    <Sparkles size={14} />
                    <span>Rendimento Calculado em Tempo Real</span>
                  </div>
                  <div className="fuel-live-calc-grid">
                    <div className="fuel-live-calc-item">
                      <span className="lbl">Distância Trecho</span>
                      <span className="val" style={{ color: '#38bdf8' }}>
                        {Number(formData.hodometro_atual) - Number(formData.hodometro_anterior)} km
                      </span>
                    </div>
                    <div className="fuel-live-calc-item">
                      <span className="lbl">Média do Veículo</span>
                      <span className="val" style={{ color: '#10b981' }}>{liveKmPerL} km/l</span>
                    </div>
                    <div className="fuel-live-calc-item">
                      <span className="lbl">Custo por Km</span>
                      <span className="val" style={{ color: '#f59e0b' }}>
                        {liveCostPerKm ? `R$ ${liveCostPerKm}` : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bloco 2: Combustível, Litros e Valores */}
            <div className="fuel-panel-card">
              <div className="fuel-panel-title">
                <DollarSign size={17} />
                <span>2. Combustível, Litragem & Valores Fiscais</span>
              </div>

              <div className="fuel-input-field">
                <label>Tipo de Combustível *</label>
                <select
                  value={formData.tipo_combustivel}
                  onChange={e => setFormData({ ...formData, tipo_combustivel: e.target.value })}
                  required
                >
                  {FUEL_TYPES.map(f => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="fuel-input-field">
                  <label>Volume Abastecido (Litros) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="Ex: 320.50"
                    value={formData.litros}
                    onChange={e => handleLitersChange(e.target.value)}
                  />
                </div>
                <div className="fuel-input-field">
                  <label>Preço Unitário (R$ / Litro) *</label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    placeholder="Ex: 6.19"
                    value={formData.preco_litro}
                    onChange={e => handlePriceChange(e.target.value)}
                  />
                </div>
              </div>

              <div className="fuel-input-field">
                <label>Valor Total do Abastecimento (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="Ex: 1983.89"
                  value={formData.valor_total}
                  onChange={e => setFormData({ ...formData, valor_total: e.target.value })}
                />
              </div>

              <div className="fuel-input-field">
                <label>Forma de Pagamento</label>
                <select
                  value={formData.forma_pagamento}
                  onChange={e => setFormData({ ...formData, forma_pagamento: e.target.value })}
                >
                  {PAYMENT_METHODS.map(m => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="fuel-input-field">
                  <label>Número da NF / Cupom TEF</label>
                  <input
                    type="text"
                    placeholder="Ex: NF-e 048291 ou Cupom 3819"
                    value={formData.nota_fiscal}
                    onChange={e => setFormData({ ...formData, nota_fiscal: e.target.value })}
                  />
                </div>
                <div className="fuel-input-field">
                  <label>Tanque Completado (Cheio)?</label>
                  <select
                    value={formData.tanque_cheio ? 'true' : 'false'}
                    onChange={e => setFormData({ ...formData, tanque_cheio: e.target.value === 'true' })}
                  >
                    <option value="true">Sim (Completo até a trava)</option>
                    <option value="false">Não (Abastecimento parcial)</option>
                  </select>
                </div>
              </div>

              <div className="fuel-input-field">
                <label>Nome do Posto / Estabelecimento</label>
                <input
                  type="text"
                  placeholder="Ex: Posto Graal Paulínia / Rede Ipiranga / Base CCO"
                  value={formData.posto_nome}
                  onChange={e => setFormData({ ...formData, posto_nome: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
                <div className="fuel-input-field">
                  <label>Cidade da Parada</label>
                  <input
                    type="text"
                    placeholder="Ex: Paulínia"
                    value={formData.cidade}
                    onChange={e => setFormData({ ...formData, cidade: e.target.value })}
                  />
                </div>
                <div className="fuel-input-field">
                  <label>UF</label>
                  <select
                    value={formData.uf}
                    onChange={e => setFormData({ ...formData, uf: e.target.value })}
                  >
                    {['SP', 'BA', 'RJ', 'MG', 'PR', 'RS', 'SC', 'ES', 'GO', 'PE', 'PA', 'AM', 'MT', 'MS', 'CE', 'DF'].map(uf => (
                      <option key={uf} value={uf}>{uf}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1.25rem' }}>
            <button
              type="button"
              className="fuel-btn fuel-btn-secondary"
              onClick={() => setViewMode('table')}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="fuel-btn fuel-btn-primary"
              id="btn-confirmar-abastecimento"
            >
              <Check size={16} />
              <span>Salvar Registro de Abastecimento</span>
            </button>
          </div>
        </form>
      ) : (
        <>
          {/* 3. Abas Rápidas no Topo */}
          <div className="fuel-tabs-bar">
            <button
              type="button"
              className={`fuel-tab-item ${activeTab === 'todos' ? 'active' : ''}`}
              onClick={() => setActiveTab('todos')}
            >
              <Fuel size={15} />
              <span>Todos os Registros ({records.length})</span>
            </button>
            <button
              type="button"
              className={`fuel-tab-item ${activeTab === 'diesel' ? 'active' : ''}`}
              onClick={() => setActiveTab('diesel')}
            >
              <Truck size={15} />
              <span>Diesel S10 / S500 ({records.filter(r => r.tipo_combustivel?.includes('Diesel')).length})</span>
            </button>
            <button
              type="button"
              className={`fuel-tab-item ${activeTab === 'arla' ? 'active' : ''}`}
              onClick={() => setActiveTab('arla')}
            >
              <Droplets size={15} />
              <span>ARLA 32 ({records.filter(r => r.tipo_combustivel?.includes('ARLA')).length})</span>
            </button>
            <button
              type="button"
              className={`fuel-tab-item ${activeTab === 'hvo' ? 'active' : ''}`}
              onClick={() => setActiveTab('hvo')}
            >
              <Leaf size={15} />
              <span>Biocombustível Verde HVO ({records.filter(r => r.tipo_combustivel?.includes('HVO')).length})</span>
            </button>
            <button
              type="button"
              className={`fuel-tab-item ${activeTab === 'alertas' ? 'active' : ''}`}
              onClick={() => setActiveTab('alertas')}
            >
              <AlertTriangle size={15} />
              <span>Consumo Excessivo ({records.filter(r => r.km_por_litro && r.km_por_litro < 2.0).length})</span>
            </button>
          </div>

          {/* 4. Barra de Filtros & Busca */}
          <div className="fuel-filter-panel">
            <div className="fuel-search-bar">
              <Search size={16} />
              <input
                type="text"
                placeholder="Buscar por placa, motorista, posto, NF ou cidade..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                >
                  ✕
                </button>
              )}
            </div>

            <div className="fuel-filter-actions-row">
              <select
                value={fuelFilter}
                onChange={e => setFuelFilter(e.target.value)}
                style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  padding: '0.55rem 0.85rem',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  outline: 'none'
                }}
              >
                <option value="Todos">Todos os Combustíveis</option>
                {FUEL_TYPES.map(f => (
                  <option key={f.value} value={f.value}>{f.value}</option>
                ))}
              </select>

              {uniquePlatesInRecords.length > 0 && (
                <select
                  value={plateFilter}
                  onChange={e => setPlateFilter(e.target.value)}
                  style={{
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    padding: '0.55rem 0.85rem',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    outline: 'none'
                  }}
                >
                  <option value="Todas">Todas as Placas</option>
                  {uniquePlatesInRecords.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              )}

              {/* Botões de Alternância de Visualização */}
              <div style={{ display: 'flex', gap: '0.35rem', background: 'rgba(0,0,0,0.3)', padding: '3px', borderRadius: '8px' }}>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  style={{
                    background: viewMode === 'table' ? 'rgba(16, 185, 129, 0.25)' : 'transparent',
                    color: viewMode === 'table' ? '#34d399' : '#94a3b8',
                    border: 'none',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                  title="Modo Tabela Operacional"
                >
                  <List size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  style={{
                    background: viewMode === 'cards' ? 'rgba(16, 185, 129, 0.25)' : 'transparent',
                    color: viewMode === 'cards' ? '#34d399' : '#94a3b8',
                    border: 'none',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                  title="Modo Cards de Ticket"
                >
                  <LayoutGrid size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* 5. Empty State Limpo (Se não houver registros) */}
          {filteredRecords.length === 0 ? (
            <div className="fuel-empty-state-card animate-fade-in" id="fuel-empty-state">
              <div className="fuel-empty-beacon">
                <div className="fuel-beacon-ring"></div>
                <div className="fuel-beacon-icon">
                  <Fuel size={36} color="#10b981" />
                </div>
              </div>

              <h3 className="fuel-empty-title">
                {searchTerm || fuelFilter !== 'Todos' || plateFilter !== 'Todas'
                  ? 'Nenhum abastecimento encontrado para os filtros selecionados'
                  : 'Módulo de Combustível CCO Pronto para Lançamentos'}
              </h3>

              <p className="fuel-empty-desc">
                {searchTerm || fuelFilter !== 'Todos' || plateFilter !== 'Todas'
                  ? 'Tente limpar a pesquisa ou os filtros para visualizar os abastecimentos cadastrados.'
                  : 'Cadastre os abastecimentos da frota para controlar o rendimento (km/l), auditar custos com diesel, monitorar o ARLA 32 e validar cupons fiscais.'}
              </p>

              <div className="fuel-empty-actions">
                {searchTerm || fuelFilter !== 'Todos' || plateFilter !== 'Todas' ? (
                  <button
                    type="button"
                    className="fuel-btn fuel-btn-secondary"
                    onClick={() => {
                      setSearchTerm('');
                      setFuelFilter('Todos');
                      setPlateFilter('Todas');
                      setActiveTab('todos');
                    }}
                  >
                    <RefreshCw size={15} />
                    <span>Limpar Filtros</span>
                  </button>
                ) : null}

                <button
                  type="button"
                  className="fuel-btn fuel-btn-primary"
                  onClick={handleOpenCreateForm}
                  id="btn-cadastrar-primeiro-abastecimento"
                  style={{ padding: '0.85rem 1.85rem', fontSize: '0.92rem' }}
                >
                  <Plus size={18} />
                  <span>+ Lançar Primeiro Abastecimento</span>
                </button>
              </div>
            </div>
          ) : viewMode === 'table' ? (
            /* 6. Modo Tabela Operacional */
            <div className="fuel-table-wrapper animate-fade-in">
              <table className="fuel-oper-table">
                <thead>
                  <tr>
                    <th>Data / Hora</th>
                    <th>Placa & Modelo</th>
                    <th>Condutor MOPP</th>
                    <th>Combustível</th>
                    <th>Volume (L)</th>
                    <th>Preço Unit.</th>
                    <th>Valor Total</th>
                    <th>Hodômetro / Trecho</th>
                    <th>Média (km/l)</th>
                    <th>Posto / Cidade</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map(rec => {
                    const efficiency = getConsumptionEfficiency(rec.km_por_litro, rec.tipo_combustivel);
                    const fuelMeta = FUEL_TYPES.find(f => f.value === rec.tipo_combustivel) || FUEL_TYPES[0];

                    return (
                      <tr key={rec.id}>
                        <td>
                          <div style={{ fontWeight: 600, color: '#ffffff' }}>
                            {rec.data_abastecimento?.split('-').reverse().join('/')}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                            {rec.hora_abastecimento || '—'}
                          </div>
                        </td>

                        <td>
                          <div className="fuel-plate-badge">
                            <Truck size={12} />
                            <span>{rec.placa}</span>
                          </div>
                          {rec.modelo_veiculo && (
                            <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
                              {rec.modelo_veiculo}
                            </div>
                          )}
                        </td>

                        <td>
                          <span style={{ fontWeight: 500 }}>
                            {rec.motorista ? rec.motorista.split(' ')[0] : 'Escala CCO'}
                          </span>
                        </td>

                        <td>
                          <span 
                            className="fuel-type-chip"
                            style={{
                              background: `${fuelMeta.color}15`,
                              color: fuelMeta.color,
                              border: `1px solid ${fuelMeta.color}35`
                            }}
                          >
                            <Fuel size={11} />
                            {rec.tipo_combustivel}
                          </span>
                        </td>

                        <td>
                          <strong style={{ color: '#ffffff', fontSize: '0.9rem' }}>
                            {Number(rec.litros).toLocaleString('pt-BR', { minimumFractionDigits: 1 })} L
                          </strong>
                        </td>

                        <td>
                          <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>
                            R$ {Number(rec.preco_litro).toFixed(2)}
                          </span>
                        </td>

                        <td>
                          <strong style={{ color: '#10b981', fontSize: '0.92rem' }}>
                            R$ {Number(rec.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </strong>
                        </td>

                        <td>
                          <div><strong>{rec.hodometro_atual?.toLocaleString('pt-BR')} km</strong></div>
                          {rec.distancia_percorrida_km > 0 && (
                            <div style={{ fontSize: '0.72rem', color: '#38bdf8' }}>
                              +{rec.distancia_percorrida_km} km rodados
                            </div>
                          )}
                        </td>

                        <td>
                          {rec.km_por_litro ? (
                            <span className={`fuel-efficiency-badge ${efficiency.status}`}>
                              <Gauge size={12} />
                              {rec.km_por_litro} km/l
                            </span>
                          ) : (
                            <span style={{ color: '#64748b', fontSize: '0.75rem' }}>—</span>
                          )}
                        </td>

                        <td>
                          <div style={{ color: '#ffffff', fontWeight: 600 }}>{rec.posto_nome || 'Posto Rota'}</div>
                          <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                            {rec.cidade ? `${rec.cidade}/${rec.uf || ''}` : 'Rodovia'}
                          </div>
                        </td>

                        <td>
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button
                              type="button"
                              onClick={() => setSelectedTicket(rec)}
                              title="Visualizar Ticket Fiscal"
                              style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#38bdf8', padding: '5px', borderRadius: '6px', cursor: 'pointer' }}
                            >
                              <FileText size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEditForm(rec)}
                              title="Editar Lançamento"
                              style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#10b981', padding: '5px', borderRadius: '6px', cursor: 'pointer' }}
                            >
                              <Edit3 size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteRecord(rec.id, rec.placa)}
                              title="Excluir"
                              style={{ background: 'rgba(244,63,94,0.1)', border: 'none', color: '#f43f5e', padding: '5px', borderRadius: '6px', cursor: 'pointer' }}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* 7. Modo Cards de Ticket */
            <div className="fuel-tickets-grid animate-fade-in">
              {filteredRecords.map(rec => {
                const efficiency = getConsumptionEfficiency(rec.km_por_litro, rec.tipo_combustivel);
                const fuelMeta = FUEL_TYPES.find(f => f.value === rec.tipo_combustivel) || FUEL_TYPES[0];

                return (
                  <div key={rec.id} className="fuel-ticket-card">
                    <div>
                      <div className="fuel-ticket-header">
                        <div>
                          <div className="fuel-ticket-station">
                            <Building size={15} color="#10b981" />
                            <span>{rec.posto_nome || 'Posto de Abastecimento'}</span>
                          </div>
                          <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                            {rec.cidade ? `${rec.cidade}/${rec.uf || ''}` : 'Ponto de Parada'} {rec.nota_fiscal ? `• ${rec.nota_fiscal}` : ''}
                          </span>
                        </div>
                        <div className="fuel-ticket-date">
                          <Calendar size={12} />
                          <span>{rec.data_abastecimento?.split('-').reverse().join('/')}</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0.65rem 0' }}>
                        <div className="fuel-plate-badge">
                          <Truck size={13} />
                          <span>{rec.placa}</span>
                        </div>
                        <span 
                          className="fuel-type-chip"
                          style={{
                            background: `${fuelMeta.color}15`,
                            color: fuelMeta.color,
                            border: `1px solid ${fuelMeta.color}35`
                          }}
                        >
                          {rec.tipo_combustivel}
                        </span>
                      </div>

                      <div className="fuel-ticket-metrics-box">
                        <div className="fuel-ticket-metric-cell">
                          <span className="metric-lbl">Volume</span>
                          <span className="metric-val">{Number(rec.litros).toFixed(1)} L</span>
                        </div>
                        <div className="fuel-ticket-metric-cell">
                          <span className="metric-lbl">Total Pago</span>
                          <span className="metric-val" style={{ color: '#10b981' }}>
                            R$ {Number(rec.valor_total).toFixed(2)}
                          </span>
                        </div>
                        <div className="fuel-ticket-metric-cell">
                          <span className="metric-lbl">Rendimento</span>
                          <span className="metric-val" style={{ color: efficiency.color }}>
                            {rec.km_por_litro ? `${rec.km_por_litro} km/l` : '—'}
                          </span>
                        </div>
                      </div>

                      <div style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem' }}>
                        <span>Condutor: <strong style={{ color: '#ffffff' }}>{rec.motorista || 'Escala CCO'}</strong></span>
                        <span>Hodômetro: <strong style={{ color: '#ffffff' }}>{rec.hodometro_atual} km</strong></span>
                      </div>
                    </div>

                    <div className="fuel-ticket-footer">
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        Pagamento: {rec.forma_pagamento?.split('-')[0] || 'Cartão Frota'}
                      </span>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedTicket(rec)}
                          title="Ver Detalhes do Ticket"
                          className="fuel-btn fuel-btn-secondary"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                        >
                          <FileText size={13} />
                          <span>Ver Ticket</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditForm(rec)}
                          title="Editar"
                          className="fuel-btn fuel-btn-secondary"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                        >
                          <Edit3 size={13} />
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

      {/* MODAL 1: SIMULADOR DE AUTONOMIA & CONSUMO DE ROTA */}
      {showSimulator && (
        <div className="fuel-modal-backdrop animate-fade-in" onClick={() => setShowSimulator(false)}>
          <div className="fuel-modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="fuel-modal-header">
              <h4>
                <Compass size={18} color="#06b6d4" />
                <span>Simulador de Autonomia & Consumo de Rota CCO</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowSimulator(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div className="fuel-modal-body">
              <p style={{ fontSize: '0.86rem', color: '#94a3b8', marginBottom: '1.25rem' }}>
                Simule o volume de combustível necessário, paradas de abastecimento e custos previstos antes da liberação do manifesto de viagem:
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div className="fuel-input-field">
                  <label>Distância Total do Trecho (km)</label>
                  <input
                    type="number"
                    value={simulatorData.distanciaKm}
                    onChange={e => setSimulatorData({ ...simulatorData, distanciaKm: e.target.value })}
                  />
                </div>
                <div className="fuel-input-field">
                  <label>Consumo Estimado do Veículo (km/l)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={simulatorData.mediaEsperada}
                    onChange={e => setSimulatorData({ ...simulatorData, mediaEsperada: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div className="fuel-input-field">
                  <label>Preço Médio do Diesel S10 (R$/L)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={simulatorData.precoDiesel}
                    onChange={e => setSimulatorData({ ...simulatorData, precoDiesel: e.target.value })}
                  />
                </div>
                <div className="fuel-input-field">
                  <label>Capacidade do Tanque (Litros)</label>
                  <input
                    type="number"
                    value={simulatorData.capacidadeTanque}
                    onChange={e => setSimulatorData({ ...simulatorData, capacidadeTanque: e.target.value })}
                  />
                </div>
              </div>

              {/* Resultado da Simulação */}
              <div style={{ background: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.25)', borderRadius: '12px', padding: '1.25rem' }}>
                <h5 style={{ margin: '0 0 0.85rem 0', color: '#38bdf8', fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Sparkles size={16} />
                  <span>Resultado da Projeção de Viagem CCO</span>
                </h5>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', textAlign: 'center' }}>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block' }}>Diesel Necessário</span>
                    <strong style={{ fontSize: '1.2rem', color: '#ffffff', display: 'block', marginTop: '2px' }}>
                      {simResults.litrosDiesel} L
                    </strong>
                  </div>

                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block' }}>ARLA 32 Estimado</span>
                    <strong style={{ fontSize: '1.2rem', color: '#38bdf8', display: 'block', marginTop: '2px' }}>
                      {simResults.litrosArla} L
                    </strong>
                  </div>

                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block' }}>Custo Estimado</span>
                    <strong style={{ fontSize: '1.2rem', color: '#10b981', display: 'block', marginTop: '2px' }}>
                      R$ {Number(simResults.custoTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </strong>
                  </div>
                </div>

                <div style={{ marginTop: '0.85rem', fontSize: '0.8rem', color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Autonomia com Tanque Cheio: <strong style={{ color: '#ffffff' }}>{simResults.autonomiaKm} km</strong></span>
                  <span>Paradas Recomendadas: <strong style={{ color: '#34d399' }}>{simResults.paradasRecomendadas} parada(s)</strong></span>
                  <span>Pegada Carbono: <strong style={{ color: '#f59e0b' }}>{simResults.co2Kg} kg CO₂</strong></span>
                </div>
              </div>
            </div>

            <div className="fuel-modal-footer">
              <button
                type="button"
                className="fuel-btn fuel-btn-secondary"
                onClick={() => setShowSimulator(false)}
              >
                Fechar Simulador
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: DOSSIÊ / TICKET FISCAL DE ABASTECIMENTO */}
      {selectedTicket && (
        <div className="fuel-modal-backdrop animate-fade-in" onClick={() => setSelectedTicket(null)}>
          <div className="fuel-modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="fuel-modal-header">
              <h4>
                <FileText size={18} color="#10b981" />
                <span>Ticket de Abastecimento #{selectedTicket.id}</span>
              </h4>
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div className="fuel-modal-body">
              <div style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '1.25rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem' }}>
                  <div>
                    <h5 style={{ margin: 0, fontSize: '1.1rem', color: '#ffffff' }}>{selectedTicket.posto_nome || 'Posto de Rota Homologado'}</h5>
                    <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                      {selectedTicket.cidade ? `${selectedTicket.cidade}/${selectedTicket.uf}` : 'Ponto de Abastecimento'} {selectedTicket.posto_cnpj ? `• CNPJ: ${selectedTicket.posto_cnpj}` : ''}
                    </span>
                  </div>
                  <div className="fuel-plate-badge" style={{ fontSize: '0.9rem', padding: '4px 10px' }}>
                    <Truck size={14} />
                    <span>{selectedTicket.placa}</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', fontSize: '0.84rem' }}>
                  <div>
                    <span style={{ color: '#94a3b8' }}>Data & Hora:</span>
                    <div style={{ color: '#ffffff', fontWeight: 600 }}>
                      {selectedTicket.data_abastecimento?.split('-').reverse().join('/')} às {selectedTicket.hora_abastecimento || '00:00'}
                    </div>
                  </div>

                  <div>
                    <span style={{ color: '#94a3b8' }}>Combustível:</span>
                    <div style={{ color: '#10b981', fontWeight: 600 }}>{selectedTicket.tipo_combustivel}</div>
                  </div>

                  <div>
                    <span style={{ color: '#94a3b8' }}>Volume Abastecido:</span>
                    <div style={{ color: '#ffffff', fontWeight: 600 }}>{selectedTicket.litros} Litros</div>
                  </div>

                  <div>
                    <span style={{ color: '#94a3b8' }}>Preço Unitário:</span>
                    <div style={{ color: '#ffffff', fontWeight: 600 }}>R$ {Number(selectedTicket.preco_litro).toFixed(2)} / L</div>
                  </div>

                  <div>
                    <span style={{ color: '#94a3b8' }}>Valor Total Pago:</span>
                    <div style={{ color: '#10b981', fontWeight: 800, fontSize: '1.1rem' }}>
                      R$ {Number(selectedTicket.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  <div>
                    <span style={{ color: '#94a3b8' }}>Forma de Pagamento:</span>
                    <div style={{ color: '#ffffff', fontWeight: 600 }}>{selectedTicket.forma_pagamento}</div>
                  </div>

                  <div>
                    <span style={{ color: '#94a3b8' }}>Hodômetro no Ato:</span>
                    <div style={{ color: '#ffffff', fontWeight: 600 }}>{selectedTicket.hodometro_atual?.toLocaleString('pt-BR')} km</div>
                  </div>

                  <div>
                    <span style={{ color: '#94a3b8' }}>Rendimento Calculado:</span>
                    <div style={{ color: '#38bdf8', fontWeight: 600 }}>
                      {selectedTicket.km_por_litro ? `${selectedTicket.km_por_litro} km/l` : 'Não calculado'}
                    </div>
                  </div>

                  <div>
                    <span style={{ color: '#94a3b8' }}>Condutor MOPP:</span>
                    <div style={{ color: '#ffffff', fontWeight: 600 }}>{selectedTicket.motorista || 'Escala CCO'}</div>
                  </div>

                  <div>
                    <span style={{ color: '#94a3b8' }}>Documento Fiscal / TEF:</span>
                    <div style={{ color: '#ffffff', fontWeight: 600 }}>{selectedTicket.nota_fiscal || 'Comprovante Eletrônico'}</div>
                  </div>
                </div>

                {selectedTicket.observacoes && (
                  <div style={{ marginTop: '1rem', paddingTop: '0.85rem', borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: '0.8rem', color: '#94a3b8' }}>
                    <strong style={{ color: '#f59e0b' }}>Observações: </strong>
                    {selectedTicket.observacoes}
                  </div>
                )}
              </div>
            </div>

            <div className="fuel-modal-footer">
              <button
                type="button"
                className="fuel-btn fuel-btn-secondary"
                onClick={() => window.print()}
              >
                <Printer size={15} />
                <span>Imprimir Cupom CCO</span>
              </button>
              <button
                type="button"
                className="fuel-btn fuel-btn-primary"
                onClick={() => setSelectedTicket(null)}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
