import React, { useState, useEffect } from 'react';
import { 
  UserCheck, 
  Plus, 
  Search, 
  ShieldCheck, 
  AlertTriangle, 
  Phone, 
  Truck, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  RefreshCw,
  Award,
  Calendar,
  MessageCircle,
  ArrowLeft,
  Save,
  Check,
  Flame,
  Layers,
  User,
  ShieldAlert,
  FileText,
  Upload
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import PremiumSelect from './PremiumSelect';
import { readCnhPdfFile } from '../utils/cnhPdfReader';

export const STATUS_OPTIONS = [
  { 
    value: 'Disponível', 
    label: 'Disponível no Pátio / CCO', 
    sublabel: 'Pronto para escala e alocação imediata', 
    color: '#10b981',
    badge: 'Liberado'
  },
  { 
    value: 'Bloqueado', 
    label: 'Bloqueado (Documentação / CCO)', 
    sublabel: 'Pendência em CNH, MOPP, Toxicológico ou NR', 
    color: '#f43f5e',
    badge: 'Bloqueado'
  }
];

export const DEFAULT_FLEET = [
  { placa: 'AMB-4K89', modelo: 'Carreta Tanque Inox Químico (Volvo FH 540)' },
  { placa: 'AMB-9T21', modelo: 'Carreta Sider Resíduos Classe I (Scania R450)' },
  { placa: 'AMB-2M33', modelo: 'Auto-Vácuo Sucção Líquidos (Actros 2651)' },
  { placa: 'AMB-7X10', modelo: 'Roll-on / Caçamba Estanque (Volvo VM 330)' },
  { placa: 'AMB-5P44', modelo: 'Bitrem Graneleiro / Big Bags (DAF XF 530)' },
  { placa: 'AMB-8L19', modelo: 'Baú Carga Perigosa Fracionada (Constellation)' }
];

export const CNH_CATEGORIES = [
  {
    value: 'E',
    label: 'Categoria E (Combinações Pesadas)',
    sublabel: 'Carretas Tanque, Bitrens, Rodotrens e Articulados',
    icon: '🚛'
  },
  {
    value: 'D',
    label: 'Categoria D (Caminhões Pesados)',
    sublabel: 'Caminhões Truck, Bi-truck e Coletivos',
    icon: '🚚'
  },
  {
    value: 'C',
    label: 'Categoria C (Carga Média)',
    sublabel: 'Caminhões Toco, VUC e Cargas Fracionadas',
    icon: '📦'
  }
];
// Utilitário de cálculo automático de contagem regressiva de validade
export const getCountdown = (dateStr) => {
  if (!dateStr) return { status: 'none', text: 'Não informada', days: null, badgeClass: 'badge-muted', color: '#64748b' };
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // Garante parsing local correto sem desvio de fuso
  const [year, month, day] = dateStr.split('-');
  const target = new Date(Number(year), Number(month) - 1, Number(day));
  
  const diffTime = target - today;
  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (days < 0) {
    return {
      status: 'expired',
      days,
      text: `VENCIDO há ${Math.abs(days)} dia(s)`,
      badgeClass: 'badge-expired',
      color: '#f43f5e'
    };
  }
  if (days === 0) {
    return {
      status: 'today',
      days: 0,
      text: 'VENCE HOJE!',
      badgeClass: 'badge-expired',
      color: '#f43f5e'
    };
  }
  if (days <= 30) {
    return {
      status: 'critical',
      days,
      text: `Faltam ${days} dia(s) (Alerta Crítico)`,
      badgeClass: 'badge-warning',
      color: '#f59e0b'
    };
  }
  if (days <= 60) {
    return {
      status: 'attention',
      days,
      text: `Restam ${days} dia(s) (Atenção)`,
      badgeClass: 'badge-attention',
      color: '#38bdf8'
    };
  }
  return {
    status: 'valid',
    days,
    text: `Válido (${days} dias restantes)`,
    badgeClass: 'badge-valid',
    color: '#10b981'
  };
};

export default function DriversModule({ user }) {
  // Controle de visualização: 'list' (Quadro Geral) ou 'form' (Formulário Amplo na Página, sem pop-up)
  const [viewMode, setViewMode] = useState('list');
  const [editingId, setEditingId] = useState(null);

  // Motoristas reais
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
  const [statusFilter, setStatusFilter] = useState('all');
  const [feedback, setFeedback] = useState(null);

  // Frotas Integradas (pré-programado para alimentar o futuro Módulo de Frotas)
  const [fleetVehicles, setFleetVehicles] = useState(() => {
    try {
      const saved = localStorage.getItem('ambipar_fleet_vehicles');
      return saved ? JSON.parse(saved) : DEFAULT_FLEET;
    } catch {
      return DEFAULT_FLEET;
    }
  });

  // Salva veículos da frota no localStorage
  useEffect(() => {
    try {
      localStorage.setItem('ambipar_fleet_vehicles', JSON.stringify(fleetVehicles));
    } catch (e) {
      console.warn('Erro ao salvar veículos da frota:', e);
    }
  }, [fleetVehicles]);

  // Estado do Formulário Completo com Todos os Cursos
  const initialForm = {
    nome: '',
    cpf: '',
    telefone: '',
    telefone_emergencia: '',
    cnh: '',
    categoria_cnh: 'E',
    validade_cnh: '',
    mopp_numero: '',
    validade_mopp: '',
    validade_toxicologico: '',
    validade_nr20: '',
    validade_nr35: '',
    validade_nr33: '',
    validade_direcao_defensiva: '',
    validade_cargas_especiais: '',
    validade_hazmat_pae: '',
    veiculo_vinculado: '',
    status: 'Disponível',
    observacoes: ''
  };

  const [formData, setFormData] = useState(initialForm);
  const [pdfExtracting, setPdfExtracting] = useState(false);
  const [pdfSuccessMessage, setPdfSuccessMessage] = useState(null);

  // Leitura 100% no cliente da CNH via PDF (Sem armazenamento no Supabase)
  const handlePdfUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reseta o input para permitir selecionar o mesmo arquivo novamente se desejar
    e.target.value = '';

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      alert('Por favor, selecione um arquivo em formato PDF da CNH.');
      return;
    }

    setPdfExtracting(true);
    setPdfSuccessMessage(null);

    try {
      const extracted = await readCnhPdfFile(file);
      
      setFormData(prev => ({
        ...prev,
        nome: extracted.nome || prev.nome,
        cpf: extracted.cpf || prev.cpf,
        cnh: extracted.cnh || prev.cnh,
        categoria_cnh: extracted.categoria_cnh || prev.categoria_cnh,
        validade_cnh: extracted.validade_cnh || prev.validade_cnh,
        mopp_numero: extracted.mopp_numero || prev.mopp_numero
      }));

      const filledFields = [];
      if (extracted.nome) filledFields.push('Nome');
      if (extracted.cpf) filledFields.push('CPF');
      if (extracted.cnh) filledFields.push('Nº Registro CNH');
      if (extracted.categoria_cnh) filledFields.push(`Categoria (${extracted.categoria_cnh})`);
      if (extracted.validade_cnh) filledFields.push('Validade CNH');
      if (extracted.mopp_numero) filledFields.push('MOPP');

      if (filledFields.length > 0) {
        setPdfSuccessMessage(`CNH processada em memória! Campos preenchidos: ${filledFields.join(', ')}. Zero espaço consumido no Supabase.`);
      } else {
        alert('O PDF foi lido, mas nenhum campo de CNH foi identificado. O arquivo pode ser uma imagem escaneada sem OCR.');
      }
    } catch (err) {
      console.error('Erro ao ler PDF da CNH:', err);
      alert(`Falha ao ler o PDF da CNH: ${err.message || 'Verifique se o arquivo é um PDF de CNH válido'}`);
    } finally {
      setPdfExtracting(false);
    }
  };

  // Salva no localStorage como backup persistente
  useEffect(() => {
    try {
      localStorage.setItem('ambipar_real_drivers', JSON.stringify(drivers));
    } catch (e) {
      console.warn('Erro ao salvar motoristas:', e);
    }
  }, [drivers]);

  // Busca registros do Supabase se a tabela existir
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

  // Prepara formulário para cadastrar
  const handleOpenCreateForm = () => {
    setEditingId(null);
    setFormData(initialForm);
    setPdfSuccessMessage(null);
    setPdfExtracting(false);
    setViewMode('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Prepara formulário para editar
  const handleOpenEditForm = (driver) => {
    setEditingId(driver.id);
    setPdfSuccessMessage(null);
    setPdfExtracting(false);
    setFormData({
      nome: driver.nome || '',
      cpf: driver.cpf || '',
      telefone: driver.telefone || '',
      telefone_emergencia: driver.telefone_emergencia || '',
      cnh: driver.cnh || '',
      categoria_cnh: driver.categoria_cnh || 'E',
      validade_cnh: driver.validade_cnh || '',
      mopp_numero: driver.mopp_numero || '',
      validade_mopp: driver.validade_mopp || '',
      validade_toxicologico: driver.validade_toxicologico || '',
      validade_nr20: driver.validade_nr20 || '',
      validade_nr35: driver.validade_nr35 || '',
      validade_nr33: driver.validade_nr33 || '',
      validade_direcao_defensiva: driver.validade_direcao_defensiva || '',
      validade_cargas_especiais: driver.validade_cargas_especiais || '',
      validade_hazmat_pae: driver.validade_hazmat_pae || '',
      veiculo_vinculado: driver.veiculo_vinculado || '',
      status: driver.status === 'Bloqueado' ? 'Bloqueado' : 'Disponível',
      observacoes: driver.observacoes || ''
    });
    setViewMode('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Submissão do formulário
  const handleSubmitForm = async (e) => {
    e.preventDefault();

    // Se tiver informado uma placa, salva automaticamente na frota para o módulo de frotas
    if (formData.veiculo_vinculado) {
      const cleanPlate = formData.veiculo_vinculado.toUpperCase().trim();
      const exists = fleetVehicles.some(v => v.placa === cleanPlate);
      if (!exists && cleanPlate.length >= 7) {
        const updatedFleet = [
          ...fleetVehicles,
          { placa: cleanPlate, modelo: `Equipamento Vinculado (${formData.nome})`, tipo: 'Frota Operacional' }
        ];
        setFleetVehicles(updatedFleet);
        try {
          localStorage.setItem('ambipar_fleet_vehicles', JSON.stringify(updatedFleet));
        } catch (err) {
          console.warn('Erro ao salvar na frota:', err);
        }
      }
    }

    if (editingId) {
      // Edição
      const updatedList = drivers.map(d => d.id === editingId ? { ...formData, id: editingId } : d);
      setDrivers(updatedList);

      if (isSupabaseConfigured && supabase) {
        try {
          await supabase.from('motoristas').update(formData).eq('id', editingId);
        } catch (err) {
          console.warn('Erro ao atualizar no Supabase:', err);
        }
      }
      setFeedback({ type: 'success', text: `Motorista ${formData.nome} atualizado com sucesso!` });
    } else {
      // Novo Cadastro
      const newDriver = {
        ...formData,
        id: `MOT-${Date.now().toString().slice(-6)}`,
        created_at: new Date().toISOString()
      };

      if (isSupabaseConfigured && supabase) {
        try {
          const { data, error } = await supabase
            .from('motoristas')
            .insert([{
              user_id: user?.id,
              ...formData
            }])
            .select();

          if (!error && data && data.length > 0) {
            newDriver.id = data[0].id;
          }
        } catch (err) {
          console.warn('Gravação local realizada (Supabase pendente):', err);
        }
      }

      setDrivers([newDriver, ...drivers]);
      setFeedback({ type: 'success', text: `Motorista ${formData.nome} homologado com sucesso!` });
    }

    setViewMode('list');
    setTimeout(() => setFeedback(null), 4000);
  };

  // Alterar Status diretamente na tabela
  const handleChangeStatus = (id, newStatus) => {
    const updated = drivers.map(d => d.id === id ? { ...d, status: newStatus } : d);
    setDrivers(updated);

    if (isSupabaseConfigured && supabase) {
      supabase.from('motoristas').update({ status: newStatus }).eq('id', id).then();
    }
  };

  // Excluir Motorista
  const handleDeleteDriver = (id, nome) => {
    if (window.confirm(`Tem certeza que deseja remover o cadastro do motorista ${nome}?`)) {
      setDrivers(drivers.filter(d => d.id !== id));
      if (isSupabaseConfigured && supabase) {
        supabase.from('motoristas').delete().eq('id', id).then();
      }
    }
  };

  // Verifica se o motorista tem alerta de conformidade em qualquer documento ou curso
  const hasComplianceAlert = (driver) => {
    const dates = [
      driver.validade_cnh,
      driver.validade_mopp,
      driver.validade_toxicologico,
      driver.validade_nr20,
      driver.validade_nr35,
      driver.validade_nr33,
      driver.validade_direcao_defensiva,
      driver.validade_cargas_especiais,
      driver.validade_hazmat_pae
    ];

    return dates.some(d => {
      if (!d) return false;
      const c = getCountdown(d);
      return c.status === 'expired' || c.status === 'today' || c.status === 'critical';
    });
  };

  // Contadores Globais (apenas Disponível e Bloqueado)
  const totalDrivers = drivers.length;
  const availableDrivers = drivers.filter(d => d.status === 'Disponível').length;
  const blockedDrivers = drivers.filter(d => d.status === 'Bloqueado').length;
  const alertDrivers = drivers.filter(hasComplianceAlert).length;

  // Filtragem da lista
  const filteredDrivers = drivers.filter(d => {
    const s = searchTerm.toLowerCase();
    const matchesSearch = 
      (d.nome && d.nome.toLowerCase().includes(s)) ||
      (d.cnh && d.cnh.toLowerCase().includes(s)) ||
      (d.cpf && d.cpf.toLowerCase().includes(s)) ||
      (d.telefone && d.telefone.toLowerCase().includes(s)) ||
      (d.veiculo_vinculado && d.veiculo_vinculado.toLowerCase().includes(s));

    if (!matchesSearch) return false;

    if (statusFilter === 'all') return true;
    if (statusFilter === 'disponivel') return d.status === 'Disponível';
    if (statusFilter === 'bloqueado') return d.status === 'Bloqueado';
    if (statusFilter === 'alerta_doc') return hasComplianceAlert(d);
    return true;
  });

  // Link para o WhatsApp Web direto
  const getWhatsAppLink = (phoneStr) => {
    if (!phoneStr) return null;
    const cleanNumber = phoneStr.replace(/\D/g, '');
    const fullNumber = cleanNumber.startsWith('55') ? cleanNumber : `55${cleanNumber}`;
    return `https://wa.me/${fullNumber}`;
  };

  return (
    <div className="module-view animate-fade-in" id="drivers-module-root">
      {/* ============================================================== */}
      {/* CABEÇALHO DO MÓDULO */}
      {/* ============================================================== */}
      <div className="module-page-header">
        <div>
          <div className="module-tag">
            <UserCheck size={16} />
            <span>GESTÃO TÉCNICA DE CONDUTORES & COMPLIANCE MOPP</span>
          </div>
          <h2>Quadro de Motoristas & Validades em Tempo Real</h2>
          <p>
            Monitoramento de CNH, curso MOPP, exames toxicológicos e NRs com contadores automáticos de expiração e acionamento direto via WhatsApp.
          </p>
        </div>

        <div className="header-actions">
          {viewMode === 'form' ? (
            <button
              type="button"
              className="btn-secondary btn-icon-text"
              onClick={() => setViewMode('list')}
            >
              <ArrowLeft size={16} />
              <span>Voltar ao Quadro de Motoristas</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                className="btn-secondary btn-icon-text"
                onClick={fetchSupabaseDrivers}
                disabled={loading}
              >
                <RefreshCw size={16} className={loading ? 'spin-icon' : ''} />
                <span>Sincronizar Banco</span>
              </button>

              <button
                type="button"
                className="btn-primary btn-icon-text"
                onClick={handleOpenCreateForm}
                id="open-create-driver-btn"
              >
                <Plus size={18} />
                <span>Cadastrar Novo Motorista</span>
              </button>
            </>
          )}
        </div>
      </div>

      {feedback && (
        <div className={`alert alert-${feedback.type} animate-fade-in`} style={{ marginBottom: '1rem' }}>
          <CheckCircle2 size={18} />
          <span>{feedback.text}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODO 1: FORMULÁRIO COMPLETO NA PÁGINA (SEM POP-UP CLAUSTROFÓBICO) */}
      {/* ============================================================== */}
      {viewMode === 'form' ? (
        <form onSubmit={handleSubmitForm} className="driver-full-page-form animate-fade-in" id="driver-form">
          <div className="form-header-banner">
            <div>
              <h3>{editingId ? 'Editar Cadastro do Motorista' : 'Homologar Novo Motorista na Frota Ambipar'}</h3>
              <p>Preencha os dados e acompanhe o contador de validade em tempo real ao selecionar cada data</p>
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
                <span>{editingId ? 'Salvar Alterações' : 'Concluir Cadastro do Motorista'}</span>
              </button>
            </div>
          </div>

          {/* Banner de Leitura & Preenchimento Automático de CNH em Memória (Zero Armazenamento no Supabase) */}
          <div className="cnh-pdf-import-banner">
            <div className="cnh-pdf-import-info">
              <div className="cnh-pdf-icon-wrap">
                <FileText size={24} />
              </div>
              <div>
                <h4>Leitura & Preenchimento Automático por CNH (PDF)</h4>
                <p>
                  Carregue o PDF da CNH Digital (CDT / Senatran). O sistema extrai <strong>Nome Completo, Registro CNH, CPF e Data de Validade</strong> diretamente na memória do seu navegador. <strong>Nenhum arquivo é salvo no Supabase</strong>, economizando 100% do seu espaço de nuvem.
                </p>
                {pdfSuccessMessage && (
                  <div className="pdf-success-pill">
                    <CheckCircle2 size={15} />
                    <span>{pdfSuccessMessage}</span>
                  </div>
                )}
              </div>
            </div>

            <label className={`cnh-upload-btn ${pdfExtracting ? 'loading' : ''}`}>
              <Upload size={17} />
              <span>{pdfExtracting ? 'Lendo CNH no Navegador...' : 'Importar CNH (PDF)'}</span>
              <input
                type="file"
                accept="application/pdf,.pdf"
                onChange={handlePdfUpload}
                disabled={pdfExtracting}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          <div className="driver-form-sections-grid">
            {/* Bloco 1: Identificação & Área de Contato do Motorista */}
            <div className="card-panel card-z-top" style={{ position: 'relative', zIndex: 40 }}>
              <div className="panel-header">
                <div className="header-icon-label">
                  <User size={20} className="icon-emerald" />
                  <div>
                    <h4>1. Identificação & Contato Direto</h4>
                    <p>Dados civis e canais de comunicação com o condutor</p>
                  </div>
                </div>
              </div>

              <div className="input-group-custom" style={{ marginBottom: '1rem' }}>
                <label>Nome Completo do Motorista *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Eduardo dos Santos"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                />
              </div>

              <div className="grid-2-cols" style={{ marginBottom: '1rem' }}>
                <div className="input-group-custom">
                  <label>CPF do Motorista</label>
                  <input
                    type="text"
                    placeholder="000.000.000-00"
                    value={formData.cpf}
                    onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                  />
                </div>

                <div className="input-group-custom">
                  <label>Status Operacional Inicial</label>
                  <PremiumSelect
                    value={formData.status}
                    onChange={(val) => setFormData({ ...formData, status: val })}
                    options={STATUS_OPTIONS}
                    id="driver-status-select"
                  />
                </div>
              </div>

              {/* Área Destacada de Contato Telefônico & WhatsApp */}
              <div className="contact-highlight-container">
                <div className="contact-highlight-header">
                  <Phone size={18} className="text-emerald" />
                  <strong>Área de Contato Operacional & WhatsApp</strong>
                </div>

                {/* Enquadramento e alinhamento dos 2 números na mesma altura exata */}
                <div className="contact-numbers-aligned-grid">
                  <div className="input-group-custom">
                    <label>Telefone / WhatsApp Principal *</label>
                    <div className="input-with-unit">
                      <input
                        type="text"
                        required
                        placeholder="(19) 99876-5432"
                        value={formData.telefone}
                        onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                      />
                      <span className="unit-tag">
                        <MessageCircle size={15} style={{ color: '#25D366' }} />
                      </span>
                    </div>
                  </div>

                  <div className="input-group-custom">
                    <label>Telefone de Emergência / Recado</label>
                    <div className="input-with-unit">
                      <input
                        type="text"
                        placeholder="(19) 3876-0000"
                        value={formData.telefone_emergencia}
                        onChange={(e) => setFormData({ ...formData, telefone_emergencia: e.target.value })}
                      />
                      <span className="unit-tag">
                        <Phone size={15} style={{ color: '#94a3b8' }} />
                      </span>
                    </div>
                  </div>
                </div>

                {formData.telefone && (
                  <div className="whatsapp-preview-box">
                    <span className="whatsapp-chip">
                      <MessageCircle size={14} /> WhatsApp Integrado:
                    </span>
                    <span className="whatsapp-number">{formData.telefone}</span>
                    <a
                      href={getWhatsAppLink(formData.telefone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="whatsapp-test-btn"
                    >
                      Testar Link de Mensagem ➔
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Bloco 2: CNH & Exame Toxicológico com Contadores Regressivos */}
            <div className="card-panel card-z-mid-high" style={{ position: 'relative', zIndex: 35 }}>
              <div className="panel-header">
                <div className="header-icon-label">
                  <ShieldCheck size={20} className="icon-cyan" />
                  <div>
                    <h4>2. Habilitação CNH & Toxicológico</h4>
                    <p>Contadores automáticos de expiração e categoria</p>
                  </div>
                </div>
              </div>

              {/* Número de Registro CNH com espaço amplo e legível */}
              <div className="input-group-custom" style={{ marginBottom: '1.2rem' }}>
                <label>Número de Registro CNH (11 dígitos) *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 04981726354"
                  value={formData.cnh}
                  onChange={(e) => setFormData({ ...formData, cnh: e.target.value.replace(/\D/g, '').slice(0, 11) })}
                  style={{ fontSize: '1.05rem', fontWeight: 600, letterSpacing: '0.06em' }}
                />
              </div>

              {/* Categoria CNH em linha própria com espaço total para ícones e textos */}
              <div className="input-group-custom" style={{ marginBottom: '1.25rem' }}>
                <label>Categoria da Carteira Nacional de Habilitação</label>
                <PremiumSelect
                  value={formData.categoria_cnh}
                  onChange={(val) => setFormData({ ...formData, categoria_cnh: val })}
                  options={CNH_CATEGORIES}
                  id="driver-cnh-category-select"
                />
              </div>

              {/* Data Validade CNH com Contador Automático */}
              <div className="date-field-with-countdown-card" style={{ marginBottom: '1.25rem' }}>
                <div className="input-group-custom">
                  <label>Data de Validade da CNH *</label>
                  <input
                    type="date"
                    required
                    value={formData.validade_cnh}
                    onChange={(e) => setFormData({ ...formData, validade_cnh: e.target.value })}
                  />
                </div>

                {formData.validade_cnh && (
                  <div className={`countdown-live-banner ${getCountdown(formData.validade_cnh).badgeClass}`}>
                    <Calendar size={15} />
                    <strong>CNH:</strong>
                    <span>{getCountdown(formData.validade_cnh).text}</span>
                  </div>
                )}
              </div>

              {/* Data Validade Toxicológico com Contador Automático */}
              <div className="date-field-with-countdown-card">
                <div className="input-group-custom">
                  <label>Validade do Exame Toxicológico Periódico</label>
                  <input
                    type="date"
                    value={formData.validade_toxicologico}
                    onChange={(e) => setFormData({ ...formData, validade_toxicologico: e.target.value })}
                  />
                </div>

                {formData.validade_toxicologico && (
                  <div className={`countdown-live-banner ${getCountdown(formData.validade_toxicologico).badgeClass}`}>
                    <Calendar size={15} />
                    <strong>Toxicológico:</strong>
                    <span>{getCountdown(formData.validade_toxicologico).text}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bloco 3: Curso MOPP & Treinamentos de Segurança (NRs e Especializações Ambipar) */}
            <div className="card-panel card-z-mid" style={{ position: 'relative', zIndex: 10 }}>
              <div className="panel-header">
                <div className="header-icon-label">
                  <Award size={20} className="icon-emerald" />
                  <div>
                    <h4>3. Cursos Obrigatórios & Certificações Técnicas</h4>
                    <p>MOPP, NRs, Produtos Perigosos e Treinamentos Especializados</p>
                  </div>
                </div>
              </div>

              {/* MOPP Principal */}
              <div className="date-field-with-countdown-card" style={{ marginBottom: '1.2rem', background: 'rgba(16, 185, 129, 0.05)', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                <div className="grid-2-cols">
                  <div className="input-group-custom">
                    <label>Nº do Certificado MOPP (Resolução ANTT)</label>
                    <input
                      type="text"
                      placeholder="Ex: MOPP-SP-89412"
                      value={formData.mopp_numero}
                      onChange={(e) => setFormData({ ...formData, mopp_numero: e.target.value })}
                    />
                  </div>

                  <div className="input-group-custom">
                    <label>Data de Validade do Curso MOPP *</label>
                    <input
                      type="date"
                      required
                      value={formData.validade_mopp}
                      onChange={(e) => setFormData({ ...formData, validade_mopp: e.target.value })}
                    />
                  </div>
                </div>

                {formData.validade_mopp && (
                  <div className={`countdown-live-banner ${getCountdown(formData.validade_mopp).badgeClass}`}>
                    <Calendar size={15} />
                    <strong>Curso MOPP ANTT:</strong>
                    <span>{getCountdown(formData.validade_mopp).text}</span>
                  </div>
                )}
              </div>

              {/* Grid com Cursos e NRs Especializadas do Setor */}
              <div className="courses-two-cols-grid">
                {/* 1. NR-20 (Inflamáveis e Combustíveis) */}
                <div className="date-field-with-countdown-card">
                  <div className="input-group-custom">
                    <label>NR-20 (Inflamáveis & Combustíveis)</label>
                    <input
                      type="date"
                      value={formData.validade_nr20}
                      onChange={(e) => setFormData({ ...formData, validade_nr20: e.target.value })}
                    />
                  </div>
                  {formData.validade_nr20 && (
                    <div className={`countdown-live-banner ${getCountdown(formData.validade_nr20).badgeClass}`}>
                      <span>{getCountdown(formData.validade_nr20).text}</span>
                    </div>
                  )}
                </div>

                {/* 2. NR-35 (Trabalho em Altura - Bocais de Tanque) */}
                <div className="date-field-with-countdown-card">
                  <div className="input-group-custom">
                    <label>NR-35 (Trabalho em Altura - Tanques)</label>
                    <input
                      type="date"
                      value={formData.validade_nr35}
                      onChange={(e) => setFormData({ ...formData, validade_nr35: e.target.value })}
                    />
                  </div>
                  {formData.validade_nr35 && (
                    <div className={`countdown-live-banner ${getCountdown(formData.validade_nr35).badgeClass}`}>
                      <span>{getCountdown(formData.validade_nr35).text}</span>
                    </div>
                  )}
                </div>

                {/* 3. NR-33 (Espaço Confinado - Inspeção e Limpeza de Tanques) */}
                <div className="date-field-with-countdown-card">
                  <div className="input-group-custom">
                    <label>NR-33 (Espaço Confinado / Tanques)</label>
                    <input
                      type="date"
                      value={formData.validade_nr33}
                      onChange={(e) => setFormData({ ...formData, validade_nr33: e.target.value })}
                    />
                  </div>
                  {formData.validade_nr33 && (
                    <div className={`countdown-live-banner ${getCountdown(formData.validade_nr33).badgeClass}`}>
                      <span>{getCountdown(formData.validade_nr33).text}</span>
                    </div>
                  )}
                </div>

                {/* 4. Direção Defensiva & Condução Segura */}
                <div className="date-field-with-countdown-card">
                  <div className="input-group-custom">
                    <label>Direção Defensiva (CONTRAN)</label>
                    <input
                      type="date"
                      value={formData.validade_direcao_defensiva}
                      onChange={(e) => setFormData({ ...formData, validade_direcao_defensiva: e.target.value })}
                    />
                  </div>
                  {formData.validade_direcao_defensiva && (
                    <div className={`countdown-live-banner ${getCountdown(formData.validade_direcao_defensiva).badgeClass}`}>
                      <span>{getCountdown(formData.validade_direcao_defensiva).text}</span>
                    </div>
                  )}
                </div>

                {/* 5. Cargas Indivisíveis e Especiais */}
                <div className="date-field-with-countdown-card">
                  <div className="input-group-custom">
                    <label>Cargas Indivisíveis & Especiais</label>
                    <input
                      type="date"
                      value={formData.validade_cargas_especiais}
                      onChange={(e) => setFormData({ ...formData, validade_cargas_especiais: e.target.value })}
                    />
                  </div>
                  {formData.validade_cargas_especiais && (
                    <div className={`countdown-live-banner ${getCountdown(formData.validade_cargas_especiais).badgeClass}`}>
                      <span>{getCountdown(formData.validade_cargas_especiais).text}</span>
                    </div>
                  )}
                </div>

                {/* 6. PAE / Hazmat (Plano de Atendimento a Emergências com Produtos Perigosos) */}
                <div className="date-field-with-countdown-card">
                  <div className="input-group-custom">
                    <label>PAE / Hazmat (Emergência Química)</label>
                    <input
                      type="date"
                      value={formData.validade_hazmat_pae}
                      onChange={(e) => setFormData({ ...formData, validade_hazmat_pae: e.target.value })}
                    />
                  </div>
                  {formData.validade_hazmat_pae && (
                    <div className={`countdown-live-banner ${getCountdown(formData.validade_hazmat_pae).badgeClass}`}>
                      <span>{getCountdown(formData.validade_hazmat_pae).text}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bloco 4: Alocação de Frota & Histórico (Pré-programado para o Módulo de Frotas) */}
            <div className="card-panel card-z-low" style={{ position: 'relative', zIndex: 5 }}>
              <div className="panel-header">
                <div className="header-icon-label">
                  <Truck size={20} className="icon-cyan" />
                  <div>
                    <h4>4. Alocação de Frota & Histórico</h4>
                    <p>Veículo habitual vinculado e integração direta com o módulo de frotas</p>
                  </div>
                </div>
              </div>

              {/* Seletor de Frota Pré-Programado */}
              <div className="fleet-plate-picker-box" style={{ marginBottom: '1.25rem' }}>
                <div className="input-group-custom">
                  <label>Placa do Veículo / Cavalo Mecânico Vinculado</label>
                  <input
                    type="text"
                    placeholder="Ex: AMB-4K89 ou clique na frota abaixo"
                    value={formData.veiculo_vinculado}
                    onChange={(e) => setFormData({ ...formData, veiculo_vinculado: e.target.value.toUpperCase() })}
                    style={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '0.05em' }}
                  />
                </div>

                <div style={{ marginTop: '0.75rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                    ⚡ Selecionar Placa da Frota Ambipar Cadastrada:
                  </span>
                  <div className="fleet-plate-pills-row">
                    {fleetVehicles.map((v) => {
                      const isSelected = formData.veiculo_vinculado === v.placa;
                      return (
                        <button
                          key={v.placa}
                          type="button"
                          className={`fleet-pill-btn ${isSelected ? 'is-active' : ''}`}
                          onClick={() => setFormData({ ...formData, veiculo_vinculado: v.placa })}
                          title={v.modelo}
                        >
                          <Truck size={13} />
                          <span>{v.placa}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="fleet-sync-badge">
                  <Check size={14} style={{ color: '#10b981' }} />
                  <span>
                    <strong>Pré-integrado com Módulo de Frotas:</strong> As placas selecionadas ou digitadas aqui são sincronizadas automaticamente com a frota geral e viagens.
                  </span>
                </div>
              </div>

              <div className="input-group-custom">
                <label>Observações do Analista / Restrições Médicas / CCO</label>
                <textarea
                  rows={4}
                  className="select-custom"
                  style={{ resize: 'vertical' }}
                  placeholder="Histórico de rotas, certificações adicionais ou observações do CCO..."
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Botões de Ação na Base */}
          <div className="form-submit-footer-card">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setViewMode('list')}
            >
              Cancelar e Voltar ao Quadro
            </button>

            <button
              type="submit"
              className="btn-primary btn-icon-text"
              id="submit-driver-btn"
            >
              <Save size={18} />
              <span>{editingId ? 'Salvar Alterações do Motorista' : 'Homologar Cadastro do Motorista'}</span>
            </button>
          </div>
        </form>
      ) : (
        /* ============================================================== */
        /* MODO 2: LISTAGEM COMPLETA & QUADRO DE CONFORMIDADE OPERACIONAL */
        /* ============================================================== */
        <>
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

            <div className="summary-stat-box danger">
              <span className="stat-label">Bloqueados pelo CCO</span>
              <span className="stat-number">{blockedDrivers}</span>
              <span className="stat-sub">Pendência documental ou administrativa</span>
            </div>

            <div className={`summary-stat-box ${alertDrivers > 0 ? 'warning' : 'forest'}`}>
              <span className="stat-label">Alertas de Vencimento</span>
              <span className="stat-number">{alertDrivers}</span>
              <span className="stat-sub">
                {alertDrivers > 0 ? 'CNH, MOPP ou Cursos a vencer/vencidos' : '100% dos certificados em dia'}
              </span>
            </div>
          </div>

          {/* Tabela de Motoristas com Contadores Automáticos e WhatsApp Direto */}
          <div className="card-panel" style={{ marginTop: '1.5rem' }}>
            <div className="live-board-header">
              <div>
                <h3>Quadro Operacional de Motoristas & Validades</h3>
                <p>Contadores automáticos de dias restantes para renovação e botão de WhatsApp direto</p>
              </div>

              <div className="table-controls-bar">
                {/* Campo de Busca */}
                <div className="search-input-wrap">
                  <Search size={16} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Buscar por nome, CNH, CPF, telefone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* Filtros Rápidos */}
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
                    className={`filter-btn ${statusFilter === 'bloqueado' ? 'active' : ''}`}
                    onClick={() => setStatusFilter('bloqueado')}
                  >
                    Bloqueados ({blockedDrivers})
                  </button>
                  <button
                    type="button"
                    className={`filter-btn ${statusFilter === 'alerta_doc' ? 'active' : ''}`}
                    onClick={() => setStatusFilter('alerta_doc')}
                  >
                    Alertas Críticos ({alertDrivers})
                  </button>
                </div>
              </div>
            </div>

            <div className="table-responsive-wrapper">
              <table className="operational-table" id="drivers-table">
                <thead>
                  <tr>
                    <th>Condutor & Contato</th>
                    <th>CNH & Categoria</th>
                    <th>Curso MOPP</th>
                    <th>Exame Toxicológico</th>
                    <th>Cursos NR-20 / NR-35</th>
                    <th>Veículo</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDrivers.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="empty-table-state">
                        <p style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                          Nenhum motorista cadastrado ainda.
                        </p>
                        <span style={{ fontSize: '0.85rem', display: 'block', marginBottom: '1rem' }}>
                          Utilize o botão abaixo para abrir a tela de cadastro e registrar seu primeiro condutor com controle automático de validades.
                        </span>
                        <button
                          type="button"
                          className="btn-primary btn-icon-text"
                          onClick={handleOpenCreateForm}
                          style={{ margin: '0 auto' }}
                        >
                          <Plus size={16} />
                          <span>Cadastrar Primeiro Motorista</span>
                        </button>
                      </td>
                    </tr>
                  ) : (
                    filteredDrivers.map((d) => {
                      const cnhCount = getCountdown(d.validade_cnh);
                      const moppCount = getCountdown(d.validade_mopp);
                      const toxCount = getCountdown(d.validade_toxicologico);
                      const nr20Count = getCountdown(d.validade_nr20);
                      const nr35Count = getCountdown(d.validade_nr35);
                      const nr33Count = getCountdown(d.validade_nr33);
                      const dirDefCount = getCountdown(d.validade_direcao_defensiva);
                      const cargasEspCount = getCountdown(d.validade_cargas_especiais);
                      const hazmatCount = getCountdown(d.validade_hazmat_pae);
                      const waLink = getWhatsAppLink(d.telefone);

                      return (
                        <tr key={d.id} className={hasComplianceAlert(d) ? 'row-alert-warning' : ''}>
                          {/* Coluna 1: Nome & Contato WhatsApp */}
                          <td>
                            <div className="driver-identity-cell">
                              <strong>{d.nome}</strong>
                              {d.cpf && <small style={{ color: 'var(--text-dim)' }}>CPF: {d.cpf}</small>}
                              
                              {d.telefone ? (
                                <div className="whatsapp-action-pill">
                                  <Phone size={12} className="text-muted" />
                                  <span>{d.telefone}</span>
                                  {waLink && (
                                    <a
                                      href={waLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="btn-wa-direct"
                                      title="Abrir WhatsApp com o motorista"
                                    >
                                      <MessageCircle size={13} />
                                      <span>Chamar no Zap</span>
                                    </a>
                                  )}
                                </div>
                              ) : (
                                <small style={{ color: 'var(--text-dim)' }}>Sem telefone</small>
                              )}
                            </div>
                          </td>

                          {/* Coluna 2: CNH com Contador Automático */}
                          <td>
                            <div className="cnh-cell">
                              <span className="cnh-number">Reg: {d.cnh} (Cat. {d.categoria_cnh || 'E'})</span>
                              <span className={`doc-countdown-chip ${cnhCount.badgeClass}`}>
                                <Calendar size={12} />
                                <span>{cnhCount.text}</span>
                              </span>
                            </div>
                          </td>

                          {/* Coluna 3: MOPP com Contador Automático */}
                          <td>
                            <div className="mopp-cell">
                              <strong>{d.mopp_numero || 'MOPP Homologado'}</strong>
                              <span className={`doc-countdown-chip ${moppCount.badgeClass}`}>
                                <Calendar size={12} />
                                <span>{moppCount.text}</span>
                              </span>
                            </div>
                          </td>

                          {/* Coluna 4: Toxicológico com Contador Automático */}
                          <td>
                            <div className="cnh-cell">
                              <span className={`doc-countdown-chip ${toxCount.badgeClass}`}>
                                <Calendar size={12} />
                                <span>{toxCount.text}</span>
                              </span>
                            </div>
                          </td>

                          {/* Coluna 5: NRs & Cursos com Contadores */}
                          <td>
                            <div className="nrs-stacked-cell">
                              <div className="nr-line">
                                <span className="nr-label">NR-20:</span>
                                <span className={`doc-countdown-chip ${nr20Count.badgeClass}`}>
                                  {nr20Count.text}
                                </span>
                              </div>
                              <div className="nr-line">
                                <span className="nr-label">NR-35:</span>
                                <span className={`doc-countdown-chip ${nr35Count.badgeClass}`}>
                                  {nr35Count.text}
                                </span>
                              </div>
                              {d.validade_nr33 && (
                                <div className="nr-line">
                                  <span className="nr-label">NR-33:</span>
                                  <span className={`doc-countdown-chip ${nr33Count.badgeClass}`}>
                                    {nr33Count.text}
                                  </span>
                                </div>
                              )}
                              {d.validade_hazmat_pae && (
                                <div className="nr-line">
                                  <span className="nr-label">Hazmat:</span>
                                  <span className={`doc-countdown-chip ${hazmatCount.badgeClass}`}>
                                    {hazmatCount.text}
                                  </span>
                                </div>
                              )}
                              {d.validade_direcao_defensiva && (
                                <div className="nr-line">
                                  <span className="nr-label">Dir.Def:</span>
                                  <span className={`doc-countdown-chip ${dirDefCount.badgeClass}`}>
                                    {dirDefCount.text}
                                  </span>
                                </div>
                              )}
                              {d.validade_cargas_especiais && (
                                <div className="nr-line">
                                  <span className="nr-label">Carg.Esp:</span>
                                  <span className={`doc-countdown-chip ${cargasEspCount.badgeClass}`}>
                                    {cargasEspCount.text}
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Coluna 6: Veículo Vinculado */}
                          <td>
                            {d.veiculo_vinculado ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <span className="plate-badge">{d.veiculo_vinculado}</span>
                              </div>
                            ) : (
                              <small style={{ color: 'var(--text-dim)' }}>Não vinculado</small>
                            )}
                          </td>

                          {/* Coluna 7: Status Operacional */}
                          <td>
                            <PremiumSelect
                              value={d.status}
                              onChange={(val) => handleChangeStatus(d.id, val)}
                              options={STATUS_OPTIONS}
                              size="inline"
                              id={`status-select-${d.id}`}
                            />
                          </td>

                          {/* Coluna 8: Ações */}
                          <td>
                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                              <button
                                type="button"
                                className="topbar-icon-btn"
                                style={{ width: '30px', height: '30px' }}
                                onClick={() => handleOpenEditForm(d)}
                                title="Editar dados e renovar validades"
                              >
                                <Edit3 size={14} />
                              </button>

                              <button
                                type="button"
                                className="btn-danger-icon"
                                onClick={() => handleDeleteDriver(d.id, d.nome)}
                                title="Excluir motorista"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
