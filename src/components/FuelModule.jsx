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
  Compass,
  MapPin,
  Route,
  Navigation,
  Shield,
  Copy,
  Download,
  Award,
  Zap,
  Info
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
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

// Presets de Conjuntos para Simulação Rápida
export const SIMULATOR_VEHICLE_PRESETS = [
  {
    id: 'tanque_316l',
    label: 'Carreta Tanque Inox 316L',
    sublabel: 'PBT 45t Química',
    icon: '🧪',
    tipo: 'Carreta Tanque Inox 316L (PBT 45t)',
    tanqueDiesel: 800,
    tanqueArla: 80,
    mediaCarregado: 2.1,
    mediaVazio: 2.7,
    capacidadeCargaTon: 30
  },
  {
    id: 'bitrem_74t',
    label: 'Bitrem Tanque 74t',
    sublabel: 'PBT 74t 9 Eixos',
    icon: '🚛',
    tipo: 'Bitrem Tanque 7 ou 9 Eixos (PBT 57t a 74t)',
    tanqueDiesel: 1000,
    tanqueArla: 100,
    mediaCarregado: 1.7,
    mediaVazio: 2.2,
    capacidadeCargaTon: 50
  },
  {
    id: 'truck_23t',
    label: 'Truck Rígido 23t',
    sublabel: 'Sucção / ETE 3 Eixos',
    icon: '🚚',
    tipo: 'Caminhão Truck Rígido (3 Eixos - PBT 23t)',
    tanqueDiesel: 400,
    tanqueArla: 40,
    mediaCarregado: 2.8,
    mediaVazio: 3.4,
    capacidadeCargaTon: 14
  },
  {
    id: 'pae_24h',
    label: 'Unidade PAE Emergência',
    sublabel: 'Ambipar Response 24h',
    icon: '🚒',
    tipo: 'Veículo de Resposta PAE Ambipar',
    tanqueDiesel: 300,
    tanqueArla: 30,
    mediaCarregado: 3.5,
    mediaVazio: 4.2,
    capacidadeCargaTon: 6
  }
];

// Classificação de Eficiência de Consumo (km/l)
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

