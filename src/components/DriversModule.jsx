import React, { useState, useEffect } from 'react';
import { 
  UserCheck, 
  Plus, 
  Search, 
  Filter, 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  Phone, 
  Truck, 
  FileCheck, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  XCircle, 
  RefreshCw,
  Award,
  AlertCircle,
  Database
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export default function DriversModule({ user }) {
  // Motoristas carregados do Supabase ou localStorage
  const [drivers, setDrivers] = useState(() => {
    try {
      const saved = localStorage.getItem('ambipar_real_drivers');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'disponivel' | 'viagem' | 'folga' | 'alerta_doc'
  const [showModal, setShowModal] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Formulário de Cadastro / Edição
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    cnh: '',
    categoria_cnh: 'E',
    validade_cnh: '',
    mopp_numero: '',
    validade_mopp: '',
    validade_toxicologico: '',
    nr20: true,
    nr35: true,
    telefone: '',
    status: 'Disponível',
    veiculo_vinculado: ''
  });

  // Salva no localStorage como backup persistente
  useEffect(() => {
    try {
      localStorage.setItem('ambipar_real_drivers', JSON.stringify(drivers));
    } catch (e) {
      console.warn('Erro ao salvar motoristas no localStorage:', e);
    }
  }, [drivers]);

  // Busca do Supabase se a tabela 'motoristas' existir
  const fetchSupabaseDrivers = async () => {
    if (!isSupabaseConfigured || !supabase) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('motoristas')
        .select('*')
        .order('nome', { ascending: true });

      if (!error && data && data.length > 0) {
        setDrivers(data);
      }
    } catch (err) {
      console.warn('Tabela motoristas ainda não executada no Supabase:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupabaseDrivers();
  }, []);

  // Função auxiliar de checagem de validade de documentos
  const checkDocStatus = (dateStr) => {
    if (!dateStr) return { status: 'nao_informado', label: 'Não informado', days: null };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expDate = new Date(dateStr);
    const diffTime = expDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { status: 'vencido', label: `VENCIDO (${Math.abs(diffDays)}d atrás)`, days: diffDays };
    }
    if (diffDays <= 30) {
      return { status: 'vencendo', label: `Vence em ${diffDays} dias`, days: diffDays };
    }
    return { status: 'valido', label: `Válido (${diffDays} dias)`, days: diffDays };
  };

  // Motorista com qualquer documento crítico vencido ou a vencer
  const hasComplianceAlert = (driver) => {
    const cnh = checkDocStatus(driver.validade_cnh);
    const mopp = checkDocStatus(driver.validade_mopp);
    const tox = checkDocStatus(driver.validade_toxicologico);
    return cnh.status === 'vencido' || mopp.status === 'vencido' || tox.status === 'vencido' ||
           cnh.status === 'vencendo' || mopp.status === 'vencendo' || tox.status === 'vencendo';
  };

  // Cadastro de Novo Motorista
  const handleSaveDriver = async (e) => {
    e.preventDefault();
    setFeedback(null);

    const newDriver = {
      ...formData,
      id: `MOT-${Date.now().toString().slice(-6)}`,
      created_at: new Date().toISOString()
    };

    // Tenta gravar no Supabase se configurado
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('motoristas')
          .insert([{
            user_id: user?.id,
            nome: formData.nome,
            cpf: formData.cpf,
            cnh: formData.cnh,
            categoria_cnh: formData.categoria_cnh,
            validade_cnh: formData.validade_cnh || null,
            mopp_numero: formData.mopp_numero,
            validade_mopp: formData.validade_mopp || null,
            validade_toxicologico: formData.validade_toxicologico || null,
            nr20: formData.nr20,
            nr35: formData.nr35,
            telefone: formData.telefone,
            status: formData.status,
            veiculo_vinculado: formData.veiculo_vinculado
          }])
          .select();

        if (!error && data && data.length > 0) {
          newDriver.id = data[0].id;
        }
      } catch (err) {
        console.warn('Gravação local realizada (tabela Supabase pendente):', err);
      }
    }

    setDrivers([newDriver, ...drivers]);
    setShowModal(false);
    setFeedback({ type: 'success', text: `Motorista ${formData.nome} cadastrado com sucesso!` });
    setTimeout(() => setFeedback(null), 4000);

    // Limpa formulário
    setFormData({
      nome: '',
      cpf: '',
      cnh: '',
      categoria_cnh: 'E',
      validade_cnh: '',
      mopp_numero: '',
      validade_mopp: '',
      validade_toxicologico: '',
      nr20: true,
      nr35: true,
      telefone: '',
      status: 'Disponível',
      veiculo_vinculado: ''
    });
  };

  // Alterar Status do Motorista
  const handleChangeStatus = (id, newStatus) => {
    const updated = drivers.map(d => d.id === id ? { ...d, status: newStatus } : d);
    setDrivers(updated);

    if (isSupabaseConfigured && supabase) {
      supabase.from('motoristas').update({ status: newStatus }).eq('id', id).then();
    }
  };

  // Excluir Motorista
  const handleDeleteDriver = (id, nome) => {
    if (window.confirm(`Tem certeza que deseja remover o motorista ${nome}?`)) {
      setDrivers(drivers.filter(d => d.id !== id));
      if (isSupabaseConfigured && supabase) {
        supabase.from('motoristas').delete().eq('id', id).then();
      }
    }
  };

  // Contadores Reais
  const totalDrivers = drivers.length;
  const availableDrivers = drivers.filter(d => d.status === 'Disponível').length;
  const onTripDrivers = drivers.filter(d => d.status === 'Em Viagem').length;
  const alertDrivers = drivers.filter(hasComplianceAlert).length;

  // Filtragem
  const filteredDrivers = drivers.filter(d => {
    const matchesSearch = 
      (d.nome && d.nome.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (d.cnh && d.cnh.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (d.cpf && d.cpf.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (d.veiculo_vinculado && d.veiculo_vinculado.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (statusFilter === 'all') return true;
    if (statusFilter === 'disponivel') return d.status === 'Disponível';
    if (statusFilter === 'viagem') return d.status === 'Em Viagem';
    if (statusFilter === 'folga') return d.status === 'Folga';
    if (statusFilter === 'alerta_doc') return hasComplianceAlert(d);
    return true;
  });

  return (
    <div className="module-view animate-fade-in" id="drivers-module-root">
      {/* Cabeçalho do Módulo */}
      <div className="module-page-header">
        <div>
          <div className="module-tag">
            <UserCheck size={16} />
            <span>GESTÃO DE MOTORISTAS & CERTIFICAÇÃO MOPP</span>
          </div>
          <h2>Quadro de Motoristas & Conformidade Técnica</h2>
          <p>
            Controle de condutores habilitados para cargas perigosas, monitoramento de validade de CNH, curso MOPP, exames toxicológicos e NRs.
          </p>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="btn-secondary btn-icon-text"
            onClick={fetchSupabaseDrivers}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'spin-icon' : ''} />
            <span>Atualizar</span>
          </button>

          <button
            type="button"
            className="btn-primary btn-icon-text"
            onClick={() => setShowModal(true)}
            id="open-new-driver-modal-btn"
          >
            <Plus size={18} />
            <span>Cadastrar Motorista</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className={`alert alert-${feedback.type} animate-fade-in`} style={{ marginBottom: '1rem' }}>
          <CheckCircle2 size={18} />
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Cards de Métricas Operacionais de Motoristas */}
      <div className="mtr-summary-cards">
        <div className="summary-stat-box">
          <span className="stat-label">Total de Motoristas</span>
          <span className="stat-number">{totalDrivers}</span>
          <span className="stat-sub">Condutores homologados</span>
        </div>

        <div className="summary-stat-box success">
          <span className="stat-label">Disponíveis no Pátio / CCO</span>
          <span className="stat-number">{availableDrivers}</span>
          <span className="stat-sub">Prontos para escala imediata</span>
        </div>

        <div className="summary-stat-box cyan">
          <span className="stat-label">Em Viagem / Rota Ativa</span>
          <span className="stat-number">{onTripDrivers}</span>
          <span className="stat-sub">Operando em trânsito</span>
        </div>

        <div className={`summary-stat-box ${alertDrivers > 0 ? 'danger' : 'forest'}`}>
          <span className="stat-label">Alertas de Documentação</span>
          <span className="stat-number">{alertDrivers}</span>
          <span className="stat-sub">
            {alertDrivers > 0 ? 'CNH, MOPP ou Toxicológico a expirar' : '100% dos documentos em dia'}
          </span>
        </div>
      </div>

      {/* Tabela e Filtros de Motoristas */}
      <div className="card-panel" style={{ marginTop: '1.5rem' }}>
        <div className="live-board-header">
          <div>
            <h3>Quadro Operacional de Condutores</h3>
            <p>Acompanhamento de status da jornada e conformidade regulatória (ANTT / Detran)</p>
          </div>

          <div className="table-controls-bar">
            {/* Campo de Busca */}
            <div className="search-input-wrap">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Buscar por nome, CNH, CPF, placa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filtros Rápidos de Status */}
            <div className="filter-pill-buttons">
              <button
                type="button"
                className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
                onClick={() => setStatusFilter('all')}
              >
                Todos ({totalDrivers})
              </button>
              <button
                type="button"
                className={`filter-btn ${statusFilter === 'disponivel' ? 'active' : ''}`}
                onClick={() => setStatusFilter('disponivel')}
              >
                Disponíveis ({availableDrivers})
              </button>
              <button
                type="button"
                className={`filter-btn ${statusFilter === 'viagem' ? 'active' : ''}`}
                onClick={() => setStatusFilter('viagem')}
              >
                Em Viagem ({onTripDrivers})
              </button>
              <button
                type="button"
                className={`filter-btn ${statusFilter === 'alerta_doc' ? 'active' : ''}`}
                onClick={() => setStatusFilter('alerta_doc')}
              >
                Alertas ({alertDrivers})
              </button>
            </div>
          </div>
        </div>

        {/* Listagem de Motoristas */}
        <div className="table-responsive-wrapper">
          <table className="operational-table">
            <thead>
              <tr>
                <th>Motorista & Contato</th>
                <th>CNH & Categoria</th>
                <th>Certificação MOPP</th>
                <th>Toxicológico</th>
                <th>NRs (20/35)</th>
                <th>Veículo Vinculado</th>
                <th>Status Operacional</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredDrivers.length === 0 ? (
                <tr>
                  <td colSpan="8" className="empty-table-state">
                    <p style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                      Nenhum motorista localizado com os critérios informados.
                    </p>
                    <span style={{ fontSize: '0.85rem' }}>
                      Clique em <strong>"Cadastrar Motorista"</strong> para registrar os primeiros condutores da sua frota.
                    </span>
                  </td>
                </tr>
              ) : (
                filteredDrivers.map((d) => {
                  const cnhStatus = checkDocStatus(d.validade_cnh);
                  const moppStatus = checkDocStatus(d.validade_mopp);
                  const toxStatus = checkDocStatus(d.validade_toxicologico);

                  return (
                    <tr key={d.id}>
                      <td>
                        <div className="driver-identity-cell">
                          <strong>{d.nome}</strong>
                          <div className="driver-contact-line">
                            {d.telefone && (
                              <span className="contact-tag">
                                <Phone size={12} /> {d.telefone}
                              </span>
                            )}
                            {d.cpf && <small>CPF: {d.cpf}</small>}
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="cnh-cell">
                          <span className="cnh-number">CNH: {d.cnh} (Cat. {d.categoria_cnh || 'E'})</span>
                          <span className={`doc-status-badge ${cnhStatus.status}`}>
                            {cnhStatus.label}
                          </span>
                        </div>
                      </td>

                      <td>
                        <div className="mopp-cell">
                          <div className="mopp-header-tag">
                            <Award size={13} className="text-emerald" />
                            <strong>{d.mopp_numero ? `MOPP: ${d.mopp_numero}` : 'MOPP Ativo'}</strong>
                          </div>
                          <span className={`doc-status-badge ${moppStatus.status}`}>
                            {moppStatus.label}
                          </span>
                        </div>
                      </td>

                      <td>
                        <span className={`doc-status-badge ${toxStatus.status}`}>
                          {toxStatus.label}
                        </span>
                      </td>

                      <td>
                        <div className="nr-tags-box">
                          <span className={`nr-badge ${d.nr20 ? 'valid' : 'invalid'}`}>
                            NR-20 {d.nr20 ? '✓' : '✗'}
                          </span>
                          <span className={`nr-badge ${d.nr35 ? 'valid' : 'invalid'}`}>
                            NR-35 {d.nr35 ? '✓' : '✗'}
                          </span>
                        </div>
                      </td>

                      <td>
                        {d.veiculo_vinculado ? (
                          <span className="plate-badge">{d.veiculo_vinculado}</span>
                        ) : (
                          <small style={{ color: 'var(--text-dim)' }}>Não vinculado</small>
                        )}
                      </td>

                      <td>
                        <select
                          className={`status-select-inline ${d.status.toLowerCase().replace(' ', '_')}`}
                          value={d.status}
                          onChange={(e) => handleChangeStatus(d.id, e.target.value)}
                        >
                          <option value="Disponível">Disponível</option>
                          <option value="Em Viagem">Em Viagem</option>
                          <option value="Folga">Folga / Descanso</option>
                          <option value="Bloqueado">Bloqueado (Doc)</option>
                        </select>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="btn-danger-icon"
                          onClick={() => handleDeleteDriver(d.id, d.nome)}
                          title="Remover motorista"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Cadastro de Motorista */}
      {showModal && (
        <div className="modal-backdrop animate-fade-in" id="new-driver-modal">
          <div className="modal-container" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <div className="header-icon-label">
                <UserCheck size={20} className="icon-emerald" />
                <h3>Cadastrar Novo Motorista Homologado</h3>
              </div>
              <button 
                type="button" 
                className="modal-close-btn"
                onClick={() => setShowModal(false)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveDriver} className="modal-form">
              <div className="grid-2-cols">
                <div className="input-group-custom">
                  <label>Nome Completo do Condutor *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Carlos Eduardo dos Santos"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  />
                </div>

                <div className="input-group-custom">
                  <label>CPF do Motorista</label>
                  <input
                    type="text"
                    placeholder="000.000.000-00"
                    value={formData.cpf}
                    onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid-2-cols">
                <div className="input-group-custom">
                  <label>Número do Registro CNH *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 04981726354"
                    value={formData.cnh}
                    onChange={(e) => setFormData({ ...formData, cnh: e.target.value })}
                  />
                </div>

                <div className="grid-2-cols">
                  <div className="input-group-custom">
                    <label>Categoria</label>
                    <select
                      value={formData.categoria_cnh}
                      onChange={(e) => setFormData({ ...formData, categoria_cnh: e.target.value })}
                      className="select-custom"
                    >
                      <option value="E">Cat. E (Articulados)</option>
                      <option value="D">Cat. D (Pesados)</option>
                      <option value="C">Cat. C (Truck)</option>
                    </select>
                  </div>

                  <div className="input-group-custom">
                    <label>Validade CNH *</label>
                    <input
                      type="date"
                      required
                      value={formData.validade_cnh}
                      onChange={(e) => setFormData({ ...formData, validade_cnh: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="grid-2-cols">
                <div className="input-group-custom">
                  <label>Certificado MOPP (Resoluções ANTT)</label>
                  <input
                    type="text"
                    placeholder="Ex: MOPP-89412"
                    value={formData.mopp_numero}
                    onChange={(e) => setFormData({ ...formData, mopp_numero: e.target.value })}
                  />
                </div>

                <div className="input-group-custom">
                  <label>Validade Curso MOPP *</label>
                  <input
                    type="date"
                    required
                    value={formData.validade_mopp}
                    onChange={(e) => setFormData({ ...formData, validade_mopp: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid-2-cols">
                <div className="input-group-custom">
                  <label>Validade Exame Toxicológico</label>
                  <input
                    type="date"
                    value={formData.validade_toxicologico}
                    onChange={(e) => setFormData({ ...formData, validade_toxicologico: e.target.value })}
                  />
                </div>

                <div className="input-group-custom">
                  <label>Telefone / WhatsApp de Contato</label>
                  <input
                    type="text"
                    placeholder="(19) 99876-5432"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid-2-cols">
                <div className="input-group-custom">
                  <label>Veículo / Placa Habitual</label>
                  <input
                    type="text"
                    placeholder="Ex: AMB-4K89"
                    value={formData.veiculo_vinculado}
                    onChange={(e) => setFormData({ ...formData, veiculo_vinculado: e.target.value.toUpperCase() })}
                  />
                </div>

                <div className="input-group-custom">
                  <label>Status Inicial</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="select-custom"
                  >
                    <option value="Disponível">Disponível no Pátio</option>
                    <option value="Em Viagem">Em Viagem / Rota</option>
                    <option value="Folga">Folga Regulamentar</option>
                  </select>
                </div>
              </div>

              {/* Checkboxes de NRs */}
              <div style={{ display: 'flex', gap: '2rem', marginTop: '0.5rem', padding: '0.75rem', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-sm)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                  <input
                    type="checkbox"
                    checked={formData.nr20}
                    onChange={(e) => setFormData({ ...formData, nr20: e.target.checked })}
                  />
                  <span>Capacitação NR-20 (Inflamáveis)</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                  <input
                    type="checkbox"
                    checked={formData.nr35}
                    onChange={(e) => setFormData({ ...formData, nr35: e.target.checked })}
                  />
                  <span>Capacitação NR-35 (Trabalho em Altura)</span>
                </label>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Salvar e Homologar Motorista
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
