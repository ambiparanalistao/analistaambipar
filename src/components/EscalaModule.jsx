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
  ExternalLink,
  ArrowLeft,
  Fuel,
  FileText,
  Check,
  X
} from 'lucide-react';
import { 
  AUDITED_RJ_ROUTES, 
  AUDITED_RJ_CLIENTS, 
  INITIAL_SCHEDULE_DATA 
} from '../data/auditedClientsRoutesData';
import useFleetDirectory from '../hooks/useFleetDirectory';

export default function EscalaModule({ user, onNavigateRotas,companyId }) {
  const directory=useFleetDirectory(companyId);const AUDITED_VEHICLES=directory.vehicles,AUDITED_DRIVERS=directory.drivers;
  // Controle de Visualização em Tela Inteira: 'list' (Quadro Geral), 'form' (Montar Escala Tela Cheia), 'romaneio' (Ficha de Despacho Tela Cheia)
  const [viewMode, setViewMode] = useState('list');
  const [selectedRomaneio, setSelectedRomaneio] = useState(null);

  const [schedules, setSchedules] = useState(() => {
    try {
      localStorage.removeItem('ambipar_real_schedules');
      localStorage.removeItem('ambipar_real_schedules_v2');
      const saved = localStorage.getItem('ambipar_user_schedules_clean_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [dateFilter, setDateFilter] = useState('2026-10-24');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');

  // Formulário de Nova Escala (em Tela Inteira)
  const defaultScheduleState = {
    data_escala: '2026-10-24',
    turno: 'Manhã (07:00 às 16:00)',
    rota_id: '',
    rota_nome: '',
    polo: 'Operações RJ',
    veiculo_placa: '',
    veiculo_modelo: '',
    motorista_nome: '',
    motorista_telefone: '',
    motorista_cnh: '',
    distancia_prevista_km: 0,
    instrucoes_especiais: '',
    paradas: [
      {
        ordem: 1,
        cliente: 'Base Ambipar Duque de Caxias',
        endereco: 'Rod. Washington Luís, km 114 - Duque de Caxias',
        status: 'Programado',
        horario: '07:00'
      }
    ]
  };

  const [formData, setFormData] = useState(defaultScheduleState);

  // Ao trocar a rota no formulário de tela cheia, carrega o itinerário correspondente
  const handleSelectRouteInForm = (routeId) => {
    if (!routeId) {
      setFormData(prev => ({
        ...prev,
        rota_id: '',
        rota_nome: '',
        distancia_prevista_km: 0
      }));
      return;
    }
    const r = AUDITED_RJ_ROUTES.find(x => x.id === routeId);
    if (!r) return;
    setFormData(prev => ({
      ...prev,
      rota_id: r.id,
      rota_nome: r.nome,
      polo: r.polo,
      distancia_prevista_km: r.distancia_km,
      veiculo_placa: prev.veiculo_placa || r.placa_sugerida || '',
      motorista_nome: prev.motorista_nome || r.motorista_sugerido || '',
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
      localStorage.setItem('ambipar_user_schedules_clean_v1', JSON.stringify(newSchedules));
    } catch (e) {
      console.warn(e);
    }
  };

  // Adiciona nova parada dinâmica no formulário
  const handleAddStopToForm = () => {
    setFormData(prev => ({
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

  // Remove parada do formulário
  const handleRemoveStopFromForm = (idx) => {
    if (formData.paradas.length <= 1) return;
    const updated = formData.paradas.filter((_, i) => i !== idx).map((p, i) => ({
      ...p,
      ordem: i + 1
    }));
    setFormData(prev => ({ ...prev, paradas: updated }));
  };

  // Salvar Escala (Tela Cheia)
  const handleSaveSchedule = (e) => {
    e.preventDefault();
    if (!formData.rota_nome || !formData.rota_nome.trim()) {
      alert('Por favor informe o nome da rota a ser executada nesta escala.');
      return;
    }
    if (!formData.veiculo_placa) {
      alert('Por favor selecione o veículo da frota a ser escalado.');
      return;
    }
    if (!formData.motorista_nome) {
      alert('Por favor selecione o motorista homologado.');
      return;
    }

    const created = {
      ...formData,
      id: `ESC-${Date.now()}`,
      status: 'Programada',
      paradas_total: formData.paradas.length,
      parada_atual: 1,
      progresso_percentual: 0
    };

    const updated = [created, ...schedules];
    saveSchedules(updated);
    setViewMode('list');
  };

  // Concluir Parada na Escala
  const handleAdvanceStop = (scheduleId) => {
    const updated = schedules.map(s => {
      if (s.id !== scheduleId) return s;
      const nextStop = Math.min(s.parada_atual + 1, s.paradas_total);
      const isFinished = nextStop >= s.paradas_total && s.parada_atual === s.paradas_total;
      const newStatus = isFinished ? 'Concluída' : 'Em Rota';
      const pct = Math.round((nextStop / s.paradas_total) * 100);

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
    const paradasTexto = item.paradas.map((p, i) => `${i + 1}️⃣ *${p.cliente}* ${p.endereco ? `(${p.endereco})` : ''} [${p.horario || 'Horário Central de Gestão'}]`).join('\n');
    
    const msg = `🚨 *ESCALA OPERACIONAL AMBIPAR Central de Gestão - RJ*\n` +
      `📅 *Data:* ${item.data_escala} | *Turno:* ${item.turno}\n` +
      `🛣️ *Rota:* ${item.rota_nome}\n` +
      `🚛 *Veículo:* ${item.veiculo_placa} (${item.veiculo_modelo})\n` +
      `👤 *Motorista:* ${item.motorista_nome}\n\n` +
      `📍 *SEQUÊNCIA DE CLIENTES & PARADAS NO DIA:*\n${paradasTexto}\n\n` +
      `⚠️ *Instruções Central de Gestão:* ${item.instrucoes_especiais || 'Conferir MTR SINIR e EPIs antes da saída.'}\n` +
      `📞 Suporte Central de Gestão: (21) 3655-9000`;

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

  // =========================================================================
  // MODO 1: TELA INTEIRA DE ROMANEIO / FICHA DE DESPACHO
  // =========================================================================
  if (viewMode === 'romaneio' && selectedRomaneio) {
    return (
      <div className="escala-romaneio-fullscreen animate-fade-in" style={{ padding: '0.5rem 0' }}>
        {/* Barra Superior de Ações */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <button
            type="button"
            className="btn-secondary btn-icon-text"
            onClick={() => setViewMode('list')}
          >
            <ArrowLeft size={16} />
            <span>Voltar ao Quadro de Escalas</span>
          </button>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              className="btn-secondary btn-icon-text"
              onClick={() => window.print()}
            >
              <Printer size={16} />
              <span>Imprimir Ficha de Despacho</span>
            </button>
            <button
              type="button"
              className="btn-primary btn-icon-text"
              onClick={() => handleSendWhatsApp(selectedRomaneio)}
              style={{ background: '#25D366', borderColor: '#25D366', color: '#070b12', fontWeight: 700 }}
            >
              <Send size={16} />
              <span>Enviar no WhatsApp</span>
            </button>
          </div>
        </div>

        {/* Folha de Romaneio em Tela Cheia */}
        <div className="card-panel" style={{ background: '#0e1524', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '2.5rem', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid var(--accent-emerald)', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent-emerald)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                AMBIPAR ENVIRONMENT SOLUTIONS • UNIDADE DUQUE DE CAXIAS
              </span>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '0.2rem 0', color: 'var(--text-main)' }}>
                Ficha Oficial de Despacho & Escala Diária Central de Gestão
              </h2>
              <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.85rem' }}>
                Ordem de Serviço Logística • Central de Gestão de Frota e Logística
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>ID da Escala:</span>
              <code style={{ fontSize: '1rem', color: 'var(--accent-cyan)', fontWeight: 800 }}>{selectedRomaneio.id}</code>
              <div style={{ marginTop: '0.35rem' }}>
                <span style={{ fontSize: '0.75rem', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald-light)', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                  {selectedRomaneio.status}
                </span>
              </div>
            </div>
          </div>

          {/* Dados do Despacho */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', background: 'rgba(7, 11, 18, 0.6)', padding: '1.25rem', borderRadius: '8px', marginBottom: '1.75rem', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Data da Operação:</span>
              <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>{selectedRomaneio.data_escala}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Turna Central de Gestão:</span>
              <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>{selectedRomaneio.turno}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Veículo & Placa:</span>
              <strong style={{ fontSize: '1rem', color: 'var(--accent-cyan)' }}>{selectedRomaneio.veiculo_placa}</strong>
              <small style={{ display: 'block', color: 'var(--text-muted)' }}>{selectedRomaneio.veiculo_modelo}</small>
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Motorista Escalado:</span>
              <strong style={{ fontSize: '0.95rem', color: 'var(--accent-emerald)' }}>{selectedRomaneio.motorista_nome}</strong>
              <small style={{ display: 'block', color: 'var(--text-muted)' }}>{selectedRomaneio.motorista_cnh}</small>
            </div>
          </div>

          {/* Tabela do Itinerário de Clientes */}
          <div style={{ marginBottom: '1.75rem' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={18} style={{ color: 'var(--accent-emerald)' }} />
              <span>Itinerário de Paradas e Clientes no Dia ({selectedRomaneio.paradas?.length} locais)</span>
            </h4>

            <table className="operational-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>Ordem</th>
                  <th>Cliente / Ponto de Atendimento</th>
                  <th>Endereço Completo de Coleta</th>
                  <th>Horário Previsto</th>
                  <th>Situação Central de Gestão</th>
                </tr>
              </thead>
              <tbody>
                {selectedRomaneio.paradas?.map((p, idx) => (
                  <tr key={idx}>
                    <td>
                      <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--accent-emerald)', color: '#070b12', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>
                        {p.ordem}
                      </span>
                    </td>
                    <td><strong>{p.cliente}</strong></td>
                    <td><small>{p.endereco || '—'}</small></td>
                    <td><span className="date-tag">{p.horario || 'Programado'}</span></td>
                    <td>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: p.status === 'Concluído' ? 'var(--accent-emerald)' : 'var(--accent-cyan)' }}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Instruções Central de Gestão */}
          <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '1rem 1.25rem', borderRadius: '8px', borderLeft: '4px solid var(--accent-cyan)', marginBottom: '2rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>
              Instruções Especiais de Segurança e Operação:
            </span>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-main)' }}>
              {selectedRomaneio.instrucoes_especiais || 'Conferir crachá de acesso industrial, utilizar todos os EPIs obrigatórios (capacete, óculos, botina e luvas) e emitir MTR SINIR antes de deixar a portaria do cliente.'}
            </p>
          </div>

          {/* Assinaturas */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', paddingTop: '2rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ borderBottom: '1px solid var(--text-muted)', width: '80%', margin: '0 auto 0.5rem' }}></div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-main)', fontWeight: 700 }}>
                {selectedRomaneio.motorista_nome}
              </span>
              <small style={{ display: 'block', color: 'var(--text-muted)' }}>Condutor Responsável / Central de Gestão</small>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ borderBottom: '1px solid var(--text-muted)', width: '80%', margin: '0 auto 0.5rem' }}></div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-main)', fontWeight: 700 }}>
                Analista de Transporte
              </span>
              <small style={{ display: 'block', color: 'var(--text-muted)' }}>Ambipar Logistics & Operações RJ</small>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // MODO 2: TELA INTEIRA DE CADASTRO / MONTAGEM DE ESCALA (SEM POP-UP!)
  // =========================================================================
  if (viewMode === 'form') {
    return (
      <div className="escala-form-fullscreen animate-fade-in" style={{ padding: '0.5rem 0' }}>
        {/* Top Header da Tela Cheia */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                onClick={() => setViewMode('list')}
              >
                <ArrowLeft size={14} />
                <span>Voltar ao Quadro</span>
              </button>
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', fontWeight: 800, background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                Central de Gestão • DESPACHO OPERACIONAL
              </span>
            </div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
              Montar Nova Escala de Despacho em Tela Cheia
            </h2>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.85rem' }}>
              Vincule veículo homologado, motorista habilitado com MOPP e itinerário diário de múltiplos clientes e endereços.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setViewMode('list')}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn-primary btn-icon-text"
              onClick={handleSaveSchedule}
              style={{ background: 'var(--accent-emerald)', borderColor: 'var(--accent-emerald)', color: '#070b12', fontWeight: 700 }}
            >
              <Check size={16} />
              <span>Confirmar & Despachar Escala</span>
            </button>
          </div>
        </div>

        {/* Layout Dividido em Duas Colunas Amplas */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) minmax(450px, 1.4fr)', gap: '1.5rem' }}>
          {/* Coluna 1: Parâmetros da Escala, Veículo e Motorista */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="card-panel" style={{ background: '#0e1524' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={18} />
                <span>1. Data, Turno e Rota Homologada</span>
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                    Data da Escala:
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.data_escala}
                    onChange={(e) => setFormData({ ...formData, data_escala: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#070b12', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: '#fff', fontSize: '0.9rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                    Turno de Atendimento:
                  </label>
                  <select
                    value={formData.turno}
                    onChange={(e) => setFormData({ ...formData, turno: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#070b12', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: '#fff', fontSize: '0.9rem' }}
                  >
                    <option value="Manhã (06:00 às 15:00)">Manhã (06:00 às 15:00)</option>
                    <option value="Manhã (07:00 às 16:00)">Manhã (07:00 às 16:00)</option>
                    <option value="Tarde (13:00 às 22:00)">Tarde (13:00 às 22:00)</option>
                    <option value="Noturno Especial (22:00 às 06:00)">Noturno Especial (22:00 às 06:00)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                  Nome da Rota / Circuito do Dia: *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Rota Coletas Zona Norte e Centro"
                  value={formData.rota_nome}
                  onChange={(e) => setFormData({ ...formData, rota_nome: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#070b12', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: '#fff', fontSize: '0.9rem', marginBottom: '0.75rem' }}
                />

                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                  Ou Selecione um Circuito Cadastrado (Opcional):
                </label>
                <select
                  value={formData.rota_id}
                  onChange={(e) => handleSelectRouteInForm(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#070b12', border: '1px solid rgba(6, 182, 212, 0.4)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
                >
                  <option value="">-- Preencher rota e paradas manualmente --</option>
                  {AUDITED_RJ_ROUTES.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.codigo} - {r.nome} ({r.distancia_km} km • {r.pontos_parada.length} paradas)
                    </option>
                  ))}
                </select>
                <small style={{ color: 'var(--accent-cyan)', display: 'block', marginTop: '0.35rem' }}>
                  💡 Se selecionar um circuito cadastrado, ele preenche os clientes e endereços automaticamente ao lado.
                </small>
              </div>
            </div>

            {/* Veículo e Motorista */}
            <div className="card-panel" style={{ background: '#0e1524' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-emerald)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Truck size={18} />
                <span>2. Alocação de Veículo & Condutor</span>
              </h3>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                  Veículo da Frota (21 Unidades Homologadas DCX / Vale):
                </label>
                <select
                  required
                  value={formData.veiculo_placa}
                  onChange={(e) => {
                    const v = AUDITED_VEHICLES.find(x => x.placa === e.target.value);
                    setFormData({
                      ...formData,
                      veiculo_placa: e.target.value,
                      veiculo_modelo: v ? `${v.tipo} (${v.marca_modelo})` : ''
                    });
                  }}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#070b12', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: '#fff', fontSize: '0.9rem' }}
                >
                  <option value="">-- Selecione o Veículo Liberado na Frota --</option>
                  {AUDITED_VEHICLES.map(v => (
                    <option key={v.placa} value={v.placa} disabled={v.status !== 'Disponível'}>
                      {v.placa} • {v.tipo} ({v.marca_modelo}) [{v.status}]
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                  Motorista (Quadro Homologado MOPP):
                </label>
                <select
                  required
                  value={formData.motorista_nome}
                  onChange={(e) => {
                    const m = AUDITED_DRIVERS.find(x => x.nome === e.target.value);
                    setFormData({
                      ...formData,
                      motorista_nome: e.target.value,
                      motorista_telefone: m?.telefone || '',
                      motorista_cnh: m ? `Cat. ${m.categoria_cnh || 'Não informada'} (MOPP: validade indeterminada)` : ''
                    });
                  }}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#070b12', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: '#fff', fontSize: '0.9rem' }}
                >
                  <option value="">-- Selecione o Motorista Homologado MOPP --</option>
                  {AUDITED_DRIVERS.map(d => (
                    <option key={d.id} value={d.nome}>
                      {d.nome} (Cat. {d.categoria_cnh || 'Não informada'} • MOPP: validade indeterminada)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                  Instruções Especiais Central de Gestão / Despacho:
                </label>
                <textarea
                  rows={3}
                  placeholder="Ex: Entrar pela Doca 14 na Amazon; apresentar crachá no TIG Guaíba; verificar lona de contenção."
                  value={formData.instrucoes_especiais}
                  onChange={(e) => setFormData({ ...formData, instruções_especiais: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#070b12', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem', resize: 'vertical' }}
                />
              </div>
            </div>
          </div>

          {/* Coluna 2: Construtor Amplo de Múltiplos Clientes e Paradas no Dia */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="card-panel" style={{ background: '#0e1524', height: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.85rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <MapPin size={18} style={{ color: 'var(--accent-amber)' }} />
                    <span>Itinerário de Clientes & Paradas no Mesmo Dia ({formData.paradas.length} locais)</span>
                  </h3>
                  <small style={{ color: 'var(--text-muted)' }}>O caminhão percorrerá estes clientes sequencialmente neste turno</small>
                </div>

                <button
                  type="button"
                  className="btn-secondary btn-icon-text"
                  onClick={handleAddStopToForm}
                  style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
                >
                  <Plus size={14} />
                  <span>Adicionar Cliente / Parada</span>
                </button>
              </div>

              {/* Lista Ampla de Paradas */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxHeight: '550px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                {formData.paradas.map((p, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'rgba(7, 11, 18, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: '8px',
                      padding: '0.85rem 1rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: idx === 0 ? 'var(--accent-emerald)' : (idx === formData.paradas.length - 1 ? 'var(--accent-cyan)' : 'var(--accent-amber)'),
                          color: '#070b12',
                          fontWeight: 800,
                          fontSize: '0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {p.ordem}
                        </span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>
                          {idx === 0 ? 'Origem / Saída da Base' : (idx === formData.paradas.length - 1 ? 'Destino Final / Retorno' : `Parada #${p.ordem} (Cliente RJ)`)}
                        </span>
                      </div>

                      {formData.paradas.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveStopFromForm(idx)}
                          style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}
                          title="Remover esta parada"
                        >
                          <X size={14} />
                          <span>Remover</span>
                        </button>
                      )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.6fr 90px', gap: '0.65rem' }}>
                      <div>
                        <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>Nome do Cliente / Local:</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: Inter Japan Botafogo"
                          value={p.cliente}
                          onChange={(e) => {
                            const updated = [...formData.paradas];
                            updated[idx].cliente = e.target.value;
                            setFormData({ ...formData, paradas: updated });
                          }}
                          style={{ width: '100%', padding: '0.5rem 0.65rem', background: '#0e1524', border: '1px solid var(--border-subtle)', borderRadius: '4px', color: '#fff', fontSize: '0.82rem' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>Endereço Completo:</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: Rua General Polidoro, 74 - Botafogo"
                          value={p.endereco}
                          onChange={(e) => {
                            const updated = [...formData.paradas];
                            updated[idx].endereco = e.target.value;
                            setFormData({ ...formData, paradas: updated });
                          }}
                          style={{ width: '100%', padding: '0.5rem 0.65rem', background: '#0e1524', border: '1px solid var(--border-subtle)', borderRadius: '4px', color: '#fff', fontSize: '0.82rem' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>Horário:</label>
                        <input
                          type="text"
                          placeholder="08:30"
                          value={p.horario}
                          onChange={(e) => {
                            const updated = [...formData.paradas];
                            updated[idx].horario = e.target.value;
                            setFormData({ ...formData, paradas: updated });
                          }}
                          style={{ width: '100%', padding: '0.5rem 0.65rem', background: '#0e1524', border: '1px solid var(--border-subtle)', borderRadius: '4px', color: '#fff', fontSize: '0.82rem', textAlign: 'center' }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Resumo da Operação */}
              <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Distância Prevista:</span>
                    <strong style={{ fontSize: '1rem', color: 'var(--accent-emerald)' }}>{formData.distancia_prevista_km} km</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Total de Paradas:</span>
                    <strong style={{ fontSize: '1rem', color: 'var(--accent-cyan)' }}>{formData.paradas.length} clientes/locais</strong>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-primary btn-icon-text"
                  onClick={handleSaveSchedule}
                  style={{ background: 'var(--accent-emerald)', borderColor: 'var(--accent-emerald)', color: '#070b12', fontWeight: 700 }}
                >
                  <Check size={16} />
                  <span>Confirmar & Despachar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // MODO 3: QUADRO GERAL DE ESCALAS (TELA CHEIA NATIVA)
  // =========================================================================
  return (
    <div className="escala-module animate-fade-in" style={{ padding: '0.5rem 0' }}>
      {/* Banner Principal */}
      <div className="control-tower-banner" style={{ background: 'linear-gradient(135deg, rgba(14, 21, 36, 0.95) 0%, rgba(10, 15, 29, 0.98) 100%)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
        <div className="tower-header-text">
          <div className="tower-badge-live" style={{ background: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.3)', color: 'var(--accent-emerald)' }}>
            <span className="live-dot" style={{ background: 'var(--accent-emerald)' }}></span>
            <span>CENTRAL DE ESCALA OPERACIONAL & DESPACHO Central de Gestão • 2026</span>
          </div>
          <h2>Escala Diária de Motoristas, Veículos & Rotas</h2>
          <p>
            Vincule cada motorista homologado e veículo disponível aos circuitos do dia com múltiplos clientes e endereços de paradas: Vale Guaíba/CPBS, Amazon Meriti e Coletas Jogue Limpo RJ.
          </p>
        </div>

        <button 
          type="button" 
          className="btn-primary btn-icon-text"
          onClick={() => {
            setFormData(defaultScheduleState);
            setViewMode('form');
          }}
          style={{ background: 'var(--accent-emerald)', borderColor: 'var(--accent-emerald)', color: '#070b12', fontWeight: 700 }}
        >
          <Plus size={16} />
          <span>Nova Escala de Despacho (Tela Inteira)</span>
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
            <span>Sequenciamento logístico otimizada Central de Gestão</span>
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
          <div className="card-panel" style={{ textAlign: 'center', padding: '4rem 2rem', background: 'rgba(15, 23, 42, 0.4)', border: '1px dashed rgba(255, 255, 255, 0.12)', borderRadius: '12px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
              <Calendar size={32} style={{ color: 'var(--accent-emerald)' }} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
              Nenhuma Escala Operacional Cadastrada
            </h3>
            <p style={{ color: 'var(--text-muted)', maxWidth: '520px', margin: '0 auto 1.5rem', fontSize: '0.88rem', lineHeight: '1.5' }}>
              O quadro de despacho da Central de Gestão está 100% limpo. Nenhuma escala ou viagem foi pré-programada. Clique no botão abaixo para montar uma nova escala com veículo liberado, motorista e paradas do dia.
            </p>
            <button
              type="button"
              className="btn-primary btn-icon-text"
              onClick={() => {
                setFormData(defaultScheduleState);
                setViewMode('form');
              }}
              style={{ background: 'var(--accent-emerald)', borderColor: 'var(--accent-emerald)', color: '#070b12', fontWeight: 700, padding: '0.75rem 1.6rem', fontSize: '0.9rem' }}
            >
              <Plus size={18} />
              <span>+ Montar Nova Escala Operacional</span>
            </button>
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
                      onClick={() => {
                        setSelectedRomaneio(item);
                        setViewMode('romaneio');
                      }}
                      style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}
                      title="Visualizar Ficha de Despacho e Romaneio em Tela Cheia"
                    >
                      <FileText size={13} />
                      <span>Romaneio Central de Gestão</span>
                    </button>

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
                      {item.instrucoes_especiais || 'Operação conforme procedimento Central de Gestão.'}
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
    </div>
  );
}