export default function FuelModule({ user, initialView = 'table', onNavigateModule }) {
  // Estado 100% Limpo inicial
  const [records, setRecords] = useState(() => {
    try {
      const saved = localStorage.getItem('ambipar_fuel_records_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Carrega veículos, motoristas e rotas de clientes reais cadastrados
  const [availablePlates, setAvailablePlates] = useState([]);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [clientRoutes, setClientRoutes] = useState([]);

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

      // Rotas de Clientes Reais
      const savedClients = localStorage.getItem('ambipar_real_clients_v2');
      if (savedClients) {
        const parsed = JSON.parse(savedClients);
        const validRoutes = parsed
          .filter(c => c.rota_nome || (c.origem && c.destino))
          .map(c => ({
            id: c.id,
            cliente: c.nome_fantasia || c.razao_social,
            nome: c.rota_nome || `${c.origem} ⇄ ${c.destino}`,
            origem: c.origem || `${c.cidade || 'Base'}/${c.uf || 'SP'}`,
            destino: c.destino || 'Planta Cliente',
            distanciaKm: Number(c.distancia_km) || 600
          }));
        setClientRoutes(validRoutes);
      }
    } catch (e) {
      console.warn('Erro ao carregar dados integrados CCO:', e);
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
  // viewMode: 'table' | 'cards' | 'ranking' | 'simulator' | 'form'
  const [viewMode, setViewMode] = useState(initialView || 'table');

  useEffect(() => {
    if (initialView) {
      setViewMode(initialView);
    }
  }, [initialView]);

  const [activeTab, setActiveTab] = useState('todos'); // 'todos' | 'diesel' | 'arla' | 'hvo' | 'alertas'
  const [searchTerm, setSearchTerm] = useState('');
  const [fuelFilter, setFuelFilter] = useState('Todos');
  const [plateFilter, setPlateFilter] = useState('Todas');
  const [feedback, setFeedback] = useState(null);

  // Modais
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showDispatchOrderModal, setShowDispatchOrderModal] = useState(false);

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

  // =========================================================================
  // ESTADO DO SIMULADOR DE AUTONOMIA & CONSUMO DE ROTA CCO
  // =========================================================================
  const [simulatorData, setSimulatorData] = useState({
    origem: 'Base Ambipar Paulínia / SP',
    destino: 'Polo Petroquímico de Camaçari / BA',
    distanciaKm: 1850,
    sentido: 'ida_e_volta', // 'ida_carregado' | 'ida_e_volta' | 'volta_vazio' | 'carregado_ida_e_volta'
    tipoRelevo: 'misto', // 'plano' (1.0) | 'misto' (1.08) | 'serra' (1.18)
    veiculoTipo: 'Carreta Tanque Inox 316L (PBT 45t)',
    capacidadeTanque: 800,
    capacidadeArla: 80,
    mediaCarregado: 2.1,
    mediaVazio: 2.7,
    capacidadeCargaTon: 30,
    reservaSegurancaPct: 15,
    tipoCombustivel: 'Diesel S10',
    precoDieselBase: 5.85,
    precoDieselPosto: 6.29,
    precoArla: 3.80,
    velocidadeMediaKmH: 70
  });

  const [activePresetId, setActivePresetId] = useState('tanque_316l');

  // Aplicar Preset de Veículo
  const handleApplyPreset = (preset) => {
    setActivePresetId(preset.id);
    setSimulatorData(prev => ({
      ...prev,
      veiculoTipo: preset.tipo,
      capacidadeTanque: preset.tanqueDiesel,
      capacidadeArla: preset.tanqueArla,
      mediaCarregado: preset.mediaCarregado,
      mediaVazio: preset.mediaVazio,
      capacidadeCargaTon: preset.capacidadeCargaTon
    }));
  };

  // Puxar Rota Real de Cliente
  const handleSelectClientRoute = (routeId) => {
    const match = clientRoutes.find(r => r.id === routeId);
    if (match) {
      setSimulatorData(prev => ({
        ...prev,
        origem: match.origem,
        destino: match.destino,
        distanciaKm: match.distanciaKm
      }));
      setFeedback({ type: 'success', text: `Rota do cliente "${match.cliente}" aplicada ao simulador (${match.distanciaKm} km)!` });
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  // Se o usuário seleciona uma placa no formulário de abastecimento
  const handleSelectPlate = (selectedPlate) => {
    const matchedVehicle = availablePlates.find(p => p.placa === selectedPlate);
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

  const handleLitersChange = (val) => {
    const litrosNum = parseFloat(val) || 0;
    const precoNum = parseFloat(formData.preco_litro) || 0;
    const calcTotal = litrosNum > 0 && precoNum > 0 ? (litrosNum * precoNum).toFixed(2) : formData.valor_total;
    setFormData(prev => ({ ...prev, litros: val, valor_total: calcTotal }));
  };

  const handlePriceChange = (val) => {
    const precoNum = parseFloat(val) || 0;
    const litrosNum = parseFloat(formData.litros) || 0;
    const calcTotal = litrosNum > 0 && precoNum > 0 ? (litrosNum * precoNum).toFixed(2) : formData.valor_total;
    setFormData(prev => ({ ...prev, preco_litro: val, valor_total: calcTotal }));
  };

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

  // Abertura de formulário
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

  const handleDeleteRecord = (id, placa) => {
    if (window.confirm(`Confirma a exclusão do registro de abastecimento da placa "${placa}"?`)) {
      setRecords(records.filter(r => r.id !== id));
      setFeedback({ type: 'info', text: `Registro de abastecimento removido.` });
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  // KPIs de Abastecimentos Consolidados
  const totalFuelCost = useMemo(() => records.reduce((acc, r) => acc + (Number(r.valor_total) || 0), 0), [records]);
  const totalFuelLiters = useMemo(() => records.filter(r => !r.tipo_combustivel?.includes('ARLA')).reduce((acc, r) => acc + (Number(r.litros) || 0), 0), [records]);
  const totalArlaLiters = useMemo(() => records.filter(r => r.tipo_combustivel?.includes('ARLA')).reduce((acc, r) => acc + (Number(r.litros) || 0), 0), [records]);

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

  const uniquePlatesInRecords = useMemo(() => Array.from(new Set(records.map(r => r.placa).filter(Boolean))), [records]);

  // Auditoria / Ranking de Eficiência por Placa
  const fleetRanking = useMemo(() => {
    const map = {};
    records.forEach(r => {
      const p = r.placa || 'Sem Placa';
      if (!map[p]) {
        map[p] = {
          placa: p,
          modelo: r.modelo_veiculo || 'Frota CCO',
          totalLitros: 0,
          totalValor: 0,
          totalDistancia: 0,
          contagem: 0
        };
      }
      map[p].totalLitros += Number(r.litros) || 0;
      map[p].totalValor += Number(r.valor_total) || 0;
      map[p].totalDistancia += Number(r.distancia_percorrida_km) || 0;
      map[p].contagem += 1;
    });

    return Object.values(map).map(item => {
      const kmPorLitro = item.totalLitros > 0 && item.totalDistancia > 0 ? Number((item.totalDistancia / item.totalLitros).toFixed(2)) : 0;
      const cpk = item.totalDistancia > 0 ? Number((item.totalValor / item.totalDistancia).toFixed(2)) : 0;
      const meta = getConsumptionEfficiency(kmPorLitro, 'Diesel S10');
      return { ...item, kmPorLitro, cpk, meta };
    }).sort((a, b) => b.kmPorLitro - a.kmPorLitro);
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

      if (activeTab === 'diesel') return matchSearch && matchFuel && matchPlate && r.tipo_combustivel?.includes('Diesel');
      if (activeTab === 'arla') return matchSearch && matchFuel && matchPlate && r.tipo_combustivel?.includes('ARLA');
      if (activeTab === 'hvo') return matchSearch && matchFuel && matchPlate && r.tipo_combustivel?.includes('HVO');
      if (activeTab === 'alertas') return matchSearch && matchFuel && matchPlate && r.km_por_litro && r.km_por_litro < 2.0;

      return matchSearch && matchFuel && matchPlate;
    });
  }, [records, searchTerm, fuelFilter, plateFilter, activeTab]);

  // Exportação para Excel / CSV
  const handleExportCSV = () => {
    if (filteredRecords.length === 0) {
      alert('Nenhum registro para exportar.');
      return;
    }

    const headers = ['ID', 'Data', 'Hora', 'Placa', 'Modelo', 'Motorista', 'Combustivel', 'Litros', 'Preco_Litro', 'Valor_Total', 'KM_Anterior', 'KM_Atual', 'Distancia_KM', 'KM_Litro', 'CPK', 'Posto', 'Cidade', 'UF', 'NF', 'Forma_Pagamento'];
    const rows = filteredRecords.map(r => [
      r.id,
      r.data_abastecimento,
      r.hora_abastecimento || '',
      r.placa,
      `"${r.modelo_veiculo || ''}"`,
      `"${r.motorista || ''}"`,
      r.tipo_combustivel,
      r.litros,
      r.preco_litro,
      r.valor_total,
      r.hodometro_anterior || '',
      r.hodometro_atual || '',
      r.distancia_percorrida_km || '',
      r.km_por_litro || '',
      r.custo_por_km || '',
      `"${r.posto_nome || ''}"`,
      `"${r.cidade || ''}"`,
      r.uf || '',
      `"${r.nota_fiscal || ''}"`,
      `"${r.forma_pagamento || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `abastecimentos_ambipar_cco_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setFeedback({ type: 'success', text: 'Planilha CSV exportada com sucesso!' });
    setTimeout(() => setFeedback(null), 3000);
  };

  // =========================================================================
  // CÁLCULO COMPLETO DO SIMULADOR DE AUTONOMIA & CONSUMO DE ROTA CCO
  // =========================================================================
  const simCalculations = useMemo(() => {
    const distTrecho = Number(simulatorData.distanciaKm) || 0;
    const sentido = simulatorData.sentido;
    let distTotal = distTrecho;
    let isCircuitoCompleto = false;

    if (sentido === 'ida_e_volta' || sentido === 'carregado_ida_e_volta') {
      distTotal = distTrecho * 2;
      isCircuitoCompleto = true;
    }

    let fatorRelevo = 1.0;
    if (simulatorData.tipoRelevo === 'misto') fatorRelevo = 1.08;
    if (simulatorData.tipoRelevo === 'serra') fatorRelevo = 1.18;

    const mediaCarregadoEfetiva = Number((simulatorData.mediaCarregado / fatorRelevo).toFixed(2));
    const mediaVazioEfetiva = Number((simulatorData.mediaVazio / fatorRelevo).toFixed(2));

    let litrosDieselTotal = 0;
    let mediaPonderada = 2.3;

    if (sentido === 'ida_carregado') {
      litrosDieselTotal = distTrecho / mediaCarregadoEfetiva;
      mediaPonderada = mediaCarregadoEfetiva;
    } else if (sentido === 'volta_vazio') {
      litrosDieselTotal = distTrecho / mediaVazioEfetiva;
      mediaPonderada = mediaVazioEfetiva;
    } else if (sentido === 'carregado_ida_e_volta') {
      litrosDieselTotal = distTotal / mediaCarregadoEfetiva;
      mediaPonderada = mediaCarregadoEfetiva;
    } else {
      const litrosIda = distTrecho / mediaCarregadoEfetiva;
      const litrosVolta = distTrecho / mediaVazioEfetiva;
      litrosDieselTotal = litrosIda + litrosVolta;
      mediaPonderada = Number((distTotal / litrosDieselTotal).toFixed(2));
    }

    const litrosArlaTotal = litrosDieselTotal * 0.05;
    const capTanque = Number(simulatorData.capacidadeTanque) || 800;
    const reservaPct = Number(simulatorData.reservaSegurancaPct) || 15;
    const volumeUtilTanque = capTanque * (1 - reservaPct / 100);
    const autonomiaMaximaKm = capTanque * mediaPonderada;
    const autonomiaSeguraKm = volumeUtilTanque * mediaPonderada;
    const numParadas = Math.max(0, Math.ceil(distTotal / autonomiaSeguraKm) - 1);

    const precoBase = Number(simulatorData.precoDieselBase) || 5.85;
    const precoPosto = Number(simulatorData.precoDieselPosto) || 6.29;
    const precoArla = Number(simulatorData.precoArla) || 3.80;

    const litrosBaseInicial = Math.min(capTanque, litrosDieselTotal);
    const litrosRodoviaNecessarios = Math.max(0, litrosDieselTotal - litrosBaseInicial);

    const custoDieselBase = litrosBaseInicial * precoBase;
    const custoDieselRodovia = litrosRodoviaNecessarios * precoPosto;
    const custoDieselMisto = custoDieselBase + custoDieselRodovia;
    const custoArlaTotal = litrosArlaTotal * precoArla;
    const custoTotalMisto = custoDieselMisto + custoArlaTotal;
    const cpkMisto = distTotal > 0 ? (custoTotalMisto / distTotal).toFixed(2) : '0.00';

    const custoDiesel100Posto = litrosDieselTotal * precoPosto;
    const custoTotal100Posto = custoDiesel100Posto + custoArlaTotal;
    const custoDiesel100Base = litrosDieselTotal * precoBase;
    const custoTotal100Base = custoDiesel100Base + custoArlaTotal;

    const economiaR$ = Math.max(0, custoTotal100Posto - custoTotalMisto);
    const economiaPct = custoTotal100Posto > 0 ? ((economiaR$ / custoTotal100Posto) * 100).toFixed(1) : '0.0';

    // Custo por tonelada transportada
    const cargaTon = Number(simulatorData.capacidadeCargaTon) || 30;
    const custoPorTon = cargaTon > 0 ? (custoTotalMisto / cargaTon).toFixed(2) : '0.00';

    const isHvo = simulatorData.tipoCombustivel?.includes('HVO');
    const fatorEmissao = isHvo ? 0.53 : 2.68;
    const co2TotalTon = ((litrosDieselTotal * fatorEmissao) / 1000).toFixed(2);
    const co2EvitadoTon = isHvo ? (((litrosDieselTotal * 2.68) - (litrosDieselTotal * 0.53)) / 1000).toFixed(2) : '0.00';

    const velMedia = Number(simulatorData.velocidadeMediaKmH) || 70;
    const tempoViagemHoras = velMedia > 0 ? (distTotal / velMedia).toFixed(1) : '0';

    // Waypoints dinâmicos da rota
    const waypoints = [];
    waypoints.push({
      tipo: 'start',
      km: 0,
      titulo: 'Origem: ' + (simulatorData.origem.split('/')[0] || 'Base'),
      subtitulo: 'Saída Tanque 100% Cheio na Base CCO',
      dieselNoTanque: capTanque + ' L',
      arlaNoTanque: (Number(simulatorData.capacidadeArla) || 80) + ' L',
      status: 'Saída Autorizada'
    });

    if (numParadas > 0) {
      for (let i = 1; i <= numParadas; i++) {
        const kmParada = Math.round(i * autonomiaSeguraKm);
        const litrosParaCompletar = Math.min(capTanque - (capTanque * reservaPct / 100), litrosDieselTotal - (i * volumeUtilTanque));
        const litrosArlaParada = Math.round(litrosParaCompletar * 0.05);

        waypoints.push({
          tipo: 'stop',
          km: kmParada,
          titulo: `Parada ${i} de Reabastecimento`,
          subtitulo: `Rede Credenciada de Rodovia (~km ${kmParada})`,
          dieselNoTanque: `+${Math.round(litrosParaCompletar)} L Diesel`,
          arlaNoTanque: `+${litrosArlaParada} L ARLA`,
          status: 'Parada Obrigatória'
        });
      }
    }

    const nivelFinalPct = Math.max(8, Math.round(100 - ((distTotal % autonomiaSeguraKm) / capTanque * 100)));
    waypoints.push({
      tipo: 'arrival',
      km: distTotal,
      titulo: 'Destino: ' + (simulatorData.destino.split('/')[0] || 'Chegada'),
      subtitulo: isCircuitoCompleto ? 'Retorno à Base / Ciclo Concluído' : 'Chegada na Planta / Descarga',
      dieselNoTanque: `Nível Final ~${nivelFinalPct}%`,
      arlaNoTanque: 'Tanque Conforme',
      status: 'Destino Alcançado'
    });

    // Curva de telemetria SVG Points (X: 0 a 800, Y: 20 a 140)
    // 100% tanque = Y=30, 15% reserva = Y=125, 0% = Y=145
    const svgPoints = [];
    svgPoints.push({ x: 30, y: 35, km: 0, pct: 100 }); // Início

    if (numParadas === 0) {
      const finalY = 35 + ((distTotal / autonomiaMaximaKm) * 100);
      svgPoints.push({ x: 770, y: Math.min(135, finalY), km: distTotal, pct: nivelFinalPct });
    } else {
      const stepX = (740 / (numParadas + 1));
      for (let i = 1; i <= numParadas; i++) {
        const xBefore = 30 + (i * stepX) - 10;
        const xAfter = 30 + (i * stepX);
        svgPoints.push({ x: xBefore, y: 125, km: Math.round(i * autonomiaSeguraKm), pct: 15 }); // Caiu na reserva
        svgPoints.push({ x: xAfter, y: 35, km: Math.round(i * autonomiaSeguraKm), pct: 100 }); // Reabasteceu 100%
      }
      svgPoints.push({ x: 770, y: 35 + (100 - nivelFinalPct), km: distTotal, pct: nivelFinalPct });
    }

    const svgPathD = svgPoints.reduce((acc, pt, idx) => {
      return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
    }, '');

    return {
      distTotal,
      isCircuitoCompleto,
      litrosDieselTotal: litrosDieselTotal.toFixed(1),
      litrosArlaTotal: litrosArlaTotal.toFixed(1),
      custoTotalMisto: custoTotalMisto.toFixed(2),
      custoDieselBase: custoDieselBase.toFixed(2),
      custoDieselRodovia: custoDieselRodovia.toFixed(2),
      custoDieselMisto: custoDieselMisto.toFixed(2),
      custoArlaTotal: custoArlaTotal.toFixed(2),
      cpkMisto,
      custoPorTon,
      custoTotal100Posto: custoTotal100Posto.toFixed(2),
      custoTotal100Base: custoTotal100Base.toFixed(2),
      economiaR$: economiaR$.toFixed(2),
      economiaPct,
      autonomiaMaximaKm: autonomiaMaximaKm.toFixed(0),
      autonomiaSeguraKm: autonomiaSeguraKm.toFixed(0),
      numParadas,
      co2TotalTon,
      co2EvitadoTon,
      tempoViagemHoras,
      mediaPonderada,
      waypoints,
      svgPoints,
      svgPathD
    };
  }, [simulatorData]);

  // Copiar resumo
  const handleCopySimulationSummary = () => {
    const text = `🚛 PLANO DE ABASTECIMENTO & AUTONOMIA CCO AMBIPAR
Origem: ${simulatorData.origem}
Destino: ${simulatorData.destino}
Distância Total: ${simCalculations.distTotal} km
Conjunto: ${simulatorData.veiculoTipo}
Combustível: ${simulatorData.tipoCombustivel}
----------------------------------------
Diesel Total Estimado: ${simCalculations.litrosDieselTotal} L
ARLA 32 Estimado: ${simCalculations.litrosArlaTotal} L
Custo Total Previsto: R$ ${Number(simCalculations.custoTotalMisto).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
Custo por Km (CPK): R$ ${simCalculations.cpkMisto} / km
Custo por Tonelada: R$ ${simCalculations.custoPorTon} / t
Autonomia Segura: ${simCalculations.autonomiaSeguraKm} km (com 15% reserva técnica)
Paradas Recomendadas: ${simCalculations.numParadas} parada(s) na rodovia
Emissões CO2: ${simCalculations.co2TotalTon} t CO2e
Economia Gerada p/ Base: R$ ${Number(simCalculations.economiaR$).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${simCalculations.economiaPct}%)
----------------------------------------
CCO Ambipar Logistics & Emergency Response`;

    navigator.clipboard.writeText(text);
    setFeedback({ type: 'success', text: 'Plano de rota copiado para a área de transferência!' });
    setTimeout(() => setFeedback(null), 3500);
  };

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

          <button
            type="button"
            className="fuel-btn fuel-btn-secondary"
            onClick={() => window.print()}
            title="Imprimir relatório CCO"
          >
            <Printer size={15} />
            <span>Imprimir</span>
          </button>
        </div>
      </div>

      {/* 2. Barra de Navegação de Áreas do Módulo */}
      <div className="fuel-mode-switch-bar">
        <button
          type="button"
          className={`fuel-mode-tab-btn ${viewMode === 'table' || viewMode === 'cards' ? 'active' : ''}`}
          onClick={() => setViewMode('table')}
          id="btn-tab-extrato-abastecimentos"
        >
          <Fuel size={17} />
          <span>Extrato & Lançamentos CCO ({records.length})</span>
        </button>

        <button
          type="button"
          className={`fuel-mode-tab-btn ${viewMode === 'ranking' ? 'active' : ''}`}
          onClick={() => setViewMode('ranking')}
          id="btn-tab-ranking-frota"
        >
          <Award size={17} />
          <span>Auditoria por Placa ({uniquePlatesInRecords.length})</span>
        </button>

        <button
          type="button"
          className={`fuel-mode-tab-btn ${viewMode === 'simulator' ? 'simulator-active' : ''}`}
          onClick={() => setViewMode('simulator')}
          id="btn-tab-simulador-autonomia-full"
        >
          <Compass size={17} />
          <span>Simulador de Autonomia & Rota CCO (Área Completa)</span>
        </button>
      </div>

      {/* Feedback Toast */}
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

      {/* ===================================================================== */}
      {/* SELETOR DE VIEW PRINCIPAL                                             */}
      {/* ===================================================================== */}

      {/* VIEW 1: ÁREA COMPLETA DO SIMULADOR DE AUTONOMIA & CONSUMO DE ROTA */}
      {viewMode === 'simulator' ? (
        <div className="fuel-simulator-full-area animate-fade-in" id="fuel-simulator-full-workspace">
          {/* Hero Banner do Simulador */}
          <div className="simulator-hero-card">
            <div className="simulator-hero-content">
              <div className="simulator-hero-icon">
                <Compass size={32} />
              </div>
              <div className="simulator-hero-text">
                <h3>
                  <span>Simulador Analítico de Autonomia, Consumo de Rota & Paradas CCO</span>
                </h3>
                <p>
                  Planejamento preditivo de viagem para despacho de carretas tanques e veículos pesados: calcule volume exato de diesel, injeção de ARLA 32, paradas seguras na rodovia e estratégia de redução de custo com abastecimento na base interna.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="fuel-btn fuel-btn-secondary"
                onClick={handleCopySimulationSummary}
                title="Copiar dados para enviar ao motorista via WhatsApp"
              >
                <Copy size={15} />
                <span>Copiar Resumo CCO</span>
              </button>
              <button
                type="button"
                className="fuel-btn fuel-btn-cyan"
                onClick={() => setShowDispatchOrderModal(true)}
                title="Gerar e imprimir Ordem de Abastecimento para o Motorista"
              >
                <FileText size={15} />
                <span>Ordem de Abastecimento</span>
              </button>
            </div>
          </div>

          {/* Grid de Trabalho: Parâmetros (Esquerda) vs Resultados & Cockpit (Direita) */}
          <div className="simulator-workbench-grid">
            {/* COLUNA ESQUERDA: PARÂMETROS DA SIMULAÇÃO */}
            <div className="simulator-params-column">
              {/* Presets Rápidos de Conjuntos */}
              <div className="sim-section-box">
                <div className="sim-section-title">
                  <Zap size={16} />
                  <span>Configuração Rápida por Perfil de Conjunto</span>
                </div>
                <div className="sim-preset-chips-group">
                  {SIMULATOR_VEHICLE_PRESETS.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      className={`sim-quick-preset-btn ${activePresetId === p.id ? 'active' : ''}`}
                      onClick={() => handleApplyPreset(p)}
                    >
                      <span>{p.icon}</span>
                      <span>{p.label}</span>
                    </button>
                  ))}
                </div>

                {/* Se houver rotas cadastradas em clientes, permite puxar */}
                {clientRoutes.length > 0 && (
                  <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: '#94a3b8', marginBottom: '0.35rem', fontWeight: 600 }}>
                      Puxar Rota Cadastrada de Cliente (Opcional):
                    </label>
                    <select
                      className="styled-native-select"
                      style={{ width: '100%', padding: '0.45rem', fontSize: '0.8rem' }}
                      onChange={e => handleSelectClientRoute(e.target.value)}
                      defaultValue=""
                    >
                      <option value="">-- Selecionar Rota de Cliente --</option>
                      {clientRoutes.map(r => (
                        <option key={r.id} value={r.id}>
                          {r.cliente}: {r.origem} ➔ {r.destino} ({r.distanciaKm} km)
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Caixa 1: Rota & Topografia */}
              <div className="sim-section-box">
                <div className="sim-section-title">
                  <Route size={17} />
                  <span>1. Rota, Distância & Topografia</span>
                </div>

                <div className="fuel-input-field">
                  <label>Ponto de Origem da Carga</label>
                  <input
                    type="text"
                    value={simulatorData.origem}
                    onChange={e => setSimulatorData({ ...simulatorData, origem: e.target.value })}
                  />
                </div>

                <div className="fuel-input-field">
                  <label>Ponto de Destino / Cliente</label>
                  <input
                    type="text"
                    value={simulatorData.destino}
                    onChange={e => setSimulatorData({ ...simulatorData, destino: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="fuel-input-field">
                    <label>Distância do Trecho (km)</label>
                    <input
                      type="number"
                      value={simulatorData.distanciaKm}
                      onChange={e => setSimulatorData({ ...simulatorData, distanciaKm: e.target.value })}
                    />
                  </div>

                  <div className="fuel-input-field">
                    <label>Sentido da Viagem</label>
                    <select
                      value={simulatorData.sentido}
                      onChange={e => setSimulatorData({ ...simulatorData, sentido: e.target.value })}
                    >
                      <option value="ida_e_volta">Ida Carregado / Volta Vazio (2x)</option>
                      <option value="ida_carregado">Apenas Ida (Carregado)</option>
                      <option value="volta_vazio">Apenas Volta (Vazio / Lastro)</option>
                      <option value="carregado_ida_e_volta">Carregado Ida e Volta (2x)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="fuel-input-field">
                    <label>Relevo / Topografia</label>
                    <select
                      value={simulatorData.tipoRelevo}
                      onChange={e => setSimulatorData({ ...simulatorData, tipoRelevo: e.target.value })}
                    >
                      <option value="plano">Plano / Duplicada (1.0x)</option>
                      <option value="misto">Misto / Ondulado (+8%)</option>
                      <option value="serra">Serra / Pista Simples (+18%)</option>
                    </select>
                  </div>

                  <div className="fuel-input-field">
                    <label>Velocidade Média (km/h)</label>
                    <input
                      type="number"
                      value={simulatorData.velocidadeMediaKmH}
                      onChange={e => setSimulatorData({ ...simulatorData, velocidadeMediaKmH: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Caixa 2: Veículo & Tanque */}
              <div className="sim-section-box">
                <div className="sim-section-title">
                  <Truck size={17} />
                  <span>2. Conjunto & Capacidade de Tanques</span>
                </div>

                <div className="fuel-input-field">
                  <label>Configuração do Conjunto</label>
                  <input
                    type="text"
                    value={simulatorData.veiculoTipo}
                    onChange={e => setSimulatorData({ ...simulatorData, veiculoTipo: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="fuel-input-field">
                    <label>Capacidade Diesel (L)</label>
                    <input
                      type="number"
                      value={simulatorData.capacidadeTanque}
                      onChange={e => setSimulatorData({ ...simulatorData, capacidadeTanque: e.target.value })}
                    />
                  </div>

                  <div className="fuel-input-field">
                    <label>Capacidade ARLA 32 (L)</label>
                    <input
                      type="number"
                      value={simulatorData.capacidadeArla}
                      onChange={e => setSimulatorData({ ...simulatorData, capacidadeArla: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="fuel-input-field">
                    <label>Média Carregado (km/l)</label>
                    <input
                      type="number"
                      step="0.05"
                      value={simulatorData.mediaCarregado}
                      onChange={e => setSimulatorData({ ...simulatorData, mediaCarregado: e.target.value })}
                    />
                  </div>

                  <div className="fuel-input-field">
                    <label>Média Vazio (km/l)</label>
                    <input
                      type="number"
                      step="0.05"
                      value={simulatorData.mediaVazio}
                      onChange={e => setSimulatorData({ ...simulatorData, mediaVazio: e.target.value })}
                    />
                  </div>
                </div>

                <div className="fuel-input-field">
                  <label>Reserva Técnica de Segurança: {simulatorData.reservaSegurancaPct}%</label>
                  <input
                    type="range"
                    min="10"
                    max="25"
                    step="1"
                    className="styled-range-slider"
                    value={simulatorData.reservaSegurancaPct}
                    onChange={e => setSimulatorData({ ...simulatorData, reservaSegurancaPct: e.target.value })}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748b' }}>
                    <span>10% (mínima)</span>
                    <span style={{ color: '#10b981' }}>{simulatorData.reservaSegurancaPct}% selecionado</span>
                    <span>25% (máxima)</span>
                  </div>
                </div>
              </div>

              {/* Caixa 3: Preços & Combustível */}
              <div className="sim-section-box">
                <div className="sim-section-title">
                  <DollarSign size={17} />
                  <span>3. Estratégia de Preços & Combustível</span>
                </div>

                <div className="fuel-input-field">
                  <label>Tipo de Combustível Principal</label>
                  <select
                    value={simulatorData.tipoCombustivel}
                    onChange={e => setSimulatorData({ ...simulatorData, tipoCombustivel: e.target.value })}
                  >
                    <option value="Diesel S10">Diesel S10 (Euro 6 / Euro 5)</option>
                    <option value="Diesel Renovável HVO / R5">Diesel Renovável HVO / R5 (Biocombustível Verde Ambipar)</option>
                    <option value="Diesel S500">Diesel S500 (Convencional)</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="fuel-input-field">
                    <label>Preço Base Interna: R$ {Number(simulatorData.precoDieselBase).toFixed(2)}/L</label>
                    <input
                      type="number"
                      step="0.01"
                      value={simulatorData.precoDieselBase}
                      onChange={e => setSimulatorData({ ...simulatorData, precoDieselBase: e.target.value })}
                    />
                  </div>

                  <div className="fuel-input-field">
                    <label>Preço Posto Rodovia: R$ {Number(simulatorData.precoDieselPosto).toFixed(2)}/L</label>
                    <input
                      type="number"
                      step="0.01"
                      value={simulatorData.precoDieselPosto}
                      onChange={e => setSimulatorData({ ...simulatorData, precoDieselPosto: e.target.value })}
                    />
                  </div>
                </div>

                <div className="fuel-input-field">
                  <label>Preço ARLA 32 (R$/L)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={simulatorData.precoArla}
                    onChange={e => setSimulatorData({ ...simulatorData, precoArla: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* COLUNA DIREITA: RESULTADOS & COCKPIT ANALÍTICO */}
            <div className="simulator-cockpit-column">
              {/* 6 Cards de KPI da Simulação */}
              <div className="sim-kpi-cards-grid">
                <div className="sim-kpi-card">
                  <div className="sim-kpi-header">
                    <span className="sim-kpi-title">Diesel Necessário</span>
                    <Droplets size={16} color="#06b6d4" />
                  </div>
                  <div className="sim-kpi-val" style={{ color: '#38bdf8' }}>
                    {simCalculations.litrosDieselTotal} L
                  </div>
                  <span className="sim-kpi-sub">
                    {simCalculations.isCircuitoCompleto ? 'Circuito Ida e Volta' : 'Percurso do Trecho'}
                  </span>
                </div>

                <div className="sim-kpi-card">
                  <div className="sim-kpi-header">
                    <span className="sim-kpi-title">ARLA 32 Estimado</span>
                    <Droplets size={16} color="#3b82f6" />
                  </div>
                  <div className="sim-kpi-val" style={{ color: '#60a5fa' }}>
                    {simCalculations.litrosArlaTotal} L
                  </div>
                  <span className="sim-kpi-sub">5% do volume de diesel (SCR)</span>
                </div>

                <div className="sim-kpi-card">
                  <div className="sim-kpi-header">
                    <span className="sim-kpi-title">Custo Total Previsto</span>
                    <DollarSign size={16} color="#10b981" />
                  </div>
                  <div className="sim-kpi-val" style={{ color: '#34d399' }}>
                    R$ {Number(simCalculations.custoTotalMisto).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <span className="sim-kpi-sub">Diesel + ARLA 32 (Estratégia Base)</span>
                </div>

                <div className="sim-kpi-card">
                  <div className="sim-kpi-header">
                    <span className="sim-kpi-title">Custo por KM (CPK)</span>
                    <TrendingUp size={16} color="#f59e0b" />
                  </div>
                  <div className="sim-kpi-val" style={{ color: '#fbbf24' }}>
                    R$ {simCalculations.cpkMisto}
                  </div>
                  <span className="sim-kpi-sub">/ km rodado na rota</span>
                </div>

                <div className="sim-kpi-card">
                  <div className="sim-kpi-header">
                    <span className="sim-kpi-title">Autonomia Segura</span>
                    <Gauge size={16} color="#a855f7" />
                  </div>
                  <div className="sim-kpi-val" style={{ color: '#c084fc' }}>
                    {simCalculations.autonomiaSeguraKm} km
                  </div>
                  <span className="sim-kpi-sub">Com {simulatorData.reservaSegurancaPct}% reserva de segurança</span>
                </div>

                <div className="sim-kpi-card">
                  <div className="sim-kpi-header">
                    <span className="sim-kpi-title">Emissões de Carbono</span>
                    <Leaf size={16} color="#10b981" />
                  </div>
                  <div className="sim-kpi-val" style={{ color: '#10b981' }}>
                    {simCalculations.co2TotalTon} t
                  </div>
                  <span className="sim-kpi-sub">
                    {simulatorData.tipoCombustivel?.includes('HVO') ? `-${simCalculations.co2EvitadoTon} t evitadas (HVO Verde)` : 'Inventário GEE Escopo 1'}
                  </span>
                </div>
              </div>

              {/* Gráfico Visual de Telemetria de Nível do Tanque */}
              <div className="sim-telemetry-curve-box">
                <div className="telemetry-chart-header">
                  <div className="telemetry-chart-title">
                    <Gauge size={17} color="#10b981" />
                    <span>Curva Preditiva do Nível do Tanque ao Longo da Rota</span>
                  </div>
                  <div className="telemetry-legend">
                    <div className="telemetry-legend-item">
                      <span className="telemetry-legend-dot" style={{ background: '#10b981' }}></span>
                      <span>Nível Combustível</span>
                    </div>
                    <div className="telemetry-legend-item">
                      <span className="telemetry-legend-dot" style={{ background: '#f43f5e' }}></span>
                      <span>Linha Reserva ({simulatorData.reservaSegurancaPct}%)</span>
                    </div>
                  </div>
                </div>

                <div className="telemetry-svg-container">
                  <svg width="100%" height="100%" viewBox="0 0 800 170" preserveAspectRatio="none">
                    {/* Linha de Grade de 100%, 50% e 15% */}
                    <line x1="20" y1="35" x2="780" y2="35" stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" />
                    <text x="25" y="30" fill="#64748b" fontSize="10">100% Tanque Cheio</text>

                    <line x1="20" y1="85" x2="780" y2="85" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
                    <text x="25" y="80" fill="#64748b" fontSize="10">50% Meio Tanque</text>

                    <line x1="20" y1="125" x2="780" y2="125" stroke="rgba(244,63,94,0.3)" strokeDasharray="3 3" />
                    <text x="25" y="120" fill="#f43f5e" fontSize="10">Reserva de Segurança ({simulatorData.reservaSegurancaPct}%)</text>

                    {/* Curva de Consumo */}
                    <path
                      d={simCalculations.svgPathD}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Pontos de Parada / Reabastecimento */}
                    {simCalculations.svgPoints.map((pt, idx) => (
                      <g key={idx}>
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={idx === 0 || idx === simCalculations.svgPoints.length - 1 ? 6 : 5}
                          fill={pt.y >= 120 ? '#f59e0b' : '#38bdf8'}
                          stroke="#ffffff"
                          strokeWidth="2"
                        />
                        <text
                          x={pt.x}
                          y={pt.y - 10}
                          textAnchor="middle"
                          fill="#ffffff"
                          fontSize="10"
                          fontWeight="700"
                        >
                          {pt.km} km
                        </text>
                      </g>
                    ))}
                  </svg>
                </div>
              </div>

              {/* Linha do Tempo Visual de Paradas da Rota (Road Waypoints) */}
              <div className="sim-waypoints-container">
                <div className="sim-waypoints-title-row">
                  <div className="sim-waypoints-title">
                    <Compass size={18} color="#06b6d4" />
                    <span>Plano Operacional de Paradas na Rodovia ({simCalculations.numParadas} parada(s) recomendada(s))</span>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    Distância Total: <strong style={{ color: '#ffffff' }}>{simCalculations.distTotal} km</strong> • Tempo de Trânsito: ~<strong style={{ color: '#38bdf8' }}>{simCalculations.tempoViagemHoras}h</strong>
                  </span>
                </div>

                <div className="sim-waypoints-timeline">
                  {simCalculations.waypoints.map((wp, idx) => (
                    <div key={idx} className="sim-waypoint-item">
                      <div className={`sim-waypoint-badge ${wp.tipo}`}>
                        {idx + 1}
                      </div>
                      <div className="sim-waypoint-name">{wp.titulo}</div>
                      <div className="sim-waypoint-km">{wp.km} km</div>
                      <div className="sim-waypoint-fuel-level">{wp.dieselNoTanque}</div>
                      <span style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '3px' }}>{wp.subtitulo}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* DRE de Custos & Ponto de Cobertura */}
              <div className="sim-dre-box">
                <div className="sim-dre-title">
                  <DollarSign size={15} />
                  <span>DRE Analítica de Combustível da Viagem</span>
                </div>

                <div className="sim-dre-row">
                  <span style={{ color: '#94a3b8' }}>Diesel Abastecido na Base CCO:</span>
                  <strong style={{ color: '#ffffff' }}>R$ {Number(simCalculations.custoDieselBase).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                </div>

                {Number(simCalculations.custoDieselRodovia) > 0 && (
                  <div className="sim-dre-row">
                    <span style={{ color: '#94a3b8' }}>Diesel em Postos de Rodovia:</span>
                    <strong style={{ color: '#38bdf8' }}>R$ {Number(simCalculations.custoDieselRodovia).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                  </div>
                )}

                <div className="sim-dre-row">
                  <span style={{ color: '#94a3b8' }}>Agente Redutor ARLA 32:</span>
                  <strong style={{ color: '#60a5fa' }}>R$ {Number(simCalculations.custoArlaTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                </div>

                <div className="sim-dre-row">
                  <span style={{ color: '#94a3b8' }}>Custo Médio por Tonelada ({simulatorData.capacidadeCargaTon}t PBT):</span>
                  <strong style={{ color: '#fbbf24' }}>R$ {simCalculations.custoPorTon} / ton</strong>
                </div>

                <div className="sim-dre-row total">
                  <span style={{ color: '#34d399' }}>Custo Total Previsto da Operação:</span>
                  <span style={{ color: '#10b981' }}>R$ {Number(simCalculations.custoTotalMisto).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              {/* Comparativo de Estratégias Financeiras */}
              <div className="sim-comparison-box">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h4 style={{ margin: 0, fontSize: '0.92rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <BarChart3 size={16} color="#10b981" />
                    <span>Otimização Financeira: Estratégias de Compra de Combustível</span>
                  </h4>
                  {Number(simCalculations.economiaR$) > 0 && (
                    <span style={{ fontSize: '0.78rem', color: '#34d399', fontWeight: 700, background: 'rgba(16,185,129,0.12)', padding: '3px 8px', borderRadius: '6px' }}>
                      Economia de R$ {Number(simCalculations.economiaR$).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ({simCalculations.economiaPct}%)
                    </span>
                  )}
                </div>

                <table className="sim-comparison-table">
                  <thead>
                    <tr>
                      <th>Estratégia de Abastecimento</th>
                      <th>Preço Médio Diesel</th>
                      <th>Custo Previsto</th>
                      <th>CPK</th>
                      <th>Diferencial CCO</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="highlight-strategy">
                      <td>
                        <strong style={{ color: '#10b981' }}>Estratégia CCO Recomendada (Base + Rodovia)</strong>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Sai 100% abastecido na Base e reabastece apenas o necessário na rodovia</div>
                      </td>
                      <td>Ponderado</td>
                      <td><strong>R$ {Number(simCalculations.custoTotalMisto).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></td>
                      <td><span style={{ color: '#34d399', fontWeight: 700 }}>R$ {simCalculations.cpkMisto}</span></td>
                      <td><span style={{ color: '#10b981', fontWeight: 700 }}>Melhor Custo / Viabilidade</span></td>
                    </tr>
                    <tr>
                      <td>
                        <strong>100% Postos de Rodovia</strong>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Abastecimentos realizados integralmente ao preço de rodovia credenciada</div>
                      </td>
                      <td>R$ {Number(simulatorData.precoDieselPosto).toFixed(2)}</td>
                      <td>R$ {Number(simCalculations.custoTotal100Posto).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td>R$ {(Number(simCalculations.custoTotal100Posto) / simCalculations.distTotal).toFixed(2)}</td>
                      <td><span style={{ color: '#f43f5e' }}>+R$ {Number(simCalculations.economiaR$).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} mais caro</span></td>
                    </tr>
                    <tr>
                      <td>
                        <strong>Cenário Ideal 100% Base</strong>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Abastecimentos 100% em tanques internos de atacado Ambipar</div>
                      </td>
                      <td>R$ {Number(simulatorData.precoDieselBase).toFixed(2)}</td>
                      <td>R$ {Number(simCalculations.custoTotal100Base).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td>R$ {(Number(simCalculations.custoTotal100Base) / simCalculations.distTotal).toFixed(2)}</td>
                      <td><span style={{ color: '#38bdf8' }}>Menor custo teórico</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : viewMode === 'ranking' ? (
        /* VIEW 2: AUDITORIA / RANKING DE EFICIÊNCIA DA FROTA */
        <div className="fleet-audit-panel animate-fade-in">
          <div className="fleet-audit-header">
            <div>
              <div className="fleet-audit-title">
                <Award size={20} color="#10b981" />
                <span>Auditoria de Desempenho & Eficiência por Placa (Ranking da Frota)</span>
              </div>
              <p style={{ fontSize: '0.84rem', color: '#94a3b8', margin: '0.25rem 0 0 0' }}>
                Acompanhamento consolidado do rendimento médio (km/l) e custo por quilômetro rodado por conjunto mecânico:
              </p>
            </div>

            <button
              type="button"
              className="fuel-btn fuel-btn-secondary"
              onClick={handleExportCSV}
              title="Exportar dados consolidados em planilha Excel"
            >
              <Download size={15} />
              <span>Exportar Excel (CSV)</span>
            </button>
          </div>

          {fleetRanking.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
              <Truck size={42} color="#10b981" style={{ opacity: 0.5, marginBottom: '0.75rem' }} />
              <p>Nenhum abastecimento registrado para apuração de ranking.</p>
              <button
                type="button"
                className="fuel-btn fuel-btn-primary"
                onClick={handleOpenCreateForm}
              >
                + Lançar Primeiro Abastecimento
              </button>
            </div>
          ) : (
            <div className="fleet-audit-grid">
              {fleetRanking.map((v, i) => (
                <div key={v.placa} className="fleet-audit-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#38bdf8' }}>#{i + 1}</span>
                      <div className="fuel-plate-badge">{v.placa}</div>
                    </div>
                    <span 
                      className={`fuel-efficiency-badge ${v.meta.status}`}
                      style={{ fontSize: '0.72rem' }}
                    >
                      {v.kmPorLitro > 0 ? `${v.kmPorLitro} km/l` : 'Sem KM'}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.76rem', color: '#94a3b8', margin: '0.5rem 0 0.2rem 0' }}>
                    {v.modelo}
                  </div>

                  {/* Barra de Progresso de Eficiência */}
                  <div className="fleet-progress-bar-bg">
                    <div 
                      className="fleet-progress-bar-fill" 
                      style={{ 
                        width: `${Math.min(100, Math.max(10, (v.kmPorLitro / 3.0) * 100))}%`,
                        background: v.meta.color
                      }}
                    ></div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem', textAlign: 'center', marginTop: '0.65rem', background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: '6px' }}>
                    <div>
                      <span style={{ fontSize: '0.65rem', color: '#64748b', display: 'block' }}>TOTAL PAGO</span>
                      <strong style={{ fontSize: '0.8rem', color: '#10b981' }}>R$ {Math.round(v.totalValor)}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.65rem', color: '#64748b', display: 'block' }}>VOLUME</span>
                      <strong style={{ fontSize: '0.8rem', color: '#ffffff' }}>{Math.round(v.totalLitros)} L</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.65rem', color: '#64748b', display: 'block' }}>CPK MÉDIO</span>
                      <strong style={{ fontSize: '0.8rem', color: '#fbbf24' }}>{v.cpk > 0 ? `R$ ${v.cpk}` : '—'}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : viewMode === 'form' ? (
        /* VIEW 3: FORMULÁRIO DE LANÇAMENTO */
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
        /* VIEW 4: EXTRATO & GESTÃO DE ABASTECIMENTOS (TABELA / CARDS) */
        <>
          {/* Grid de KPIs Operacionais (5 Colunas) */}
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

          {/* Abas Rápidas no Topo */}
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

          {/* Barra de Filtros & Busca */}
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

              <button
                type="button"
                className="fuel-btn fuel-btn-secondary"
                onClick={handleExportCSV}
                title="Exportar dados filtrados para Excel / CSV"
                style={{ padding: '0.55rem 0.85rem', fontSize: '0.82rem' }}
              >
                <Download size={14} />
                <span>Exportar CSV</span>
              </button>

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

          {/* Empty State Limpo */}
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
            /* Modo Tabela Operacional */
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
            /* Modo Cards de Ticket */
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

      {/* MODAL 1: TICKET FISCAL DE ABASTECIMENTO */}
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

      {/* MODAL 2: ORDEM DE ABASTECIMENTO PARA O MOTORISTA */}
      {showDispatchOrderModal && (
        <div className="fuel-modal-backdrop animate-fade-in" onClick={() => setShowDispatchOrderModal(false)}>
          <div className="fuel-modal-dialog" onClick={e => e.stopPropagation()} style={{ maxWidth: '650px' }}>
            <div className="fuel-modal-header">
              <h4>
                <ShieldCheck size={18} color="#10b981" />
                <span>Ordem de Abastecimento & Despacho CCO</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowDispatchOrderModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div className="fuel-modal-body" id="printable-dispatch-order">
              <div style={{ border: '2px dashed rgba(16, 185, 129, 0.4)', borderRadius: '12px', padding: '1.5rem', background: 'rgba(0,0,0,0.35)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                  <div>
                    <h5 style={{ margin: 0, color: '#ffffff', fontSize: '1.15rem' }}>AMBIPAR LOGISTICS • CCO</h5>
                    <span style={{ fontSize: '0.72rem', color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Autorização Operacional de Abastecimento</span>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#94a3b8' }}>
                    <div>Ref: <strong>AUT-{Math.floor(100000 + Math.random() * 900000)}</strong></div>
                    <div>Data: {new Date().toLocaleDateString('pt-BR')}</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.82rem', marginBottom: '1rem' }}>
                  <div>
                    <span style={{ color: '#94a3b8' }}>Origem:</span>
                    <div style={{ color: '#ffffff', fontWeight: 600 }}>{simulatorData.origem}</div>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8' }}>Destino:</span>
                    <div style={{ color: '#ffffff', fontWeight: 600 }}>{simulatorData.destino}</div>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8' }}>Distância Total:</span>
                    <div style={{ color: '#38bdf8', fontWeight: 700 }}>{simCalculations.distTotal} km</div>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8' }}>Conjunto / Veículo:</span>
                    <div style={{ color: '#ffffff', fontWeight: 600 }}>{simulatorData.veiculoTipo}</div>
                  </div>
                </div>

                <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '8px', padding: '0.85rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Diesel Total Autorizado:</span>
                    <strong style={{ color: '#10b981', fontSize: '1rem' }}>{simCalculations.litrosDieselTotal} Litros</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>ARLA 32 Autorizado:</span>
                    <strong style={{ color: '#38bdf8', fontSize: '1rem' }}>{simCalculations.litrosArlaTotal} Litros</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Teto de Gastos Previsto:</span>
                    <strong style={{ color: '#fbbf24', fontSize: '1.05rem' }}>R$ {Number(simCalculations.custoTotalMisto).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                  </div>
                </div>

                <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '1.25rem' }}>
                  <strong style={{ color: '#ffffff' }}>Instruções ao Condutor:</strong>
                  <ul style={{ margin: '0.35rem 0 0 1rem', padding: 0 }}>
                    <li>Abastecer obrigatoriamente na Rede de Postos Credenciados (Ticket Log / Good Card / Sem Parar).</li>
                    <li>Exigir Cupom Fiscal / NF-e com placa do cavalo e hodômetro impresso.</li>
                    <li>Não deixar o nível do tanque baixar além dos {simulatorData.reservaSegurancaPct}% de reserva técnica.</li>
                  </ul>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8' }}>
                  <div>
                    <div style={{ borderTop: '1px solid #64748b', paddingTop: '4px' }}>Analista CCO Responsável</div>
                  </div>
                  <div>
                    <div style={{ borderTop: '1px solid #64748b', paddingTop: '4px' }}>Assinatura do Condutor MOPP</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="fuel-modal-footer">
              <button
                type="button"
                className="fuel-btn fuel-btn-secondary"
                onClick={() => window.print()}
              >
                <Printer size={15} />
                <span>Imprimir Ordem</span>
              </button>
              <button
                type="button"
                className="fuel-btn fuel-btn-primary"
                onClick={() => setShowDispatchOrderModal(false)}
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
