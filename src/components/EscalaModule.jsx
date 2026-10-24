import React, { useState } from 'react';
import { 
  Calendar, 
  Truck, 
  UserCheck, 
  Route, 
  MapPin, 
  Plus, 
  Search, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Share2, 
  Phone, 
  Printer, 
  Trash2, 
  Edit3, 
  Layers, 
  Send, 
  ChevronRight, 
  Building2, 
  Compass, 
  ShieldCheck, 
  Navigation,
  Sparkles,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { 
  AUDITED_RJ_ROUTES, 
  AUDITED_RJ_CLIENTS, 
  INITIAL_SCHEDULE_DATA 
} from '../data/auditedClientsRoutesData';
import { AUDITED_VEHICLES, AUDITED_DRIVERS } from '../data/auditedAmbiparData';

export default function EscalaModule({ user }) {
  const [schedules, setSchedules] = useState(() => {
    try {
      const saved = localStorage.getItem('ambipar_real_schedules');
      return saved ? JSON.parse(saved) : INITIAL_SCHEDULE_DATA;
    } catch {
      return INITIAL_SCHEDULE_DATA;
    }
  });

  const [dateFilter, setDateFilter] = useState('2026-10-24');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedScheduleView, setSelectedScheduleView] = useState(null);

  // Formulário de Nova Escala
  const [newSchedule, setNewSchedule] = useState({
    data_escala: '2026-10-24',
    turno: 'Manhã (06:00 às 15:00)',
    rota_id: AUDITED_RJ_ROUTES[0].id,
    rota_nome: AUDITED_RJ_ROUTES[0].nome,
    polo: AUDITED_RJ_ROUTES[0].polo,
    veiculo_placa: 'RHU-6I87',
    veiculo_modelo: 'VW 26.280 CRM Poli Duplo',
    motorista_nome: 'Maiquel Souza da Silva',
    motorista_telefone: '(21) 98702-0014',
    motorista_cnh: 'Cat. AE (MOPP Válido)',
    distancia_prevista_km: AUDITED_RJ_ROUTES[0].distancia_km,
    instrucoes_especiais: '',
    paradas: AUDITED_RJ_ROUTES[0].pontos_parada.map(p => ({
      ordem: p.ordem,
      cliente: p.nome_ponto,
      endereco: p.endereco,
      status: 'Programado',
      horario: '08:00'
    }))
  });

  // Atualiza rota no form e recarrega os múltiplos endereços automaticamente
  const handleSelectRouteInForm = (routeId) => {
    const r = AUDITED_RJ_ROUTES.find(x => x.id === routeId);
    if (!r) return;
    setNewSchedule(prev => ({
      ...prev,
      rota_id: r.id,
      rota_nome: r.nome,
      polo: r.polo,
      distancia_prevista_km: r.distancia_km,
      veiculo_placa: r.placa_sugerida || prev.veiculo_placa,
      motorista_nome: r.motorista_sugerido || prev.motorista_nome,
      paradas: r.pontos_parada.map(p => ({
        ordem: p.ordem,
        cliente: p.nome_ponto,
        endereco: p.endereco,
        status: 'Programado',
        horario: '08:00'
      }))
    }));
  };

  // Salva no localStorage
  const saveSchedules = (newSchedules) => {
    setSchedules(newSchedules);
    try {
      localStorage.setItem('ambipar_real_schedules', JSON.stringify(newSchedules));
    } catch (e) {
      console.warn(e);
    }
  };

  // Adiciona nova parada dinâmica à escala
  const handleAddStopToForm = () => {
    setNewSchedule(prev => ({
      ...prev,
      paradas: [
        ...prev.paradas,
        {
          ordem: prev.paradas.length + 1,
          cliente: '',
          endereco: '',
          status: 'Programado',
          horario: '10:00'
        }
      ]
    }));
  };

  // Remove parada do form
  const handleRemoveStopFromForm = (idx) => {
    if (newSchedule.paradas.length <= 1) return;
    const updated = newSchedule.paradas.filter((_, i) => i !== idx).map((p, i) => ({
      ...p,
      ordem: i + 1
    }));
    setNewSchedule(prev => ({ ...prev, paradas: updated }));
  };

  // Submissão do formulário
  const handleCreateSchedule = (e) => {
    e.preventDefault();
    const created = {
      ...newSchedule,
      id: `ESC-${Date.now()}`,
      status: 'Programada',
      paradas_total: newSchedule.paradas.length,
      parada_atual: 1,
      progresso_percentual: 0
    };

    const updated = [created, ...schedules];
    saveSchedules(updated);
    setShowCreateModal(false);
  };

  // Concluir Parada na Escala
  const handleAdvanceStop = (scheduleId) => {
    const updated = schedules.map(s => {
      if (s.id !== scheduleId) return s;
      const nextStop = Math.min(s.parada_atual + 1, s.paradas_total);
      const isFinished = nextStop >= s.paradas_total && s.parada_atual === s.paradas_total;
      const newStatus = isFinished ? 'Concluída' : 'Em Rota';
      const pct = Math.round((nextStop / s.paradas_total) * 100);

      // Marca a parada atual como concluída
      const updatedParadas = s.paradas.map((p, i) => {
        if (i < nextStop - 1 || isFinished) return { ...p, status: 'Concluído' };
        if (i === nextStop - 1) return { ...p, status: 'Em Atendimento' };
        return p;
      });

      return {
        ...s,
        status: newStatus,
        parada_atual: nextStop,
        progresso_percentual: pct,
        paradas: updatedParadas
      };
    });
    saveSchedules(updated);
  };

  // Disparo de Escala via WhatsApp para o Motorista
  const handleSendWhatsApp = (item) => {
    const paradasTexto = item.paradas.map((p, i) => `${i + 1}️⃣ *${p.cliente}* ${p.endereco ? `(${p.endereco})` : ''} [${p.horario || 'Horário CCO'}]`).join('\n');
    
    const msg = `🚨 *ESCALA OPERACIONAL AMBIPAR CCO - RJ*\n` +
      `📅 *Data:* ${item.data_escala} | *Turno:* ${item.turno}\n` +
      `🛣️ *Rota:* ${item.rota_nome}\n` +
      `🚛 *Veículo:* ${item.veiculo_placa} (${item.veiculo_modelo})\n` +
      `👤 *Motorista:* ${item.motorista_nome}\n\n` +
      `📍 *SEQUÊNCIA DE CLIENTES & PARADAS NO DIA:*\n${paradasTexto}\n\n` +
      `⚠️ *Instruções CCO:* ${item.instrucoes_especiais || 'Conferir MTR SINIR e EPIs antes da saída.'}\n` +
      `📞 Suporte CCO: (21) 3655-9000`;

    const encoded = encodeURIComponent(msg);
    const cleanPhone = (item.motorista_telefone || '').replace(/\D/g, '');
    const url = cleanPhone ? `https://wa.me/55${cleanPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
  };

  // Filtragem de Escalas
  const filteredSchedules = schedules.filter(s => {
    const matchSearch = (
      s.rota_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.veiculo_placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.motorista_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.polo.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const matchStatus = statusFilter === 'Todos' || s.status === statusFilter;
    const matchDate = !dateFilter || s.data_escala === dateFilter;
    return matchSearch && matchStatus && matchDate;
  });

  // Métricas do Topo
  const totalEscaladosHoje = schedules.filter(s => s.data_escala === '2026-10-24').length;
  const emRotaHoje = schedules.filter(s => s.data_escala === '2026-10-24' && s.status === 'Em Rota').length;
  const paradasHoje = schedules.filter(s => s.data_escala === '2026-10-24').reduce((acc, curr) => acc + (curr.paradas_total || 0), 0);
  const kmHoje = schedules.filter(s => s.data_escala === '2026-10-24').reduce((acc, curr) => acc + (curr.distancia_prevista_km || 0), 0);

  return (
    <div className="escala-module animate-fade-in" style={{ padding: '0.5rem 0' }}>
      {/* Banner Principal */}
      <div className="control-tower-banner" style={{ background: 'linear-gradient(135deg, rgba(14, 21, 36, 0.95) 0%, rgba(10, 15, 29, 0.98) 100%)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
        <div className="tower-header-text">
          <div className="tower-badge-live" style={{ background: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.3)', color: 'var(--accent-emerald)' }}>
            <span className="live-dot" style={{ background: 'var(--accent-emerald)' }}></span>
            <span>CENTRAL DE ESCALA OPERACIONAL & DESPACHO CCO • 2026</span>
          </div>
          <h2>Escala Diária de Motoristas, Veículos & Rotas</h2>
          <p>
            Vincule cada motorista homologado e veículo disponível aos circuitos do dia com múltiplos clientes e endereços de paradas: Vale Guaíba/CPBS, Amazon Meriti e Coletas Jogue Limpo RJ.
          </p>
        </div>

        <button 
          type="button" 
          className="btn-primary btn-icon-text"
          onClick={() => setShowCreateModal(true)}
          style={{ background: 'var(--accent-emerald)', borderColor: 'var(--accent-emerald)', color: '#070b12', fontWeight: 700 }}
        >
          <Plus size={16} />
          <span>Nova Escala de Despacho</span>
        </button>
      </div>

      {/* Grid de KPIs de Escala */}
      <div className="kpi-metrics-grid" style={{ marginTop: '1.25rem' }}>
        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-title">Veículos Escalados Hoje</span>
            <div className="kpi-icon-wrap emerald">
              <Truck size={20} />
            </div>
          </div>
          <div className="kpi-main-val">
            <span className="val-number">{totalEscaladosHoje}</span>
            <span className="unit-suffix">caminhões</span>
          </div>
          <div className="kpi-formula-tag">
            <code>Frota homologada DCX & Vale</code>
          </div>
          <div className="kpi-footer-status positive">
            <span>{emRotaHoje} veículos em rota ativa neste momento</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-title">Motoristas Escalados</span>
            <div className="kpi-icon-wrap cyan">
              <UserCheck size={20} />
            </div>
          </div>
          <div className="kpi-main-val">
            <span className="val-number">{totalEscaladosHoje}</span>
            <span className="unit-suffix">condutores</span>
          </div>
          <div className="kpi-formula-tag">
            <code>100% com MOPP e CNH regular</code>
          </div>
          <div className="kpi-footer-status positive">
            <span>Escala vinculada a telefones de contato</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-title">Clientes / Paradas Programadas</span>
            <div className="kpi-icon-wrap amber">
              <MapPin size={20} />
            </div>
          </div>
          <div className="kpi-main-val">
            <span className="val-number">{paradasHoje}</span>
            <span className="unit-suffix">endereços</span>
          </div>
          <div className="kpi-formula-tag">
            <code>Múltiplas paradas no mesmo dia</code>
          </div>
          <div className="kpi-footer-status neutral">
            <span>Sequenciamento logístico otimizado CCO</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-title">Distância Total Prevista</span>
            <div className="kpi-icon-wrap purple">
              <Route size={20} />
            </div>
          </div>
          <div className="kpi-main-val">
            <span className="val-number">{kmHoje}</span>
            <span className="unit-suffix">km hoje</span>
          </div>
          <div className="kpi-formula-tag">
            <code>Circuito consolidado na malha RJ</code>
          </div>
          <div className="kpi-footer-status positive">
            <span>Consumo médio previsto: {(kmHoje / 2.8).toFixed(0)} L diesel</span>
          </div>
        </div>
      </div>

      {/* Barra de Filtros e Busca de Escala */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="search-input-wrap" style={{ minWidth: '280px' }}>
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Buscar por placa, motorista ou rota..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(15, 23, 42, 0.6)', padding: '0.35rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <Calendar size={15} style={{ color: 'var(--accent-emerald)' }} />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '0.8rem', outline: 'none' }}
            />
            {dateFilter && (
              <button 
                type="button" 
                onClick={() => setDateFilter('')}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.75rem' }}
                title="Limpar filtro de data"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Filtros de Status */}
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {['Todos', 'Em Rota', 'Programada', 'Concluída'].map(st => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '6px',
                border: 'none',
                background: statusFilter === st ? 'var(--accent-emerald)' : 'rgba(15, 23, 42, 0.6)',
                color: statusFilter === st ? '#070b12' : 'var(--text-main)',
                fontWeight: 700,
                fontSize: '0.78rem',
                cursor: 'pointer'
              }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Cards de Escala Executiva */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1.25rem' }}>
        {filteredSchedules.length === 0 ? (
          <div className="card-panel" style={{ textAlign: 'center', padding: '3rem' }}>
            <Calendar size={36} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
            <p style={{ fontWeight: 600, color: 'var(--text-main)' }}>Nenhuma escala encontrada com os filtros selecionados.</p>
            <small style={{ color: 'var(--text-muted)' }}>Clique no botão "Nova Escala de Despacho" para programar viagens do dia.</small>
          </div>
        ) : (
          filteredSchedules.map((item) => {
            const isEmRota = item.status === 'Em Rota';
            const isFinished = item.status === 'Concluída';
            return (
              <div 
                key={item.id}
                className="card-panel"
                style={{
                  border: isEmRota ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                  background: isEmRota 
                    ? 'linear-gradient(180deg, rgba(16, 185, 129, 0.04) 0%, rgba(15, 23, 42, 0.8) 100%)' 
                    : 'linear-gradient(180deg, rgba(15, 23, 42, 0.7) 0%, rgba(10, 15, 29, 0.85) 100%)',
                  boxShadow: isEmRota ? '0 0 20px rgba(16, 185, 129, 0.06)' : undefined
                }}
              >
                {/* Header da Escala */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                      padding: '0.4rem 0.85rem',
                      borderRadius: '8px',
                      background: 'rgba(6, 182, 212, 0.15)',
                      border: '1px solid rgba(6, 182, 212, 0.3)',
                      color: 'var(--accent-cyan)',
                      fontWeight: 800,
                      fontSize: '1.05rem',
                      letterSpacing: '0.05em'
                    }}>
                      {item.veiculo_placa}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <strong style={{ fontSize: '1rem', color: 'var(--text-main)' }}>{item.veiculo_modelo}</strong>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>• {item.polo}</span>
                      </div>
                      <small style={{ color: 'var(--text-muted)', display: 'block' }}>
                        📅 Data: <strong>{item.data_escala}</strong> | ⏰ {item.turno} | 🛣️ {item.distancia_prevista_km} km previstos
                      </small>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      padding: '4px 10px',
                      borderRadius: '20px',
                      background: isEmRota ? 'rgba(16, 185, 129, 0.2)' : (isFinished ? 'rgba(6, 182, 212, 0.2)' : 'rgba(245, 158, 11, 0.2)'),
                      color: isEmRota ? 'var(--accent-emerald-light)' : (isFinished ? 'var(--accent-cyan)' : 'var(--accent-amber)'),
                      border: `1px solid ${isEmRota ? 'rgba(16, 185, 129, 0.4)' : (isFinished ? 'rgba(6, 182, 212, 0.4)' : 'rgba(245, 158, 11, 0.4)')}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}>
                      {isEmRota && <span className="live-dot" style={{ width: '6px', height: '6px' }}></span>}
                      <span>{item.status}</span>
                    </span>

                    <button
                      type="button"
                      className="btn-secondary btn-icon-text"
                      onClick={() => handleSendWhatsApp(item)}
                      style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', background: '#25D366', color: '#070b12', borderColor: '#25D366', fontWeight: 700 }}
                      title="Enviar itinerário de paradas pelo WhatsApp para o condutor"
                    >
                      <Send size={13} />
                      <span>WhatsApp Condutor</span>
                    </button>
                  </div>
                </div>

                {/* Dados do Motorista & Nome da Rota */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', margin: '1rem 0' }}>
                  <div style={{ background: 'rgba(7, 11, 18, 0.5)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Motorista Escalado:</span>
                    <strong style={{ fontSize: '0.95rem', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                      <UserCheck size={16} />
                      <span>{item.motorista_nome}</span>
                    </strong>
                    <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '0.2rem' }}>
                      {item.motorista_cnh} • Tel: {item.motorista_telefone || '(21) 98700-0000'}
                    </small>
                  </div>

                  <div style={{ background: 'rgba(7, 11, 18, 0.5)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Rota Homologada:</span>
                    <strong style={{ fontSize: '0.95rem', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                      <Route size={16} />
                      <span>{item.rota_nome}</span>
                    </strong>
                    <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '0.2rem' }}>
                      {item.instrucoes_especiais || 'Operação conforme procedimento CCO.'}
                    </small>
                  </div>
                </div>

                {/* Sequenciamento de Clientes / Paradas no mesmo dia */}
                <div style={{ background: 'rgba(7, 11, 18, 0.3)', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Roteiro de Paradas no Dia ({item.paradas?.length || 0} locais atendidos):
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', fontWeight: 700 }}>
                      Progresso: {item.progresso_percentual || 0}%
                    </span>
                  </div>

                  {/* Linha do tempo visual de paradas */}
                  <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                    {item.paradas?.map((p, pIdx) => {
                      const isDone = p.status === 'Concluído';
                      const isCurrent = p.status === 'Em Atendimento' || (!isDone && pIdx === (item.parada_atual - 1));
                      return (
                        <div 
                          key={pIdx}
                          style={{
                            minWidth: '200px',
                            flex: 1,
                            background: isDone ? 'rgba(16, 185, 129, 0.08)' : (isCurrent ? 'rgba(6, 182, 212, 0.12)' : 'rgba(255, 255, 255, 0.03)'),
                            border: `1px solid ${isDone ? 'rgba(16, 185, 129, 0.3)' : (isCurrent ? 'rgba(6, 182, 212, 0.4)' : 'rgba(255, 255, 255, 0.05)')}`,
                            borderRadius: '8px',
                            padding: '0.65rem 0.85rem',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between'
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                              <span style={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                background: isDone ? 'var(--accent-emerald)' : (isCurrent ? 'var(--accent-cyan)' : '#64748b'),
                                color: '#070b12',
                                fontWeight: 800,
                                fontSize: '0.65rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                {p.ordem}
                              </span>
                              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{p.horario || '—'}</span>
                            </div>

                            <strong style={{ fontSize: '0.82rem', color: 'var(--text-main)', display: 'block', lineHeight: 1.2 }}>
                              {p.cliente}
                            </strong>
                            {p.endereco && (
                              <small style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.2rem' }}>
                                {p.endereco}
                              </small>
                            )}
                          </div>

                          <div style={{ marginTop: '0.5rem', textAlign: 'right' }}>
                            <span style={{
                              fontSize: '0.65rem',
                              fontWeight: 800,
                              color: isDone ? 'var(--accent-emerald)' : (isCurrent ? 'var(--accent-cyan)' : 'var(--text-muted)')
                            }}>
                              {p.status || (isDone ? 'Concluído' : (isCurrent ? 'Em Atendimento' : 'Programado'))}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Ação de Avançar Parada */}
                  {!isFinished && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
                      <button
                        type="button"
                        className="btn-primary btn-icon-text"
                        onClick={() => handleAdvanceStop(item.id)}
                        style={{ padding: '0.35rem 0.85rem', fontSize: '0.75rem' }}
                      >
                        <CheckCircle2 size={14} />
                        <span>Confirmar Avanço de Parada</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal de Criação de Escala Operacional */}
      {showCreateModal && (
        <div className="modal-backdrop animate-fade-in" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="modal-container" style={{ background: '#0e1524', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '14px', width: '100%', maxWidth: '720px', maxHeight: '90vh', overflowY: 'auto', padding: '1.75rem', boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.85rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                  Montar Nova Escala Operacional CCO
                </h3>
                <small style={{ color: 'var(--text-muted)' }}>Vincule motorista homologado, caminhão liberado e circuito de múltiplos clientes</small>
              </div>
              <button 
                type="button" 
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSchedule}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                    Data da Escala
                  </label>
                  <input
                    type="date"
                    required
                    value={newSchedule.data_escala}
                    onChange={(e) => setNewSchedule({ ...newSchedule, data_escala: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'rgba(15, 23, 42, 0.7)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: '#fff' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                    Turno de Atendimento
                  </label>
                  <select
                    value={newSchedule.turno}
                    onChange={(e) => setNewSchedule({ ...newSchedule, turno: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', background: '#0f172a', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: '#fff' }}
                  >
                    <option value="Manhã (06:00 às 15:00)">Manhã (06:00 às 15:00)</option>
                    <option value="Manhã (07:00 às 16:00)">Manhã (07:00 às 16:00)</option>
                    <option value="Tarde (13:00 às 22:00)">Tarde (13:00 às 22:00)</option>
                    <option value="Noturno Especial (22:00 às 06:00)">Noturno Especial (22:00 às 06:00)</option>
                  </select>
                </div>

                {/* Seleção da Rota Homologada */}
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                    Selecione a Rota (Carrega múltiplos clientes e endereços automaticamente):
                  </label>
                  <select
                    value={newSchedule.rota_id}
                    onChange={(e) => handleSelectRouteInForm(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.75rem', background: '#0f172a', border: '1px solid rgba(6, 182, 212, 0.4)', borderRadius: '6px', color: '#fff', fontWeight: 600 }}
                  >
                    {AUDITED_RJ_ROUTES.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.codigo} - {r.nome} ({r.distancia_km} km • {r.pontos_parada.length} paradas)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Seleção de Veículo Real */}
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                    Veículo Homologado (Frota DCX / Vale):
                  </label>
                  <select
                    value={newSchedule.veiculo_placa}
                    onChange={(e) => {
                      const v = AUDITED_VEHICLES.find(x => x.placa === e.target.value);
                      setNewSchedule({
                        ...newSchedule,
                        veiculo_placa: e.target.value,
                        veiculo_modelo: v ? `${v.tipo} (${v.marca_modelo})` : newSchedule.veiculo_modelo
                      });
                    }}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', background: '#0f172a', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: '#fff' }}
                  >
                    {AUDITED_VEHICLES.map(v => (
                      <option key={v.placa} value={v.placa} disabled={v.status === 'Bloqueado'}>
                        {v.placa} - {v.tipo} ({v.marca_modelo}) [{v.status}]
                      </option>
                    ))}
                  </select>
                </div>

                {/* Seleção de Motorista Real */}
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                    Motorista (Quadro Homologado MOPP):
                  </label>
                  <select
                    value={newSchedule.motorista_nome}
                    onChange={(e) => {
                      const m = AUDITED_DRIVERS.find(x => x.nome === e.target.value);
                      setNewSchedule({
                        ...newSchedule,
                        motorista_nome: e.target.value,
                        motorista_telefone: m?.telefone || newSchedule.motorista_telefone,
                        motorista_cnh: m ? `Cat. ${m.categoria_cnh} (MOPP ${m.status_mopp})` : newSchedule.motorista_cnh
                      });
                    }}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', background: '#0f172a', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: '#fff' }}
                  >
                    {AUDITED_DRIVERS.map(d => (
                      <option key={d.id} value={d.nome}>
                        {d.nome} (Cat. {d.categoria_cnh} • MOPP {d.status_mopp})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Endereços e Paradas na Rota do Dia */}
              <div style={{ marginTop: '1.25rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                    Endereços de Paradas Vinculados à Rota ({newSchedule.paradas.length} locais):
                  </label>
                  <button
                    type="button"
                    className="btn-secondary btn-icon-text"
                    onClick={handleAddStopToForm}
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                  >
                    <Plus size={14} />
                    <span>Adicionar Cliente / Parada</span>
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {newSchedule.paradas.map((p, pIdx) => (
                    <div 
                      key={pIdx}
                      style={{
                        background: 'rgba(15, 23, 42, 0.6)',
                        padding: '0.65rem 0.85rem',
                        borderRadius: '6px',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-cyan)', width: '25px' }}>
                        #{p.ordem}
                      </span>
                      <input
                        type="text"
                        required
                        placeholder="Nome do Cliente"
                        value={p.cliente}
                        onChange={(e) => {
                          const updated = [...newSchedule.paradas];
                          updated[pIdx].cliente = e.target.value;
                          setNewSchedule({ ...newSchedule, paradas: updated });
                        }}
                        style={{ flex: 1, padding: '0.4rem 0.6rem', background: '#070b12', border: '1px solid var(--border-subtle)', borderRadius: '4px', color: '#fff', fontSize: '0.8rem' }}
                      />
                      <input
                        type="text"
                        required
                        placeholder="Endereço Completo"
                        value={p.endereco}
                        onChange={(e) => {
                          const updated = [...newSchedule.paradas];
                          updated[pIdx].endereco = e.target.value;
                          setNewSchedule({ ...newSchedule, paradas: updated });
                        }}
                        style={{ flex: 1.5, padding: '0.4rem 0.6rem', background: '#070b12', border: '1px solid var(--border-subtle)', borderRadius: '4px', color: '#fff', fontSize: '0.8rem' }}
                      />
                      <input
                        type="text"
                        placeholder="Horário (Ex: 09:30)"
                        value={p.horario}
                        onChange={(e) => {
                          const updated = [...newSchedule.paradas];
                          updated[pIdx].horario = e.target.value;
                          setNewSchedule({ ...newSchedule, paradas: updated });
                        }}
                        style={{ width: '80px', padding: '0.4rem 0.6rem', background: '#070b12', border: '1px solid var(--border-subtle)', borderRadius: '4px', color: '#fff', fontSize: '0.8rem' }}
                      />
                      {newSchedule.paradas.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveStopFromForm(pIdx)}
                          style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '0.8rem' }}
                          title="Remover parada"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Instruções CCO */}
              <div style={{ marginTop: '1rem' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                  Instruções Especiais CCO / Romaneio
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Pegar crachá de acesso no TIG Guaíba; verificar travas da caixa compactadora na Amazon."
                  value={newSchedule.instrucoes_especiais}
                  onChange={(e) => setNewSchedule({ ...newSchedule, instrucoes_especiais: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'rgba(15, 23, 42, 0.7)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: '#fff', resize: 'vertical' }}
                />
              </div>

              {/* Botões do Rodapé */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ background: 'var(--accent-emerald)', borderColor: 'var(--accent-emerald)', color: '#070b12', fontWeight: 700 }}
                >
                  Confirmar Escala de Despacho
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
