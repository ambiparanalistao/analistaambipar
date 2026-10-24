import React, { useState } from 'react';
import { 
  Wrench, 
  Gauge, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Truck, 
  Calendar, 
  Plus, 
  Search, 
  Filter, 
  ArrowLeft, 
  Check, 
  Save, 
  FileText, 
  Printer, 
  DollarSign, 
  ShieldAlert, 
  Flame, 
  ChevronRight,
  TrendingUp,
  Layers,
  History,
  Info
} from 'lucide-react';
import { 
  PREVENTIVE_RULES, 
  INITIAL_VEHICLE_MAINTENANCE_STATUS, 
  INITIAL_SERVICE_ORDERS_HISTORY,
  WORKSHOP_OPTIONS 
} from '../data/preventiveMaintenanceData';

export default function PreventiveMaintenanceModule({ user, onNavigateFleet }) {
  // Controle de Tela Inteira: 'overview' | 'record_service' | 'update_km' | 'history'
  const [viewMode, setViewMode] = useState('overview');
  const [selectedVehicleForAction, setSelectedVehicleForAction] = useState(null);

  // Estado dos Veículos e Manutenções (Persistido no localStorage)
  const [vehicles, setVehicles] = useState(() => {
    try {
      const saved = localStorage.getItem('ambipar_preventive_maintenance_v1');
      return saved ? JSON.parse(saved) : INITIAL_VEHICLE_MAINTENANCE_STATUS;
    } catch {
      return INITIAL_VEHICLE_MAINTENANCE_STATUS;
    }
  });

  // Histórico de Ordens de Serviço (OSs)
  const [serviceHistory, setServiceHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('ambipar_service_orders_history_v1');
      return saved ? JSON.parse(saved) : INITIAL_SERVICE_ORDERS_HISTORY;
    } catch {
      return INITIAL_SERVICE_ORDERS_HISTORY;
    }
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos'); // 'Todos' | 'Criticos' | 'Atencao' | 'EmDia'
  const [feedback, setFeedback] = useState(null);

  // Formulário de Baixa de Preventiva em Tela Cheia
  const [serviceForm, setServiceForm] = useState({
    placa: '',
    servico_tipo: 'oleo_filtros',
    oficina: 'EIVA Manutenção Pesada',
    os_numero: '',
    data: new Date().toISOString().split('T')[0],
    km_execucao: '',
    horimetro_pto: '',
    valor_pecas: '',
    valor_mao_obra: '',
    tecnico_responsavel: '',
    nf_numero: '',
    observacoes: ''
  });

  // Formulário de Atualização de Odômetro em Tela Cheia
  const [kmForm, setKmForm] = useState({
    placa: '',
    odometro_novo: '',
    horimetro_pto_novo: ''
  });

  // Salva no localStorage
  const saveVehiclesState = (updatedList) => {
    setVehicles(updatedList);
    try {
      localStorage.setItem('ambipar_preventive_maintenance_v1', JSON.stringify(updatedList));
    } catch (e) {
      console.warn(e);
    }
  };

  const saveHistoryState = (updatedHistory) => {
    setServiceHistory(updatedHistory);
    try {
      localStorage.setItem('ambipar_service_orders_history_v1', JSON.stringify(updatedHistory));
    } catch (e) {
      console.warn(e);
    }
  };

  // Cálculo de Vida Útil e Status por Serviço
  const calculateServiceStatus = (vehicle, rule) => {
    const s = vehicle.servicos[rule.id] || { ultimo_km: 0, ultima_data: '2026-01-01' };
    const kmRodado = vehicle.odometro_atual - s.ultimo_km;
    const kmRestante = Math.max(0, rule.intervalo_km - kmRodado);
    const pctConsumido = Math.min(100, Math.round((kmRodado / rule.intervalo_km) * 100));

    let estado = 'NORMAL'; // 'NORMAL' | 'ATENCAO' | 'CRITICO'
    if (kmRestante <= 0 || kmRodado >= rule.intervalo_km) {
      estado = 'CRITICO';
    } else if (kmRestante <= rule.aviso_antecipado_km) {
      estado = 'ATENCAO';
    }

    return {
      kmRodado,
      kmRestante,
      pctConsumido,
      estado,
      ultimoKm: s.ultimo_km,
      ultimaData: s.ultima_data,
      oficina: s.oficina,
      osNumero: s.os_numero
    };
  };

  // Resumo Geral da Frota
  const fleetAnalytics = vehicles.map(v => {
    const statuses = PREVENTIVE_RULES.map(r => ({
      rule: r,
      status: calculateServiceStatus(v, r)
    }));

    const temCritico = statuses.some(s => s.status.estado === 'CRITICO');
    const temAtencao = statuses.some(s => s.status.estado === 'ATENCAO');

    let overallState = 'EM_DIA';
    if (temCritico) overallState = 'CRITICO';
    else if (temAtencao) overallState = 'ATENCAO';

    // Encontra o serviço mais próximo de vencer
    const maisProximo = [...statuses].sort((a, b) => a.status.kmRestante - b.status.kmRestante)[0];

    return {
      vehicle: v,
      statuses,
      overallState,
      maisProximo
    };
  });

  // KPIs
  const totalVeiculos = vehicles.length;
  const countCriticos = fleetAnalytics.filter(f => f.overallState === 'CRITICO').length;
  const countAtencao = fleetAnalytics.filter(f => f.overallState === 'ATENCAO').length;
  const countEmDia = fleetAnalytics.filter(f => f.overallState === 'EM_DIA').length;
  const totalGastoOS = serviceHistory.reduce((acc, curr) => acc + (Number(curr.valor_total) || 0), 0);

  // Alerta Crítico Mais Urgente da Frota
  const maisUrgenteDaFrota = [...fleetAnalytics]
    .filter(f => f.maisProximo)
    .sort((a, b) => a.maisProximo.status.kmRestante - b.maisProximo.status.kmRestante)[0];

  // Filtros de Busca
  const filteredFleet = fleetAnalytics.filter(f => {
    const s = searchTerm.toLowerCase();
    const matchSearch = (
      f.vehicle.placa.toLowerCase().includes(s) ||
      f.vehicle.modelo.toLowerCase().includes(s) ||
      f.vehicle.operacao.toLowerCase().includes(s)
    );

    let matchStatus = true;
    if (statusFilter === 'Criticos') matchStatus = f.overallState === 'CRITICO';
    if (statusFilter === 'Atencao') matchStatus = f.overallState === 'ATENCAO';
    if (statusFilter === 'EmDia') matchStatus = f.overallState === 'EM_DIA';

    return matchSearch && matchStatus;
  });

  // Abrir Formulário de Baixa de Serviço em Tela Cheia
  const handleOpenRecordService = (vehicle, ruleId = 'oleo_filtros') => {
    setSelectedVehicleForAction(vehicle);
    setServiceForm({
      placa: vehicle.placa,
      servico_tipo: ruleId,
      oficina: 'EIVA Manutenção Pesada',
      os_numero: `OS-${Math.floor(10000 + Math.random() * 90000)}`,
      data: new Date().toISOString().split('T')[0],
      km_execucao: vehicle.odometro_atual,
      horimetro_pto: vehicle.horimetro_pto,
      valor_pecas: '1850.00',
      valor_mao_obra: '650.00',
      tecnico_responsavel: 'Mecânico Chefe',
      nf_numero: `NF-e ${Math.floor(10000 + Math.random() * 90000)}`,
      observacoes: 'Substituição preventiva concluída com êxito conforme plano CCO.'
    });
    setViewMode('record_service');
  };

  // Abrir Formulário de Atualização de Odômetro em Tela Cheia
  const handleOpenUpdateKm = (vehicle) => {
    setSelectedVehicleForAction(vehicle);
    setKmForm({
      placa: vehicle.placa,
      odometro_novo: vehicle.odometro_atual,
      horimetro_pto_novo: vehicle.horimetro_pto || 0
    });
    setViewMode('update_km');
  };

  // Submeter Registro de Baixa de Preventiva
  const handleSubmitService = (e) => {
    e.preventDefault();
    if (!serviceForm.placa || !serviceForm.os_numero || !serviceForm.km_execucao) {
      alert('Preencha os campos obrigatórios da Ordem de Serviço.');
      return;
    }

    const kmExec = Number(serviceForm.km_execucao);
    const rule = PREVENTIVE_RULES.find(r => r.id === serviceForm.servico_tipo);
    const vTotal = (Number(serviceForm.valor_pecas) || 0) + (Number(serviceForm.valor_mao_obra) || 0);

    // 1. Atualiza o status do veículo resetando o KM do serviço específico
    const updatedVehicles = vehicles.map(v => {
      if (v.placa !== serviceForm.placa) return v;

      return {
        ...v,
        odometro_atual: Math.max(v.odometro_atual, kmExec),
        horimetro_pto: Number(serviceForm.horimetro_pto) || v.horimetro_pto,
        servicos: {
          ...v.servicos,
          [serviceForm.servico_tipo]: {
            ultimo_km: kmExec,
            ultima_data: serviceForm.data,
            oficina: serviceForm.oficina,
            os_numero: serviceForm.os_numero
          }
        }
      };
    });

    // 2. Adiciona ao histórico de OSs
    const newOs = {
      id: serviceForm.os_numero,
      data: serviceForm.data,
      placa: serviceForm.placa,
      modelo: selectedVehicleForAction?.modelo || 'Caminhão Frota',
      servico_tipo: serviceForm.servico_tipo,
      servico_nome: rule?.nome || 'Manutenção Preventiva',
      oficina: serviceForm.oficina,
      km_execucao: kmExec,
      valor_pecas: Number(serviceForm.valor_pecas) || 0,
      valor_mao_obra: Number(serviceForm.valor_mao_obra) || 0,
      valor_total: vTotal,
      tecnico_responsavel: serviceForm.tecnico_responsavel,
      nf_numero: serviceForm.nf_numero,
      observacoes: serviceForm.observacoes
    };

    saveVehiclesState(updatedVehicles);
    saveHistoryState([newOs, ...serviceHistory]);

    setFeedback({
      type: 'success',
      text: `Preventiva "${rule?.nome}" registrada com sucesso para o veículo ${serviceForm.placa} (OS ${serviceForm.os_numero}). Ciclo de KM reiniciado!`
    });
    setTimeout(() => setFeedback(null), 5000);
    setViewMode('overview');
  };

  // Submeter Atualização de Odômetro
  const handleSubmitKm = (e) => {
    e.preventDefault();
    const novoKm = Number(kmForm.odometro_novo);
    if (!novoKm || novoKm <= 0) {
      alert('Informe uma quilometragem válida.');
      return;
    }

    const updated = vehicles.map(v => {
      if (v.placa !== kmForm.placa) return v;
      return {
        ...v,
        odometro_atual: novoKm,
        horimetro_pto: Number(kmForm.horimetro_pto_novo) || v.horimetro_pto
      };
    });

    saveVehiclesState(updated);
    setFeedback({
      type: 'success',
      text: `Odômetro do veículo ${kmForm.placa} atualizado para ${novoKm.toLocaleString('pt-BR')} km. Todas as barras de vida útil foram recalculadas!`
    });
    setTimeout(() => setFeedback(null), 5000);
    setViewMode('overview');
  };

  // =========================================================================
  // MODO 1: TELA INTEIRA DE BAIXA DE PREVENTIVA / ORDEM DE SERVIÇO (SEM POP-UP)
  // =========================================================================
  if (viewMode === 'record_service' && selectedVehicleForAction) {
    const currentRule = PREVENTIVE_RULES.find(r => r.id === serviceForm.servico_tipo);
    return (
      <div className="maintenance-form-fullscreen animate-fade-in" style={{ padding: '0.5rem 0' }}>
        {/* Top Header da Tela Cheia */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                onClick={() => setViewMode('overview')}
              >
                <ArrowLeft size={14} />
                <span>Voltar ao Quadro Geral</span>
              </button>
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-amber)', fontWeight: 800, background: 'rgba(245, 158, 11, 0.12)', padding: '2px 8px', borderRadius: '4px' }}>
                BAIXA DE PREVENTIVA & ORDEM DE SERVIÇO
              </span>
            </div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
              Registrar Execução de Preventiva: {selectedVehicleForAction.placa}
            </h2>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.85rem' }}>
              {selectedVehicleForAction.modelo} • {selectedVehicleForAction.operacao} • Odômetro Atual: {selectedVehicleForAction.odometro_atual.toLocaleString('pt-BR')} km
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setViewMode('overview')}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn-primary btn-icon-text"
              onClick={handleSubmitService}
              style={{ background: 'var(--accent-emerald)', borderColor: 'var(--accent-emerald)', color: '#070b12', fontWeight: 700 }}
            >
              <Check size={16} />
              <span>Confirmar Baixa & Zerar Ciclo</span>
            </button>
          </div>
        </div>

        {/* Layout em Duas Colunas da Tela Cheia */}
        <form onSubmit={handleSubmitService} style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) minmax(420px, 1.2fr)', gap: '1.5rem' }}>
          {/* Coluna 1: Dados do Serviço e Oficina */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="card-panel" style={{ background: '#0e1524' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Wrench size={18} />
                <span>1. Tipo de Preventiva & Oficina Executante</span>
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                    Serviço de Manutenção a ser Baixado: *
                  </label>
                  <select
                    value={serviceForm.servico_tipo}
                    onChange={(e) => setServiceForm({ ...serviceForm, servico_tipo: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem 0.85rem', background: '#070b12', border: '1px solid rgba(6, 182, 212, 0.4)', borderRadius: '6px', color: '#fff', fontSize: '0.9rem', fontWeight: 700 }}
                  >
                    {PREVENTIVE_RULES.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.nome} (Intervalo: {r.intervalo_km.toLocaleString('pt-BR')} km)
                      </option>
                    ))}
                  </select>
                  {currentRule && (
                    <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '0.35rem', lineHeight: '1.4' }}>
                      📋 {currentRule.descricao}
                    </small>
                  )}
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                    Oficina Homologada / Prestador de Serviço: *
                  </label>
                  <select
                    value={serviceForm.oficina}
                    onChange={(e) => setServiceForm({ ...serviceForm, oficina: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#070b12', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
                  >
                    {WORKSHOP_OPTIONS.map(w => (
                      <option key={w.value} value={w.value}>
                        {w.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                      Nº da Ordem de Serviço (OS): *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: OS-15580"
                      value={serviceForm.os_numero}
                      onChange={(e) => setServiceForm({ ...serviceForm, os_numero: e.target.value })}
                      style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#070b12', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: '#fff', fontSize: '0.9rem', fontWeight: 700 }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                      Data da Execução: *
                    </label>
                    <input
                      type="date"
                      required
                      value={serviceForm.data}
                      onChange={(e) => setServiceForm({ ...serviceForm, data: e.target.value })}
                      style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#070b12', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: '#fff', fontSize: '0.9rem' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Painel de Custos da OS */}
            <div className="card-panel" style={{ background: '#0e1524' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-emerald)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <DollarSign size={18} />
                <span>2. Apropriação Financeira da Manutenção</span>
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                    Valor Peças & Filtros (R$):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ex: 1850.00"
                    value={serviceForm.valor_pecas}
                    onChange={(e) => setServiceForm({ ...serviceForm, valor_pecas: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#070b12', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: '#fff', fontSize: '0.9rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                    Valor Mão de Obra (R$):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ex: 650.00"
                    value={serviceForm.valor_mao_obra}
                    onChange={(e) => setServiceForm({ ...serviceForm, valor_mao_obra: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#070b12', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: '#fff', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                  Nota Fiscal Eletrônica (NF-e):
                </label>
                <input
                  type="text"
                  placeholder="Ex: NF-e 88410 (Chave ou número da nota)"
                  value={serviceForm.nf_numero}
                  onChange={(e) => setServiceForm({ ...serviceForm, nf_numero: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#070b12', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>
            </div>
          </div>

          {/* Coluna 2: Apontamento de KM e Diagnóstico Técnico */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="card-panel" style={{ background: '#0e1524' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-amber)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Gauge size={18} />
                <span>3. Odômetro na Execução & Responsável Técnico</span>
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                    Odômetro no Momento da Troca (KM): *
                  </label>
                  <input
                    type="number"
                    required
                    value={serviceForm.km_execucao}
                    onChange={(e) => setServiceForm({ ...serviceForm, km_execucao: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#070b12', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'var(--accent-emerald)', fontSize: '1.05rem', fontWeight: 800 }}
                  />
                  <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>
                    Odômetro anterior registrado: {selectedVehicleForAction.odometro_atual.toLocaleString('pt-BR')} km
                  </small>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                    Horímetro PTO (Tomada de Força):
                  </label>
                  <input
                    type="number"
                    value={serviceForm.horimetro_pto}
                    onChange={(e) => setServiceForm({ ...serviceForm, horimetro_pto: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#070b12', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: '#fff', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                  Técnico / Mecânico Responsável:
                </label>
                <input
                  type="text"
                  placeholder="Ex: Carlos Mecânico / Chefe de Oficina EIVA"
                  value={serviceForm.tecnico_responsavel}
                  onChange={(e) => setServiceForm({ ...serviceForm, tecnico_responsavel: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#070b12', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                  Anotações Técnicas / Peças Substituídas:
                </label>
                <textarea
                  rows={4}
                  placeholder="Ex: Trocado elemento do filtro Racor, dreno de água do Diesel S10, verificado nível de óleo do câmbio e lubrificados os pinos de articulação do poliguindaste."
                  value={serviceForm.observacoes}
                  onChange={(e) => setServiceForm({ ...serviceForm, observacoes: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#070b12', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem', resize: 'vertical' }}
                />
              </div>
            </div>

            {/* Aviso de Reinício de Ciclo */}
            <div className="card-panel" style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                <CheckCircle2 size={18} color="var(--accent-emerald)" />
                <strong style={{ fontSize: '0.85rem', color: 'var(--accent-emerald)' }}>Efeito Imediato no Sistema:</strong>
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                Ao confirmar, a quilometragem do serviço <strong>{currentRule?.nome}</strong> será redefinida para {Number(serviceForm.km_execucao || 0).toLocaleString('pt-BR')} km. A barra de vida útil deste veículo voltará para 100% (Verde) e os próximos {currentRule?.intervalo_km.toLocaleString('pt-BR')} km começarão a ser monitorados automaticamente.
              </p>
            </div>
          </div>
        </form>
      </div>
    );
  }

  // =========================================================================
  // MODO 2: TELA INTEIRA DE ATUALIZAÇÃO DE ODÔMETRO (SEM POP-UP)
  // =========================================================================
  if (viewMode === 'update_km' && selectedVehicleForAction) {
    return (
      <div className="maintenance-update-km-fullscreen animate-fade-in" style={{ padding: '0.5rem 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                onClick={() => setViewMode('overview')}
              >
                <ArrowLeft size={14} />
                <span>Voltar ao Quadro</span>
              </button>
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 800, background: 'rgba(6, 182, 212, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                APONTAMENTO DE QUILOMETRAGEM CCO
              </span>
            </div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
              Atualizar Odômetro & Horímetro: {selectedVehicleForAction.placa}
            </h2>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.85rem' }}>
              {selectedVehicleForAction.modelo} • {selectedVehicleForAction.operacao}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setViewMode('overview')}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn-primary btn-icon-text"
              onClick={handleSubmitKm}
              style={{ background: 'var(--accent-cyan)', borderColor: 'var(--accent-cyan)', color: '#070b12', fontWeight: 700 }}
            >
              <Check size={16} />
              <span>Salvar Novo KM & Recalcular Barras</span>
            </button>
          </div>
        </div>

        <div className="card-panel" style={{ maxWidth: '600px', background: '#0e1524', margin: '0 auto' }}>
          <form onSubmit={handleSubmitKm}>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                Odômetro Atual Registrado no Painel do Caminhão (KM): *
              </label>
              <input
                type="number"
                required
                value={kmForm.odometro_novo}
                onChange={(e) => setKmForm({ ...kmForm, odometro_novo: e.target.value })}
                style={{ width: '100%', padding: '0.75rem 1rem', background: '#070b12', border: '1px solid rgba(6, 182, 212, 0.4)', borderRadius: '8px', color: 'var(--accent-cyan)', fontSize: '1.3rem', fontWeight: 800 }}
              />
              <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '0.35rem' }}>
                Último registro no sistema: {selectedVehicleForAction.odometro_atual.toLocaleString('pt-BR')} km
              </small>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                Horímetro da Tomada de Força (PTO Horas):
              </label>
              <input
                type="number"
                value={kmForm.horimetro_pto_novo}
                onChange={(e) => setKmForm({ ...kmForm, horimetro_pto_novo: e.target.value })}
                style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#070b12', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: '#fff', fontSize: '1rem' }}
              />
              <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '0.35rem' }}>
                Relevante para caminhões poli-guindaste e roll-on com acionamento hidráulico contínuo.
              </small>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setViewMode('overview')}
              >
                Voltar
              </button>
              <button
                type="submit"
                className="btn-primary"
                style={{ background: 'var(--accent-cyan)', borderColor: 'var(--accent-cyan)', color: '#070b12', fontWeight: 700 }}
              >
                Confirmar Atualização
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // =========================================================================
  // MODO 3: TELA INTEIRA DE HISTÓRICO DE ORDENS DE SERVIÇO (SEM POP-UP)
  // =========================================================================
  if (viewMode === 'history') {
    return (
      <div className="maintenance-history-fullscreen animate-fade-in" style={{ padding: '0.5rem 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                onClick={() => setViewMode('overview')}
              >
                <ArrowLeft size={14} />
                <span>Voltar ao Quadro</span>
              </button>
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', fontWeight: 800, background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                HISTÓRICO DE ORDENS DE SERVIÇO
              </span>
            </div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
              Histórico Consolidado de Manutenções da Frota ({serviceHistory.length} OSs)
            </h2>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.85rem' }}>
              Registro auditável de todas as revisões preventivas executadas na Autotec, EIVA e Base DCX.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              className="btn-secondary btn-icon-text"
              onClick={() => window.print()}
            >
              <Printer size={16} />
              <span>Imprimir Relatório</span>
            </button>
          </div>
        </div>

        <div className="card-panel" style={{ background: '#0e1524', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: 'var(--text-muted)', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem 0.5rem' }}>Nº OS</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Data</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Placa</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Serviço Preventivo</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Oficina Executante</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>KM da Troca</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Valor Total</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>NF-e</th>
              </tr>
            </thead>
            <tbody>
              {serviceHistory.map(os => (
                <tr key={os.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <td style={{ padding: '0.75rem 0.5rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>{os.id}</td>
                  <td style={{ padding: '0.75rem 0.5rem', color: '#fff' }}>{os.data}</td>
                  <td style={{ padding: '0.75rem 0.5rem' }}>
                    <span style={{ background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan)', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>
                      {os.placa}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 0.5rem', color: '#fff' }}>{os.servico_nome}</td>
                  <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)' }}>{os.oficina}</td>
                  <td style={{ padding: '0.75rem 0.5rem', color: 'var(--accent-emerald)', fontWeight: 700 }}>{os.km_execucao?.toLocaleString('pt-BR')} km</td>
                  <td style={{ padding: '0.75rem 0.5rem', color: '#fff', fontWeight: 700 }}>
                    R$ {Number(os.valor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-dim)' }}>{os.nf_numero || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // =========================================================================
  // MODO 4: QUADRO GERAL DE PREVENTIVA & ODÔMETRO (VISÃO PRINCIPAL)
  // =========================================================================
  return (
    <div className="preventive-maintenance-module animate-fade-in" style={{ padding: '0.5rem 0' }}>
      {/* Banner Superior da Torre CCO */}
      <div className="control-tower-banner" style={{ background: 'linear-gradient(135deg, rgba(14, 21, 36, 0.95) 0%, rgba(10, 15, 29, 0.98) 100%)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
        <div className="tower-header-text">
          <div className="tower-badge-live" style={{ background: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.3)', color: 'var(--accent-amber)' }}>
            <span className="live-dot" style={{ background: 'var(--accent-amber)' }}></span>
            <span>MANUTENÇÃO PREVENTIVA & CONTROLE DE ODÔMETRO • CCO AMBIPAR 2026</span>
          </div>
          <h2>Plano Preventivo por KM & Barras de Vida Útil da Frota</h2>
          <p>
            Monitoramento antecipado de vida útil para evitar quebras de caminhões em rota: Troca de óleo/filtros a cada 15.000 km (ou 250h PTO), engraxamento de articulações de poli a cada 5.000 km e freios a cada 30.000 km.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button 
            type="button" 
            className="btn-secondary btn-icon-text"
            onClick={() => setViewMode('history')}
            style={{ padding: '0.55rem 1rem', fontSize: '0.85rem' }}
          >
            <History size={16} />
            <span>Histórico de OSs ({serviceHistory.length})</span>
          </button>

          <button 
            type="button" 
            className="btn-primary btn-icon-text"
            onClick={() => handleOpenRecordService(vehicles[0])}
            style={{ background: 'var(--accent-amber)', borderColor: 'var(--accent-amber)', color: '#070b12', fontWeight: 800 }}
          >
            <Plus size={16} />
            <span>+ Lançar / Baixar Preventiva (OS)</span>
          </button>
        </div>
      </div>

      {/* Alerta Dinâmico do Veículo Mais Próximo da Revisão */}
      {maisUrgenteDaFrota && maisUrgenteDaFrota.maisProximo && (
        <div 
          style={{
            marginTop: '1.25rem',
            padding: '1rem 1.25rem',
            borderRadius: '10px',
            background: maisUrgenteDaFrota.maisProximo.status.kmRestante <= 500 ? 'rgba(244, 63, 94, 0.12)' : 'rgba(245, 158, 11, 0.12)',
            border: `1px solid ${maisUrgenteDaFrota.maisProximo.status.kmRestante <= 500 ? 'rgba(244, 63, 94, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              background: maisUrgenteDaFrota.maisProximo.status.kmRestante <= 500 ? 'var(--accent-rose)' : 'var(--accent-amber)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#070b12'
            }}>
              <AlertTriangle size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <strong style={{ fontSize: '0.95rem', color: '#fff' }}>
                  Alerta Preditivo CCO: Faltam apenas {maisUrgenteDaFrota.maisProximo.status.kmRestante.toLocaleString('pt-BR')} km para a revisão do veículo {maisUrgenteDaFrota.vehicle.placa}!
                </strong>
                <span style={{ fontSize: '0.72rem', background: 'rgba(0,0,0,0.4)', padding: '2px 8px', borderRadius: '4px', color: 'var(--accent-amber)' }}>
                  {maisUrgenteDaFrota.maisProximo.rule.nome}
                </span>
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Veículo {maisUrgenteDaFrota.vehicle.modelo} ({maisUrgenteDaFrota.vehicle.operacao}). Agende a preventiva na EIVA ou oficina interna DCX para evitar quebras em viagem com carga.
              </span>
            </div>
          </div>

          <button
            type="button"
            className="btn-primary btn-icon-text"
            onClick={() => handleOpenRecordService(maisUrgenteDaFrota.vehicle, maisUrgenteDaFrota.maisProximo.rule.id)}
            style={{ background: 'var(--accent-amber)', borderColor: 'var(--accent-amber)', color: '#070b12', fontWeight: 700, padding: '0.45rem 1rem', fontSize: '0.8rem' }}
          >
            <Wrench size={14} />
            <span>Agendar / Baixar Esta Revisão</span>
          </button>
        </div>
      )}

      {/* Feedback Toast */}
      {feedback && (
        <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: '8px', color: 'var(--accent-emerald)', fontSize: '0.85rem' }}>
          ✓ {feedback.text}
        </div>
      )}

      {/* Grid de KPIs do Topo */}
      <div className="kpi-metrics-grid" style={{ marginTop: '1.25rem' }}>
        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-title">Veículos Monitorados</span>
            <div className="kpi-icon-wrap cyan">
              <Truck size={20} />
            </div>
          </div>
          <div className="kpi-main-val">
            <span className="val-number">{totalVeiculos}</span>
            <span className="unit-suffix">caminhões</span>
          </div>
          <div className="kpi-formula-tag">
            <code>Frota Base DCX, Vale & Amazon</code>
          </div>
          <div className="kpi-footer-status positive">
            <span>100% com regras de KM ativas</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-title">Revisões Próximas (&lt; 1.000 km)</span>
            <div className="kpi-icon-wrap amber">
              <Clock size={20} />
            </div>
          </div>
          <div className="kpi-main-val">
            <span className="val-number" style={{ color: 'var(--accent-amber)' }}>{countAtencao}</span>
            <span className="unit-suffix">em alerta</span>
          </div>
          <div className="kpi-formula-tag">
            <code>Janela de agendamento CCO</code>
          </div>
          <div className="kpi-footer-status warning">
            <span>Evitar paradas em rota com carga</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-title">Revisões Críticas / Vencidas</span>
            <div className="kpi-icon-wrap rose">
              <ShieldAlert size={20} />
            </div>
          </div>
          <div className="kpi-main-val">
            <span className="val-number" style={{ color: countCriticos > 0 ? '#f43f5e' : 'var(--accent-emerald)' }}>
              {countCriticos}
            </span>
            <span className="unit-suffix">veículos</span>
          </div>
          <div className="kpi-formula-tag">
            <code>KM limite ultrapassado</code>
          </div>
          <div className="kpi-footer-status negative">
            <span>Risco de quebra e perda de garantia</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-title">Histórico de Investimento OS</span>
            <div className="kpi-icon-wrap green">
              <DollarSign size={20} />
            </div>
          </div>
          <div className="kpi-main-val">
            <span className="val-number" style={{ fontSize: '1.4rem' }}>
              R$ {totalGastoOS.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
            </span>
          </div>
          <div className="kpi-formula-tag">
            <code>Total investido em preventivas</code>
          </div>
          <div className="kpi-footer-status positive">
            <span>Economia de ~400% vs quebras corretivas</span>
          </div>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div className="search-input-wrap" style={{ flex: '1', maxWidth: '420px' }}>
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Buscar por placa, modelo ou contrato (Vale, Amazon, Jogue Limpo)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {[
            { id: 'Todos', label: `Todos (${fleetAnalytics.length})` },
            { id: 'Criticos', label: `Críticos (${countCriticos})` },
            { id: 'Atencao', label: `Atenção (${countAtencao})` },
            { id: 'EmDia', label: `Em Dia (${countEmDia})` }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '6px',
                border: 'none',
                background: statusFilter === tab.id ? 'var(--accent-amber)' : 'rgba(15, 23, 42, 0.6)',
                color: statusFilter === tab.id ? '#070b12' : 'var(--text-main)',
                fontWeight: 700,
                fontSize: '0.78rem',
                cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Cards de Manutenção Preventiva por Veículo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(440px, 1fr))', gap: '1.25rem', marginTop: '1.25rem' }}>
        {filteredFleet.map(({ vehicle, statuses, overallState }) => {
          const isCritico = overallState === 'CRITICO';
          const isAtencao = overallState === 'ATENCAO';

          return (
            <div
              key={vehicle.placa}
              className="card-panel"
              style={{
                background: isCritico 
                  ? 'linear-gradient(180deg, rgba(244, 63, 94, 0.05) 0%, rgba(15, 23, 42, 0.85) 100%)' 
                  : isAtencao 
                  ? 'linear-gradient(180deg, rgba(245, 158, 11, 0.05) 0%, rgba(15, 23, 42, 0.85) 100%)'
                  : 'linear-gradient(180deg, rgba(15, 23, 42, 0.75) 0%, rgba(10, 15, 29, 0.9) 100%)',
                border: isCritico ? '1px solid rgba(244, 63, 94, 0.4)' : isAtencao ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                {/* Header do Card */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: 'rgba(6, 182, 212, 0.15)',
                        border: '1px solid rgba(6, 182, 212, 0.3)',
                        color: 'var(--accent-cyan)',
                        fontWeight: 800,
                        fontSize: '0.95rem'
                      }}>
                        {vehicle.placa}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {vehicle.prefixo} • {vehicle.operacao}
                      </span>
                    </div>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>
                      {vehicle.modelo}
                    </h4>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                      Implemento: {vehicle.tipo_implemento}
                    </span>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>Odômetro Atual</span>
                    <strong style={{ fontSize: '1.05rem', color: 'var(--accent-emerald)' }}>
                      {vehicle.odometro_atual.toLocaleString('pt-BR')} km
                    </strong>
                    {vehicle.horimetro_pto > 0 && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--accent-amber)', display: 'block' }}>
                        {vehicle.horimetro_pto}h PTO
                      </span>
                    )}
                  </div>
                </div>

                {/* As 4 Barras de Vida Útil dos Planos Preventivos */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '0.85rem' }}>
                  {statuses.map(({ rule, status }) => {
                    const isServiceCritico = status.estado === 'CRITICO';
                    const isServiceAtencao = status.estado === 'ATENCAO';
                    const barColor = isServiceCritico ? '#f43f5e' : isServiceAtencao ? '#f59e0b' : '#10b981';

                    return (
                      <div key={rule.id} style={{ background: 'rgba(7, 11, 18, 0.5)', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff' }}>
                            {rule.nome}
                          </span>
                          <span style={{
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            color: barColor,
                            background: isServiceCritico ? 'rgba(244, 63, 94, 0.15)' : isServiceAtencao ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                            padding: '1px 6px',
                            borderRadius: '4px'
                          }}>
                            {isServiceCritico ? 'VENCIDO / URGENTE' : isServiceAtencao ? `Faltam ${status.kmRestante.toLocaleString('pt-BR')} km` : `Faltam ${status.kmRestante.toLocaleString('pt-BR')} km`}
                          </span>
                        </div>

                        {/* Barra Visual de Vida Útil */}
                        <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                          <div
                            style={{
                              width: `${status.pctConsumido}%`,
                              height: '100%',
                              background: isServiceCritico 
                                ? 'linear-gradient(90deg, #f59e0b 0%, #f43f5e 100%)' 
                                : isServiceAtencao 
                                ? 'linear-gradient(90deg, #10b981 0%, #f59e0b 100%)' 
                                : 'var(--accent-emerald)',
                              transition: 'width 0.4s ease'
                            }}
                          />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.35rem', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                          <span>Última troca em {status.ultimoKm.toLocaleString('pt-BR')} km ({status.ultimaData})</span>
                          <span>Ciclo: a cada {rule.intervalo_km.toLocaleString('pt-BR')} km</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Botões do Rodapé do Card */}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '0.75rem' }}>
                <button
                  type="button"
                  className="btn-secondary btn-icon-text"
                  onClick={() => handleOpenUpdateKm(vehicle)}
                  style={{ flex: 1, padding: '0.45rem 0.65rem', fontSize: '0.75rem', justifyContent: 'center' }}
                  title="Atualizar odômetro do caminhão"
                >
                  <Gauge size={14} />
                  <span>Ajustar Odômetro</span>
                </button>

                <button
                  type="button"
                  className="btn-primary btn-icon-text"
                  onClick={() => handleOpenRecordService(vehicle)}
                  style={{ flex: 1.3, padding: '0.45rem 0.65rem', fontSize: '0.75rem', justifyContent: 'center', background: 'var(--accent-amber)', borderColor: 'var(--accent-amber)', color: '#070b12', fontWeight: 700 }}
                  title="Baixar preventiva e zerar ciclo"
                >
                  <Wrench size={14} />
                  <span>Baixar Preventiva (OS)</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
